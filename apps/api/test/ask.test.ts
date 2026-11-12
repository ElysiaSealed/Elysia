import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { encodeAbiParameters, encodeEventTopics, getAddress, parseAbi } from 'viem'
import { askPayments, ponsTokens, ponsTrades } from '@elysia/db'
import { askPlanResponseSchema, askResponseSchema } from '@elysia/api-client'
import { buildApp } from '../src/app'
import type { AskConfig } from '../src/ask'
import { testDb } from './test-db'

const { db, client, configured } = testDb()
let dbUp = !configured
if (configured) try {
  await client`select 1`
  dbUp = true
} catch {
  console.warn('Test Postgres unavailable: DB-backed /ask tests are skipped')
}

const NOW = new Date('2026-12-01T12:00:00.000Z')
const USDG = '0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168' as const
const TREASURY = '0x00000000000000000000000000000000000000a1' as const
const PAYER = '0x00000000000000000000000000000000000000b2' as const
const TOKEN = '0x00000000000000000000000000000000000000c3'
const OTHER = '0x00000000000000000000000000000000000000d4'
const h = (n: number) => `0x${n.toString(16).padStart(64, '0')}` as `0x${string}`
const transferAbi = parseAbi(['event Transfer(address indexed from, address indexed to, uint256 value)'])

const transferLog = (token: `0x${string}`, to: `0x${string}`, value: bigint) => ({
  address: token,
  topics: encodeEventTopics({ abi: transferAbi, eventName: 'Transfer', args: { from: PAYER, to } }),
  data: encodeAbiParameters([{ type: 'uint256' }], [value]),
  blockHash: h(1),
  blockNumber: 1n,
  logIndex: 0,
  transactionHash: h(2),
  transactionIndex: 0,
  removed: false,
})

/** Fake receipt per tx hash for the legacy /ask/plan test config. */
function fakeClient(receipts: Record<string, { status: 'success' | 'reverted'; logs: ReturnType<typeof transferLog>[] }>): AskConfig['client'] {
  return {
    getTransactionReceipt: async ({ hash }: { hash: `0x${string}` }) => {
      const r = receipts[hash]
      if (!r) throw new Error('not found')
      return r
    },
  } as unknown as AskConfig['client']
}

const receipts = {
  [h(10)]: { status: 'success' as const, logs: [transferLog(USDG, TREASURY, 1_000_000n)] },
}

const mk = (paid = true, withAsk = true) =>
  buildApp({
    db,
    explorerUrl: 'https://explorer.example.test',
    paidFeaturesEnabled: paid,
    now: () => NOW,
    ...(withAsk ? { ask: { client: fakeClient(receipts), usdg: USDG, recipient: TREASURY, minAmount: 1_000_000n } } : {}),
  })

async function seedToken(ageHours: number) {
  await db.insert(ponsTokens).values({
    address: getAddress(TOKEN), // the indexer stores checksummed addresses
    curve: '0x00000000000000000000000000000000000000ee',
    creator: PAYER,
    name: 'Test',
    symbol: 'TST',
    launchedAt: new Date(NOW.getTime() - ageHours * 3_600_000),
    creatorTaxBps: 1500,
    redFlags: ['High creator tax'],
    blockNumber: 1n,
  })
  const row = (i: number, side: 'buy' | 'sell') => ({
    id: `t${i}`,
    token: TOKEN,
    trader: PAYER,
    side,
    tokenAmount: '1',
    quoteAmount: '1',
    quoteDecimals: 18,
    at: NOW,
    blockNumber: 1n,
  })
  const [t] = await db.select().from(ponsTokens)
  await db.insert(ponsTrades).values([row(1, 'buy'), row(2, 'buy'), row(3, 'sell')].map((r) => ({ ...r, token: t!.address })))
}

describe('GET /ask/plan (legacy NEXA payment plan, unused by the free Ask)', () => {
  it('returns the plan only when paid features are on and a chain is configured; 503 otherwise', async () => {
    const withChain = buildApp({
      db,
      explorerUrl: 'https://explorer.example.test',
      paidFeaturesEnabled: true,
      now: () => NOW,
      ask: {
        client: fakeClient(receipts),
        usdg: USDG,
        recipient: TREASURY,
        minAmount: 1_000_000n,
        chainId: 46630,
        chain: { name: 'Test Chain', rpcUrl: 'https://rpc.example.test', explorerUrl: 'https://explorer.example.test' },
      },
    })
    const r = await withChain.inject({ method: 'GET', url: '/ask/plan' })
    expect(r.statusCode).toBe(200)
    expect(askPlanResponseSchema.parse(r.json()).chainId).toBe(46630)
    expect((await mk(false).inject({ method: 'GET', url: '/ask/plan' })).statusCode).toBe(503)
    expect((await mk(true, false).inject({ method: 'GET', url: '/ask/plan' })).statusCode).toBe(503)
  })
})

