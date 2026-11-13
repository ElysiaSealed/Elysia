import type { Metadata } from 'next'
import { PageShell } from '@/components/pages/PageShell'
import { ProPanel } from '@/components/pages/ProPanel'
import { findItem, getPricing, priceLabel, unitLabel } from '@/lib/pricing'

export const metadata: Metadata = { title: 'ELYSIA Pro · ELYSIA', alternates: { canonical: '/pro' } }

// Prices come from GET /pricing. Buying only works once the API has PAID_FEATURES_ENABLED=true.
export const revalidate = 60

export default async function ProPage() {
  const pro = findItem(await getPricing(), 'pro')
  return (
    <PageShell
      label={`ELYSIA Pro · ${priceLabel(pro)} ${unitLabel(pro)}`}
      title="ELYSIA Pro"
      dim="gets you there first."
      intro="Alerts arrive the moment ELYSIA approves a post, 15 minutes before it goes public on X. Paid in USDG from your wallet. The public feed and Ask stay free."
    >
      <ProPanel apiUrl={process.env.NEXT_PUBLIC_API_URL} />
      <p className="pg-note" style={{ marginTop: 22 }}>
        ELYSIA is an automated AI agent. Nothing it posts is financial advice, and its calls can be wrong. Not affiliated with Robinhood.
      </p>
    </PageShell>
  )
}
