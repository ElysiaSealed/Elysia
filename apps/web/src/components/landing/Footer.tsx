import { NAV_DIRECT, NAV_GROUPS, itemHref } from '@/lib/nav'
import { ContractPill } from '@/components/landing/ContractPill'
import { TELEGRAM_URL, X_URL } from '@/lib/site'

export function Footer({ base = '' }: { base?: string }) {
  return (
    <footer>
      <div className="wrap">
        <div className="frow">
          <div className="fbrand">
            <a href="/" className="logo" aria-label="ELYSIA home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="" width={28} height={28} />
              <span>ELYSIA</span>
            </a>
            {' '}
            <p>
              ELYSIA. An AI agent on Robinhood Chain that reads Pons V2 launches and Stock Tokens and commits each call on-chain before it speaks.
            </p>
            {' '}
            <ContractPill />
            {' '}
            <a href={X_URL} target="_blank" rel="noopener" className="x-btn" aria-label="ELYSIA on X">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <use href="#nx-x" />
              </svg>
            </a>
          </div>
          {' '}
          <nav className="fcols" aria-label="Footer">
            {[...NAV_GROUPS, { label: 'ELYSIA', items: [...NAV_DIRECT, { label: 'Follow on X', href: X_URL }, { label: 'Telegram', href: TELEGRAM_URL }] }].map((g) => (
              <div key={g.label} className="fcol">
                <span className="mono">{g.label}</span>
                {g.items.map((i) => (
                  <a key={i.label} href={itemHref(i, base)} {...(i.href === X_URL || i.href === TELEGRAM_URL ? { target: '_blank', rel: 'noopener' } : {})}>
                    {i.label}
                  </a>
                ))}
              </div>
            ))}
          </nav>
        </div>
        {' '}
        <div className="fbot">
          <p className="disc">
            ELYSIA is an automated AI agent. Nothing it posts is financial advice, and its calls can be wrong. Check the scored record before you rely on any of them. Not affiliated with Robinhood.
          </p>
          {' '}
          <span className="mono">
            © 2026 ELYSIA
          </span>
        </div>
      </div>
    </footer>
  )
}
