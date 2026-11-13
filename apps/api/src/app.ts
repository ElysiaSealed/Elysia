import cors from '@fastify/cors'
import { createHash } from 'node:crypto'
import { and, asc, desc, eq, gt, gte, inArray, isNotNull, sql } from 'drizzle-orm'
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify'
import { z } from 'zod'
import { apiKeys, askCreditUses, askPayments, burns, ponsTokens, postQueue, predictions, priceSnapshots, proAlerts, whaleTransfers, type createDb } from '@elysia/db'
import {
  alertEventSchema,
  signalsWhalesResponseSchema,
  type SignalsWhalesResponse,
  proPlanResponseSchema,
  askPlanResponseSchema,
  proSubscribeRequestSchema,
  proSubscribeResponseSchema,
  telegramLinkResponseSchema,
  askRequestSchema,
  askResponseSchema,
  meResponseSchema,
  nonceResponseSchema,
  sessionResponseSchema,
  verifyRequestSchema,
  burnResponseSchema,
  leaderboardResponseSchema,
  predictionResponseSchema,
  proofResponseSchema,
  rugRadarResponseSchema,
  marketResponseSchema,
  signalsResponseSchema,
  type AskResponse,
  type BurnResponse,
  type LeaderboardResponse,
  type Prediction,
  type ProofResponse,
  type RugRadarResponse,
  type MarketResponse,
  type SignalsResponse,
} from '@elysia/api-client'
import { buildMe, createNonce, endSession, monthKey, sessionFrom, verifyLogin, type AuthConfig } from './auth'
import { kolStats, rankEntries } from './leaderboard'
import { buildMarket } from './market'
import { CHAINS, chainSlug } from '@elysia/shared'
import { buildPricingResponse, DEFAULT_PRICING, type PricingConfig } from './pricing'
import { createTtlCache } from './cache'
import { DEFAULT_ASK_LIMITS, createAskLimiter, type AskLimits } from './ask-limit'
import { buildRiskReport, verifyUsdgPayment, type AskConfig } from './ask'
import { formatBps, formatUnits, formatWinRate, shortAddress } from './format'
import { createLinkCode, proStatus, subscribe, unlinkTelegram, type ProConfig } from './pro'

export type Db = ReturnType<typeof createDb>['db']

export interface AppConfig {
  db: Db
  /** Basis Blockscout, tanpa slash akhir (mis. https://explorer.testnet.chain.robinhood.com). */
  explorerUrl: string
  /** Explorer tx path separator. Default: '/tx/'. */
  explorerTxPath?: string
  /** Chain ID yang dilayani service ini (untuk validasi ?chain= dan respons). Default: Robinhood Chain mainnet (4663). */
  chainId?: number
  /** Slug chain API. Default: slug of Robinhood Chain ('robinhood'). */
  chainSlugValue?: string
  /** Basis Blockscout untuk alamat token Pons (indexer membaca mainnet, sedangkan explorerUrl bisa testnet). Default: explorerUrl. */
  tokenExplorerUrl?: string
  /** Asal web yang diizinkan CORS (env WEB_ORIGIN; beberapa asal dipisah koma). Kosong = CORS dimatikan. */
  webOrigin?: string
  /** alamat aset (huruf kecil) -> simbol, untuk prediksi yang sudah di-reveal. */
  symbols?: Record<string, string>
  /** Fitur berbayar (Signals API dst.) mati sampai true (env PAID_FEATURES_ENABLED). */
  paidFeaturesEnabled?: boolean
  /** Batas permintaan per kunci API per menit. */
  signalsRateLimitPerMinute?: number
  /** Call ternilai minimum agar masuk peringkat leaderboard (env LEADERBOARD_MIN_SCORED). */
  leaderboardMinScored?: number
  /** Legacy payment config. POST /ask is free and no longer reads it; only GET /ask/plan does. */
  ask?: AskConfig
  /** Free Ask rate limit per IP (PENDING numbers, see ask-limit.ts). */
  askRateLimit?: AskLimits
  /** Number of trusted reverse-proxy hops in front of the API (0 = none: req.ip is the socket address and X-Forwarded-For is ignored). */
  trustProxyHops?: number
  /** Login wallet (SIWE) dan benefit holder. Tanpa ini /auth/* dan /me menjawab 503. */
  auth?: AuthConfig
  /** Elysia Pro (langganan USDG, alert stream, Telegram). Tanpa ini /pro/* dan /alerts/stream menjawab 503. */
  pro?: ProConfig
  /** Public prices shown by GET /pricing (env-driven). Defaults to DEFAULT_PRICING. */
  pricing?: PricingConfig
  /** Seconds that public read endpoints are served from memory before the database is read again. 0 = no cache. Keeps Supabase egress low. */
  publicCacheSeconds?: number
  now?: () => Date
}

