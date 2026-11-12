import Link from 'next/link'

// No prices: ELYSIA is a free service. Pro and Payment are "Soon" placeholders (no subscription, no gateway).
const PLANS = [
  { href: '/pro', name: 'ELYSIA Pro', amt: 'Soon', per: 'not available yet', text: 'Early alerts are planned. Nothing to buy today.', hot: true },
  { href: '/ask', name: 'Ask ELYSIA', amt: 'Free', per: 'no payment, no login', text: 'A risk report for one contract or token address, from data ELYSIA has indexed.' },
  { href: '/signals', name: 'Signals API', amt: 'Free', per: 'public feed', text: 'A JSON feed of public ELYSIA posts for bots, dashboards and communities.' },
  { href: '/sponsored', name: 'Sponsored report', amt: 'Soon', per: 'payments are off', text: 'Project research labelled Sponsored, with no buy recommendation.' },
]

export function Pricing() {
  return (
    <section className="sec" id="pricing">
      <div className="head">
        <div data-reveal="">
          <h2>
            ELYSIA is free.
            <br />
            <span className="dim">The feed and the tools.</span>
          </h2>
        </div>
        {' '}
        <p className="lede" data-reveal="">
          No subscriptions and no payments. Pro and Sponsored reports are placeholders until they are announced.
        </p>
      </div>
      {' '}
      <div className="price" data-stagger="">
        {PLANS.map((p) => (
          <Link key={p.name} href={p.href} className={`card plan${p.hot ? ' hot' : ''} tilt spot`}>
            <span className="mono">{p.name}</span>
            <div className="amt">{p.amt}</div>
            <span className="per">{p.per}</span>
            <p>{p.text}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
