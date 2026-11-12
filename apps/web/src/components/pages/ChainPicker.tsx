'use client'

/**
 * ChainPicker: chain tabs. ELYSIA serves one chain, Elysium Testnet, which is the default.
 * Shown only when NEXT_PUBLIC_API_URL_ELYSIUM is configured.
 * Uses plain navigation links (?chain=) so server pages can still render on the server.
 * Not shown on the landing page; only on /proof and /rug-radar.
 */

import { useSearchParams } from 'next/navigation'

const DEFAULT_CHAIN = 'elysium-testnet'

export const SUPPORTED_CHAINS: { slug: string; label: string }[] = [{ slug: DEFAULT_CHAIN, label: 'Elysium Testnet' }]

interface ChainPickerProps {
  /** Whether the Elysium API is configured (NEXT_PUBLIC_API_URL_ELYSIUM is set). */
  elysiumEnabled: boolean
}

export function ChainPicker({ elysiumEnabled }: ChainPickerProps) {
  const searchParams = useSearchParams()
  const currentChain = searchParams.get('chain') ?? DEFAULT_CHAIN

  if (!elysiumEnabled) return null

  return (
    <div className="chain-picker" aria-label="Select chain">
      {SUPPORTED_CHAINS.map(({ slug, label }) => {
        const params = new URLSearchParams(searchParams)
        if (slug === DEFAULT_CHAIN) {
          params.delete('chain')
        } else {
          params.set('chain', slug)
        }
        const href = `?${params.toString()}`
        const active = currentChain === slug
        return (
          <a
            key={slug}
            href={href}
            className={`chain-pill${active ? ' active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            {label}
          </a>
        )
      })}
    </div>
  )
}
