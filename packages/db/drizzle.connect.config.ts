import { defineConfig } from 'drizzle-kit'

// Config for drizzle-kit commands that connect to a database: `drizzle-kit <command> --config drizzle.connect.config.ts`.
// No default URL: it must never fall back to a shared or NEXA database.
const url = process.env.DATABASE_URL
if (!url) {
  throw new Error('DATABASE_URL is not set. Set it in your shell to the connection URL of the intended ELYSIA database before running drizzle-kit with this config. Never use a shared or NEXA database.')
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema.ts',
  out: './migrations',
  dbCredentials: { url },
})
