import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Empty, PageShell } from '@/components/pages/PageShell'
import { PredictionRow } from '@/components/pages/PredictionRow'
import { apiForChain, hasElysium, safe } from '@/lib/api'
import { ChainPicker } from '@/components/pages/ChainPicker'
import { fmtUtc } from '@/lib/format'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Proof of Intelligence · ELYSIA', alternates: { canonical: '/proof' } }

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function ProofPage(props: Props) {
  const rawParams = await Promise.resolve(props.searchParams)
  const chain = typeof rawParams.chain === 'string' ? rawParams.chain : undefined
  const proof = await safe(apiForChain(chain).getProof())
  const elysiumEnabled = hasElysium()
  return (
    <PageShell
      label="Proof of Intelligence"
      title="Every call,"
      dim="on-chain and scored."
      intro="Each prediction is hashed and committed on-chain before it is posted, then scored automatically against the oracle price. The record below cannot be edited or deleted."
    >
      <Suspense>
        <ChainPicker elysiumEnabled={elysiumEnabled} />
      </Suspense>
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
              <span className="n">{proof.formatted.avgReturn ?? 'n/a'}</span>
              <span className="t">Avg return per call</span>
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

          {proof.current ? (
            <div className="card pg-card">
              <span className="label" style={{ marginBottom: 0 }}>
                Prediction of the Day · day {proof.current.day} of {proof.current.prediction.horizonDays}
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
                    View on Blockscout
                  </a>
                </div>
              </div>
            </div>
          ) : null}

          <div className="label">Recent calls</div>
          {proof.recent.length === 0 ? (
            <Empty title="No calls yet">
              The first Prediction of the Day appears here once it is committed. The win rate is published after the first call is scored.
            </Empty>
          ) : (
            <div className="pg-list">
              {proof.recent.map((p) => (
                <PredictionRow key={p.id} p={p} />
              ))}
            </div>
          )}
          <p className="pg-note" style={{ marginTop: 22 }}>
            Scored by the oracle, not by ELYSIA. Calls can be wrong. Nothing here is financial advice.
          </p>
        </>
      )}
    </PageShell>
  )
}
