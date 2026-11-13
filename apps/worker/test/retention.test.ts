import { beforeEach, describe, expect, it } from 'vitest'
import { authNonces, authSessions, ponsTrades, postQueue, predictions, priceSnapshots, proAlerts, whaleTransfers } from '@elysia/db'
import { checkDatabaseSize, DEFAULT_RETENTION, pruneOldData } from '../src/retention'
import { testDb } from './test-db'

const { db, client, configured } = testDb()
let dbUp = !configured
if (configured) try {
  await client`select 1`
  dbUp = true
} catch {
  console.warn('Test Postgres unavailable: retention tests are skipped')
}

const NOW = new Date('2026-12-01T12:00:00.000Z')
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 86_400_000)

describe.skipIf(!dbUp)('retention (Supabase free plan housekeeping)', () => {
  beforeEach(async () => {
    await db.delete(proAlerts)
    await db.delete(postQueue)
    await db.delete(predictions)
    await db.delete(ponsTrades)
    await db.delete(whaleTransfers)
    await db.delete(priceSnapshots)
    await db.delete(authNonces)
    await db.delete(authSessions)
  })

  it('removes old derived rows and keeps recent rows', async () => {
    const trade = (id: string, d: number) => ({ id, token: '0xt', trader: '0xa', side: 'buy' as const, tokenAmount: '1', quoteAmount: '1', quoteDecimals: 6, at: daysAgo(d), blockNumber: 1n })
    await db.insert(ponsTrades).values([trade('old', 40), trade('new', 5)])
    const whale = (id: string, d: number) => ({ id, token: '0xt', from: '0xa', to: '0xb', amount: '1', decimals: 18, at: daysAgo(d), blockNumber: 1n })
    await db.insert(whaleTransfers).values([whale('old', 40), whale('new', 5)])
    const snap = (d: number) => ({ asset: 'NVDA', source: 'oracle' as const, price: '1', decimals: 8, at: daysAgo(d) })
    await db.insert(priceSnapshots).values([snap(10), snap(1)])

    const removed = await pruneOldData(db, DEFAULT_RETENTION, NOW)
    expect(removed).toMatchObject({ ponsTrades: 1, whaleTransfers: 1, priceSnapshots: 1 })
    expect((await db.select().from(ponsTrades)).map((r) => r.id)).toEqual(['new'])
    expect((await db.select().from(whaleTransfers)).map((r) => r.id)).toEqual(['new'])
    expect(await db.select().from(priceSnapshots)).toHaveLength(1)
  })

  it('removes expired login nonces and sessions but not valid ones', async () => {
    await db.insert(authNonces).values([
      { nonce: 'expired', expiresAt: daysAgo(3) },
      { nonce: 'valid', expiresAt: new Date(NOW.getTime() + 60_000) },
    ])
    await db.insert(authSessions).values([
      { tokenHash: 'expired', address: '0xa', expiresAt: daysAgo(3) },
      { tokenHash: 'valid', address: '0xb', expiresAt: new Date(NOW.getTime() + 60_000) },
    ])
    await pruneOldData(db, DEFAULT_RETENTION, NOW)
    expect((await db.select().from(authNonces)).map((r) => r.nonce)).toEqual(['valid'])
    expect((await db.select().from(authSessions)).map((r) => r.tokenHash)).toEqual(['valid'])
  })

  it('prunes only Pro alerts that were already dispatched', async () => {
    const posts = await db
      .insert(postQueue)
      .values([1, 2, 3].map((n) => ({ kind: 'prediction', content: `post ${n}` })))
      .returning({ id: postQueue.id })
    await db.insert(proAlerts).values([
      { postId: posts[0]!.id, kind: 'prediction', content: 'old sent', createdAt: daysAgo(60), telegramDispatchedAt: daysAgo(60) },
      { postId: posts[1]!.id, kind: 'prediction', content: 'old unsent', createdAt: daysAgo(60), telegramDispatchedAt: null },
      { postId: posts[2]!.id, kind: 'prediction', content: 'recent sent', createdAt: daysAgo(2), telegramDispatchedAt: daysAgo(2) },
    ])
    const removed = await pruneOldData(db, DEFAULT_RETENTION, NOW)
    expect(removed.proAlerts).toBe(1)
    expect((await db.select().from(proAlerts)).map((r) => r.content).sort()).toEqual(['old unsent', 'recent sent'])
  })

  it('never touches prediction evidence or the post queue', async () => {
    await db.insert(predictions).values({ hash: '0x01', preimageEncrypted: 'enc', status: 'committed', createdAt: daysAgo(400) })
    await db.insert(postQueue).values({ kind: 'prediction', content: 'old post', createdAt: daysAgo(400) })
    await pruneOldData(db, DEFAULT_RETENTION, NOW)
    expect(await db.select().from(predictions)).toHaveLength(1)
    expect(await db.select().from(postQueue)).toHaveLength(1)
  })

  it('reports database size levels', async () => {
    const ok = await checkDatabaseSize(db, 100_000, 200_000)
    expect(ok.mb).toBeGreaterThan(0)
    expect(ok.level).toBe('ok')
    expect((await checkDatabaseSize(db, 0.001, 100_000)).level).toBe('warn')
    expect((await checkDatabaseSize(db, 0.001, 0.002)).level).toBe('critical')
  })
})
