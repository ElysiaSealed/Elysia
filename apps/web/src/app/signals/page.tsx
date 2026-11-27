import type { Metadata } from 'next'
import { Empty, PageShell } from '@/components/pages/PageShell'

export const metadata: Metadata = { title: 'Signals API · ELYSIA', alternates: { canonical: '/signals' } }

export default function SignalsPage() {
  return (
    <PageShell label="Signals API" title="ELYSIA's feed," dim="coming soon." intro="A JSON feed of public ELYSIA posts for bots, dashboards and communities.">
      <Empty title="Coming soon">The Signals API is not open yet.</Empty>
    </PageShell>
  )
}
