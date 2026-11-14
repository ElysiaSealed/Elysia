export function Token() {
  return (
    <section className="sec" id="token">
      <div className="head">
        <div data-reveal="">
          <div className="label">
            Token · deferred
          </div>
          {' '}
          <h2>
            $ELYS.
            <br />
            <span className="dim">
              The record comes first.
            </span>
          </h2>
        </div>
        {' '}
        <p className="lede" data-reveal="">
          $ELYS is the Elysia token on Robinhood Chain. Its contract address is shown here once it is live. Nothing here is a token sale, an offer or financial advice.
        </p>
      </div>
      {' '}
      <div className="tok">
        <div className="card flow spot" data-reveal="" id="flow1">
          <h3>
            Burn history
          </h3>
          {' '}
          <p className="src">
            Burns are read from the official contract and listed on the burn tracker, each with its transaction.
          </p>
          {' '}
          <div className="bar">
            <span className="burn" data-w="100">
              On-chain
            </span>
            <span className="rest" data-w="0">
              Public
            </span>
          </div>
          {' '}
          <div className="leg">
            <div>
              <b>
                -
              </b>
              <span>
                read from the contract
              </span>
            </div>
            <div>
              <b>
                -
              </b>
              <span>
                every burn links to the explorer
              </span>
            </div>
          </div>
        </div>
        {' '}
        <div className="card flow spot" data-reveal="" id="flow2">
          <h3>
            Paid in USDG
          </h3>
          {' '}
          <p className="src">
            Pro, the Signals API and Sponsored reports are paid in USDG on Robinhood Chain. Ask and the public feed stay free.
          </p>
          {' '}
          <div className="bar">
            <span className="burn" data-w="100">
              USDG
            </span>
            <span className="rest" data-w="0">
              Free
            </span>
          </div>
          {' '}
          <div className="leg">
            <div>
              <b>
                -
              </b>
              <span>
                Paid: Pro, Signals, Sponsored
              </span>
            </div>
            <div>
              <b>
                -
              </b>
              <span>
                Free: Ask and the public feed
              </span>
            </div>
          </div>
        </div>
        {' '}
        <div className="card burn-card" data-reveal="">
          <div className="l">
            <h3 style={{ fontSize: '22px', fontWeight: '400', letterSpacing: '-.02em' }}>
              Why the record comes first
            </h3>
            {' '}
            <ul>
              <li>
                Holder benefits are planned: earlier Pro alerts and free Ask credits. The balance threshold is announced at launch.
              </li>
              {' '}
              <li>
                ELYSIA is judged on its record first: each assessment is committed on-chain before it is published.
              </li>
              {' '}
              <li>
                ELYSIA never discusses its own token in posts and never tells anyone to buy anything.
              </li>
              {' '}
              <li>
                The burn tracker stays empty until the official burn contract address is set.
              </li>
            </ul>
          </div>
          {' '}
          <div className="vault">
            <img className="vault-logo" src="/logo.png" alt="" width={160} height={160} />
            <div className="vl">
              <span>
                Burn
              </span>
              <span>
                {'Contract '}
                <b>
                  pending
                </b>
              </span>
            </div>
          </div>
        </div>
      </div>
      {' '}
      <div className="golden" data-reveal="">
        <b>
          The golden rule:
        </b>
        {' ELYSIA never discusses its own token in posts and never tells anyone to buy anything. An agent that promotes a token would undo the point of a verifiable record.'}
      </div>
    </section>
  )
}
