import { burns, type createDb } from '@elysia/db'

type Db = ReturnType<typeof createDb>['db']

export interface BurnLog {
  args: { caller: string; pairSpent: bigint; elysBurned: bigint }
  blockNumber: bigint
  logIndex: number
  transactionHash: string
}

/** Burned event of the burn contract -> burns table (dibaca GET /burn). Idempoten per `${tx}-${logIndex}`. */
export async function processBurns(db: Db, logs: BurnLog[], blockTime: (n: bigint) => Promise<Date>): Promise<number> {
  let inserted = 0
  for (const l of logs) {
    const at = await blockTime(l.blockNumber)
    const r = await db
      .insert(burns)
      .values({
        id: `${l.transactionHash}-${l.logIndex}`,
        txHash: l.transactionHash,
        elysBurned: l.args.elysBurned.toString(),
        pairSpent: l.args.pairSpent.toString(),
        at,
        blockNumber: l.blockNumber,
      })
      .onConflictDoNothing()
      .returning({ id: burns.id })
    inserted += r.length
  }
  return inserted
}
