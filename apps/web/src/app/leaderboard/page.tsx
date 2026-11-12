import type { Metadata } from 'next'
import { PageShell } from '@/components/pages/PageShell'

export const metadata: Metadata = { title: 'ELYSIA vs KOL · ELYSIA', alternates: { canonical: '/leaderboard' } }

const PREVIEW = [
  { rank: '#1', name: 'ELYSIA', handle: 'joining soon', nexa: true },
  { rank: 'n/a', name: 'KOL', handle: 'joining soon', nexa: false },
  { rank: 'n/a', name: 'KOL', handle: 'joining soon', nexa: false },
]

export default function LeaderboardPage() {
  return (
    <PageShell
      label="ELYSIA vs KOL"
      title="Accuracy,"
      dim="not follower count."
      intro="A public leaderboard of call accuracy. Only KOLs who agreed to be scored will appear here, and every call will link to the original post."
    >
      <div className="cs">
        <span className="cs-badge">
          <i /> Coming soon
        </span>
        <b>The first KOLs are being lined up.</b>
        <p>We only score public, checkable calls from people who opted in. The board opens once the first KOLs are on it.</p>
        <div className="cs-list" aria-hidden="true">
          {PREVIEW.map((r, i) => (
            <div key={i} className={`cs-row${r.nexa ? ' elysia nexa' : ''}`}>
              <span>{r.rank}</span>
              <div>
                <em>{r.name}</em>
                <small>@{r.handle}</small>
              </div>
              <span className="cs-bar" />
              <span className="cs-bar s" />
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  )
}
