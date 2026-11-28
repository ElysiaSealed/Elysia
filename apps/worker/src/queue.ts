import { and, asc, desc, eq, isNull, lte, sql } from 'drizzle-orm'
import type { createDb } from '@elysia/db'
import { postQueue, predictions, proAlerts, riskguardLog } from '@elysia/db'
import {
  evaluate,
  toLogEntry,
  type RiskGuardConfig,
  type RiskGuardDecision,
  type RiskGuardInput,
} from '@elysia/riskguard'

export type Db = ReturnType<typeof createDb>['db']
export type PostMode = 'dry' | 'live'

/** Post publik ditunda 15 menit dari alert Pro (brief, aturan pipeline 5). */
export const PUBLIC_POST_DELAY_MS = 15 * 60 * 1000

/** Default minimum gap between public posts (30 minutes). */
export const POST_GAP_MS = 30 * 60 * 1000

let postGapMs = POST_GAP_MS
/** Slot spacing. Must match the publisher gap (POST_INTERVAL_MINUTES), or Pro alerts announce a time X will not keep. */
export function configurePostGap(ms: number): void {
  postGapMs = ms
}

/** Jenis post yang didahulukan di antrian slot: prediksi harian dan ringkasan Stock Token harian. */
export const PRIORITY_KINDS: readonly string[] = ['prediction', 'daily_summary']

/** Slot terakhir yang terpakai: post terbit terakhir atau jadwal terjauh dari post yang sudah disetujui. Null bila antrian kosong. */
export async function lastSlotAt(db: Db): Promise<Date | null> {
  const [posted] = await db
    .select({ posted: postQueue.postedAt, scheduled: postQueue.scheduledAt })
    .from(postQueue)
    .where(eq(postQueue.status, 'posted'))
    .orderBy(desc(sql`coalesce(${postQueue.postedAt}, ${postQueue.scheduledAt})`))
    .limit(1)
  const [queued] = await db
    .select({ at: postQueue.scheduledAt })
    .from(postQueue)
    .where(eq(postQueue.status, 'approved'))
    .orderBy(desc(postQueue.scheduledAt))
    .limit(1)
  const times = [posted?.posted ?? posted?.scheduled, queued?.at].filter((d): d is Date => d instanceof Date)
  return times.length ? new Date(Math.max(...times.map((d) => d.getTime()))) : null
}

/**
 * Membagi slot untuk semua post yang sudah disetujui dan belum terbit, dengan jeda minimal postGapMs antar post.
 * Slot dihitung dari persetujuan + 15 menit untuk `newId`; post lain tidak pernah dimajukan, hanya digeser ke belakang.
 * Post yang alert Pro-nya sudah keluar (jadwal <= sekarang + 15 menit) atau sudah terbit tidak digeser. Jenis prioritas
 * (PRIORITY_KINDS) dilayani lebih dulu, sisanya menurut urutan pembuatan. Jadwal alert yang belum terkirim ikut diperbarui.
 */
export async function assignSlots(db: Db, now: Date, newId: number): Promise<void> {
  const horizon = now.getTime() + PUBLIC_POST_DELAY_MS
  const approved = await db
    .select({ id: postQueue.id, kind: postQueue.kind, scheduledAt: postQueue.scheduledAt })
    .from(postQueue)
    .where(eq(postQueue.status, 'approved'))
    .orderBy(asc(postQueue.id))
  const frozen = approved.filter((r) => r.id !== newId && (r.scheduledAt?.getTime() ?? 0) <= horizon)
  const free = approved
    .filter((r) => !frozen.includes(r))
    .sort((a, b) => Number(PRIORITY_KINDS.includes(b.kind)) - Number(PRIORITY_KINDS.includes(a.kind)) || a.id - b.id)

  const [posted] = await db
    .select({ posted: postQueue.postedAt, scheduled: postQueue.scheduledAt })
    .from(postQueue)
    .where(eq(postQueue.status, 'posted'))
    .orderBy(desc(sql`coalesce(${postQueue.postedAt}, ${postQueue.scheduledAt})`))
    .limit(1)
  let prev = (posted?.posted ?? posted?.scheduled)?.getTime() ?? -Infinity
  // A frozen post still held by the publisher gap goes out later than its stored slot: count from that later time.
  for (const at of frozen.map((r) => r.scheduledAt?.getTime() ?? -Infinity).sort((a, b) => a - b)) {
    prev = Math.max(at, prev + postGapMs)
  }

  for (const r of free) {
    const earliest = r.id === newId ? horizon : (r.scheduledAt?.getTime() ?? horizon)
    const slot = Math.max(earliest, prev + postGapMs)
    prev = slot
    if (slot === r.scheduledAt?.getTime()) continue
    const at = new Date(slot)
    await db.update(postQueue).set({ scheduledAt: at }).where(eq(postQueue.id, r.id))
    await db.update(proAlerts).set({ publicAt: at }).where(and(eq(proAlerts.postId, r.id), isNull(proAlerts.telegramDispatchedAt)))
  }
}

export interface EnqueueParams {
  kind: string
  /** Isi untuk RiskGuard: tipe konten, teks, tokens dari tool result, dataComplete. */
  input: RiskGuardInput
  mode: PostMode
  /** Wajib untuk kind 'prediction'. */
  predictionId?: number
  /** id post X yang dibalas (hanya mention_reply). */
  replyTo?: string
  riskguardConfig?: Partial<RiskGuardConfig>
  now?: Date
}

export interface EnqueueResult {
  id: number
  status: 'pending_approval' | 'approved' | 'rejected'
  decision: RiskGuardDecision
}

export class PipelineError extends Error {}

