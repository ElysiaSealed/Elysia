import type { Metadata } from 'next'
import { Empty, PageShell } from '@/components/pages/PageShell'

export const metadata: Metadata = { title: 'Graduation Watch · ELYSIA', alternates: { canonical: '/graduations' } }

// Page only: no data source is connected yet, so nothing here is fetched or invented.
const STAGES = [
  ['1', 'AMM', 'The token launches on an automated market maker.'],
  ['2', 'HyperCore', 'The token moves up to a spot market on HyperCore.'],
  ['3', 'HIP-3', 'The token reaches a perpetual market through HIP-3.'],
] as const

export default function GraduationsPage() {
  return (
    <PageShell
      label="Graduation Watch"
      title="Where each token stands,"
      dim="and when it moves up."
      intro="Tokens launched on Elysium can move through stages. ELYSIA tracks each step up and lists the red flags that come with it."
    >
      <div className="label">The stages</div>
      <div className="pg-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
        {STAGES.map(([n, name, text]) => (
          <div key={name} className="card pg-stat">
            <span className="t">Stage {n}</span>
            <span className="n" style={{ fontSize: 26 }}>
              {name}
            </span>
            <span className="pg-note">{text}</span>
          </div>
        ))}
      </div>

      <div className="label">Recent graduations</div>
      <Empty title="No graduations tracked yet">
        Graduations appear here once the launch data source is connected. Missing data is shown as unknown, never guessed.
      </Empty>

      <p className="pg-note" style={{ marginTop: 22 }}>
        Flags are automated signals from on-chain data, not a verdict. Nothing here is financial advice.
      </p>
    </PageShell>
  )
}
