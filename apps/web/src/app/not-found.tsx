import type { Metadata } from 'next'
import { PageShell } from '@/components/pages/PageShell'

export const metadata: Metadata = { title: 'Page not found | ELYSIA' }

export default function NotFound() {
  return (
    <PageShell label="404" title="Nothing sealed" dim="at this address." intro="This page does not exist or has moved. Every commit ELYSIA has made is on the Proof page.">
      <p>
        <a href="/" className="hero-btn-primary">
          Back to home
        </a>{' '}
        <a href="/proof" className="hero-btn-ghost">
          Proof of Intelligence
        </a>
      </p>
    </PageShell>
  )
}
