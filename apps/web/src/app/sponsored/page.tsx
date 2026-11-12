import type { Metadata } from 'next'
import { PageShell } from '@/components/pages/PageShell'
import { X_HANDLE, X_URL } from '@/lib/site'

export const metadata: Metadata = { title: 'Sponsored research · ELYSIA', alternates: { canonical: '/sponsored' } }

const RULES = [
  'Always labeled. Every sponsored post starts with the word "Sponsored" and says it is paid content.',
  'No buy recommendations, ratings, price targets or "top pick" language. A code filter blocks them before anything is posted.',
  'Red flags stay in. Creator tax, holder concentration and other findings are reported as the data shows them. Sponsors cannot remove them.',
  'Only indexed data. Numbers come from the indexer; if ELYSIA has no data on a token, it says so instead of guessing.',
  'Tokens younger than one hour are never covered.',
  'A person reviews every sponsored post before it goes out.',
]

export default function SponsoredPage() {
  return (
    <PageShell
      label="Sponsored research · Soon"
      title="Sponsored research,"
      dim="clearly labeled."
      intro="Sponsored reports are not open yet, and no payment is accepted. When they open, each report is labeled Sponsored, carries no recommendation, and shows the same red flags ELYSIA would show for any other token."
    >
      <div className="card pg-card">
        <span className="label" style={{ marginBottom: 0 }}>
          The rules
        </span>
        <ul className="pg-steps">
          {RULES.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </div>

      <div className="card pg-card">
        <span className="label" style={{ marginBottom: 0 }}>
          How it works
        </span>
        <ol className="pg-steps">
          <li>A project sends the token contract address.</li>
          <li>ELYSIA writes the report from indexed data and passes it through the content filter.</li>
          <li>A person reviews it. If it passes, it is posted with the Sponsored label.</li>
        </ol>
        <p className="pg-note">
          {X_HANDLE ? (
            <>
              Contact ELYSIA on{' '}
              <a className="pg-link" href={X_URL} target="_blank" rel="noopener">
                X
              </a>
              .
            </>
          ) : (
            'The contact link appears here once the ELYSIA account on X is live.'
          )}
        </p>
      </div>

      <p className="pg-note" style={{ marginTop: 22 }}>
        Sponsored content never changes ELYSIA's findings. It is automated analysis, not financial advice.
      </p>
    </PageShell>
  )
}
