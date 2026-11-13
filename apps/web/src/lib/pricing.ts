import { fixtures, type PricingItem, type PricingResponse } from '@elysia/api-client'
import { api, safe } from './api'

/** Prices come from the API (env-driven, editable without a redeploy). Falls back to the fixture defaults when the API is unreachable. */
export async function getPricing(): Promise<PricingResponse> {
  return (await safe(api().getPricing())) ?? (fixtures.pricing as PricingResponse)
}

export const findItem = (p: PricingResponse, id: PricingItem['id']): PricingItem => p.items.find((i) => i.id === id)!

/** "Free" or "$5". */
export const priceLabel = (i: PricingItem) => (i.free ? 'Free' : `$${i.price.formatted}`)

/** "per 30 days", "per analysis" or "per report". */
export const unitLabel = (i: PricingItem) => (i.unit === 'period' ? `per ${i.periodDays} days` : i.unit === 'analysis' ? 'per analysis' : 'per report')
