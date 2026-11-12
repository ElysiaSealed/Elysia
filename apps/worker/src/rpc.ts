import { CHAINS } from '@elysia/shared'

const strip = (u: string) => u.replace(/\/+$/, '').toLowerCase()

/**
 * RPC for the chain the worker runs on. Elysium Testnet (99801) falls back to its configured RPC; any other chain needs an
 * explicit RPC_URL. An explicit URL that is the known RPC of a different chain is rejected (chain id / RPC mismatch).
 * Offline check only: it cannot know the chain id of an unknown URL.
 */
export function resolveRpcUrl(chainId: number, rpcUrl: string | undefined): string {
  if (rpcUrl) {
    const known = Object.values(CHAINS).find((c) => strip(c.rpc) === strip(rpcUrl))
    if (known && known.id !== chainId) {
      throw new Error(`RPC_URL is the RPC of chain ${known.id} (${known.name}) but CHAIN_ID=${chainId}. Fix one of them.`)
    }
    return rpcUrl
  }
  if (chainId === CHAINS.elysiumTestnet.id) return CHAINS.elysiumTestnet.rpc
  throw new Error(`RPC_URL is required when CHAIN_ID=${chainId}: the default RPC exists only for Elysium Testnet (${CHAINS.elysiumTestnet.id}).`)
}
