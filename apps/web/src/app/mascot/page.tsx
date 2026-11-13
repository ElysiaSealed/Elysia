import type { Metadata } from 'next'
import '@/styles/mascot.css'
import { MascotStage } from '@/components/MascotStage'

export const metadata: Metadata = { title: 'ELYSIA mascot preview', robots: { index: false, follow: false } }

/** Internal preview: hero with animated mascot. */
export default function MascotPreview() {
  return (
    <main className="mxp">
      <div className="wrap mxp-grid">
        <div>
          <span className="mono">Preview · mascot hero</span>
          <h1>
            The superintelligence influencer. <em className="s">No deleted tweets.</em>
          </h1>
          <p className="sub">
            ELYSIA reads Pons V2 launches and Stock Tokens on Robinhood Chain and commits each call on-chain before it is published, so the record cannot be edited afterwards.
          </p>
          <div className="row">
            <a className="btn btn-org" href="#">
              Follow on X <span className="ar">↗</span>
            </a>
            <a className="btn btn-ghost" href="#">
              How a call is proved
            </a>
          </div>
          <p className="mono note">Move your cursor over the mascot.</p>
        </div>
        <MascotStage />
      </div>
    </main>
  )
}
