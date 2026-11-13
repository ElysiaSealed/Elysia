/**
 * In-memory TTL cache with single-flight loading, used to keep database egress low on the Supabase free plan.
 * Public endpoints read the database at most once per TTL per key, however many clients ask.
 * ttlMs <= 0 disables caching (loads every time). Failed loads are never cached.
 */
export interface TtlCache {
  get<T>(key: string, load: () => Promise<T>): Promise<T>
}

export function createTtlCache(ttlMs: number, nowMs: () => number = Date.now, maxEntries = 256): TtlCache {
  const entries = new Map<string, { at: number; value: unknown }>()
  const inflight = new Map<string, Promise<unknown>>()
  return {
    get<T>(key: string, load: () => Promise<T>): Promise<T> {
      if (ttlMs <= 0) return load()
      const hit = entries.get(key)
      if (hit && nowMs() - hit.at < ttlMs) return Promise.resolve(hit.value as T)
      const running = inflight.get(key)
      if (running) return running as Promise<T>
      const p = load()
        .then((value) => {
          entries.set(key, { at: nowMs(), value })
          // Bound memory: drop the oldest entry when too many keys (e.g. many distinct prediction ids) are cached.
          if (entries.size > maxEntries) entries.delete(entries.keys().next().value as string)
          return value
        })
        .finally(() => inflight.delete(key))
      inflight.set(key, p)
      return p
    },
  }
}
