import { z } from 'zod'

// Nilai env sering ditempel dengan spasi/tanda kutip di dashboard: dibuang dulu sebelum divalidasi.
const clean = (v: unknown) => (typeof v === 'string' ? v.trim().replace(/^["']+|["']+$/g, '').trim() : v)
export const addr = z.preprocess(clean, z.string().regex(/^0x[0-9a-fA-F]{40}$/))
export const envSchema = z
  .object({
    DATABASE_URL: z.string().min(1),
    /** Tanpa nilai: memakai RPC chain yang dipilih (CHAINS[CHAIN_ENV].rpc). */
    RPC_URL: z.string().url().optional(),
    /** Default Elysium Testnet (99801). mainnet/testnet (Robinhood, legacy) hanya bila dipilih eksplisit. */
    CHAIN_ENV: z.enum(['elysiumTestnet', 'testnet', 'mainnet']).default('elysiumTestnet'),
    PONS_FACTORY: z.string().optional(),
    /** Blok awal bila belum ada kursor. Kosong = mulai dari ujung chain (tanpa backfill). */
    INDEXER_START_BLOCK: z.coerce.bigint().optional(),
    INDEXER_CHUNK_BLOCKS: z.coerce.bigint().default(2000n),
    INDEXER_POLL_SECONDS: z.coerce.number().int().positive().default(5),
    HIGH_CREATOR_TAX_BPS: z.coerce.number().int().nonnegative().default(500),
    /** Satu holder (di luar curve/pool) >= ini dari total suplai = red flag "Holders concentrated". */
    HOLDER_CONCENTRATED_BPS: z.coerce.number().int().min(1).max(10_000).default(2000),
    /** Transfer token hanya dilacak untuk token yang diluncurkan dalam N hari terakhir (membatasi beban getLogs). */
    HOLDER_TRACK_DAYS: z.coerce.number().int().min(1).default(7),
    /** Transfer whale: JSON [{"address":"0x..","symbol":"NVDA","decimals":18,"feed":"0x.."}]; kosong = NVDA mainnet. */
    WHALE_TOKENS: z.string().optional(),
    WHALE_MIN_USD: z.coerce.number().positive().default(100_000),
    /** Burn contract address (provided by PM); empty = burn reader disabled. */
    BURN_CONTRACT_ADDRESS: addr.optional().or(z.literal('')),
    /** Alamat token $ELYS. Diisi (dan BURN_CONTRACT_ADDRESS kosong) = burn dibaca dari Transfer ke alamat nol / 0x…dEaD. */
    ELYS_TOKEN_ADDRESS: addr.optional().or(z.literal('')),
    /** Opsional: hanya hitung burn dari alamat ini (mis. wallet yang membakar). Kosong = semua burn. */
    BURN_FROM_ADDRESS: addr.optional().or(z.literal('')),
    /** Burn di bawah jumlah ini (unit $ELYS utuh) diabaikan: mencegah spam burn debu menggembungkan tabel. */
    BURN_MIN_ELYS: z.coerce.bigint().nonnegative().default(1n),
  })

/**
 * Fail-closed: the Elysium launchpad adapter (addresses and ABI) does not exist yet. The indexer only decodes Pons V2
 * events, so it must not run against Elysium even when PONS_FACTORY is set. Returns the reason to stop, or null.
 */
export function launchpadBlocker(chainEnv: z.infer<typeof envSchema>['CHAIN_ENV']): string | null {
  return chainEnv === 'elysiumTestnet'
    ? 'Elysium launchpad adapter is not available yet (launchpad addresses and ABI are unconfirmed); stopping. PONS_FACTORY is ignored for this chain.'
    : null
}
