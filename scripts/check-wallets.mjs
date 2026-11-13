// Reads public addresses and keystores only. Never reads or prints a private key. No network calls.
// Elysia wallets (Robinhood Chain mainnet): Deployer, Agent and Treasury, three different addresses.
// The Keeper wallet is not needed on mainnet: the ledger reads the Chainlink feeds directly.
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
const warn = (m) => console.log(`WARN  ${m}`)
const bad = (m) => { failed = true; console.log(`FAIL  ${m}`) }

// shortcut: keystore names are a local convention, not an approved decision; confirm with the developer.
// A keystore is only checked for roles that sign from this machine (the Agent key lives in the Railway dashboard).
const roles = [
  { role: 'deployer', key: 'DEPLOYER_ADDRESS', keystore: 'elysia-deployer', required: true },
  { role: 'agent', key: 'AGENT_ADDRESS', keystore: 'elysia-agent', required: false },
  { role: 'treasury', key: 'TREASURY_ADDRESS', keystore: null, required: false },
]

const addrs = []
for (const { key } of roles) {
  const v = env[key] ?? ''
  if (!v) bad(`${key} empty in .env`)
  else if (!isAddress(v)) bad(`${key} is not a valid/checksummed address`)
  else { ok(`${key} valid`); addrs.push(v.toLowerCase()) }
}
if (addrs.length === roles.length) {
  if (new Set(addrs).size === roles.length) ok('deployer, agent and treasury addresses are different')
  else bad('deployer, agent and treasury addresses must be different')
}

function keystoreAddress(name) {
  try {
    return execFileSync('cast', ['wallet', 'address', '--account', name], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 5000 }).trim()
  } catch { return null }
}
for (const { role, key, keystore, required } of roles) {
  if (!keystore) continue
  const expected = env[key]
  const a = keystoreAddress(keystore)
  if (!a) (required ? bad : warn)(`keystore ${keystore} (${role}) unreadable (not imported, or needs a password: run manually)`)
  else if (expected && a.toLowerCase() === expected.toLowerCase()) ok(`keystore ${keystore} matches ${key}`)
  else bad(`keystore ${keystore} does not match ${key}`)
}
process.exit(failed ? 1 : 0)
