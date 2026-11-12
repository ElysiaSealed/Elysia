import { describe, expect, it } from 'vitest'
import { CHAINS } from '@elysia/shared'
import { envSchema, launchpadBlocker } from '../src/config'

const base = { DATABASE_URL: 'postgres://example.invalid/none' } // never connected: schema parsing only

describe('indexer config defaults', () => {
  it('defaults to Elysium Testnet and the RPC follows the chosen chain', () => {
    const env = envSchema.parse(base)
    expect(env.CHAIN_ENV).toBe('elysiumTestnet')
    expect(env.RPC_URL).toBeUndefined() // main.ts uses CHAINS[CHAIN_ENV].rpc
    expect(CHAINS[env.CHAIN_ENV].id).toBe(99801)
    expect(CHAINS[env.CHAIN_ENV].rpc).toBe(CHAINS.elysiumTestnet.rpc)
  })

  it('mainnet and testnet (Robinhood) stay selectable, only explicitly', () => {
    expect(envSchema.parse({ ...base, CHAIN_ENV: 'mainnet' }).CHAIN_ENV).toBe('mainnet')
    expect(envSchema.parse({ ...base, CHAIN_ENV: 'testnet' }).CHAIN_ENV).toBe('testnet')
    expect(envSchema.safeParse({ ...base, CHAIN_ENV: 'localhost' }).success).toBe(false)
  })

  it('an explicit RPC_URL is kept', () => {
    expect(envSchema.parse({ ...base, RPC_URL: 'https://rpc.example.test' }).RPC_URL).toBe('https://rpc.example.test')
  })
})

describe('launchpad blocker (fail closed)', () => {
  it('blocks Elysium, with or without PONS_FACTORY', () => {
    expect(launchpadBlocker('elysiumTestnet')).toMatch(/launchpad adapter is not available/)
    const withFactory = envSchema.parse({ ...base, PONS_FACTORY: '0x0000000000000000000000000000000000000001' })
    expect(launchpadBlocker(withFactory.CHAIN_ENV)).not.toBeNull()
  })

  it('does not block an explicit mainnet or testnet selection', () => {
    expect(launchpadBlocker('mainnet')).toBeNull()
    expect(launchpadBlocker('testnet')).toBeNull()
  })
})
