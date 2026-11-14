import type { AskResponse } from '@elysia/api-client'
import { ASK_DISCLAIMER, type ReportOptions, type ReportResult } from './ask'
import { buildExternalSignals, riskLevelOf } from './ask-signals'
import type { ChainData, MarketData } from './external-token'

const MIN_AGE_SECONDS = 3600

/**
 * Limited report for a token outside the Pons V2 indexer. Same fail-closed rules: no market data or unknown age means no report,
 * tokens under one hour are not discussed, and every missing field is listed as unknown.
 */
export function buildExternalReport(market: MarketData | null, chain: ChainData, address: string, now: Date, opts: ReportOptions): ReportResult {
  if (!market) return { kind: 'no_data' }
  const ageSeconds = Math.max(0, Math.floor((now.getTime() - market.firstPairAt.getTime()) / 1000))
  if (ageSeconds < MIN_AGE_SECONDS) return { kind: 'too_new' }

  const base = opts.explorerBase.replace(/\/$/, '')
  const link = (a: string) => `${base}/address/${a}`
  const top = chain.top
  const top10 = top ? top.reduce((a, h) => a + h.shareBps, 0) : null
  const holders: AskResponse['report']['details']['holders'] = top
    ? {
        count: chain.holderCount ?? top.length,
        top5ShareBps: top.slice(0, 5).reduce((a, h) => a + h.shareBps, 0),
        top10ShareBps: top10 ?? 0,
        top: top.map((h) => ({ address: h.address, url: link(h.address), shareBps: h.shareBps })),
      }
    : null

  const unknowns = ['creator tax is not read for tokens outside Pons V2', 'bonding curve and creator trading history are not tracked']
  if (!chain.creator) unknowns.push('creator wallet could not be read')
  if (!top) unknowns.push('holder distribution could not be read')
  if (chain.verified === null) unknowns.push('contract verification status could not be read')
  if (market.liquidityUsd === null) unknowns.push('pool liquidity is not reported')

  const signals = buildExternalSignals({
    top1ShareBps: top?.[0]?.shareBps ?? null,
    top10ShareBps: top10,
    liquidityUsd: market.liquidityUsd,
    buys24h: market.buys24h,
    sells24h: market.sells24h,
    verified: chain.verified,
  })
  return {
    kind: 'report',
    report: {
      source: 'external',
      name: market.name ?? chain.name,
      symbol: market.symbol ?? chain.symbol,
      ageSeconds,
      graduated: false,
      creatorTaxBps: null,
      topHolderShareBps: top?.[0]?.shareBps ?? null,
      trades: null,
      redFlags: [],
      unknowns,
      riskLevel: riskLevelOf(signals),
      signals,
      details: {
        token: { address, url: link(address) },
        creator: chain.creator ? { address: chain.creator, url: link(chain.creator) } : null,
        curve: null,
        pair: null,
        launchedAt: market.firstPairAt.toISOString(),
        graduatedAt: null,
        market: {
          dex: market.dex,
          pairUrl: market.pairUrl,
          priceUsd: market.priceUsd,
          liquidityUsd: market.liquidityUsd,
          fdvUsd: market.fdvUsd,
          volume24hUsd: market.volume24hUsd,
          buys24h: market.buys24h,
          sells24h: market.sells24h,
          priceChange24hPct: market.priceChange24hPct,
        },
        contractVerified: chain.verified,
        activity: null,
        creatorActivity: null,
        holders,
      },
      disclaimer: `${ASK_DISCLAIMER} Limited data: market data from DexScreener and holder data from Blockscout, not verified by ELYSIA.`,
    },
  }
}
