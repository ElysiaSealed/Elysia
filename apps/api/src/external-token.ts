import { z } from 'zod'

/**
 * Read-only market and on-chain data for tokens that are NOT in the Pons V2 indexer.
 * Sources: DexScreener (market data) and Blockscout (holders, creator, verification).
 * Third-party data is untrusted: every response is validated with zod, and anything
 * missing or malformed becomes null ("unknown"), never a guess.
 */

export type FetchLike = (url: string, init?: { signal?: AbortSignal; headers?: Record<string, string> }) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>

const TIMEOUT_MS = 8000
const DEXSCREENER_BASE = 'https://api.dexscreener.com'
/** Pairs with less liquidity than this are ignored when choosing the main pair. [di luar brief] PENDING. */
export const MIN_PAIR_LIQUIDITY_USD = 100

const num = z.number().finite().nonnegative().nullish()
const dexPairSchema = z.object({
  chainId: z.string(),
  dexId: z.string().nullish(),
  url: z.string().url().nullish(),
  baseToken: z.object({ address: z.string(), name: z.string().nullish(), symbol: z.string().nullish() }),
  priceUsd: z.string().nullish(),
  txns: z.object({ h24: z.object({ buys: z.number().int().nonnegative(), sells: z.number().int().nonnegative() }).nullish() }).nullish(),
  volume: z.object({ h24: num }).nullish(),
  priceChange: z.object({ h24: z.number().finite().nullish() }).nullish(),
  liquidity: z.object({ usd: num }).nullish(),
  fdv: num,
  pairCreatedAt: z.number().int().positive().nullish(),
})
const dexResponseSchema = z.array(z.unknown())

export interface MarketData {
  name: string | null
  symbol: string | null
  dex: string | null
  pairUrl: string | null
  priceUsd: string | null
  liquidityUsd: number | null
  fdvUsd: number | null
  volume24hUsd: number | null
  buys24h: number | null
  sells24h: number | null
  priceChange24hPct: number | null
  /** Earliest pair creation among valid pairs: used as the token age. */
  firstPairAt: Date
}

const holderSchema = z.object({ address: z.object({ hash: z.string() }), value: z.string() })
const tokenInfoSchema = z.object({
  name: z.string().nullish(),
  symbol: z.string().nullish(),
  decimals: z.union([z.string(), z.number()]).nullish(),
  total_supply: z.string().nullish(),
  holders_count: z.union([z.string(), z.number()]).nullish(),
  holders: z.union([z.string(), z.number()]).nullish(),
})
const holdersPageSchema = z.object({ items: z.array(z.unknown()) })
const addressInfoSchema = z.object({ creator_address_hash: z.string().nullish(), is_verified: z.boolean().nullish() })

export interface ChainData {
  name: string | null
  symbol: string | null
  holderCount: number | null
  /** Top holders as basis points of total supply, pool contracts excluded. Null when supply or the list is unavailable. */
  top: { address: string; shareBps: number }[] | null
  creator: string | null
  verified: boolean | null
}

const ADDR = /^0x[0-9a-fA-F]{40}$/

async function getJson(fetchFn: FetchLike, url: string): Promise<unknown | null> {
  try {
    const res = await fetchFn(url, { signal: AbortSignal.timeout(TIMEOUT_MS), headers: { accept: 'application/json' } })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

/** Main pair = highest liquidity among pairs of this token. Null when the token has no usable pair. */
export async function fetchMarket(fetchFn: FetchLike, chainSlug: string, address: string): Promise<MarketData | null> {
  if (!ADDR.test(address)) return null
  const raw = dexResponseSchema.safeParse(await getJson(fetchFn, `${DEXSCREENER_BASE}/token-pairs/v1/${encodeURIComponent(chainSlug)}/${address}`))
  if (!raw.success) return null
  const pairs = raw.data
    .map((p) => dexPairSchema.safeParse(p))
    .flatMap((r) => (r.success ? [r.data] : []))
    .filter((p) => p.chainId === chainSlug && p.baseToken.address.toLowerCase() === address.toLowerCase())
  if (pairs.length === 0) return null
  const liq = (p: (typeof pairs)[number]) => p.liquidity?.usd ?? 0
  const ranked = [...pairs].sort((a, b) => liq(b) - liq(a))
  const main = ranked.find((p) => liq(p) >= MIN_PAIR_LIQUIDITY_USD) ?? ranked[0]!
  const created = pairs.flatMap((p) => (p.pairCreatedAt ? [p.pairCreatedAt] : []))
  // No creation time = unknown age: the caller must not publish a report for it.
  if (created.length === 0) return null
  return {
    name: main.baseToken.name ?? null,
    symbol: main.baseToken.symbol ?? null,
    dex: main.dexId ?? null,
    pairUrl: main.url ?? null,
    priceUsd: main.priceUsd ?? null,
    liquidityUsd: main.liquidity?.usd ?? null,
    fdvUsd: main.fdv ?? null,
    volume24hUsd: main.volume?.h24 ?? null,
    buys24h: main.txns?.h24?.buys ?? null,
    sells24h: main.txns?.h24?.sells ?? null,
    priceChange24hPct: main.priceChange?.h24 ?? null,
    firstPairAt: new Date(Math.min(...created)),
  }
}

/** Holders, creator and verification from Blockscout. Each part fails on its own into null. */
export async function fetchChainData(fetchFn: FetchLike, explorerBase: string, address: string, excluded: readonly string[]): Promise<ChainData> {
  const base = explorerBase.replace(/\/$/, '')
  const api = `${base}/api/v2`
  const [tokenRaw, holdersRaw, addrRaw] = await Promise.all([
    getJson(fetchFn, `${api}/tokens/${address}`),
    getJson(fetchFn, `${api}/tokens/${address}/holders`),
    getJson(fetchFn, `${api}/addresses/${address}`),
  ])
  const token = tokenInfoSchema.safeParse(tokenRaw)
  const info = addrRaw === null ? null : addressInfoSchema.safeParse(addrRaw)
  const page = holdersPageSchema.safeParse(holdersRaw)

  const toInt = (v: string | number | null | undefined) => {
    if (v === null || v === undefined) return null
    const n = Number(v)
    return Number.isSafeInteger(n) && n >= 0 ? n : null
  }
  let supply: bigint | null = null
  try {
    supply = token.success && token.data.total_supply ? BigInt(token.data.total_supply) : null
  } catch {
    supply = null
  }
  const skip = new Set([ZERO, ...excluded.map((a) => a.toLowerCase())])
  let top: ChainData['top'] = null
  if (page.success && supply !== null && supply > 0n) {
    const rows = page.data.items
      .map((i) => holderSchema.safeParse(i))
      .flatMap((r) => (r.success ? [r.data] : []))
      .filter((h) => !skip.has(h.address.hash.toLowerCase()))
    try {
      top = rows.slice(0, 10).map((h) => ({ address: h.address.hash, shareBps: Number((BigInt(h.value) * 10_000n) / supply!) }))
    } catch {
      top = null
    }
  }
  const creator = info?.success && info.data.creator_address_hash && ADDR.test(info.data.creator_address_hash) ? info.data.creator_address_hash : null
  return {
    name: token.success ? (token.data.name ?? null) : null,
    symbol: token.success ? (token.data.symbol ?? null) : null,
    holderCount: token.success ? toInt(token.data.holders_count ?? token.data.holders) : null,
    top,
    creator,
    verified: info?.success ? (info.data.is_verified ?? null) : null,
  }
}

const ZERO = '0x0000000000000000000000000000000000000000'
