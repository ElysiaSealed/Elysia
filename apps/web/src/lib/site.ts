// Deployment configuration: SITE_URL (without trailing slash) and X_HANDLE (without @).
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')

/** ELYSIA X handle (public). Final handle is PENDING: no default, set via env once decided. */
export const X_HANDLE = process.env.NEXT_PUBLIC_X_HANDLE || ''

/** Empty handle (when explicitly cleared) points "Follow on X" links to "#". */
export const X_URL = X_HANDLE ? `https://x.com/${X_HANDLE}` : '#'

/** ELYSIA public Telegram channel (https://t.me/ElysiaAlert), set via env. "#" until set. */
export const TELEGRAM_URL = process.env.NEXT_PUBLIC_TELEGRAM_URL || '#'

/** $ELYS contract address. Empty or malformed = ContractPill renders nothing (token not announced yet). */
const RAW_CA = process.env.NEXT_PUBLIC_ELYSIA_CA || ''
export const ELYSIA_CA = /^0x[0-9a-fA-F]{40}$/.test(RAW_CA) ? RAW_CA : ''

/** Robinhood Chain explorer page of the token. Derived from the address; NEXT_PUBLIC_ELYSIA_CA_URL overrides it. */
export const ELYSIA_CA_URL = ELYSIA_CA ? process.env.NEXT_PUBLIC_ELYSIA_CA_URL || `https://robinhoodchain.blockscout.com/token/${ELYSIA_CA}` : ''
