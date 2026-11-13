import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

export * from './schema'
export { schema }

/** Koneksi langsung/session (bukan transaction pooler) supaya cocok dengan pg-boss dan proses long-running. */
export function createDb(url: string) {
  // Pooler session mode Supabase punya batas koneksi kecil yang dipakai bersama indexer, worker, dan api: 3 service x 10 koneksi
  // menghabiskannya (ECHECKOUTTIMEOUT). Batas per proses bisa diatur lewat DB_POOL_MAX.
  const max = Number(process.env.DB_POOL_MAX)
  const client = postgres(url, { max: Number.isInteger(max) && max > 0 ? max : 4 })
  return { db: drizzle(client, { schema }), client }
}

/** Size of the whole database in bytes. The Supabase free plan allows 500 MB and goes read-only above it, so services watch this. */
export async function databaseSizeBytes(db: ReturnType<typeof createDb>['db']): Promise<number> {
  const rows = (await db.execute(sql`select pg_database_size(current_database())::text as bytes`)) as unknown as Array<{ bytes: string }>
  return Number(rows[0]?.bytes ?? 0)
}
