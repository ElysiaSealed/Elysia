import {
  baseNormalize,
  cleanTokens,
  collapsePattern,
  collapseRepeats,
  letterTokens,
  leetVariants,
  mergeShortRuns,
  stripInvisible,
} from './normalize'
import { REASON, type ContentType, type ReasonCode } from './types'

// ------------------------------------------------------------ ajakan beli/jual

// Sengaja ketat: laporan data memakai kata lain ("akumulasi", "distribusi", "transfer masuk/keluar").
const ADVICE_WORDS = [
  'buy', 'buys', 'buying', 'bought', 'sell', 'sells', 'selling', 'sold', 'purchase', 'purchased', 'purchasing',
  'beli', 'membeli', 'dibeli', 'belikan', 'belilah', 'beliin', 'jual', 'menjual', 'dijual', 'jualan', 'jualin', 'jualah',
  'borong', 'memborong', 'serok', 'diserok',
].map(collapseRepeats)
const ADVICE_WORD_RE = new RegExp(`^(?:${ADVICE_WORDS.join('|')})$`)

// Gabungan/kata berimbuhan: "buynow", "#BuyNVDA", "jualsemua", "belinya", "ngejual", "terjual".
const STEM_PREFIX_RE = /^(?:(?:me|mem|men|di|ng|nge|ter|ber|pem|pen)?(?:beli|jual|borong|serok)|buy|sell|purchase)/
// Kata wajar yang diawali batang di atas.
const STEM_EXEMPT_RE = /^(?:belia|believ|belief|belitung|belize|belittl|seller|sellers|buyer|buyers|buyback|buybacks)/

function hasAdviceStem(token: string): boolean {
  if (STEM_EXEMPT_RE.test(token)) return false
  return STEM_PREFIX_RE.test(token)
}

const PHRASE_SOURCES = [
  'pasti (?:[a-z]+ ){0,2}(?:naik|cuan|profit|untung|moon|pump|tembus)',
  'dijamin (?:[a-z]+ )?(?:naik|cuan|profit|untung)',
  'guarantee[d]?(?! (?:within|by|for|every|per|at)\\b)',
  '(?:definitely|certainly|surely) (?:[a-z]+ ){0,2}(?:pump|moon|rise|win|profit)',
  'certain to (?:rise|pump|moon|win)',
  'only up',
  'easy money',
  'free money',
  'risk free',
  'sure win',
  'cant lose',
  'all ?in',
  'to ?the ?moon',
  'moon soon',
  'ape ?in',
  'yolo',
  'wajib (?:masuk|punya|hold)',
  'jangan sampai ketinggalan',
  'dont miss',
  'must have',
  'gas pol',
  'gaskeun',
  'sikat',
  'hajar',
  'cuci gudang',
  'load up',
  'scoop up',
  'go (?:long|short)',
  'short (?:the|it|this)',
  'accumulate (?:now|more|this|these|it|them|rating|nexa)',
  'strong accumulate',
  'take profits?',
]
const PHRASES = PHRASE_SOURCES.map((p) => new RegExp(`\\b${collapsePattern(p)}\\b`))

// Rekomendasi tersirat: konten sponsor tidak boleh memberi rating/pilihan.
const SPONSOR_REC_RE = new RegExp(
  `\\b${collapsePattern('(?:top pick|strong buy|outperform|price target|recommend(?:ed|ation)?|rekomendasi|pilihan utama|undervalued|upside)')}\\b`,
)

function hasAdvice(base: string, sponsored: boolean): boolean {
  for (const variant of leetVariants(base)) {
    const tokens = cleanTokens(variant)

    for (const t of tokens) if (hasAdviceStem(t)) return true

    // Kata utuh, termasuk yang dipecah: "be li", "b u y", "s e l l".
    for (let i = 0; i < tokens.length; i++) {
      for (let size = 1; size <= 4 && i + size <= tokens.length; size++) {
        const window = tokens.slice(i, i + size)
        if (size > 1 && window.some((t) => t.length > 4)) continue
        const joined = collapseRepeats(window.join(''))
        if (joined.length > 12) continue
        if (ADVICE_WORD_RE.test(joined)) return true
      }
    }

    // Frasa: pemisah apa pun dianggap spasi; run token pendek digabung ("pa sti naik").
    const letters = letterTokens(variant)
    for (const view of [letters, mergeShortRuns(letters)]) {
      const sentence = view.map(collapseRepeats).join(' ')
      if (PHRASES.some((re) => re.test(sentence))) return true
      if (sponsored && SPONSOR_REC_RE.test(sentence)) return true
    }
  }
  return /100\s?%\s?(profit|win|cuan|gain|untung)/.test(base)
}

