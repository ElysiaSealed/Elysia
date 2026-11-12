// Validation for TEST_DATABASE_URL. Pure string parsing: it never opens a connection.

/**
 * Accepts only the local ELYSIA Postgres (localhost, port 55433) database named elysia_test that does not mention NEXA.
 * @param {string | undefined} raw
 * @returns {string | null} a problem description, or null when the URL is acceptable
 */
export function validateTestDatabaseUrl(raw) {
  if (!raw) return 'TEST_DATABASE_URL is not set'
  if (/nexa/i.test(raw)) return 'TEST_DATABASE_URL must not reference NEXA'
  let url
  try {
    url = new URL(raw)
  } catch {
    return 'TEST_DATABASE_URL is not a valid URL'
  }
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) return 'TEST_DATABASE_URL must be a postgres URL'
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) return 'TEST_DATABASE_URL must point to localhost'
  if (url.port !== '55433') return 'TEST_DATABASE_URL must use port 55433 (the local ELYSIA Postgres)'
  if (url.pathname !== '/elysia_test') return 'the TEST_DATABASE_URL database name must be elysia_test'
  return null
}
