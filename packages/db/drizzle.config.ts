import { defineConfig } from 'drizzle-kit'

// Default config for `drizzle-kit generate`: it only reads the schema and writes SQL files, so it has no database
// credentials at all. Commands that open a connection (push, studio, kit-side migrate) must use
// drizzle.connect.config.ts, which requires an explicit DATABASE_URL. With this file they fail for lack of credentials.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema.ts',
  out: './migrations',
})
