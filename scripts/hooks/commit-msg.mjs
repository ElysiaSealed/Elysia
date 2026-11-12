// Git commit-msg hook (called by .githooks/commit-msg).
// Validates the message and rejects it when invalid. It never rewrites the message.
import { readFileSync } from 'node:fs'

const TYPES = 'feat|fix|chore|docs|refactor|test|build|ci|perf|style|revert'
const SUBJECT_RE = new RegExp(`^(${TYPES})(\\([a-z0-9][a-z0-9._/-]*\\))?!?: \\S.*$`)
const MAX_SUBJECT = 100
// Attribution that must never appear in a commit message.
const FORBIDDEN = [
  [/^\s*co-authored-by:/im, 'a "Co-Authored-By" trailer'],
  [/generated with/i, 'a "Generated with ..." line'],
  [/noreply@anthropic\.com/i, 'an AI attribution address'],
]

const file = process.argv[2]
if (!file) {
  console.error('commit-msg: missing message file argument')
  process.exit(1)
}

const lines = readFileSync(file, 'utf8')
  .split(/\r?\n/)
  .filter((l) => !l.startsWith('#'))
while (lines.length && lines[lines.length - 1].trim() === '') lines.pop()

const errors = []
const subject = lines[0] ?? ''
if (!subject.trim()) {
  errors.push('the commit message is empty')
} else {
  const special = /^Merge /.test(subject) || /^Revert "/.test(subject)
  if (!special && !SUBJECT_RE.test(subject)) {
    errors.push(`the subject must follow Conventional Commits: <type>(<scope>)?: <description> (types: ${TYPES.replaceAll('|', ', ')})`)
  }
  if (subject.length > MAX_SUBJECT) errors.push(`the subject is longer than ${MAX_SUBJECT} characters`)
  if (lines.length > 1 && lines[1].trim() !== '') errors.push('leave a blank line between the subject and the body')
}
const text = lines.join('\n')
for (const [re, what] of FORBIDDEN) if (re.test(text)) errors.push(`remove ${what} (AI attribution is not allowed)`)

if (errors.length) {
  console.error('commit-msg: commit rejected.')
  for (const e of errors) console.error(`  - ${e}`)
  console.error('Write the message in English, for example: "feat(web): add proof page filters".')
  process.exit(1)
}
