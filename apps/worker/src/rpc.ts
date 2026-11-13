import { CHAINS } from '@elysia/shared'

const strip = (u: string) => u.replace(/\/+$/, '').toLowerCase()

/**
 * RPC for the chain the worker runs on. Robinhood Chain mainnet (4663) falls back to its configured RPC; any other chain needs an
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
  if (chainId === CHAINS.mainnet.id) return CHAINS.mainnet.rpc
  throw new Error(`RPC_URL is required when CHAIN_ID=${chainId}: the default RPC exists only for Robinhood Chain mainnet (${CHAINS.mainnet.id}).`)
}
