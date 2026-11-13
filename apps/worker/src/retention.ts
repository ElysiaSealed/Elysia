import { and, isNotNull, lt } from 'drizzle-orm'
import { authNonces, authSessions, databaseSizeBytes, proAlerts, priceSnapshots, ponsTrades, whaleTransfers, type createDb } from '@elysia/db'

type Db = ReturnType<typeof createDb>['db']

export interface RetentionConfig {
  /** Days to keep raw Pons trades (derived data; reports use recent windows). */
  tradesDays: number
  /** Days to keep whale transfers. */
  whalesDays: number
  /** Days to keep price snapshots (the API only serves the last 24 hours). */
  snapshotsDays: number
  /** Days to keep Pro alerts that were already sent to Telegram. */
  alertsDays: number
}

export const DEFAULT_RETENTION: RetentionConfig = { tradesDays: 30, whalesDays: 30, snapshotsDays: 7, alertsDays: 30 }

const DAY_MS = 86_400_000

/**
 * Deletes old derived and expired rows so the database stays under the Supabase free plan limit (500 MB).
 * Evidence is never touched: predictions, post queue, payments, subscriptions, and the RiskGuard log are not pruned.
 * Returns how many rows were removed per table.
 */
export async function pruneOldData(db: Db, cfg: RetentionConfig, now: Date = new Date()): Promise<Record<string, number>> {
  const cutoff = (days: number) => new Date(now.getTime() - days * DAY_MS)
  const count = (r: unknown) => Number((r as { count?: number }).count ?? 0)
  return {
    ponsTrades: count(await db.delete(ponsTrades).where(lt(ponsTrades.at, cutoff(cfg.tradesDays)))),
    whaleTransfers: count(await db.delete(whaleTransfers).where(lt(whaleTransfers.at, cutoff(cfg.whalesDays)))),
    priceSnapshots: count(await db.delete(priceSnapshots).where(lt(priceSnapshots.at, cutoff(cfg.snapshotsDays)))),
    proAlerts: count(await db.delete(proAlerts).where(and(isNotNull(proAlerts.telegramDispatchedAt), lt(proAlerts.createdAt, cutoff(cfg.alertsDays))))),
    authNonces: count(await db.delete(authNonces).where(lt(authNonces.expiresAt, cutoff(1)))),
    authSessions: count(await db.delete(authSessions).where(lt(authSessions.expiresAt, cutoff(1)))),
  }
}

export interface SizeReport {
  mb: number
  level: 'ok' | 'warn' | 'critical'
}

/** Database size against the free plan: warn at warnMb, critical at limitMb (ingestion pauses there). */
export async function checkDatabaseSize(db: Db, warnMb: number, limitMb: number): Promise<SizeReport> {
  const mb = (await databaseSizeBytes(db)) / 1_048_576
  return { mb, level: mb >= limitMb ? 'critical' : mb >= warnMb ? 'warn' : 'ok' }
}
