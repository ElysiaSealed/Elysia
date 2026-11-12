import type { Prediction } from '@elysia/api-client'
import { fmtUtc, shortHash } from '@/lib/format'

/** One call in a list. Links to the call detail page. */
export function PredictionRow({ p }: { p: Prediction }) {
  const r = p.revealed
  return (
    <a className="pg-row" href={`/predictions/${p.id}`}>
      <div className="main">
        <b>{r ? r.text : `Commit #${p.id}`}</b>
        <span className="mono">{shortHash(p.hash)}</span>
      </div>
      <div className="cell">
        <span className="k">Committed</span>
        <span className="mono-v">{fmtUtc(p.committedAt)}</span>
      </div>
      <div className="cell">
        <span className="k">{r ? 'Asset' : 'Matures'}</span>
        <span className="mono-v">{r ? `${r.assetSymbol} ${r.direction === 'up' ? '↑' : '↓'}` : fmtUtc(p.maturesAt)}</span>
      </div>
      <div className="cell">
        <span className="k">Return</span>
        <span className="mono-v">{r ? r.returnFormatted : 'n/a'}</span>
      </div>
      <span className={`pg-pill ${r ? (r.won ? 'win' : 'loss') : ''}`}>{r ? (r.won ? 'Won' : 'Lost') : 'Pending'}</span>
    </a>
  )
}
