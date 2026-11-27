import Link from 'next/link'
import { findItem, getPricing, priceLabel, unitLabel } from '@/lib/pricing'

// Prices are read from GET /pricing (env-driven), so they can be edited without changing this file.
export async function Pricing() {
  const pricing = await getPricing()
  const pro = findItem(pricing, 'pro')
  const ask = findItem(pricing, 'ask')
  const sponsored = findItem(pricing, 'sponsored')
  const note = (paid: boolean) => (paid && !pricing.paymentsOpen ? ' Not open yet.' : '')
  const plans = [
    { href: '/pro', name: 'ELYSIA Pro', item: pro, text: `Alerts the moment a post is approved, 15 minutes before it goes public on X. Paid in USDG.${note(!pro.free)}`, hot: true },
    { href: '/ask', name: 'Ask ELYSIA', item: ask, text: 'A risk report for one contract or token address, from data ELYSIA has indexed.' },
    // No item: not on sale yet, so the card shows no price.
    { href: '/signals', name: 'Signals API', item: null, text: 'A JSON feed of public ELYSIA posts for bots, dashboards and communities.' },
    { href: '/sponsored', name: 'Sponsored report', item: sponsored, text: `Project research labelled Sponsored, with no buy recommendation. Paid in USDG.${note(!sponsored.free)}` },
  ]
  return (
    <section className="sec" id="pricing">
      <div className="head">
        <div data-reveal="">
          <h2>
            Free to read.
            <br />
            <span className="dim">Paid when you build on it.</span>
          </h2>
        </div>
        {' '}
        <p className="lede" data-reveal="">
          The public feed and Ask are free. Pro and Sponsored reports are paid in USDG. The Signals API is coming soon. Prices are temporary and can change.
        </p>
      </div>
      {' '}
      <div className="price" data-stagger="">
        {plans.map((p) => (
          <Link key={p.name} href={p.href} className={`card plan${p.hot ? ' hot' : ''} tilt spot`}>
            <span className="mono">{p.name}</span>
            <div className="amt" style={p.item ? undefined : { fontSize: 34 }}>
              {p.item ? priceLabel(p.item) : 'Coming soon'}
            </div>
            <span className="per">{!p.item ? 'not open yet' : p.item.free ? 'no payment, no login' : unitLabel(p.item)}</span>
            <p>{p.text}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
