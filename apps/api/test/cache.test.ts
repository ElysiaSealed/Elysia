import { describe, expect, it } from 'vitest'
import { createTtlCache } from '../src/cache'

describe('createTtlCache', () => {
  it('loads once per TTL and serves the cached value in between', async () => {
    let t = 0
    let loads = 0
    const cache = createTtlCache(1000, () => t)
    const load = async () => ++loads
    expect(await cache.get('k', load)).toBe(1)
    t = 999
    expect(await cache.get('k', load)).toBe(1)
    t = 1000
    expect(await cache.get('k', load)).toBe(2)
    expect(loads).toBe(2)
  })

  it('shares one in-flight load between concurrent callers (single-flight)', async () => {
    let loads = 0
    const cache = createTtlCache(1000)
    const load = async () => {
      loads += 1
      await new Promise((r) => setTimeout(r, 10))
      return 'v'
    }
    const results = await Promise.all([cache.get('k', load), cache.get('k', load), cache.get('k', load)])
    expect(results).toEqual(['v', 'v', 'v'])
    expect(loads).toBe(1)
  })

  it('does not cache failures', async () => {
    let calls = 0
    const cache = createTtlCache(1000)
    const load = async () => {
      calls += 1
      if (calls === 1) throw new Error('db down')
      return 'ok'
    }
    await expect(cache.get('k', load)).rejects.toThrow('db down')
    expect(await cache.get('k', load)).toBe('ok')
  })

  it('keys are independent and a zero TTL disables caching', async () => {
    let loads = 0
    const off = createTtlCache(0)
    await off.get('a', async () => ++loads)
    await off.get('a', async () => ++loads)
    expect(loads).toBe(2)
    const on = createTtlCache(1000)
    expect(await on.get('a', async () => 1)).toBe(1)
    expect(await on.get('b', async () => 2)).toBe(2)
  })

  it('bounds the number of cached keys', async () => {
    let t = 0
    let loads = 0
    const cache = createTtlCache(1000, () => t, 2)
    await cache.get('a', async () => ++loads)
    await cache.get('b', async () => ++loads)
    await cache.get('c', async () => ++loads) // evicts "a"
    expect(loads).toBe(3)
    await cache.get('a', async () => ++loads)
    expect(loads).toBe(4)
  })
})
