import { describe, expect, it } from 'vitest'
import { verifyUsdgPayment, type AskConfig } from '../src/ask'

const HASH = `0x${'1'.repeat(64)}` as const

/** Client whose receipt shows up only after `misses` failed lookups. */
function laggingClient(misses: number) {
  const calls = { n: 0 }
  const client = {
    getTransactionReceipt: async () => {
      if (calls.n++ < misses) throw new Error('not found')
      return { status: 'reverted', logs: [] }
    },
  } as unknown as AskConfig['client']
  return { calls, cfg: { client, usdg: '0x00000000000000000000000000000000000000aa', recipient: '0x00000000000000000000000000000000000000bb', minAmount: 1n, receiptRetryMs: [0, 0] } satisfies AskConfig }
}

describe('verifyUsdgPayment receipt lookup', () => {
  it('retries until the receipt is visible', async () => {
    const { calls, cfg } = laggingClient(2)
    expect(await verifyUsdgPayment(cfg, HASH)).toEqual({ ok: false, reason: 'tx_failed' }) // receipt was read
    expect(calls.n).toBe(3)
  })

  it('reports tx_not_found after the last retry', async () => {
    const { calls, cfg } = laggingClient(10)
    expect(await verifyUsdgPayment(cfg, HASH)).toEqual({ ok: false, reason: 'tx_not_found' })
    expect(calls.n).toBe(3)
  })
})
