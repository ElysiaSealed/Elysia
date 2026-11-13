import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { CHAINS } from '@elysia/shared'
import { resolveRpcUrl } from '../src/rpc'

const MAINNET = CHAINS.mainnet

describe('resolveRpcUrl', () => {
  it('Robinhood Chain mainnet without RPC_URL uses the configured mainnet RPC', () => {
    expect(resolveRpcUrl(4663, undefined)).toBe(MAINNET.rpc)
  })

  it('an explicit RPC_URL is kept (mainnet and other chains)', () => {
    expect(resolveRpcUrl(4663, 'https://rpc.example.test')).toBe('https://rpc.example.test')
    expect(resolveRpcUrl(31337, 'http://127.0.0.1:8545')).toBe('http://127.0.0.1:8545')
  })

  it('any other chain without RPC_URL is an error (no default RPC)', () => {
    expect(() => resolveRpcUrl(46630, undefined)).toThrow(/RPC_URL is required when CHAIN_ID=46630/)
    expect(() => resolveRpcUrl(31337, undefined)).toThrow(/RPC_URL is required/)
  })

  it('rejects the known RPC of a different chain (mismatch), also with a trailing slash or other case', () => {
    expect(() => resolveRpcUrl(4663, CHAINS.testnet.rpc)).toThrow(/CHAIN_ID=4663/)
    expect(() => resolveRpcUrl(4663, `${CHAINS.testnet.rpc.toUpperCase()}/`)).toThrow(/46630/)
    expect(() => resolveRpcUrl(46630, MAINNET.rpc)).toThrow(/chain 4663/)
  })

  it('the known RPC of the same chain is accepted when chosen explicitly', () => {
    expect(resolveRpcUrl(46630, CHAINS.testnet.rpc)).toBe(CHAINS.testnet.rpc)
  })
})

describe('RPC_URL schema', () => {
  const schema = z.string().url().optional() // same shape as apps/worker/src/main.ts
  it('an empty string is not a valid URL; unset is fine', () => {
    expect(schema.safeParse('').success).toBe(false)
    expect(schema.safeParse(undefined).success).toBe(true)
  })
})