let defaultRiskGuardConfig: Partial<RiskGuardConfig> = {}
/** Konfigurasi RiskGuard bawaan untuk semua post (mis. approvalMode dari env). Aturan konten tidak pernah bisa dimatikan. */
export function configureRiskGuard(cfg: Partial<RiskGuardConfig>): void {
  defaultRiskGuardConfig = cfg
}

/**
 * Pintu masuk tunggal ke antrian. Urutan wajib brief:
 * (AI sudah menghasilkan teks) -> RiskGuard -> [prediksi: commit terkonfirmasi] -> antrian -> post.
 */
export async function enqueuePost(db: Db, p: EnqueueParams): Promise<EnqueueResult> {
  const now = p.now ?? new Date()

  // Aturan 2: prediksi tidak boleh diposting sebelum tx commit terkonfirmasi dan hash-nya tersimpan.
  if (p.kind === 'prediction') {
    if (p.predictionId === undefined) throw new PipelineError('post prediksi wajib punya predictionId')
    const [pred] = await db.select().from(predictions).where(eq(predictions.id, p.predictionId))
    if (!pred) throw new PipelineError(`prediksi ${p.predictionId} tidak ada`)
    if (pred.status !== 'committed' || !pred.commitTxHash) {
      throw new PipelineError(`prediksi ${p.predictionId} belum ter-commit on-chain; tidak boleh masuk antrian`)
    }
  }

  // Aturan 1: tidak ada post yang keluar sebelum lolos RiskGuard. Setiap keputusan dicatat.
  const decision = evaluate(p.input, p.riskguardConfig ?? defaultRiskGuardConfig)
  const entry = toLogEntry(p.input, decision)
  await db.insert(riskguardLog).values(entry)

  const status = !decision.allowed ? 'rejected' : decision.requiresApproval ? 'pending_approval' : 'approved'
  // An auto-approved post gets its slot (and its Pro alert, if already due) atomically.
  const row = await db.transaction(async (tx) => {
    const [post] = await tx
      .insert(postQueue)
      .values({
        kind: p.kind,
        content: p.input.text,
        status,
        riskguard: decision,
        predictionId: p.predictionId ?? null,
        replyTo: p.replyTo ?? null,
        scheduledAt: new Date(now.getTime() + PUBLIC_POST_DELAY_MS),
        mode: p.mode,
      })
      .returning()
    if (status === 'approved') {
      await assignSlots(tx as unknown as Db, now, post!.id)
      await releaseDueAlerts(tx as unknown as Db, now)
      return post!
    }
    return post!
  })
  return { id: row.id, status, decision }
}

/**
 * Creates the Pro alert of every approved post whose public slot is at most 15 minutes away. Runs on approval and on
 * every worker cycle, so a post waiting for a later slot stays hidden from Pro until its lead window opens.
 */
export async function releaseDueAlerts(db: Db, now = new Date()): Promise<void> {
  const due = await db
    .select({ id: postQueue.id, kind: postQueue.kind, content: postQueue.content, scheduledAt: postQueue.scheduledAt })
    .from(postQueue)
    .leftJoin(proAlerts, eq(proAlerts.postId, postQueue.id))
    .where(and(eq(postQueue.status, 'approved'), lte(postQueue.scheduledAt, new Date(now.getTime() + PUBLIC_POST_DELAY_MS)), isNull(proAlerts.id)))
    .orderBy(asc(postQueue.scheduledAt))
  for (const post of due) await recordProAlert(db, post)
}

/** Alert Pro: sumber stream SSE dan pengiriman Telegram ke pelanggan. Idempoten per post. */
export async function recordProAlert(db: Db, post: { id: number; kind: string; content: string; scheduledAt: Date | null }): Promise<void> {
  await db
    .insert(proAlerts)
    .values({ postId: post.id, kind: post.kind, content: post.content, publicAt: post.scheduledAt })
    .onConflictDoNothing()
}

export async function listPending(db: Db) {
  return db.select().from(postQueue).where(eq(postQueue.status, 'pending_approval')).orderBy(asc(postQueue.id))
}

export async function getPost(db: Db, id: number) {
  const [row] = await db.select().from(postQueue).where(eq(postQueue.id, id))
  return row
}

async function transition(db: Db, id: number, to: 'approved' | 'rejected', now = new Date()) {
  await db.transaction(async (tx) => {
    const updated = await tx
      .update(postQueue)
      // Human approval: the slot counts from approval, not creation, so a late approval keeps the 15 minute Pro lead.
      // The alert goes out now if the slot is free, otherwise 15 minutes before the later slot.
      .set(to === 'approved' ? { status: to, scheduledAt: new Date(now.getTime() + PUBLIC_POST_DELAY_MS) } : { status: to })
      .where(and(eq(postQueue.id, id), eq(postQueue.status, 'pending_approval')))
      .returning()
    if (updated.length === 0) throw new PipelineError(`post ${id} tidak ada atau tidak sedang menunggu persetujuan`)
    if (to === 'approved') {
      await assignSlots(tx as unknown as Db, now, id)
      await releaseDueAlerts(tx as unknown as Db, now)
    }
  })
}

/** Hanya post yang sudah lolos RiskGuard yang bisa disetujui; yang diblokir otomatis tidak pernah pending. */
export const approvePost = (db: Db, id: number, now = new Date()) => transition(db, id, 'approved', now)
export const rejectPost = (db: Db, id: number) => transition(db, id, 'rejected')

/** Post siap terbit: disetujui dan sudah lewat jadwal tunda 15 menit. */
export async function dueForPublish(db: Db, now = new Date()) {
  return db
    .select()
    .from(postQueue)
    .where(and(eq(postQueue.status, 'approved'), lte(postQueue.scheduledAt, now)))
    .orderBy(asc(postQueue.scheduledAt))
}
