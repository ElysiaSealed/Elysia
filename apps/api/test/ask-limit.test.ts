import { describe, expect, it } from 'vitest'
import { createAskLimiter } from '../src/ask-limit'

describe('ask limiter', () => {
  it('allows up to the minute limit, then blocks with a positive retry time', () => {
    let t = Date.UTC(2026, 11, 1, 12)
    const l = createAskLimiter({ perMinute: 2, perDay: 10 }, () => t)
    expect(l.check('a').ok).toBe(true)
    expect(l.check('a').ok).toBe(true)
    const r = l.check('a')
    expect(r.ok).toBe(false)
    expect(r.ok === false && r.retryAfterSeconds).toBeGreaterThan(0)
    t += 60_000
    expect(l.check('a').ok).toBe(true)
  })

  it('keys are independent', () => {
    const l = createAskLimiter({ perMinute: 1, perDay: 10 }, () => 0)
    expect(l.check('a').ok).toBe(true)
    expect(l.check('b').ok).toBe(true)
    expect(l.check('a').ok).toBe(false)
  })

  it('daily cap holds across minute windows and resets on the next UTC day', () => {
    let t = Date.UTC(2026, 11, 1, 12)
    const l = createAskLimiter({ perMinute: 5, perDay: 3 }, () => t)
    for (let i = 0; i < 3; i++) {
      expect(l.check('a').ok).toBe(true)
      t += 61_000
    }
    expect(l.check('a').ok).toBe(false)
    t = Date.UTC(2026, 11, 2, 0, 0, 1)
    expect(l.check('a').ok).toBe(true)
  })

  it('rejected requests are not counted, so a blocked client cannot extend its own block', () => {
    let t = 0
    const l = createAskLimiter({ perMinute: 1, perDay: 2 }, () => t)
    expect(l.check('a').ok).toBe(true)
    for (let i = 0; i < 20; i++) expect(l.check('a').ok).toBe(false)
    t += 60_000
    expect(l.check('a').ok).toBe(true)
  })

  it('a global daily cap applies to all keys together and resets on the next UTC day', () => {
    let t = Date.UTC(2026, 11, 1, 12)
    const l = createAskLimiter({ perMinute: 10, perDay: 10, globalPerDay: 3 }, () => t)
    expect(l.check('a').ok).toBe(true)
    expect(l.check('b').ok).toBe(true)
    expect(l.check('c').ok).toBe(true)
    const blocked = l.check('d')
    expect(blocked.ok).toBe(false)
    expect(blocked.ok === false && blocked.retryAfterSeconds).toBeGreaterThan(0)
    t += 24 * 3_600_000
    expect(l.check('d').ok).toBe(true)
  })
})
