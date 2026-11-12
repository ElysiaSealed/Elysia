import { describe, expect, it } from 'vitest'
import { evaluate, type ContentType, type ReasonCode } from '../src'

const ADDR = '0x1111111111111111111111111111111111111111'
const OLD = 7200
const run = (text: string, type: ContentType = 'gate_report', over: object = {}) =>
  evaluate({ type, text, dataComplete: true, tokens: [{ address: ADDR, ageSeconds: OLD }], ...over })
const blocked = (text: string, code: ReasonCode = 'OFFICIAL_CLAIM', type: ContentType = 'gate_report') => {
  const d = run(text, type)
  expect(d.allowed, `must block: "${text}"`).toBe(false)
  expect(d.reasons).toContain(code)
}
const passes = (text: string, type: ContentType = 'gate_report') => {
  const d = run(text, type)
  expect(d.reasons, `must pass: "${text}"`).toEqual([])
  expect(d.allowed).toBe(true)
}

describe('official Elysium/Kinetiq claims', () => {
  it.each([
    'We are the official Elysium gatekeeper',
    'Official Kinetiq account',
    'Elysium official partner reports a clean launch',
    "Elysium's official agent flagged this token",
    'Official partner of Elysium',
    'Proudly affiliated with Kinetiq',
    'Partnered with Elysium on this report',
    'This report is backed by Kinetiq',
    'Endorsed by Elysium',
    'I am Elysium',
    'We are part of Elysium',
    'Not affiliated with Kinetiq, but official Elysium partner',
  ])('blocks: %s', (t) => blocked(t))

  it.each([
    'o f f i c i a l Elysium account',
    'official  Elysium  account',
    'OFFICIAL ELYSIUM ACCOUNT',
    'official E​lysium account',
    'оfficial Elysium account', // Cyrillic o
    'official 3lysium account',
    'affiliated with Kinetiq',
    'afffiliated with Kinetiq',
  ])('blocks evasion: %s', (t) => blocked(t))

  it.each([
    'Not affiliated with Kinetiq or Elysium.',
    'not affiliated with Kinetiq or Elysium',
    'Not affiliated with Elysium.',
    'Token launched on Elysium 2 hours ago; holder concentration is high.',
    'Kinetiq built the chain; this agent reports on launches.',
  ])('passes: %s', (t) => passes(t))
})

describe('official claims: reviewer regressions', () => {
  // H1: the disclaimer must pass even when a short word precedes it.
  it.each([
    'We are not affiliated with Kinetiq or Elysium.',
    'This agent is not affiliated with Kinetiq or Elysium.',
    'Token launched 2 hours ago. Not affiliated with Kinetiq or Elysium.',
    'Risk looks low. Not affiliated with Kinetiq or Elysium.',
    'ELYSIA is not affiliated with Kinetiq or Elysium.',
    'Top holders hold 40% of supply, so go slow. Not affiliated with Kinetiq or Elysium.',
  ])('passes disclaimer after other text: %s', (t) => passes(t))

  // H2: natural-language affiliation claims.
  it.each([
    'Elysium is our official partner',
    'Kinetiq has endorsed this agent',
    'Elysium approved this report',
    'Elysium backs us',
    'We partner with Elysium',
    'Partnering with Kinetiq',
    'In partnership with Elysium',
    'Collaborating with Elysium',
    'Affiliated with the Elysium team',
    'Official bot of the Elysium network',
    'Authorized by Elysium',
    'Licensed by Kinetiq',
    'On behalf of Elysium',
    'We work at Elysium',
    'Kinetiq-backed agent',
    'Elysium staff reviewed this',
  ])('blocks natural claim: %s', (t) => blocked(t))

  // H3: claims disguised behind a negation.
  it.each([
    'Not affiliated with Kinetiq, but in partnership with Elysium.',
    'Not affiliated with Kinetiq, but Elysium is our partner.',
    'Not affiliated with Elysium, but affiliated with Kinetiq.',
    'We are not not affiliated with Elysium.',
  ])('blocks claim behind negation: %s', (t) => blocked(t))

  // M1: separators inside words.
  it.each([
    'off.icial Elysium account',
    'of-ficial Elysium account',
    'offi_cial Elysium account',
    'official Ely-sium account',
    'official Kine.tiq account',
    'we are E l y s i u m',
    'partner of E l y s i u m',
  ])('blocks separator evasion: %s', (t) => blocked(t))

  // The wider patterns must not catch plain reporting.
  it.each([
    'Elysium is a new L2 and the launch window is open.',
    'Kinetiq built the chain; the token has 3 holders.',
    'The token launched on Elysium 2 hours ago.',
    'Holder concentration is high. Not affiliated with Kinetiq or Elysium. Stay careful.',
  ])('still passes plain text: %s', (t) => passes(t))
})

describe('ELYSIA content types', () => {
  it.each(['gate_report', 'graduation_watch', 'hype_daily_call', 'weekly_recap'] as const)('%s is accepted and still hits shared rules', (type) => {
    passes('Top holders control 40% of supply, flagged.', type)
    blocked('You should buy this now', 'ADVICE_PHRASE', type)
    blocked('Price target $5', 'PRICE_TARGET', type)
  })

  it('fails closed on incomplete data', () => {
    const d = run('Top holders control a lot.', 'gate_report', { dataComplete: false })
    expect(d.allowed).toBe(false)
    expect(d.reasons).toContain('DATA_INCOMPLETE')
  })

  it('rejects unknown content types', () => {
    const d = evaluate({ type: 'burn_everything' as ContentType, text: 'hello', dataComplete: true })
    expect(d.allowed).toBe(false)
  })

  it('every new type requires approval in the default mode', () => {
    expect(run('Holder concentration is high.', 'gate_report').requiresApproval).toBe(true)
  })
})
