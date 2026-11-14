import { describe, expect, it } from 'vitest'
import { askResponseSchema } from '@elysia/api-client'
import { buildExternalReport } from '../src/ask-external'
import { fetchChainData, fetchMarket, type FetchLike } from '../src/external-token'

const TOKEN = '0x0f8110b99bc4c5c0b22aa7dcf17a06935f7b8f4a'
const POOL = '0x00000000000000000000000000000000000000aa'
const HOLDER = '0x00000000000000000000000000000000000000bb'
const CREATOR = '0x00000000000000000000000000000000000000cc'
const NOW = new Date('2026-12-01T12:00:00.000Z')
const OPTS = { explorerBase: 'https://explorer.example.test' }

const pair = (over: Record<string, unknown> = {}) => ({
  chainId: 'robinhood',
  dexId: 'uniswap',
  url: 'https://dexscreener.com/robinhood/0x1',
  baseToken: { address: TOKEN, name: 'Test', symbol: 'TST' },
  priceUsd: '0.01',
  txns: { h24: { buys: 10, sells: 5 } },
  volume: { h24: 1234 },
  priceChange: { h24: -3.5 },
  liquidity: { usd: 20000 },
  fdv: 50000,
  pairCreatedAt: NOW.getTime() - 5 * 3_600_000,
  ...over,
})

/** Routes a URL to a fixed JSON body; anything not listed answers HTTP 500. */
const fakeFetch = (routes: Record<string, unknown>): FetchLike => async (url) => {
  const hit = Object.entries(routes).find(([k]) => url.includes(k))
  return { ok: hit !== undefined, status: hit ? 200 : 500, json: async () => hit?.[1] }
}

const chainRoutes = {
  [`/tokens/${TOKEN}/holders`]: {
    items: [
      { address: { hash: POOL }, value: '600' },
      { address: { hash: HOLDER }, value: '100' },
    ],
  },
  [`/tokens/${TOKEN}`]: { name: 'Test', symbol: 'TST', total_supply: '1000', holders_count: '42' },
  [`/addresses/${TOKEN}`]: { creator_address_hash: CREATOR, is_verified: true },
}

describe('fetchMarket', () => {
  it('picks the pair with the most liquidity and the earliest creation time', async () => {
    const f = fakeFetch({
      'token-pairs/v1/robinhood': [pair({ liquidityUsd: 1, liquidity: { usd: 0.79 }, pairCreatedAt: NOW.getTime() - 9 * 3_600_000 }), pair()],
    })
    const m = await fetchMarket(f, 'robinhood', TOKEN)
    expect(m?.liquidityUsd).toBe(20000)
    expect(m?.firstPairAt.getTime()).toBe(NOW.getTime() - 9 * 3_600_000)
  })

  it('returns null for another token, a malformed body, or an HTTP error', async () => {
    expect(await fetchMarket(fakeFetch({ 'token-pairs': [pair({ baseToken: { address: POOL } })] }), 'robinhood', TOKEN)).toBeNull()
    expect(await fetchMarket(fakeFetch({ 'token-pairs': { not: 'an array' } }), 'robinhood', TOKEN)).toBeNull()
    expect(await fetchMarket(fakeFetch({}), 'robinhood', TOKEN)).toBeNull()
    expect(await fetchMarket(fakeFetch({}), 'robinhood', 'not-an-address')).toBeNull()
  })

  it('returns null when no pair has a creation time (unknown age)', async () => {
    expect(await fetchMarket(fakeFetch({ 'token-pairs': [pair({ pairCreatedAt: null })] }), 'robinhood', TOKEN)).toBeNull()
  })
})

describe('fetchChainData', () => {
  it('computes holder shares of total supply and leaves excluded pool addresses out', async () => {
    const c = await fetchChainData(fakeFetch(chainRoutes), OPTS.explorerBase, TOKEN, [POOL])
    expect(c.top).toEqual([{ address: HOLDER, shareBps: 1000 }])
    expect(c.holderCount).toBe(42)
    expect(c.creator).toBe(CREATOR)
    expect(c.verified).toBe(true)
  })

  it('turns every failed lookup into null, not a guess', async () => {
    const c = await fetchChainData(fakeFetch({}), OPTS.explorerBase, TOKEN, [])
    expect(c).toEqual({ name: null, symbol: null, holderCount: null, top: null, creator: null, verified: null })
  })
})

describe('buildExternalReport', () => {
  const market = async () => (await fetchMarket(fakeFetch({ 'token-pairs': [pair()] }), 'robinhood', TOKEN))!
  const chain = () => fetchChainData(fakeFetch(chainRoutes), OPTS.explorerBase, TOKEN, [POOL])

  it('builds a limited report that matches the public schema', async () => {
    const res = buildExternalReport(await market(), await chain(), TOKEN, NOW, OPTS)
    expect(res.kind).toBe('report')
    if (res.kind !== 'report') return
    expect(res.report.source).toBe('external')
    expect(res.report.trades).toBeNull()
    expect(res.report.details.market?.liquidityUsd).toBe(20000)
    expect(res.report.disclaimer).toContain('Limited data')
    expect(() => askResponseSchema.parse({ address: TOKEN, generatedAt: NOW.toISOString(), report: res.report, paymentTxUrl: null })).not.toThrow()
  })

  it('answers no_data without a market and too_new under one hour', async () => {
    expect(buildExternalReport(null, await chain(), TOKEN, NOW, OPTS)).toEqual({ kind: 'no_data' })
    const young = { ...(await market()), firstPairAt: new Date(NOW.getTime() - 30 * 60_000) }
    expect(buildExternalReport(young, await chain(), TOKEN, NOW, OPTS)).toEqual({ kind: 'too_new' })
  })

  it('marks missing chain data as unknown and never reports a low level from nothing', async () => {
    const empty = await fetchChainData(fakeFetch({}), OPTS.explorerBase, TOKEN, [])
    const res = buildExternalReport(await market(), empty, TOKEN, NOW, OPTS)
    if (res.kind !== 'report') throw new Error('expected report')
    expect(res.report.unknowns).toContain('holder distribution could not be read')
    expect(res.report.signals.filter((s) => s.level === 'unknown').map((s) => s.id)).toEqual(['top_holder', 'top10', 'verified'])
    expect(res.report.details.creator).toBeNull()
  })
})
