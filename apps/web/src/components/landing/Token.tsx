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
            No token yet.
            <br />
            <span className="dim">
              The record comes first.
            </span>
          </h2>
        </div>
        {' '}
        <p className="lede" data-reveal="">
          A token is not part of the current plan and nothing here is a token sale or an offer. ELYSIA is free to use and has no fees, no treasury and no burn.
        </p>
      </div>
      {' '}
      <div className="tok">
        <div className="card flow spot" data-reveal="" id="flow1">
          <h3>
            No fees
          </h3>
          {' '}
          <p className="src">
            There is no fee split. ELYSIA is a free service.
          </p>
          {' '}
          <div className="bar">
            <span className="burn" data-w="100">
              None
            </span>
            <span className="rest" data-w="0">
              None
            </span>
          </div>
          {' '}
          <div className="leg">
            <div>
              <b>
                —
              </b>
              <span>
                no fee split
              </span>
            </div>
            <div>
              <b>
                —
              </b>
              <span>
                no treasury
              </span>
            </div>
          </div>
        </div>
        {' '}
        <div className="card flow spot" data-reveal="" id="flow2">
          <h3>
            No payments
          </h3>
          {' '}
          <p className="src">
            Pro and Payments are placeholders (Soon). No subscription is sold and no payment is accepted.
          </p>
          {' '}
          <div className="bar">
            <span className="burn" data-w="100">
              Soon
            </span>
            <span className="rest" data-w="0">
              Soon
            </span>
          </div>
          {' '}
          <div className="leg">
            <div>
              <b>
                —
              </b>
              <span>
                Pro: coming soon
              </span>
            </div>
            <div>
              <b>
                —
              </b>
              <span>
                Payments: coming soon
              </span>
            </div>
          </div>
        </div>
        {' '}
        <div className="card burn-card" data-reveal="">
          <div className="l">
            <h3 style={{ fontSize: '22px', fontWeight: '400', letterSpacing: '-.02em' }}>
              Why there is no token yet
            </h3>
            {' '}
            <ul>
              <li>
                A token is deferred and not scheduled.
              </li>
              {' '}
              <li>
                ELYSIA is judged on its record first: each assessment is committed on-chain before it is published.
              </li>
              {' '}
              <li>
                ELYSIA never discusses a token of its own and never tells anyone to buy anything.
              </li>
              {' '}
              <li>
                The burn tracker is an empty placeholder until an official contract address exists. No burn transaction is active.
              </li>
            </ul>
          </div>
          {' '}
          <div className="vault">
            <canvas id="embers" aria-hidden="true" />
            <div className="vl">
              <span>
                Burn
              </span>
              <span>
                {'Ratios '}
                <b>
                  not active
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
        {' ELYSIA never discusses a token of its own and never tells anyone to buy anything. An agent that promotes a token would undo the point of a verifiable record.'}
      </div>
    </section>
  )
}
