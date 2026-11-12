import type { Metadata } from 'next'
import { AskForm } from '@/components/pages/AskForm'
import { PageShell } from '@/components/pages/PageShell'

export const metadata: Metadata = { title: 'Ask ELYSIA · ELYSIA', alternates: { canonical: '/ask' } }

export default function AskPage() {
  return (
    <PageShell
      label="Ask ELYSIA · Free"
      title="A risk summary"
      dim="for any token, on demand."
      intro="Paste a token address and get a risk summary. Ask is free: no payment and no wallet needed. The summary is built only from data ELYSIA has indexed. If the data is not there, it says it does not know."
    >
      <div className="card pg-card">
        <span className="label" style={{ marginBottom: 0 }}>
          How it works
        </span>
        <ol className="pg-steps">
          <li>Paste the token address below.</li>
          <li>Press the button to get the report.</li>
          <li>If ELYSIA has no data on the token, it says so instead of guessing.</li>
        </ol>
      </div>
      <AskForm apiUrl={process.env.NEXT_PUBLIC_API_URL} />
      <p className="pg-note" style={{ marginTop: 22 }}>
        Tokens younger than one hour are not analyzed. Requests are rate limited. Reports are automated summaries of on-chain data, not financial advice.
      </p>
    </PageShell>
  )
}
