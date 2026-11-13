import { describe, expect, it } from 'vitest'
import { CHAINS } from '@elysia/shared'
import { envSchema } from '../src/config'

const base = { DATABASE_URL: 'postgres://example.invalid/none' } // never connected: schema parsing only

describe('indexer config defaults', () => {
  it('defaults to Robinhood Chain mainnet and the RPC follows the chosen chain', () => {
    const env = envSchema.parse(base)
    expect(env.CHAIN_ENV).toBe('mainnet')
    expect(env.RPC_URL).toBeUndefined() // main.ts uses CHAINS[CHAIN_ENV].rpc
    expect(CHAINS[env.CHAIN_ENV].id).toBe(4663)
    expect(CHAINS[env.CHAIN_ENV].rpc).toBe(CHAINS.mainnet.rpc)
  })

  it('the testnet stays selectable only explicitly; unknown chains are rejected', () => {
    expect(envSchema.parse({ ...base, CHAIN_ENV: 'testnet' }).CHAIN_ENV).toBe('testnet')
    expect(envSchema.safeParse({ ...base, CHAIN_ENV: 'localhost' }).success).toBe(false)
    expect(envSchema.safeParse({ ...base, CHAIN_ENV: 'elysiumTestnet' }).success).toBe(false)
  })

  it('an explicit RPC_URL is kept', () => {
    expect(envSchema.parse({ ...base, RPC_URL: 'https://rpc.example.test' }).RPC_URL).toBe('https://rpc.example.test')
  })
})
