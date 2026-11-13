/** Fixed-window request limiter for the free POST /ask, keyed by client IP. In memory: resets on restart, per instance. */
export interface AskLimits {
  perMinute: number
  perDay: number
  /** Optional cap on all Ask requests per UTC day, whoever sends them (database egress budget). */
  globalPerDay?: number
}

// PENDING: temporary numbers, to be evaluated (ELYSIA_DECISIONS.md). Not an approved policy.
export const DEFAULT_ASK_LIMITS: AskLimits = { perMinute: 10, perDay: 100 }

const MINUTE_MS = 60_000
const DAY_MS = 86_400_000
const MAX_KEYS = 10_000

interface Entry {
  minuteStart: number
  minuteCount: number
  day: number
  dayCount: number
}

export type AskLimitResult = { ok: true } | { ok: false; retryAfterSeconds: number }

export function createAskLimiter(limits: AskLimits, now: () => number) {
  const hits = new Map<string, Entry>()
  let globalDay = -1
  let globalCount = 0
  return {
    /** Counts the request only when it is allowed, so a rejected client cannot extend its own block. */
    check(key: string): AskLimitResult {
      const t = now()
      const day = Math.floor(t / DAY_MS)
      if (globalDay !== day) {
        globalDay = day
        globalCount = 0
      }
      if (limits.globalPerDay !== undefined && globalCount >= limits.globalPerDay) return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil(((day + 1) * DAY_MS - t) / 1000)) }
      let e = hits.get(key)
      if (!e || e.day !== day) e = { minuteStart: t, minuteCount: 0, day, dayCount: 0 }
      if (t - e.minuteStart >= MINUTE_MS) {
        e.minuteStart = t
        e.minuteCount = 0
      }
      if (e.dayCount >= limits.perDay) return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil(((day + 1) * DAY_MS - t) / 1000)) }
      if (e.minuteCount >= limits.perMinute) return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((e.minuteStart + MINUTE_MS - t) / 1000)) }
      e.minuteCount++
      e.dayCount++
      globalCount++
      if (hits.size >= MAX_KEYS && !hits.has(key)) for (const [k, v] of hits) if (v.day !== day) hits.delete(k)
      hits.set(key, e)
      return { ok: true }
    },
  }
}
