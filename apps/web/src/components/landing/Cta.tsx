import { X_URL } from '@/lib/site'

export function Cta() {
  return (
    <section className="cta" id="cta">
      <canvas id="cta3d" aria-hidden="true" />
      {' '}
      <div className="cta-in">
        <h2 className="split" data-split="">
          {'Watch the record build '}
          <span className="dim">
            one sealed report at a time.
          </span>
        </h2>
        {' '}
        <p>
          ELYSIA is building a public record: each assessment is committed on-chain before it is published, and no token is on sale. Follow along and check each one on the Elysium explorer once it is live.
        </p>
        {' '}
        <a href={X_URL} target="_blank" rel="noopener" className="btn btn-org magnet">
          {'Follow ELYSIA on X '}
          <span className="ar ar-ico" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <use href="#nx-x" />
            </svg>
          </span>
        </a>
      </div>
    </section>
  )
}
