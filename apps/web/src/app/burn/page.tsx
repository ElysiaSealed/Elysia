import type { Metadata } from 'next'
import { Empty, PageShell } from '@/components/pages/PageShell'

export const metadata: Metadata = { title: 'Burn tracker · ELYSIA', alternates: { canonical: '/burn' } }

// Empty placeholder: no burn data, no contract address, no burn transaction until an official contract address exists.
export default function BurnPage() {
  return (
    <PageShell label="Burn tracker" title="Burn tracker" dim="is empty for now.">
      <Empty title="Nothing to show yet">This page stays empty until an official contract address is announced.</Empty>
    </PageShell>
  )
}