// ------------------------------------------------------------------ target harga

const CUR = String.raw`(?:\$|rp\.?|usd|us\$|idr)`
const NUM = String.raw`\d[\d.,]*`
const AMT =
  String.raw`~?\s?(?:(?:around|about|sekitar|approx\w*|kira\s?kira|near)\s+)?` +
  String.raw`(?:${CUR}\s?${NUM}\s?(?:k|m|b|jt|juta|rb|ribu)?|${NUM}\s?(?:\$|dollars?|dolar|usd|rupiah|rp|idr)(?![a-z]))`
const TARGET_WORD = String.raw`(?:targets?|targeting|targeted|sasaran)`
const GAP = String.raw`[^.;!?\n]`

const TARGET_RES = [
  new RegExp(String.raw`\b(?:${TARGET_WORD}|tp\d?|pt\d?)\b\W{0,3}${NUM}`),
  new RegExp(String.raw`\b${TARGET_WORD}\b${GAP}{0,40}?${AMT}`),
  /\b(?:price\s*target|take\s*profits?|stop\s*loss|cut\s*loss|target\s*harga)\b/,
  new RegExp(String.raw`\bfair\s*value\b${GAP}{0,15}?${AMT}`),
  // Isyarat masa depan di dekat nominal harga.
  new RegExp(
    String.raw`\b(?:will|akan|bakal|would|could|should|might|going\s+to|gonna|set\s+to|poised\s+to|heading\s+(?:to|for)|menuju|towards?|expected\s+to|diprediksi|diperkirakan|projected|forecast)\b${GAP}{0,30}?${AMT}`,
  ),
]
// "to $150" / "ke Rp 5000" tanpa kata kerja laporan di depannya dianggap target.
const BARE_TO_RE = new RegExp(String.raw`\b(?:to|ke)\s+${AMT}`, 'g')
const REPORT_VERB_RE =
  /\b(?:moved?|moves|rose|rises?|fell|falls?|dropped|climbed|slipped|jumped|surged|rallied|dipped|slid|settled|closed|traded|trading|stood|ticked|bergerak|naik|turun|menjadi|berubah|berakhir|ditutup|from|dari|up|down)\s*(?:\w+\s+)?$/

function hasPriceTarget(base: string): boolean {
  const spaced = base.replace(/[-_]/g, ' ')
  if (TARGET_RES.some((re) => re.test(spaced))) return true
  for (const m of spaced.matchAll(BARE_TO_RE)) {
    const before = spaced.slice(Math.max(0, m.index - 25), m.index)
    if (!REPORT_VERB_RE.test(before)) return true
  }
  return false
}

// -------------------------------------------------------------------------- URL

const TLDS = [
  'com', 'io', 'xyz', 'org', 'net', 'app', 'ai', 'co', 'id', 'me', 'ly', 'link', 'finance', 'fi', 'gg', 'to', 'tv', 'dev',
  'eth', 'sol', 'info', 'biz', 'site', 'online', 'top', 'club', 'cc', 'us', 'uk', 'gl', 'sh', 'so', 'ws', 'page', 'live',
  'fun', 'lol', 'wtf', 'bet', 'tech', 'exchange', 'vip', 'network', 'trade', 'money', 'cash', 'capital', 'group', 'global',
  'world', 'space', 'store', 'shop', 'art', 'nft', 'dao', 'defi', 'pro', 'one', 'win', 'gold', 'market', 'markets', 'tools',
  'bio', 'ink',
].join('|')
const DOMAIN_RE = new RegExp(`\\b[a-z0-9][a-z0-9-]*(?:\\.[a-z0-9-]+)*\\.(?:${TLDS})\\b`)