/** Only the public columns: the encrypted preimage is never selected by the API. */
type PredictionRow = Pick<
  typeof predictions.$inferSelect,
  'ledgerId' | 'hash' | 'status' | 'commitTxHash' | 'committedAt' | 'maturesAt' | 'revealedText' | 'revealedAsset' | 'revealedDirection' | 'revealTxHash' | 'won' | 'returnBps' | 'voided'
>
const DAY_MS = 86_400_000
const RECENT_LIMIT = 10
/** Kontrak Pons/Uniswap yang memegang suplai tetapi bukan holder sungguhan (dikecualikan dari peringkat holder). */
const POOL_ADDRESSES = [CHAINS.mainnet.pons.hook, CHAINS.mainnet.pons.graduationExecutor, CHAINS.mainnet.pons.factory, CHAINS.mainnet.uniswapV4.poolManager]
const RADAR_LIMIT = 50

/** Hanya prediksi yang sudah ter-commit on-chain yang pernah terlihat publik; draft tidak. */
const PUBLIC_STATUSES = ['committed', 'posted', 'revealed'] as const

export function buildApp(cfg: AppConfig): FastifyInstance {
  const app = Fastify({ logger: false, trustProxy: cfg.trustProxyHops && cfg.trustProxyHops > 0 ? cfg.trustProxyHops : false })
  const askLimiter = createAskLimiter(cfg.askRateLimit ?? DEFAULT_ASK_LIMITS, () => now().getTime())
  const now = () => (cfg.now ? cfg.now() : new Date())
  const symbols = cfg.symbols ?? {}
  // Cache windows follow how often the data really changes (base = PUBLIC_CACHE_SECONDS, default 120 s):
  //   publicCache x1  new launches (rug radar)
  //   slowCache   x2.5 scoreboard and Signals posts: change a few times a day
  //   marketCache x5  price snapshots: the worker writes one every 10 minutes
  //   fixedCache  x30 a single prediction: immutable once revealed
  const baseCacheMs = (cfg.publicCacheSeconds ?? 0) * 1000
  const publicCache = createTtlCache(baseCacheMs, () => now().getTime())
  const slowCache = createTtlCache(baseCacheMs * 2.5, () => now().getTime())
  const marketCache = createTtlCache(baseCacheMs * 5, () => now().getTime())
  const fixedCache = createTtlCache(baseCacheMs * 30, () => now().getTime())
  const txPath = (cfg.explorerTxPath ?? '/tx/')
  const tx = (hash: string) => `${cfg.explorerUrl}${txPath}${hash}`
  // The service serves one chain, Robinhood Chain mainnet, unless overridden.
  const serviceChainId = cfg.chainId ?? CHAINS.mainnet.id
  const serviceChainSlug = cfg.chainSlugValue ?? chainSlug(serviceChainId)

  if (cfg.webOrigin) void app.register(cors, { origin: cfg.webOrigin.split(',').map((o) => o.trim().replace(/\/$/, '')).filter(Boolean), methods: ['GET', 'POST'], allowedHeaders: ['content-type', 'x-api-key', 'authorization', 'last-event-id'] })

  function toPrediction(row: PredictionRow): Prediction {
    const committedAt = row.committedAt!
    const maturesAt = row.maturesAt!
    const revealed =
      row.status === 'revealed' && row.revealedText !== null && row.revealedAsset !== null && row.revealedDirection !== null && row.won !== null && row.returnBps !== null && row.revealTxHash
        ? (() => {
            const aligned = alignedBps(row)!
            return {
              text: row.revealedText,
              assetSymbol: symbols[row.revealedAsset.toLowerCase()] ?? shortAddress(row.revealedAsset),
              direction: row.revealedDirection === 1 ? ('up' as const) : ('down' as const),
              won: row.won,
              voided: row.voided,
              returnBps: aligned,
              returnFormatted: formatBps(aligned),
              revealTxHash: row.revealTxHash,
              revealTxUrl: tx(row.revealTxHash),
            }
          })()
        : null
    return {
      id: row.ledgerId!,
      status: row.status as 'committed' | 'posted' | 'revealed',
      hash: row.hash,
      commitTxHash: row.commitTxHash!,
      commitTxUrl: tx(row.commitTxHash!),
      committedAt: committedAt.toISOString(),
      maturesAt: maturesAt.toISOString(),
      horizonDays: Math.max(1, Math.round((maturesAt.getTime() - committedAt.getTime()) / DAY_MS)),
      revealed,
    }
  }

  /** Return searah klaim: prediksi turun yang benar bernilai positif (sama dengan sumReturnBps di kontrak). */
  function alignedBps(row: PredictionRow): number | null {
    if (row.returnBps === null || row.revealedDirection === null) return null
    return row.revealedDirection === 1 ? row.returnBps : -row.returnBps
  }

  // Egress rules (Supabase free plan): never select the whole predictions table, never select the encrypted preimage,
  // aggregate in SQL, and serve public reads from the TTL cache.
  const publicFilter = and(inArray(predictions.status, [...PUBLIC_STATUSES]), isNotNull(predictions.ledgerId), isNotNull(predictions.commitTxHash))
  const predictionColumns = {
    ledgerId: predictions.ledgerId,
    hash: predictions.hash,
    status: predictions.status,
    commitTxHash: predictions.commitTxHash,
    committedAt: predictions.committedAt,
    maturesAt: predictions.maturesAt,
    revealedText: predictions.revealedText,
    revealedAsset: predictions.revealedAsset,
    revealedDirection: predictions.revealedDirection,
    revealTxHash: predictions.revealTxHash,
    won: predictions.won,
    returnBps: predictions.returnBps,
    voided: predictions.voided,
  }

  /** Scoreboard numbers and the few full rows /proof shows, from three small queries. Shared by /proof and /leaderboard. */
  const loadProofData = () =>
    slowCache.get('proof-data', async () => {
      // Void (harga basi) predictions are revealed but never scored: they stay out of scored, wins and the average return.
      const scoredCond = sql`${predictions.status} = 'revealed' and ${predictions.returnBps} is not null and ${predictions.revealedDirection} is not null and ${predictions.voided} is false`
      const [agg] = await cfg.db
        .select({
          scored: sql<string>`count(*) filter (where ${scoredCond})`,
          wins: sql<string>`count(*) filter (where ${scoredCond} and ${predictions.won} is true)`,
          open: sql<string>`count(*) filter (where ${predictions.status} <> 'revealed')`,
          sumAligned: sql<string>`coalesce(sum(case when ${predictions.revealedDirection} = 1 then ${predictions.returnBps} else -${predictions.returnBps} end) filter (where ${scoredCond}), 0)`,
        })
        .from(predictions)
        .where(publicFilter)
      const [current] = await cfg.db
        .select(predictionColumns)
        .from(predictions)
        .where(and(publicFilter, sql`${predictions.status} <> 'revealed'`))
        .orderBy(desc(predictions.committedAt))
        .limit(1)
      const recent = await cfg.db.select(predictionColumns).from(predictions).where(publicFilter).orderBy(desc(predictions.committedAt)).limit(RECENT_LIMIT)
      const scored = Number(agg?.scored ?? 0)
      return {
        scored,
        wins: Number(agg?.wins ?? 0),
        open: Number(agg?.open ?? 0),
        avgReturnBps: scored > 0 ? Math.round(Number(agg?.sumAligned ?? 0) / scored) : null,
        current: current ?? null,
        recent,
      }
    })

  const cache = (reply: { header: (k: string, v: string) => unknown }) => reply.header('cache-control', 'public, max-age=15')

  app.get('/healthz', async () => ({ ok: true, chainId: serviceChainId, chain: serviceChainSlug }))

  /**
   * Validasi ?chain= param: harus cocok dengan slug chain yang dilayani service ini.
   * Misalnya, a service with another chainSlug rejects ?chain=robinhood.
   * Tanpa param = klien lama / tidak peduli chain; selalu diterima.
   */
  function validateChain(req: FastifyRequest, reply: FastifyReply): boolean {
    const chain = (req.query as Record<string, string | undefined>).chain
    if (chain !== undefined && chain !== serviceChainSlug) {
      void reply.code(400).send({ error: 'wrong_chain', expected: serviceChainSlug, got: chain })
      return false
    }
    return true
  }

  app.get('/proof', async (req, reply) => {
    if (!validateChain(req, reply)) return
    const d = await loadProofData()
    const winRate = d.scored > 0 ? d.wins / d.scored : null
    const cur = d.current
    const current = cur
      ? {
          day: Math.min(
            Math.max(1, Math.floor((now().getTime() - cur.committedAt!.getTime()) / DAY_MS) + 1),
            Math.max(1, Math.round((cur.maturesAt!.getTime() - cur.committedAt!.getTime()) / DAY_MS)),
          ),
          prediction: toPrediction(cur),
        }
      : null

    const body: ProofResponse = proofResponseSchema.parse({
      stats: { scored: d.scored, wins: d.wins, pending: d.open, winRate, avgReturnBps: d.avgReturnBps },
      formatted: {
        winRate: winRate === null ? null : formatWinRate(winRate),
        avgReturn: d.avgReturnBps === null ? null : formatBps(d.avgReturnBps),
      },
      current,
      recent: d.recent.map(toPrediction),
      chainId: serviceChainId,
      explorerBaseUrl: cfg.explorerUrl,
    })
    cache(reply)
    return body
  })

  app.get('/predictions/:id', async (req, reply) => {
    if (!validateChain(req, reply)) return
    const parsed = z.object({ id: z.coerce.number().int().nonnegative() }).safeParse(req.params)
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_id' })
    const id = parsed.data.id
    const row = await fixedCache.get(`prediction:${id}`, async () => {
      const [r] = await cfg.db.select(predictionColumns).from(predictions).where(and(publicFilter, eq(predictions.ledgerId, id))).orderBy(desc(predictions.committedAt)).limit(1)
      return r ?? null
    })
    if (!row) return reply.code(404).send({ error: 'not_found' })
    cache(reply)
    return predictionResponseSchema.parse(toPrediction(row))
  })

  app.get('/rug-radar', async (req, reply) => {
    if (!validateChain(req, reply)) return
    const body = await publicCache.get('rug-radar', async (): Promise<RugRadarResponse> => {
      const rows = await cfg.db
        .select({
          address: ponsTokens.address,
          name: ponsTokens.name,
          symbol: ponsTokens.symbol,
          launchedAt: ponsTokens.launchedAt,
          graduatedAt: ponsTokens.graduatedAt,
          creatorTaxBps: ponsTokens.creatorTaxBps,
          topHolderShareBps: ponsTokens.topHolderShareBps,
          redFlags: ponsTokens.redFlags,
        })
        .from(ponsTokens)
        .orderBy(desc(ponsTokens.launchedAt))
        .limit(RADAR_LIMIT)
      const t = now()
      return rugRadarResponseSchema.parse({
        updatedAt: t.toISOString(),
        items: rows.map((r) => ({
          token: r.address,
          name: r.name,
          symbol: r.symbol,
          launchedAt: r.launchedAt.toISOString(),
          ageSeconds: Math.max(0, Math.floor((t.getTime() - r.launchedAt.getTime()) / 1000)),
          graduated: r.graduatedAt !== null,
          creatorTaxBps: r.creatorTaxBps,
          topHolderShareBps: r.topHolderShareBps,
          redFlags: r.redFlags,
          explorerUrl: `${cfg.tokenExplorerUrl ?? cfg.explorerUrl}/address/${r.address}`,
        })),
      })
    })
    cache(reply)
    return body
  })

  // Harga Stock Token: oracle vs DEX dari snapshot worker (24 jam terakhir). Tanpa snapshot = daftar kosong, tidak menebak.
  app.get('/market', async (_req, reply) => {
    const body = await marketCache.get('market', async (): Promise<MarketResponse> => {
      const t = now()
      const rows = await cfg.db
        .select({ asset: priceSnapshots.asset, source: priceSnapshots.source, price: priceSnapshots.price, decimals: priceSnapshots.decimals, at: priceSnapshots.at })
        .from(priceSnapshots)
        .where(gte(priceSnapshots.at, new Date(t.getTime() - 24 * 3600_000)))
        .orderBy(asc(priceSnapshots.at))
      return marketResponseSchema.parse(buildMarket(rows.map((r) => ({ asset: r.asset, source: r.source, price: BigInt(r.price), decimals: r.decimals, at: r.at })), t))
    })
    cache(reply)
    return body
  })

  // Elysia vs KOL: leaderboard akurasi. Hanya KOL yang opted_in; baris Elysia dihitung dari /proof yang sama.
  app.get('/leaderboard', async (_req, reply) => {
    const body = await slowCache.get('leaderboard', async (): Promise<LeaderboardResponse> => {
      const d = await loadProofData()
      const elysia = {
        handle: 'elysia',
        displayName: 'Elysia',
        isElysia: true,
        scored: d.scored,
        wins: d.wins,
        pending: d.open,
        avgReturnBps: d.avgReturnBps,
      }
      const minScored = cfg.leaderboardMinScored ?? 3
      return leaderboardResponseSchema.parse({
        updatedAt: now().toISOString(),
        minScored,
        entries: rankEntries([elysia, ...(await kolStats(cfg.db))], minScored),
      })
    })
    cache(reply)
    return body
  })

  // Public pricing overview (editable through env vars; the web reads it so prices change without a redeploy).
  app.get('/pricing', async (_req, reply) => {
    cache(reply)
    return buildPricingResponse(cfg.pricing ?? DEFAULT_PRICING, Boolean(cfg.paidFeaturesEnabled))
  })

  // Burn tracker: `Burned` events of the PM burn contract. $ELYS 18 desimal. Empty until the burn contract is configured and indexed.
  const ELYS_DECIMALS = 18
  const units = (raw: bigint) => ({ raw: raw.toString(), decimals: ELYS_DECIMALS, formatted: formatUnits(raw, ELYS_DECIMALS) })
  // Total dihitung di SQL dan hanya RECENT_LIMIT baris terbaru yang ditarik (egress tetap kecil walau burn ribuan).
  // Hasil disimpan 60 dtk di memori, jadi trafik web tidak berubah jadi query DB.
  let burnCache: { at: number; body: BurnResponse } | null = null
  app.get('/burn', async (_req, reply) => {
    if (!burnCache || Date.now() - burnCache.at > 60_000) {
      const [agg] = await cfg.db.select({ total: sql<string>`coalesce(sum(${burns.elysBurned}), 0)::text` }).from(burns)
      const rows = await cfg.db.select({ at: burns.at, elysBurned: burns.elysBurned, txHash: burns.txHash }).from(burns).orderBy(desc(burns.at)).limit(RECENT_LIMIT)
      burnCache = {
        at: Date.now(),
        body: burnResponseSchema.parse({
          totalBurned: units(BigInt((agg?.total ?? '0').split('.')[0]!)),
          burns: rows.map((r) => ({ at: r.at.toISOString(), amount: units(BigInt(r.elysBurned)), txHash: r.txHash, txUrl: tx(r.txHash) })),
        }),
      }
    }
    cache(reply)
    return burnCache.body
  })

  // Signals API: berbayar, jadi mati sampai PAID_FEATURES_ENABLED=true; butuh kunci API + batas laju.
  const rateWindow = new Map<number, { start: number; count: number }>()
  const rateLimit = cfg.signalsRateLimitPerMinute ?? 60
  /** Pagar Signals API: flag fitur berbayar, kunci API aktif, batas laju. Mengirim respons sendiri dan mengembalikan false bila ditolak. */
  const keyCache = createTtlCache(Math.min((cfg.publicCacheSeconds ?? 0) * 1000, 30_000), () => now().getTime())
  async function signalsGate(req: FastifyRequest, reply: FastifyReply): Promise<boolean> {
    const deny = (code: number, error: string) => {
      void reply.code(code).send({ error })
      return false
    }
    if (!cfg.paidFeaturesEnabled) return deny(503, 'paid_features_disabled')
    const key = req.headers['x-api-key']
    if (typeof key !== 'string' || key.length === 0) return deny(401, 'api_key_required')
    const keyHash = createHash('sha256').update(key).digest('hex')
    // Key lookups are cached briefly: a key at its rate limit would otherwise cost one database read per request.
    const row = await keyCache.get(`key:${keyHash}`, async () => (await cfg.db.select().from(apiKeys).where(and(eq(apiKeys.keyHash, keyHash), eq(apiKeys.active, true))))[0] ?? null)
    if (!row) return deny(401, 'invalid_api_key')

    const t = now().getTime()
    const w = rateWindow.get(row.id)
    if (!w || t - w.start >= 60_000) rateWindow.set(row.id, { start: t, count: 1 })
    else if (++w.count > rateLimit) {
      void reply.header('retry-after', String(Math.max(1, Math.ceil((w.start + 60_000 - t) / 1000))))
      return deny(429, 'rate_limited')
    }
    return true
  }
  const limitQuery = z.object({ limit: z.coerce.number().int().min(1).max(100).default(20) })

  // Whale transfers were Robinhood Stock Token data (out of ELYSIA scope). Unavailable until an ELYSIA data source exists;
  // no substitute data is served and nothing is queried.
  app.get('/signals/whales', async (_req, reply) => {
    void reply.header('cache-control', 'no-store')
    return reply.code(503).send({ error: 'unavailable', reason: 'no_elysia_data_source' })
  })

  app.get('/signals', async (req, reply) => {
    if (!(await signalsGate(req, reply))) return reply
    const q = limitQuery.safeParse(req.query)
    if (!q.success) return reply.code(400).send({ error: 'invalid_query' })
    const rows = await slowCache.get(`signals:${q.data.limit}`, () =>
      cfg.db
        .select({ post: { id: postQueue.id, kind: postQueue.kind, content: postQueue.content, postedAt: postQueue.postedAt }, ledgerId: predictions.ledgerId })
        .from(postQueue)
        .leftJoin(predictions, eq(postQueue.predictionId, predictions.id))
        .where(and(eq(postQueue.status, 'posted'), isNotNull(postQueue.postedAt)))
        .orderBy(desc(postQueue.postedAt))
        .limit(q.data.limit),
    )
    const body: SignalsResponse = signalsResponseSchema.parse({
      items: rows.map((r) => ({
        id: r.post.id,
        kind: r.post.kind,
        content: r.post.content,
        postedAt: r.post.postedAt!.toISOString(),
        ledgerId: r.ledgerId,
      })),
    })
    void reply.header('cache-control', 'private, no-store')
    return body
  })

  // Login wallet (SIWE): nonce -> tanda tangan di wallet -> sesi bearer. Di belakang flag fitur berbayar.
  const auth = cfg.auth
  const authOn = () => Boolean(cfg.paidFeaturesEnabled && auth)

  app.get('/auth/nonce', async (_req, reply) => {
    if (!authOn()) return reply.code(503).send({ error: 'paid_features_disabled' })
    void reply.header('cache-control', 'no-store')
    return nonceResponseSchema.parse(await createNonce(cfg.db, auth!, now()))
  })

  app.post('/auth/verify', async (req, reply) => {
    if (!authOn()) return reply.code(503).send({ error: 'paid_features_disabled' })
    const parsed = verifyRequestSchema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_body' })
    const r = await verifyLogin(cfg.db, auth!, parsed.data, now())
    if (!r.ok) return reply.code(401).send({ error: r.reason })
    void reply.header('cache-control', 'no-store')
    return sessionResponseSchema.parse({ token: r.token, address: r.address, expiresAt: r.expiresAt })
  })

  app.post('/auth/logout', async (req, reply) => {
    if (!authOn()) return reply.code(503).send({ error: 'paid_features_disabled' })
    const s = await sessionFrom(cfg.db, req.headers.authorization, now())
    if (s) await endSession(cfg.db, s.tokenHash)
    return reply.code(204).send()
  })

  app.get('/me', async (req, reply) => {
    if (!authOn()) return reply.code(503).send({ error: 'paid_features_disabled' })
    const s = await sessionFrom(cfg.db, req.headers.authorization, now())
    if (!s) return reply.code(401).send({ error: 'login_required' })
    void reply.header('cache-control', 'private, no-store')
    return meResponseSchema.parse(await buildMe(cfg.db, auth!, s.address, now()))
  })

  // ---- Elysia Pro ($7/bulan): langganan USDG on-chain, alert real-time (SSE) dan Telegram. Di belakang flag fitur berbayar.
  const pro = cfg.pro
  const proOn = () => Boolean(cfg.paidFeaturesEnabled && pro)
  const price = () => ({ raw: pro!.payment.minAmount.toString(), decimals: 6, formatted: formatUnits(pro!.payment.minAmount, 6) })

  app.get('/pro/plan', async (_req, reply) => {
    if (!proOn()) return reply.code(503).send({ error: 'paid_features_disabled' })
    cache(reply)
    return proPlanResponseSchema.parse({
      price: price(),
      durationDays: pro!.days,
      recipient: pro!.payment.recipient,
      usdgAddress: pro!.payment.usdg,
      chainId: pro!.chainId,
      ...(pro!.chain ? { chain: pro!.chain } : {}),
      telegramBot: pro!.telegramBot ?? null,
    })
  })

  app.post('/pro/subscribe', async (req, reply) => {
    if (!proOn() || !auth) return reply.code(503).send({ error: 'paid_features_disabled' })
    const s = await sessionFrom(cfg.db, req.headers.authorization, now())
    if (!s) return reply.code(401).send({ error: 'login_required' })
    const parsed = proSubscribeRequestSchema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_body' })
    const r = await subscribe(cfg.db, pro!, s.address, parsed.data.txHash, now())
    if (!r.ok) return reply.code(r.status).send({ error: r.error })
    void reply.header('cache-control', 'private, no-store')
    return proSubscribeResponseSchema.parse({ active: true, expiresAt: r.expiresAt.toISOString(), addedDays: r.addedDays, paymentTxUrl: tx(parsed.data.txHash) })
  })

  app.post('/pro/telegram/link', async (req, reply) => {
    if (!proOn() || !auth) return reply.code(503).send({ error: 'paid_features_disabled' })
    if (!pro!.telegramBot) return reply.code(503).send({ error: 'telegram_not_configured' })
    const s = await sessionFrom(cfg.db, req.headers.authorization, now())
    if (!s) return reply.code(401).send({ error: 'login_required' })
    if (!(await proStatus(cfg.db, s.address, now())).active) return reply.code(402).send({ error: 'subscription_required' })
    const { code, expiresAt } = await createLinkCode(cfg.db, s.address, now())
    void reply.header('cache-control', 'private, no-store')
    return telegramLinkResponseSchema.parse({ code, url: `https://t.me/${pro!.telegramBot}?start=${code}`, expiresAt: expiresAt.toISOString() })
  })

  app.post('/pro/telegram/unlink', async (req, reply) => {
    if (!proOn() || !auth) return reply.code(503).send({ error: 'paid_features_disabled' })
    const s = await sessionFrom(cfg.db, req.headers.authorization, now())
    if (!s) return reply.code(401).send({ error: 'login_required' })
    await unlinkTelegram(cfg.db, s.address)
    return reply.code(204).send()
  })

  // Stream alert (SSE). Alert dibuat saat post disetujui, 15 menit sebelum post publik di X.
  // Tanpa Last-Event-ID, stream dimulai dari alert terbaru saat ini (hanya yang baru); dengan itu, melanjutkan dari id tersebut.
  let shuttingDown = false
  // preClose (bukan onClose): server menunggu koneksi terbuka selesai, jadi stream harus diberi tahu lebih dulu.
  app.addHook('preClose', async () => {
    shuttingDown = true
    for (const wake of [...alertWaiters]) wake()
  })
  // One shared poller for every connected Pro client (Supabase free plan egress): the database is read once per poll
  // interval no matter how many streams are open, and only while at least one stream is connected.
  type AlertRow = typeof proAlerts.$inferSelect
  const ALERT_BUFFER_MAX = 200
  /** How often an open stream re-checks that its session and subscription are still valid (one tiny query per stream). */
  const SESSION_RECHECK_MS = 300_000
  const alertBuffer: AlertRow[] = []
  let alertCursor = 0 // highest alert id loaded by the hub
  let alertFloor = 0 // alert ids <= alertFloor are no longer in the buffer
  let alertSubscribers = 0
  let alertHubRunning = false
  const alertWaiters = new Set<() => void>()

  async function runAlertHub(pollMs: number): Promise<void> {
    if (alertHubRunning) return
    alertHubRunning = true
    try {
      while (alertSubscribers > 0 && !shuttingDown) {
        let more = false
        try {
          const rows = await cfg.db.select().from(proAlerts).where(gt(proAlerts.id, alertCursor)).orderBy(asc(proAlerts.id)).limit(50)
          if (rows.length > 0) {
            alertBuffer.push(...rows)
            alertCursor = rows[rows.length - 1]!.id
            while (alertBuffer.length > ALERT_BUFFER_MAX) alertFloor = alertBuffer.shift()!.id
            for (const wake of [...alertWaiters]) wake()
          }
          more = rows.length === 50
        } catch {
          /* database hiccup: try again after the poll interval */
        }
        if (!more) await new Promise<void>((resolve) => setTimeout(resolve, pollMs))
      }
    } finally {
      alertHubRunning = false
    }
  }

  app.get('/alerts/stream', async (req, reply) => {
    if (!proOn() || !auth) return reply.code(503).send({ error: 'paid_features_disabled' })
    const s = await sessionFrom(cfg.db, req.headers.authorization, now())
    if (!s) return reply.code(401).send({ error: 'login_required' })
    if (!(await proStatus(cfg.db, s.address, now())).active) return reply.code(402).send({ error: 'subscription_required' })

    const header = Number(req.headers['last-event-id'])
    let last = Number.isInteger(header) && header >= 0 ? header : ((await cfg.db.select({ id: proAlerts.id }).from(proAlerts).orderBy(desc(proAlerts.id)).limit(1))[0]?.id ?? 0)

    const pollMs = pro!.alertPollMs ?? 3000
    const heartbeatMs = pro!.heartbeatMs ?? 15_000
    const raw = reply.raw
    void reply.hijack()
    // Header CORS yang sudah diset plugin ikut dibawa; hijack melewati penulisan header normal.
    raw.writeHead(200, {
      ...(reply.getHeaders() as Record<string, string>),
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-store, no-transform',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
    })
    raw.write('retry: 5000\n: connected\n\n')

    alertSubscribers += 1
    if (alertSubscribers === 1 && !alertHubRunning) {
      alertBuffer.length = 0
      alertCursor = last
      alertFloor = last
    }
    void runAlertHub(pollMs)

    let closed = false
    let wake: (() => void) | null = null
    const notify = () => wake?.()
    alertWaiters.add(notify)
    raw.on('close', () => {
      closed = true
      notify()
    })
    const waitForAlerts = (ms: number) =>
      new Promise<void>((resolve) => {
        const done = () => {
          clearTimeout(t)
          wake = null
          resolve()
        }
        const t = setTimeout(done, ms)
        wake = done
      })

    let lastWrite = Date.now()
    let lastCheck = Date.now()
    try {
      while (!closed && !shuttingDown) {
        // Normally served from the shared buffer. A client that reconnects with an old Last-Event-ID, or stalls for long,
        // catches up straight from the database.
        const rows =
          last < alertFloor
            ? await cfg.db.select().from(proAlerts).where(gt(proAlerts.id, last)).orderBy(asc(proAlerts.id)).limit(50)
            : alertBuffer.filter((r) => r.id > last)
        for (const r of rows) {
          const ev = alertEventSchema.parse({ id: r.id, kind: r.kind, content: r.content, createdAt: r.createdAt.toISOString(), publicAt: r.publicAt ? r.publicAt.toISOString() : null })
          raw.write(`id: ${r.id}\nevent: alert\ndata: ${JSON.stringify(ev)}\n\n`)
          last = r.id
          lastWrite = Date.now()
        }
        if (Date.now() - lastWrite >= heartbeatMs) {
          raw.write(': ping\n\n')
          lastWrite = Date.now()
        }
        // Langganan atau sesi berakhir: tutup stream (klien akan melihat 402/401 saat tersambung ulang).
        if (Date.now() - lastCheck >= SESSION_RECHECK_MS) {
          lastCheck = Date.now()
          if (!(await sessionFrom(cfg.db, req.headers.authorization, now())) || !(await proStatus(cfg.db, s.address, now())).active) break
        }
        if (rows.length === 0) {
          const untilHeartbeat = heartbeatMs - (Date.now() - lastWrite)
          const untilCheck = SESSION_RECHECK_MS - (Date.now() - lastCheck)
          await waitForAlerts(Math.max(50, Math.min(untilHeartbeat, untilCheck)))
        }
      }
    } catch {
      /* koneksi putus atau DB gagal sesaat: tutup, klien menyambung ulang dengan Last-Event-ID */
    } finally {
      alertSubscribers -= 1
      alertWaiters.delete(notify)
      raw.end()
    }
  })

  // Rencana Ask Elysia: web membayar langsung dari wallet (tanpa menyalin alamat dan hash secara manual).
  app.get('/ask/plan', async (_req, reply) => {
    if (!cfg.paidFeaturesEnabled || !cfg.ask || cfg.ask.chainId === undefined) return reply.code(503).send({ error: 'paid_features_disabled' })
    cache(reply)
    return askPlanResponseSchema.parse({
      price: { raw: cfg.ask.minAmount.toString(), decimals: 6, formatted: formatUnits(cfg.ask.minAmount, 6) },
      recipient: cfg.ask.recipient,
      usdgAddress: cfg.ask.usdg,
      chainId: cfg.ask.chainId,
      ...(cfg.ask.chain ? { chain: cfg.ask.chain } : {}),
    })
  })

  // Ask ELYSIA: free. No payment, API key, login, or holder credit. Rate limited per IP before any work.
  // Tokens that are too new or have no data are not analyzed.
  app.post('/ask', async (req, reply) => {
    const limit = askLimiter.check(req.ip || 'unknown')
    if (!limit.ok) {
      void reply.header('retry-after', String(limit.retryAfterSeconds))
      return reply.code(429).send({ error: 'rate_limited' })
    }
    const parsed = askRequestSchema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_body' })
    const { address } = parsed.data

    const result = await buildRiskReport(cfg.db, address, now(), { explorerBase: cfg.tokenExplorerUrl ?? cfg.explorerUrl, excludedHolders: POOL_ADDRESSES })
    if (result.kind !== 'report') return reply.code(422).send({ error: result.kind === 'too_new' ? 'token_too_new' : 'no_data' })

    const body: AskResponse = askResponseSchema.parse({
      address,
      generatedAt: now().toISOString(),
      report: result.report,
      paymentTxUrl: null,
    })
    void reply.header('cache-control', 'private, no-store')
    return body
  })

  return app
}
