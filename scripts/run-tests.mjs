// Runs the workspace tests in one of two modes.
//   node scripts/run-tests.mjs          non-DB tests only (files that use the DB test helper are excluded)
//   node scripts/run-tests.mjs --db     DB tests only; requires an explicit local ELYSIA TEST_DATABASE_URL
// DB tests never fall back to another database.
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { validateTestDatabaseUrl } from './lib/test-db-url.mjs'

const dbMode = process.argv.includes('--db')
const isWin = process.platform === 'win32'

function testFiles(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name)
    if (e.isDirectory()) return e.name === 'node_modules' ? [] : testFiles(p)
    return e.name.endsWith('.test.ts') ? [p] : []
  })
}

if (dbMode) {
  const problem = validateTestDatabaseUrl(process.env.TEST_DATABASE_URL)
  if (problem) {
    console.error(`run-tests: refusing to run DB tests: ${problem}.`)
    process.exit(1)
  }
}

let failed = false
for (const group of ['apps', 'packages']) {
  for (const name of readdirSync(group)) {
    const pkgDir = join(group, name)
    const pkgJson = join(pkgDir, 'package.json')
    if (!existsSync(pkgJson)) continue
    const pkg = JSON.parse(readFileSync(pkgJson, 'utf8'))
    if (!pkg.scripts?.test) continue

    const all = testFiles(join(pkgDir, 'test')).map((f) => relative(pkgDir, f).replaceAll('\\', '/'))
    const usesDb = (f) => /test-db|TEST_DATABASE_URL/.test(readFileSync(join(pkgDir, f), 'utf8'))
    const dbFiles = all.filter(usesDb)

    const args = ['--filter', pkg.name, 'exec', 'vitest', 'run', '--no-file-parallelism']
    if (dbMode) {
      if (dbFiles.length === 0) continue
      args.push(...dbFiles)
    } else {
      args.push('--passWithNoTests', ...dbFiles.flatMap((f) => ['--exclude', f]))
    }
    console.log(`\n== ${pkg.name} (${dbMode ? 'DB' : 'non-DB'} tests)`)
    const r = spawnSync('pnpm', args, { stdio: 'inherit', shell: isWin })
    if (r.status !== 0) failed = true
  }
}
process.exit(failed ? 1 : 0)
