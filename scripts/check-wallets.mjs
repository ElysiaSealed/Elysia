// Reads public addresses and keystores only. Never reads or prints a private key. No network calls.
// ELYSIA wallets: exactly three (deployer, agent, keeper), three different keys, no treasury.
import { readFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { isAddress } from 'viem'

const env = {}
if (existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (m) env[m[1]] = m[2]
  }
}
let failed = false
const ok = (m) => console.log(`OK    ${m}`)
const bad = (m) => { failed = true; console.log(`FAIL  ${m}`) }

// shortcut: keystore names are a local convention, not an approved decision; confirm with the developer.
const roles = [
  ['deployer', 'DEPLOYER_ADDRESS', 'elysia-deployer'],
  ['agent', 'AGENT_ADDRESS', 'elysia-agent'],
  ['keeper', 'KEEPER_ADDRESS', 'elysia-keeper'],
]

const addrs = []
for (const [, key] of roles) {
  const v = env[key] ?? ''
  if (!v) bad(`${key} empty in .env`)
  else if (!isAddress(v)) bad(`${key} is not a valid/checksummed address`)
  else { ok(`${key} valid`); addrs.push(v.toLowerCase()) }
}
if (addrs.length === roles.length) {
  if (new Set(addrs).size === roles.length) ok('three addresses are different')
  else bad('deployer/agent/keeper addresses must be different')
}

function keystoreAddress(name) {
  try {
    return execFileSync('cast', ['wallet', 'address', '--account', name], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 5000 }).trim()
  } catch { return null }
}
for (const [role, key, keystore] of roles) {
  const expected = env[key]
  const a = keystoreAddress(keystore)
  if (!a) bad(`keystore ${keystore} (${role}) unreadable (not imported, or needs a password: run manually)`)
  else if (expected && a.toLowerCase() === expected.toLowerCase()) ok(`keystore ${keystore} matches ${key}`)
  else bad(`keystore ${keystore} does not match ${key}`)
}
process.exit(failed ? 1 : 0)
