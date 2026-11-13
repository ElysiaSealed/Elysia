'use client'

import { useEffect, useState } from 'react'

const KEY = 'elysia_splash'

/**
 * Splash screen loader: displayed on initial visit and reload, skipped during internal site navigation.
 * Exit is managed by CSS (`splash.css`), so this component simply records that the session has seen the splash
 * and unmounts the element after the exit animation completes (or upon click).
 */
export function Splash() {
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (document.documentElement.dataset.splash === 'skip') return setDone(true)
    try {
      window.sessionStorage.setItem(KEY, '1')
    } catch {
      /* storage blocked: loader will display once per hard page load */
    }
    // Safeguard: unmount element even if animationend fails to fire (e.g., background tab).
    const t = window.setTimeout(() => setDone(true), 4500)
    return () => window.clearTimeout(t)
  }, [])

  if (done) return null
  return (
    <div
      className="nx-splash"
      aria-hidden="true"
      onClick={() => setDone(true)}
      onAnimationEnd={(e) => e.animationName === 'nx-exit' && setDone(true)}
    >
      <div className="nx-stage">
        <div className="nx-track" />
        <div className="nx-ring" />
        <div className="nx-mark">
          <div className="nx-halo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="nx-logo" src="/logo.png" alt="" width={256} height={256} />
          </div>
        </div>
      </div>
    </div>
  )
}
