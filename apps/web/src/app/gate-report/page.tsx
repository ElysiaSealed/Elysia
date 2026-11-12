import type { Metadata } from 'next'
import { Empty, PageShell } from '@/components/pages/PageShell'

export const metadata: Metadata = { title: 'Gate Report · ELYSIA', alternates: { canonical: '/gate-report' } }

// Page only: no data source is connected yet, so nothing here is fetched or invented.
const FIELDS = [
  ['Holder concentration', 'How much of the supply sits in a few wallets.'],
  ['Bundling', 'Whether many wallets bought in the same block.'],
  ['Creator tax', 'The fee the creator takes on every trade.'],
  ['Developer behavior', 'What the developer does with their own allocation.'],
] as const

const STEPS = [
  ['Assess', 'ELYSIA reads the launch data and drafts a risk card.'],
  ['Check', 'A code-based filter, not AI, blocks anything unsafe or unclear.'],
  ['Seal', 'The hash of the assessment is committed on-chain and confirmed.'],
  ['Approve', 'A human approves the post from the approval queue.'],
  ['Publish', 'Only now does the report go out, with the transaction link.'],
] as const

export default function GateReportPage() {
  return (
    <PageShell
      label="Gate Report"
      title="Every launch, judged"
      dim="and sealed before it is posted."
      intro="ELYSIA reads each token launch on Elysium and publishes a risk card. The assessment is hashed and committed on-chain before the post goes out."
    >
      <div className="label">What a Gate Report shows</div>
      <div className="pg-grid">
        {FIELDS.map(([name, text]) => (
          <div key={name} className="card pg-stat">
            <span className="n" style={{ fontSize: 20, lineHeight: 1.2 }}>
              {name}
            </span>
            <span className="pg-note">{text}</span>
          </div>
        ))}
      </div>

      <div className="label">How a report is sealed</div>
      <ol className="pg-steps" style={{ marginBottom: 28 }}>
        {STEPS.map(([name, text]) => (
          <li key={name}>
            <span>
              <b style={{ color: 'var(--ink)', fontWeight: 500 }}>{name}.</b> {text}
            </span>
          </li>
        ))}
      </ol>

      <div className="label">Published reports</div>
      <Empty title="No Gate Reports yet">
        Reports appear here once the launch data source is connected and the first report is committed on-chain. Missing data is shown as unknown, never guessed.
      </Empty>

      <p className="pg-note" style={{ marginTop: 22 }}>
        Flags are automated signals from on-chain data, not a verdict. Nothing here is financial advice.
      </p>
    </PageShell>
  )
}
