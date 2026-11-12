export function Roadmap() {
  return (
    <section className="sec" id="roadmap">
      <div className="head">
        <div data-reveal="">
          <h2>
            A track record first.
            <br />
            <span className="dim">
              Everything else after.
            </span>
          </h2>
        </div>
      </div>
      {' '}
      <div className="road" id="road">
        <div className="road-track">
          <b id="roadFill" />
        </div>
        {' '}
        <div className="road-grid">
          <div className="wk">
            <span className="mono">
              Week 1–2
            </span>
            <h3>
              Indexer and ledger
            </h3>
            <p>
              Elysium launchpad indexer and the ledger contract on Elysium Testnet (99801).
            </p>
          </div>
          {' '}
          <div className="wk">
            <span className="mono">
              Week 3–4
            </span>
            <h3>
              Brain and filter
            </h3>
            <p>
              The AI layer, RiskGuard, the human approval queue and the Proof of Intelligence page.
            </p>
          </div>
          {' '}
          <div className="wk">
            <span className="mono">
              Week 5–8
            </span>
            <h3>
              Dry runs
            </h3>
            <p>
              Sample Gate Reports pass RiskGuard in dry run before anything goes live.
            </p>
          </div>
          {' '}
          <div className="wk">
            <span className="mono">
              Week 9
            </span>
            <h3>
              Readiness review
            </h3>
            <p>
              Testnet results are reviewed. Mainnet is only evaluated, never assumed.
            </p>
          </div>
          {' '}
          <div className="wk">
            <span className="mono">
              Week 10+
            </span>
            <h3>
              More tools
            </h3>
            <p>
              Ask ELYSIA and the Signals feed stay free. Pro is a placeholder: Soon.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
