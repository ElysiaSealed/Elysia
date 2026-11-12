// Run with: node --test scripts/lib/test-db-url.test.mjs
// No database connection is made; only strings are validated.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { validateTestDatabaseUrl } from './test-db-url.mjs'

const ok = (url) => assert.equal(validateTestDatabaseUrl(url), null, url)
const bad = (url, pattern) => assert.match(validateTestDatabaseUrl(url) ?? '', pattern, String(url))

test('accepts only the local ELYSIA Postgres: localhost, port 55433, database elysia_test', () => {
  ok('postgres://user:pass@localhost:55433/elysia_test')
  ok('postgresql://user:pass@127.0.0.1:55433/elysia_test')
  ok('postgres://user:pass@[::1]:55433/elysia_test')
  ok('postgres://elysia:elysia@localhost:55433/elysia_test')
})

test('rejects an empty, missing, or malformed URL', () => {
  bad(undefined, /not set/)
  bad('', /not set/)
  bad('not a url', /not a valid URL/)
  bad('postgres://', /localhost/)
})

test('rejects NEXA databases and any URL that mentions NEXA', () => {
  bad('postgres://user:pass@localhost:55433/nexa_test', /NEXA/)
  bad('postgres://user:pass@localhost:55433/nexa', /NEXA/)
  bad('postgres://nexa:nexa@localhost:55433/elysia_test', /NEXA/)
  bad('postgres://user:pass@localhost:5432/nexa_test', /NEXA/)
  bad('postgres://user:pass@db.NEXA-ai.example.com:55433/elysia_test', /NEXA/)
})

test('rejects external hosts and shared databases', () => {
  bad('postgres://user:pass@db.example.com:55433/elysia_test', /localhost/)
  bad('postgres://user:pass@localhost.example.com:55433/elysia_test', /localhost/)
  bad('postgres://user:pass@10.0.0.5:55433/elysia_test', /localhost/)
  bad('postgres://user:pass@aws-0-us-east-1.pooler.supabase.com:5432/postgres', /localhost/)
  bad('postgres://user:pass@localhost:55433/postgres', /elysia_test/)
  bad('postgres://user:pass@localhost:55433/shared_db', /elysia_test/)
})

test('rejects the wrong port, name, or protocol', () => {
  bad('postgres://user:pass@localhost:5432/elysia_test', /port 55433/)
  bad('postgres://user:pass@localhost:55432/elysia_test', /port 55433/)
  bad('postgres://user:pass@localhost/elysia_test', /port 55433/)
  bad('postgres://user:pass@localhost:55433/elysia_test_other', /elysia_test/)
  bad('postgres://user:pass@localhost:55433/', /elysia_test/)
  bad('mysql://user:pass@localhost:55433/elysia_test', /postgres URL/)
})
