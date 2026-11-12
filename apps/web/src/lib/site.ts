// Deployment configuration: SITE_URL (without trailing slash) and X_HANDLE (without @).
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')

/** ELYSIA X handle (public). Final handle is PENDING: no default, set via env once decided. */
export const X_HANDLE = process.env.NEXT_PUBLIC_X_HANDLE || ''

/** Empty handle (when explicitly cleared) points "Follow on X" links to "#". */
export const X_URL = X_HANDLE ? `https://x.com/${X_HANDLE}` : '#'

/** ELYSIA Telegram link. Channel is PENDING (not created): no default, "#" until set via env. */
export const TELEGRAM_URL = process.env.NEXT_PUBLIC_TELEGRAM_URL || '#'

/** $ELYSIA token is deferred (no address, no chain). Empty = ContractPill renders nothing. */
export const ELYSIA_CA = process.env.NEXT_PUBLIC_ELYSIA_CA || ''
export const NEXA_CA = ELYSIA_CA

/** Explorer link for the token: not defined while the token is deferred. */
export const ELYSIA_CA_URL = process.env.NEXT_PUBLIC_ELYSIA_CA_URL || ''
export const NEXA_CA_URL = ELYSIA_CA_URL
