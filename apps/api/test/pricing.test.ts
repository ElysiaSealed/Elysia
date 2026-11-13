import { describe, expect, it } from 'vitest'
import { pricingResponseSchema } from '@elysia/api-client'
import { buildPricingResponse, DEFAULT_PRICING, type PricingConfig } from '../src/pricing'

const byId = (r: ReturnType<typeof buildPricingResponse>, id: string) => r.items.find((i) => i.id === id)!

describe('buildPricingResponse', () => {
  it('uses the agreed temporary prices by default: Pro $5, Ask free, Signals $499, Sponsored $750', () => {
    const r = buildPricingResponse(DEFAULT_PRICING, false)
    expect(pricingResponseSchema.parse(r)).toEqual(r)
    expect(byId(r, 'pro')).toMatchObject({ free: false, price: { raw: '5000000', formatted: '5' }, unit: 'period', periodDays: 30 })
    expect(byId(r, 'ask')).toMatchObject({ free: true, price: { raw: '0', formatted: '0' }, unit: 'analysis', periodDays: null })
    expect(byId(r, 'signals')).toMatchObject({ free: false, price: { raw: '499000000', formatted: '499' }, unit: 'period', periodDays: 30 })
    expect(byId(r, 'sponsored')).toMatchObject({ free: false, price: { raw: '750000000', formatted: '750' }, unit: 'report' })
  })

  it('reflects edited prices, fractional dollars and the payments flag', () => {
    const cfg: PricingConfig = {
      pro: { priceMicros: 7_500_000n, days: 7 },
      ask: { priceMicros: 250_000n },
      signals: { priceMicros: 0n, days: 30 },
      sponsored: { priceMicros: 1_000_000_000n },
    }
    const r = buildPricingResponse(cfg, true)
    expect(r.paymentsOpen).toBe(true)
    expect(byId(r, 'pro')).toMatchObject({ price: { formatted: '7.5' }, periodDays: 7, free: false })
    expect(byId(r, 'ask')).toMatchObject({ price: { formatted: '0.25' }, free: false })
    expect(byId(r, 'signals').free).toBe(true)
    expect(byId(r, 'sponsored').price.formatted).toBe('1000')
  })
})
