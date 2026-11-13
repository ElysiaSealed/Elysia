import { formatUnits } from 'viem'
import { pricingResponseSchema, type PricingResponse } from '@elysia/api-client'

/** USDG has 6 decimals. All prices are stored as integer micros (1_000_000 = $1) and are edited through env vars. */
export const USDG_DECIMALS = 6

export interface PricingConfig {
  /** Pro subscription: price per period and period length in days. */
  pro: { priceMicros: bigint; days: number }
  /** Ask: 0 means free. */
  ask: { priceMicros: bigint }
  /** Signals API: price per period (sold by contact; the API key is issued after payment). */
  signals: { priceMicros: bigint; days: number }
  /** Sponsored report: price per report (sold by contact). */
  sponsored: { priceMicros: bigint }
}

/** Temporary prices set by the developer on 2026-11-13: Pro $5, Ask free, Signals API $499, Sponsored $750. */
export const DEFAULT_PRICING: PricingConfig = {
  pro: { priceMicros: 5_000_000n, days: 30 },
  ask: { priceMicros: 0n },
  signals: { priceMicros: 499_000_000n, days: 30 },
  sponsored: { priceMicros: 750_000_000n },
}

const price = (micros: bigint) => ({ raw: micros.toString(), decimals: USDG_DECIMALS, formatted: formatUnits(micros, USDG_DECIMALS) })

/** Public pricing overview. `paymentsOpen` mirrors PAID_FEATURES_ENABLED so the web can show whether buying works yet. */
export function buildPricingResponse(cfg: PricingConfig, paymentsOpen: boolean): PricingResponse {
  return pricingResponseSchema.parse({
    currency: 'USDG',
    paymentsOpen,
    items: [
      { id: 'pro', name: 'Pro', free: cfg.pro.priceMicros === 0n, price: price(cfg.pro.priceMicros), unit: 'period', periodDays: cfg.pro.days },
      { id: 'ask', name: 'Ask', free: cfg.ask.priceMicros === 0n, price: price(cfg.ask.priceMicros), unit: 'analysis', periodDays: null },
      { id: 'signals', name: 'Signals API', free: cfg.signals.priceMicros === 0n, price: price(cfg.signals.priceMicros), unit: 'period', periodDays: cfg.signals.days },
      { id: 'sponsored', name: 'Sponsored report', free: cfg.sponsored.priceMicros === 0n, price: price(cfg.sponsored.priceMicros), unit: 'report', periodDays: null },
    ],
  })
}
