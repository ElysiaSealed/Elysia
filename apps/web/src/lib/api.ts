import { createApiClient } from '@elysia/api-client'

/** Klien API untuk halaman server. Fixture bila NEXT_PUBLIC_USE_FIXTURES=true; selain itu API asli. */
export const api = () =>
  createApiClient({
    useFixtures: process.env.NEXT_PUBLIC_USE_FIXTURES === 'true',
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
    proofFixture: process.env.FIXTURE_PROOF === 'populated' ? 'populated' : 'empty',
  })

/**
 * Klien API berdasarkan chain yang dipilih.
 * - not set or 'elysium-testnet' (the default): uses NEXT_PUBLIC_API_URL_ELYSIUM when set
 * - any other value: uses NEXT_PUBLIC_API_URL
 * Elysium Testnet is the only chain ELYSIA serves; no other chain is a default.
 */
export const apiForChain = (chain?: string) => {
  const isElysium = chain === undefined || chain === 'elysium-testnet'
  const baseUrl = (isElysium && process.env.NEXT_PUBLIC_API_URL_ELYSIUM)
    ? process.env.NEXT_PUBLIC_API_URL_ELYSIUM
    : process.env.NEXT_PUBLIC_API_URL
  return createApiClient({
    useFixtures: process.env.NEXT_PUBLIC_USE_FIXTURES === 'true',
    baseUrl,
    proofFixture: process.env.FIXTURE_PROOF === 'populated' ? 'populated' : 'empty',
  })
}

/** true jika URL API Elysium terkonfigurasi (chain picker akan ditampilkan). */
export const hasElysium = () => Boolean(process.env.NEXT_PUBLIC_API_URL_ELYSIUM)

/** Gagal ambil data tidak merusak halaman: hasilnya null dan halaman menampilkan keadaan "tidak tersedia". */
export async function safe<T>(p: Promise<T>): Promise<T | null> {
  try {
    return await p
  } catch {
    return null
  }
}
