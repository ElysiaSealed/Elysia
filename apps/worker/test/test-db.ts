import { createDb } from '@elysia/db'

type TestDb = ReturnType<typeof createDb>

export const MISSING_URL_MESSAGE =
  'TEST_DATABASE_URL is not set. These tests need a dedicated local ELYSIA test database: set TEST_DATABASE_URL in your shell to its connection URL (database name elysia_test) before running vitest. Never point it at a shared or NEXA database.'

function unusable(): never {
  throw new Error(MISSING_URL_MESSAGE)
}

/**
 * DB handle for integration tests. There is no default URL: without TEST_DATABASE_URL, any database use throws
 * MISSING_URL_MESSAGE, while tests that never touch the database keep running.
 */
export function testDb(): TestDb & { configured: boolean } {
  const url = process.env.TEST_DATABASE_URL
  if (url) return { ...createDb(url), configured: true }
  const guard = () => new Proxy(function () {}, { apply: unusable, get: (_t, p) => (typeof p === 'symbol' || p === 'then' ? undefined : unusable) })
  return { db: guard() as unknown as TestDb['db'], client: guard() as unknown as TestDb['client'], configured: false }
}
