// Git pre-push hook (called by .githooks/pre-push).
// Verifies the destination, rejects force pushes, then runs the safety checks.
// It never creates commits and never deploys.
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const isWin = process.platform === 'win32'
const ZERO = /^0+$/
const ORIGIN_RE = /^(https:\/\/github\.com\/|git@github\.com:)ElysiaSealed\/Elysia(\.git)?$/i

const fail = (msg) => {
  console.error(`pre-push: push rejected. ${msg}`)
  process.exit(1)
}
const git = (...args) => spawnSync('git', args, { encoding: 'utf8' })
const run = (label, cmd, args, opts = {}) => {
  console.log(`\n[pre-push] ${label}`)
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: isWin && cmd === 'pnpm', ...opts })
  if (r.error?.code === 'ENOENT') fail(`${cmd} was not found. Install it before pushing.`)
  if (r.status !== 0) fail(`"${label}" failed.`)
}

// 1. Destination: only the ELYSIA origin, only main.
const [, , remoteName, remoteUrl] = process.argv
const configured = git('config', '--get', 'remote.origin.url').stdout.trim()
if (remoteName !== 'origin') fail(`the remote must be "origin" (got "${remoteName}").`)
if (!ORIGIN_RE.test(configured) || remoteUrl !== configured) fail('origin does not point to the ELYSIA repository (ElysiaSealed/Elysia).')

const updates = readFileSync(0, 'utf8').split('\n').filter(Boolean)
for (const line of updates) {
  const [localRef, localSha, remoteRef, remoteSha] = line.split(' ')
  const allowedPair = (localRef === 'refs/heads/main' && remoteRef === 'refs/heads/main') || (localRef === 'refs/heads/dev-rh' && remoteRef === 'refs/heads/dev-rh')
  if (!allowedPair) fail(`only "main -> main" and "dev-rh -> dev-rh" can be pushed (got ${localRef} -> ${remoteRef}).`)
  if (ZERO.test(localSha)) fail('deleting a remote branch is not allowed.')
  // 2. No force pushes: the remote tip must be an ancestor of what is pushed.
  if (!ZERO.test(remoteSha)) {
    const r = spawnSync('git', ['merge-base', '--is-ancestor', remoteSha, localSha])
    if (r.status === 1) fail('this is not a fast-forward (force push). Force pushes are not allowed.')
    if (r.status !== 0) fail('the remote tip is unknown locally. Run "git fetch origin" and try again.')
  }
}

// 3. The checks run on the working tree, so it must match the pushed commit.
const dirty = () => git('status', '--porcelain').stdout.trim()
if (dirty()) fail('the working tree has uncommitted or untracked changes. Commit or stash them first; the hook never commits for you.')

// 4. Safety checks.
run('typecheck', 'pnpm', ['typecheck'])
run('production build', 'pnpm', ['build'])
run('script tests', 'pnpm', ['test:scripts'])
run('non-DB tests', 'pnpm', ['test:non-db'])
run('forge test', 'forge', ['test'], { cwd: 'contracts' })

// 5. DB tests only with an explicit ELYSIA TEST_DATABASE_URL; run-tests.mjs validates it and never falls back.
if (process.env.TEST_DATABASE_URL) {
  run('DB tests', 'pnpm', ['test:db'])
} else {
  console.log('\n[pre-push] DB tests NOT run: TEST_DATABASE_URL is not set (they are skipped, not passed).')
}

if (dirty()) fail('the checks changed files in the working tree. Review and commit them, then push again.')
console.log('\n[pre-push] all checks passed.')
