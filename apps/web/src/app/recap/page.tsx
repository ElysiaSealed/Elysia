import type { Metadata } from 'next'
import type { Prediction } from '@elysia/api-client'
import { Empty, PageShell } from '@/components/pages/PageShell'
import { api, safe } from '@/lib/api'
import { fmtUtc, shortHash } from '@/lib/format'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'The Gate Remembers · ELYSIA', alternates: { canonical: '/recap' } }

/** Monday of the UTC week that contains the given instant, as YYYY-MM-DD. */
function weekStart(iso: string): string {
  const d = new Date(iso)
  const sinceMonday = (d.getUTCDay() + 6) % 7
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - sinceMonday)).toISOString().slice(0, 10)
}

function groupByWeek(calls: Prediction[]): [string, Prediction[]][] {
  const weeks = new Map<string, Prediction[]>()
  for (const p of [...calls].sort((a, b) => b.committedAt.localeCompare(a.committedAt))) {
    const key = weekStart(p.committedAt)
    weeks.set(key, [...(weeks.get(key) ?? []), p])
  }
  return [...weeks.entries()].sort((a, b) => b[0].localeCompare(a[0]))
}

function Row({ p }: { p: Prediction }) {
  const r = p.revealed
  return (
    <div className="pg-row">
      <div className="main">
        <b>{r ? r.text : `Commit #${p.id}`}</b>
        <span className="mono">{shortHash(p.hash)}</span>
      </div>
      <div className="cell">
        <span className="k">Committed</span>
        <span className="mono-v">{fmtUtc(p.committedAt)}</span>
      </div>
      <div className="cell">
        <span className="k">Transactions</span>
        <span className="mono-v">
          <a className="pg-link" href={p.commitTxUrl} target="_blank" rel="noopener">
            Commit
          </a>
          {r ? (
            <>
              {' · '}
              <a className="pg-link" href={r.revealTxUrl} target="_blank" rel="noopener">
                Reveal
              </a>
            </>
          ) : null}
        </span>
      </div>
      <span className={`pg-pill ${r ? (r.won ? 'win' : 'loss') : ''}`}>{r ? (r.won ? 'Won' : 'Lost') : 'Pending'}</span>
    </div>
  )
}

export default async function RecapPage() {
  const proof = await safe(api().getProof())
  const weeks = proof ? groupByWeek(proof.recent) : []
  return (
    <PageShell
      label="The Gate Remembers"
      title="What was right,"
      dim="and what was wrong."
      intro="A weekly look back at every call: which ones held, which ones failed, and the transactions that prove it. Wins and losses stay on the record."
    >
      {!proof ? (
        <Empty title="Data unavailable">The record could not be loaded right now. Try again in a moment.</Empty>
      ) : weeks.length === 0 ? (
        <Empty title="Nothing to recap yet">The first weekly recap appears here once calls have been committed and scored.</Empty>
      ) : (
        weeks.map(([week, calls]) => {
          const won = calls.filter((p) => p.revealed?.won).length
          const lost = calls.filter((p) => p.revealed && !p.revealed.won).length
          const pending = calls.filter((p) => !p.revealed).length
          return (
            <section key={week} style={{ marginBottom: 28 }}>
              <div className="label">Week of {week}</div>
              <p className="pg-note" style={{ marginBottom: 12 }}>
                {calls.length} {calls.length === 1 ? 'call' : 'calls'}: {won} won, {lost} lost, {pending} pending
              </p>
              <div className="pg-list">
                {calls.map((p) => (
                  <Row key={p.id} p={p} />
                ))}
              </div>
            </section>
          )
        })
      )}
      <p className="pg-note" style={{ marginTop: 22 }}>
        Covers the weeks of the latest calls. Scored by the price feed, not by ELYSIA. Calls can be wrong. Nothing here is financial advice.
      </p>
    </PageShell>
  )
}
