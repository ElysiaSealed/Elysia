import type { Metadata } from 'next'
import { Empty, PageShell } from '@/components/pages/PageShell'
import { PredictionRow } from '@/components/pages/PredictionRow'
import { api, safe } from '@/lib/api'
import { fmtUtc } from '@/lib/format'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'HYPE Daily Call · ELYSIA', alternates: { canonical: '/daily-call' } }

const STEPS = [
  ['Commit', 'The hash of the call is written on-chain first. Nobody, including ELYSIA, can change it afterwards.'],
  ['Post', 'Only after the commit is confirmed is the call published.'],
  ['Reveal', 'When the horizon is reached, the text and the salt are revealed and checked against the hash.'],
  ['Score', 'The call is scored against the price feed, win or lose, with links to every transaction.'],
] as const

export default async function DailyCallPage() {
  const proof = await safe(api().getProof())
  return (
    <PageShell
      label="HYPE Daily Call"
      title="One call a day,"
      dim="sealed before it is posted."
      intro="Each day ELYSIA commits a direction call on HYPE on-chain. The order is the proof: commit first, reveal later."
    >
      {!proof ? (
        <Empty title="Data unavailable">The record could not be loaded right now. Try again in a moment.</Empty>
      ) : (
        <>
          <div className="pg-grid">
            <div className="card pg-stat">
              <span className="n up">{proof.formatted.winRate ?? 'n/a'}</span>
              <span className="t">Public win rate</span>
            </div>
            <div className="card pg-stat">
              <span className="n">{proof.stats.scored}</span>
              <span className="t">Calls scored</span>
            </div>
            <div className="card pg-stat">
              <span className="n">{proof.stats.pending}</span>
              <span className="t">Pending</span>
            </div>
          </div>

          <div className="label">Today&apos;s call</div>
          {proof.current ? (
            <div className="card pg-card">
              <span className="label" style={{ marginBottom: 0 }}>
                Day {proof.current.day} of {proof.current.prediction.horizonDays}
              </span>
              <h3>Committed on-chain, contents sealed until reveal</h3>
              <div className="pg-hash">{proof.current.prediction.hash}</div>
              <div className="pg-kv">
                <div>
                  <span className="k">Committed</span>
                  <span className="v">{fmtUtc(proof.current.prediction.committedAt)}</span>
                </div>
                <div>
                  <span className="k">Reveal and score</span>
                  <span className="v">{fmtUtc(proof.current.prediction.maturesAt)}</span>
                </div>
                <div>
                  <span className="k">Commit transaction</span>
                  <a className="v pg-link" href={proof.current.prediction.commitTxUrl} target="_blank" rel="noopener">
                    View on the explorer
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <Empty title="No call in progress">The next HYPE Daily Call appears here as soon as it is committed on-chain.</Empty>
          )}

          <div className="label">How a call is proved</div>
          <ol className="pg-steps" style={{ marginBottom: 26 }}>
            {STEPS.map(([name, text]) => (
              <li key={name}>
                <b>{name}.</b> {text}
              </li>
            ))}
          </ol>

          <div className="label">Previous calls</div>
          {proof.recent.length === 0 ? (
            <Empty title="No calls yet">Past calls appear here once they are committed. The win rate is published after the first call is scored.</Empty>
          ) : (
            <div className="pg-list">
              {proof.recent.map((p) => (
                <PredictionRow key={p.id} p={p} />
              ))}
            </div>
          )}
          <p className="pg-note" style={{ marginTop: 22 }}>
            Scored by the price feed, not by ELYSIA. Calls can be wrong. Nothing here is financial advice.
          </p>
        </>
      )}
    </PageShell>
  )
}
