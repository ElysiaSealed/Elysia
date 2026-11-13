import { describe, expect, it } from 'vitest'
import { evaluate, type ContentType, type ReasonCode } from '../src'

const ADDR = '0x1111111111111111111111111111111111111111'
const OLD = 7200
const run = (text: string, type: ContentType = 'daily_summary', over: object = {}) =>
  evaluate({ type, text, dataComplete: true, tokens: [{ address: ADDR, ageSeconds: OLD }], ...over })
const blocked = (text: string, code: ReasonCode = 'OFFICIAL_CLAIM', type: ContentType = 'daily_summary') => {
  const d = run(text, type)
  expect(d.allowed, `must block: "${text}"`).toBe(false)
  expect(d.reasons).toContain(code)
}
const passes = (text: string, type: ContentType = 'daily_summary') => {
  const d = run(text, type)
  expect(d.reasons, `must pass: "${text}"`).toEqual([])
  expect(d.allowed).toBe(true)
}

describe('official Robinhood/Pons claims', () => {
  it.each([
    'We are the official Robinhood gatekeeper',
    'Official Pons account',
    'Robinhood official partner reports a clean launch',
    "Robinhood's official agent flagged this token",
    'Official partner of Robinhood',
    'Proudly affiliated with Pons',
    'Partnered with Robinhood on this report',
    'This report is backed by Pons',
    'Endorsed by Robinhood',
    'I am Robinhood',
    'We are part of Robinhood',
    'Not affiliated with Pons, but official Robinhood partner',
  ])('blocks: %s', (t) => blocked(t))

  it.each([
    'o f f i c i a l Robinhood account',
    'official  Robinhood  account',
    'OFFICIAL ROBINHOOD ACCOUNT',
    'official Rob​inhood account',
    'оfficial Robinhood account', // Cyrillic o
    'official r0binhood account',
    'affiliated with Pons',
    'afffiliated with Pons',
  ])('blocks evasion: %s', (t) => blocked(t))

  it.each([
    'Not affiliated with Pons or Robinhood.',
    'not affiliated with Pons or Robinhood',
    'Not affiliated with Robinhood.',
    'Token launched on Robinhood 2 hours ago; holder concentration is high.',
    'Pons built the chain; this agent reports on launches.',
  ])('passes: %s', (t) => passes(t))
})

describe('official claims: reviewer regressions', () => {
  // H1: the disclaimer must pass even when a short word precedes it.
  it.each([
    'We are not affiliated with Pons or Robinhood.',
    'This agent is not affiliated with Pons or Robinhood.',
    'Token launched 2 hours ago. Not affiliated with Pons or Robinhood.',
    'Risk looks low. Not affiliated with Pons or Robinhood.',
    'ELYSIA is not affiliated with Pons or Robinhood.',
    'Top holders hold 40% of supply, so go slow. Not affiliated with Pons or Robinhood.',
  ])('passes disclaimer after other text: %s', (t) => passes(t))

  // H2: natural-language affiliation claims.
  it.each([
    'Robinhood is our official partner',
    'Pons has endorsed this agent',
    'Robinhood approved this report',
    'Robinhood backs us',
    'We partner with Robinhood',
    'Partnering with Pons',
    'In partnership with Robinhood',
    'Collaborating with Robinhood',
    'Affiliated with the Robinhood team',
    'Official bot of the Robinhood network',
    'Authorized by Robinhood',
    'Licensed by Pons',
    'On behalf of Robinhood',
    'We work at Robinhood',
    'Pons-backed agent',
    'Robinhood staff reviewed this',
  ])('blocks natural claim: %s', (t) => blocked(t))

  // H3: claims disguised behind a negation.
  it.each([
    'Not affiliated with Pons, but in partnership with Robinhood.',
    'Not affiliated with Pons, but Robinhood is our partner.',
    'Not affiliated with Robinhood, but affiliated with Pons.',
    'We are not not affiliated with Robinhood.',
  ])('blocks claim behind negation: %s', (t) => blocked(t))

  // M1: separators inside words.
  it.each([
    'off.icial Robinhood account',
    'of-ficial Robinhood account',
    'offi_cial Robinhood account',
    'official Robin-hood account',
    'official Pon.s account',
    'we are R o b i n h o o d',
    'partner of R o b i n h o o d',
  ])('blocks separator evasion: %s', (t) => blocked(t))

  // The wider patterns must not catch plain reporting.
  it.each([
    'Robinhood is a new L2 and the launch window is open.',
    'Pons built the chain; the token has 3 holders.',
    'The token launched on Robinhood 2 hours ago.',
    'Holder concentration is high. Not affiliated with Pons or Robinhood. Stay careful.',
  ])('still passes plain text: %s', (t) => passes(t))
})

describe('content types', () => {
  it.each(['daily_summary', 'technical_announcement'] as const)('%s is accepted and still hits shared rules', (type) => {
    passes('Top holders control 40% of supply, flagged.', type)
    blocked('You should buy this now', 'ADVICE_PHRASE', type)
    blocked('Price target $5', 'PRICE_TARGET', type)
  })

  it('fails closed on incomplete data', () => {
    const d = run('Top holders control a lot.', 'daily_summary', { dataComplete: false })
    expect(d.allowed).toBe(false)
    expect(d.reasons).toContain('DATA_INCOMPLETE')
  })

  it('rejects unknown content types', () => {
    const d = evaluate({ type: 'burn_everything' as ContentType, text: 'hello', dataComplete: true })
    expect(d.allowed).toBe(false)
  })

  it('every new type requires approval in the default mode', () => {
    expect(run('Holder concentration is high.', 'daily_summary').requiresApproval).toBe(true)
  })
})