describe('POST /ask rate limit (no database query happens)', () => {
  // A bad body is rejected with 400 after the limiter, so these tests never touch the DB.
  const bad = { address: 'x' }
  const post = (app: ReturnType<typeof mk>, ip?: string, xff?: string) =>
    app.inject({ method: 'POST', url: '/ask', payload: bad, ...(ip ? { remoteAddress: ip } : {}), ...(xff ? { headers: { 'x-forwarded-for': xff } } : {}) })
  const limits = { perMinute: 3, perDay: 5 }
  const base = { db, explorerUrl: 'https://explorer.example.test', askRateLimit: limits }

  it('free: 400 for a bad body, with no payment, API key, or login', async () => {
    expect((await post(mk(false, false))).statusCode).toBe(400)
  })

  it('429 after the per-minute limit, with retry-after; the window then resets', async () => {
    let t = NOW.getTime()
    const app = buildApp({ ...base, now: () => new Date(t) })
    for (let i = 0; i < 3; i++) expect((await post(app)).statusCode).toBe(400)
    const blocked = await post(app)
    expect(blocked.statusCode).toBe(429)
    expect(blocked.json()).toEqual({ error: 'rate_limited' })
    expect(Number(blocked.headers['retry-after'])).toBeGreaterThan(0)
    t += 61_000
    expect((await post(app)).statusCode).toBe(400)
  })

  it('429 after the per-day limit even when the minute window resets', async () => {
    let t = NOW.getTime()
    const app = buildApp({ ...base, now: () => new Date(t) })
    for (let i = 0; i < 5; i++) {
      expect((await post(app)).statusCode).toBe(400)
      t += 61_000
    }
    expect((await post(app)).statusCode).toBe(429)
  })

  it('without a trusted proxy, X-Forwarded-For cannot dodge the limit', async () => {
    const app = buildApp({ ...base, now: () => NOW })
    for (let i = 0; i < 3; i++) await post(app, '10.0.0.1', `1.1.1.${i}`)
    expect((await post(app, '10.0.0.1', '9.9.9.9')).statusCode).toBe(429)
  })

  it('with one trusted proxy hop, clients are counted per forwarded IP', async () => {
    const app = buildApp({ ...base, now: () => NOW, trustProxyHops: 1 })
    for (let i = 0; i < 3; i++) await post(app, '10.0.0.1', '203.0.113.7')
    expect((await post(app, '10.0.0.1', '203.0.113.7')).statusCode).toBe(429)
    expect((await post(app, '10.0.0.1', '203.0.113.8')).statusCode).toBe(400)
  })

  it('with one trusted hop, a spoofed left-most X-Forwarded-For entry does not change the key', async () => {
    const app = buildApp({ ...base, now: () => NOW, trustProxyHops: 1 })
    for (let i = 0; i < 3; i++) await post(app, '10.0.0.1', `66.66.66.${i}, 203.0.113.7`)
    expect((await post(app, '10.0.0.1', '77.77.77.7, 203.0.113.7')).statusCode).toBe(429)
  })
})

describe.skipIf(!dbUp)('POST /ask (free)', () => {
  beforeEach(async () => {
    await db.delete(askPayments)
    await db.delete(ponsTrades)
    await db.delete(ponsTokens)
  })
  afterAll(async () => {
    await client.end()
  })
  const free = () => buildApp({ db, explorerUrl: 'https://explorer.example.test', now: () => NOW })
  const ask = (app: ReturnType<typeof free>, body: unknown) => app.inject({ method: 'POST', url: '/ask', payload: body as object })

  it('200: report from indexed data without payment, key, login, or credit; no payment is recorded', async () => {
    await seedToken(5)
    const res = await ask(free(), { address: TOKEN })
    expect(res.statusCode).toBe(200)
    const out = askResponseSchema.parse(res.json())
    expect(out.paymentTxUrl).toBeNull()
    expect(out.report).toMatchObject({ symbol: 'TST', creatorTaxBps: 1500, redFlags: ['High creator tax'], trades: { total: 3, buys: 2, sells: 1 } })
    expect(out.report.ageSeconds).toBe(5 * 3600)
    expect(res.headers['cache-control']).toBe('private, no-store')
    expect(await db.select().from(askPayments)).toHaveLength(0)
  })

  it('a leftover txHash in the body is ignored', async () => {
    await seedToken(5)
    expect((await ask(free(), { address: TOKEN, txHash: h(10) })).statusCode).toBe(200)
  })

  it('422 for a token younger than one hour or with no data', async () => {
    await seedToken(0.5)
    const app = free()
    expect((await ask(app, { address: TOKEN })).json()).toEqual({ error: 'token_too_new' })
    expect((await ask(app, { address: OTHER })).json()).toEqual({ error: 'no_data' })
  })
})

describe('GET /signals/whales is unavailable (no data query, no substitute data)', () => {
  it('503 with or without an API key and regardless of the paid flag', async () => {
    for (const paid of [true, false]) {
      const app = buildApp({ db, explorerUrl: 'https://explorer.example.test', paidFeaturesEnabled: paid, now: () => NOW })
      const r = await app.inject({ method: 'GET', url: '/signals/whales', headers: { 'x-api-key': 'anything' } })
      expect(r.statusCode).toBe(503)
      expect(r.json()).toEqual({ error: 'unavailable', reason: 'no_elysia_data_source' })
    }
  })
})