function hasUrl(base: string): boolean {
  const deobf = base
    .replace(/\[\s*\.\s*\]|\(\s*\.\s*\)|\{\s*\.\s*\}/g, '.')
    .replace(/\s*[([{]\s*dot\s*[)\]}]\s*/g, '.')
    .replace(/(?<=[a-z0-9])\s+dot\s+(?=[a-z0-9])/g, '.')
    .replace(/(?<=[a-z0-9])\s+\.\s+(?=[a-z]{2,})/g, '.')
  if (/\b[a-z][a-z0-9+.-]{1,15}:\/\//.test(deobf) || /\bwww\./.test(deobf)) return true
  if (/\b\d{1,3}(?:\.\d{1,3}){3}\b/.test(deobf)) return true
  if (DOMAIN_RE.test(deobf)) return true
  // Skema/www yang dipecah spasi: "h t t p s : / / ..."
  return /(?:https?|hxxps?|ftp|ipfs|tg):\/\/|www\./.test(base.replace(/\s+/g, ''))
}

// -------------------------------------------------------- official Elysium/Kinetiq claims

// Brief + FINAL decision: ELYSIA must not claim affiliation with, or official status at, Elysium/Kinetiq.
// The disclaimer "Not affiliated with Kinetiq or Elysium" is stripped first so it is never blocked; any other claim
// in the same text is still checked. Text and patterns are both repeat-collapsed ("affiliated" -> "afiliated"),
// like PHRASES. shortcut: English only, whole-name match (no fuzzy); add variants when red-team finds a gap.
const ORG = '(?:elysium|kinetiq)'
// Words that may sit between a claim word and the org name ("our", "with the", ...).
const FILL = '(?:the|our|a|an|is|are|was|has|have|been|now|proud|proudly|of|with|by|to|for|at|from|us|we|i|m|re)'
const CLAIM_BEFORE = '(?:official(?:ly)?|partner(?:s|ed|ing|ship)?|affiliated?|associated|endorse[ds]?|endorsing|sponsor(?:s|ed|ing)?|backed|backs|backing|approved|authori[sz]ed|licen[sc]ed|certified|recogni[sz]ed|collaborat(?:e|es|ed|ing|ion))'
const CLAIM_AFTER = '(?:official(?:ly)?|partner(?:s|ed|ing|ship)?|affiliated?|endorse[ds]?|sponsor(?:s|ed|ing)?|backed|backs|backing|approved|authori[sz]ed|licen[sc]ed|certified|staff|spokes(?:person|man|woman)|representative|ambassador|collaborat(?:e|es|ed|ing|ion))'
// The negation must not itself be negated ("not not affiliated with X" is a claim).
const OFFICIAL_NEGATION_RE = new RegExp(
  collapsePattern(
    `(?<!\\bnot )\\bnot (?:officially )?(?:affiliated|associated|partnered|endorsed|connected) (?:with|by|to) ${ORG}(?: (?:or|and|nor) ${ORG})?`,
  ),
  'g',
)
const OFFICIAL_CLAIM_RES = [
  `\\b${ORG} (?:s )?(?:official|team|partner|ambassador)\\b`,
  `\\bofficial (?:[a-z]+ ){0,2}(?:(?:of|for|from|by|at) )?${ORG}\\b`,
  `\\bofficial (?:[a-z]+ ){0,3}(?:of|for|from|by) the ${ORG}\\b`,
  `\\b(?:affiliated|partnered|associated|connected) (?:with|to) ${ORG}\\b`,
  `\\b(?:run|operated|built|made|backed|funded|endorsed|sponsored|approved|verified|powered) by ${ORG}\\b`,
  `\\b(?:part|member|members|team) of ${ORG}\\b`,
  `\\b(?:i am|i m|we are|we re|this is) (?:the )?(?:an? )?${ORG}\\b`,
  `\\b(?:${CLAIM_BEFORE}) (?:${FILL} ){0,3}${ORG}\\b`,
  `\\b${ORG} (?:s )?(?:${FILL} ){0,3}${CLAIM_AFTER}\\b`,
  `\\b(?:on behalf (?:of|from)|speaking (?:for|as)|work(?:s|ed|ing)? (?:at|for)) (?:the )?${ORG}\\b`,
].map((p) => new RegExp(collapsePattern(p)))

/** Joins runs of 3+ single-letter tokens ("e l y s i u m" -> "elysium"), so short words before them stay apart. */
function mergeLetterRuns(tokens: string[]): string[] {
  const out: string[] = []
  let run: string[] = []
  const flush = () => {
    out.push(...(run.length >= 3 ? [run.join('')] : run))
    run = []
  }
  for (const t of tokens) {
    if (t.length === 1) run.push(t)
    else {
      flush()
      out.push(t)
    }
  }
  flush()
  return out
}

function hasOfficialClaim(base: string): boolean {
  for (const variant of leetVariants(base)) {
    // Strip the disclaimer before any token merging, so a preceding short word cannot glue onto "not".
    const strip = (tokens: string[]) =>
      tokens.map(collapseRepeats).join(' ').replace(OFFICIAL_NEGATION_RE, ' ').split(' ').filter(Boolean)
    const letters = strip(letterTokens(variant))
    const views = [letters, mergeShortRuns(letters), strip(mergeLetterRuns(cleanTokens(variant)))]
    for (const view of views) {
      const sentence = view.map(collapseRepeats).join(' ')
      if (OFFICIAL_CLAIM_RES.some((re) => re.test(sentence))) return true
    }
  }
  return false
}

// ------------------------------------------------------------------------ $NEXA

function digitLeet(base: string): string {
  return base.replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e').replace(/4/g, 'a')
}

const TOKEN_WORDS = String.raw`(?:tokens?|tokennya|koin|koinnya|coins?|ticker|pair|pool|holders?|supply|mcap|presale|airdrop|staking)`
const NEXA_TOKEN_RES = [
  new RegExp(String.raw`\bnexa\s*[/:]\s*[a-z$]`),
  new RegExp(String.raw`[a-z$]\s*/\s*nexa\b`),
  new RegExp(String.raw`\b${TOKEN_WORDS}\W{0,3}nexa\b`),
  new RegExp(String.raw`\bnexa\W{0,3}${TOKEN_WORDS}\b`),
]
const NEXA_TICKER_RE = /\$\s?n\W?e\W?x\W?a(?![a-z])/

const PRICE_WORDS = String.raw`(?:harga|price|prices|mcap|market\s*cap|fdv|naik|turun|pump|pumped|dump|moon|ath|valuasi|valuation|undervalued|overvalued|melonjak|meroket|anjlok|ambles|rally|rallied|rallies|surge|surged|surges|soar|soared|plunge|plunged|crash|crashed|bullish|bearish|trading\s+at|(?:up|down)\s+\d+|\d\s?x)`
const NEXA_PRICE_WIDE_RE = new RegExp(String.raw`\b${PRICE_WORDS}\b`)
// Tanpa "$": kata harga berdampingan dengan NEXA (maks. satu kata di antara).
const NEXA_PRICE_NEAR_RES = [
  new RegExp(String.raw`\b${PRICE_WORDS}\W+(?:\w+\W+)?nexa\b`),
  new RegExp(String.raw`\bnexa\W+(?:\w+\W+)?${PRICE_WORDS}\b`),
]

export function mentionsNexaToken(base: string): boolean {
  const v = digitLeet(base)
  return NEXA_TICKER_RE.test(collapseRepeats(v)) || NEXA_TOKEN_RES.some((re) => re.test(v))
}

function mentionsNexaPrice(base: string): boolean {
  // Angka tidak di-leet di sini ("40%" bukan "ao%"); leet hanya dipakai untuk mengenali nama NEXA.
  if (NEXA_PRICE_NEAR_RES.some((re) => re.test(base))) return true
  return mentionsNexaToken(base) && NEXA_PRICE_WIDE_RE.test(base)
}

// ------------------------------------------------------------------ disclaimer

const DISCLAIMER_RE = /\b(bukan\s+(nasihat|saran)\s+(keuangan|investasi)|not\s+(a\s+)?financial\s+advice|nfa)\b/
const DISCLAIMER_TYPES: ReadonlySet<ContentType> = new Set(['prediction', 'risk_report', 'mention_reply'])

// -------------------------------------------------------------------- tidak tahu

// Hanya bentuk negatif, tanpa angka dan tanpa kata sambung kontras: klaim yang diselipkan setelah
// "tidak tahu" tidak boleh lolos lewat jalur ini.
const UNKNOWN_REPLY_RE =
  /^\s*(maaf[,.! ]*)?(nexa\s+)?(saya\s+)?(tidak\s+tahu|belum\s+(punya|memiliki)\s+data|data\s+(belum|tidak)\s+(lengkap|tersedia)|i\s+(do\s*n'?t|do\s+not)\s+know|not\s+enough\s+data|insufficient\s+data)/
const CONTRAST_RE = /\b(tapi|tetapi|namun|melainkan|but|however|though|although|meskipun|walau(?:pun)?)\b/

export function isUnknownReply(base: string): boolean {
  return UNKNOWN_REPLY_RE.test(base) && !/\d/.test(base) && !CONTRAST_RE.test(base)
}

// ----------------------------------------------------------------------- alamat

type AddressFinding = { kind: 'address'; address: string } | { kind: 'untracked' }

/**
 * Alamat 0x di teks. Hash transaksi (64 hex) dibiarkan; alamat utuh dibandingkan dengan daftar tracked;
 * hex yang lebih panjang/pendek dari alamat, serta alamat yang dipecah spasi/tanda hubung, ditandai.
 */
function findAddresses(base: string): AddressFinding[] {
  const found: AddressFinding[] = []
  const rest = base.replace(/0x[a-f0-9]{40,}/g, (m) => {
    const hex = m.slice(2)
    if (hex.length === 40) found.push({ kind: 'address', address: m })
    else if (hex.length !== 64) found.push({ kind: 'untracked' })
    return ' '
  })
  for (const m of rest.matchAll(/0x[\s\-_.]{0,3}(?:[a-f0-9]{1,16}[\s\-_.]{1,3}){2,}[a-f0-9]{1,16}/g)) {
    const hex = m[0].slice(2).replace(/[^a-f0-9]/g, '')
    if (hex.length >= 40) found.push({ kind: 'address', address: `0x${hex.slice(0, 40)}` })
  }
  return found
}

// --------------------------------------------------------------- angka terlacak

/** "1.234,5" / "142,10" / "0.35" -> Number. Pemisah ribuan dibuang; koma desimal dinormalkan. */
function toNumber(raw: string): number {
  const t = raw.replace(/[.,]+$/, '')
  const thousands = /^\d{1,3}([.,]\d{3})+$/.test(t)
  return Number(thousands ? t.replace(/[.,]/g, '') : t.replace(',', '.'))
}

function extractNumbers(text: string): number[] {
  return (text.replace(/0x[a-f0-9]+/g, ' ').match(/\d+(?:[.,]\d+)*/g) ?? []).map(toNumber).filter((n) => Number.isFinite(n))
}

function hasUntracedNumber(base: string, facts: readonly string[]): boolean {
  const allowed = new Set(facts.flatMap((f) => extractNumbers(f.toLowerCase())))
  return extractNumbers(base).some((n) => !allowed.has(n))
}

// ----------------------------------------------------------------------- umum

export interface RuleContext {
  type: ContentType
  text: string
  tokens: { address: string; ageSeconds: number | null }[]
  dataComplete: boolean
  minTokenAgeSeconds: number
  facts?: string[]
}

/** Mengembalikan kode alasan pemblokiran (kosong = lolos semua aturan). */
export function runRules(ctx: RuleContext): ReasonCode[] {
  const base = baseNormalize(ctx.text)
  const reasons = new Set<ReasonCode>()

  if (hasAdvice(base, ctx.type === 'sponsored')) reasons.add(REASON.ADVICE_PHRASE)
  if (hasPriceTarget(base)) reasons.add(REASON.PRICE_TARGET)
  if (hasUrl(base)) reasons.add(REASON.URL)
  if (hasOfficialClaim(base)) reasons.add(REASON.OFFICIAL_CLAIM)

  // $NEXA: hanya di pengumuman teknis & burn; harga/ajakan tidak pernah.
  if (mentionsNexaToken(base) && ctx.type !== 'technical_announcement' && ctx.type !== 'burn_report') {
    reasons.add(REASON.NEXA_MENTION)
  }
  if (mentionsNexaPrice(base)) reasons.add(REASON.NEXA_PRICE)

  if (ctx.type === 'sponsored' && !/^\s*Sponsored\b/.test(stripInvisible(ctx.text))) {
    reasons.add(REASON.SPONSORED_LABEL)
  }

  // Token: umur wajib diketahui dan >= batas; setiap alamat di teks harus berasal dari tool result.
  for (const t of ctx.tokens) {
    if (t.ageSeconds === null) reasons.add(REASON.TOKEN_AGE_UNKNOWN)
    else if (t.ageSeconds < ctx.minTokenAgeSeconds) reasons.add(REASON.TOKEN_TOO_NEW)
  }
  const tracked = new Set(ctx.tokens.map((t) => t.address.toLowerCase()))
  for (const f of findAddresses(base)) {
    if (f.kind === 'untracked' || !tracked.has(f.address)) reasons.add(REASON.UNTRACKED_ADDRESS)
  }

  const unknown = isUnknownReply(base)
  if (!ctx.dataComplete && !unknown) reasons.add(REASON.DATA_INCOMPLETE)

  if (DISCLAIMER_TYPES.has(ctx.type) && !unknown && !DISCLAIMER_RE.test(base)) reasons.add(REASON.MISSING_DISCLAIMER)

  if (ctx.facts && hasUntracedNumber(base, ctx.facts)) reasons.add(REASON.NUMBER_UNTRACED)

  return [...reasons]
}
