import { describe, expect, it } from 'vitest'
import { CHAINS, chainSlug } from '../src/chains'

describe('chainSlug', () => {
  it('maps Elysium Testnet to its slug', () => {
    expect(chainSlug(CHAINS.elysiumTestnet.id)).toBe('elysium-testnet')
  })

  it('fails closed for an unknown chain ID instead of falling back to another chain', () => {
    expect(() => chainSlug(31337)).toThrow(/Unknown chain ID 31337/)
  })
})
