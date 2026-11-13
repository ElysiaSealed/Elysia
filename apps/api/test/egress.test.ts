import { beforeEach, describe, expect, it } from 'vitest'
import { predictions } from '@elysia/db'
import { proofResponseSchema } from '@elysia/api-client'
import { buildApp } from '../src/app'
import { testDb } from './test-db'

const { db, client, configured } = testDb()
let dbUp = !configured
if (configured) try {
  await client`select 1`
  dbUp = true
} catch {
  console.warn('Test Postgres unavailable: egress tests are skipped')
}

const NOW = new Date('2026-12-01T12:00:00.000Z')
const NVDA = '0x00000000000000000000000000000000000ae1da'
const h = (n: number) => `0x${n.toString(16).padStart(64, '0')}`
let seq = 0

async function addRevealed(ledgerId: number, returnBps: number, won: boolean) {
  seq += 1
  const committedAt = new Date(NOW.getTime() - (30 - ledgerId) * 86_400_000)
  await db.insert(predictions).values({
    ledgerId,
    hash: h(5000 + seq),
    // A large encrypted preimage: the API must never read it, so it cannot add to database egress.
    preimageEncrypted: 'x'.repeat(4000),
    status: 'revealed',
    commitTxHash: h(6000 + seq),
    committedAt,
    maturesAt: new Date(committedAt.getTime() + 7 * 86_400_000),
    revealedText: `Prediction ${ledgerId}. Not financial advice.`,
    revealedAsset: NVDA,
    revealedDirection: 1,
    revealTxHash: h(7000 + seq),
    won,
    returnBps,
  })
}

describe.skipIf(!dbUp)('public read egress (Supabase free plan)', () => {
  beforeEach(async () => {
    await db.delete(predictions)
  })

  it('serves /proof from memory within its cache window (2.5 x base) and refreshes after it', async () => {
    let t = NOW.getTime()
    const app = buildApp({ db, explorerUrl: 'https://explorer.example.test', publicCacheSeconds: 60, now: () => new Date(t) })
    await addRevealed(1, 400, true)
    const first = proofResponseSchema.parse((await app.inject({ method: 'GET', url: '/proof' })).json())
    expect(first.stats.scored).toBe(1)

    await addRevealed(2, -100, false)
    t += 30_000
    const cached = proofResponseSchema.parse((await app.inject({ method: 'GET', url: '/proof' })).json())
    expect(cached.stats.scored).toBe(1) // still the cached answer: no database read

    t += 131_000 // past the scoreboard window (2.5 x the base cache window)
    const fresh = proofResponseSchema.parse((await app.inject({ method: 'GET', url: '/proof' })).json())
    expect(fresh.stats.scored).toBe(2)
    expect(fresh.stats.wins).toBe(1)
    expect(fresh.stats.avgReturnBps).toBe(150) // (400 + -100) / 2
  })

  it('does not cache when the window is 0', async () => {
    const app = buildApp({ db, explorerUrl: 'https://explorer.example.test', publicCacheSeconds: 0, now: () => NOW })
    await addRevealed(1, 400, true)
    expect(proofResponseSchema.parse((await app.inject({ method: 'GET', url: '/proof' })).json()).stats.scored).toBe(1)
    await addRevealed(2, 200, true)
    expect(proofResponseSchema.parse((await app.inject({ method: 'GET', url: '/proof' })).json()).stats.scored).toBe(2)
  })

  it('computes the scoreboard in SQL: only 10 recent rows come back however many predictions exist', async () => {
    const app = buildApp({ db, explorerUrl: 'https://explorer.example.test', publicCacheSeconds: 0, now: () => NOW })
    for (let i = 1; i <= 25; i += 1) await addRevealed(i, i % 2 === 0 ? 100 : -100, i % 2 === 0)
    const body = proofResponseSchema.parse((await app.inject({ method: 'GET', url: '/proof' })).json())
    expect(body.stats.scored).toBe(25)
    expect(body.stats.wins).toBe(12)
    expect(body.recent).toHaveLength(10)
    expect(body.recent[0]!.id).toBe(25) // newest first
  })
})
