// Hero section with dynamic headline and interactive mascot stage.
import { X_URL } from '@/lib/site'
import '@/styles/mascot.css'
import { MascotStage } from '@/components/MascotStage'

export function Hero() {
  return (
    <section className="hero" id="hero">
      <div className="stage">
        <div className="hero-backdrop" aria-hidden="true" />
        <div className="hero-mascot">
          <MascotStage />
        </div>
        <div className="hero-vignette" aria-hidden="true" />

        <div className="prog" aria-hidden="true">
          <i>
            <b />
          </i>
          <i>
            <b />
          </i>
        </div>

        <div className="stage-inner">
          <div className="hero-meta mono">
            <div className="meta-title">ELYSIA GENESIS</div>
            <div>AI AGENT // AUTOMATED RUNTIME</div>
            <div>AUTOMATED ACCOUNT ON X // SOON</div>
          </div>

          <div className="copy-a" id="copyA">
            <p className="sub">
              ELYSIA is the gatekeeper of Elysium. It is built to assess each token launch, commit the assessment on-chain, and only then publish it on X.
            </p>

            <div className="cta-row">
              <a href={X_URL} target="_blank" rel="noopener" className="hero-btn-primary magnet">
                {"Follow on X "}
                <span className="btn-arrow" aria-hidden="true">→</span>
              </a>
              <a href="#how" className="hero-btn-ghost magnet">
                {"How a call is proved "}
                <span className="btn-arrow" aria-hidden="true">↗</span>
              </a>
            </div>
          </div>

          <div className="copy-b" id="copyB">
            <div className="label">
              Proof of Intelligence
            </div>
            <h2>
              {"The hash lands on-chain "}
              <span className="dim">
                before the post lands on X.
              </span>
            </h2>
            <code>
              ledger.commit(hash(assessment, salt))
            </code>

            <div className="stage-foot">
              <div className="hstats">
                <div className="hstat">
                  <div className="n">
                    1
                    <small>
                      / day
                    </small>
                  </div>
                  <p>
                    HYPE Daily Call, committed on-chain first
                  </p>
                </div>
                <div className="hstat org">
                  <div className="n">
                    2
                    <small>
                      steps
                    </small>
                  </div>
                  <p>
                    commit first, reveal later: the order is the proof
                  </p>
                </div>
              </div>

              <div className="reads">
                <span className="mono">
                  Reads from
                </span>
                <ul>
                  <li>
                    Elysium Testnet
                  </li>
                  <li>
                    Launchpad data (soon)
                  </li>
                  <li>
                    HYPE price (soon)
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
