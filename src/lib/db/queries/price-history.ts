import { db } from "@/lib/db";
import { trades, outcomes } from "@/lib/db/schema";
import { eq, asc, sql } from "drizzle-orm";
import { lmsrAllPrices } from "@/lib/market-engine/lmsr";

export interface PriceSnapshot {
  time: string;
  prices: number[];
}

export async function getPriceHistory(
  marketId: number,
  outcomeCount: number,
  liquidityParam: number
): Promise<PriceSnapshot[]> {
  // Get all trades for this market in chronological order
  const marketTrades = await db
    .select({
      outcomeId: trades.outcomeId,
      quantity: trades.quantity,
      createdAt: trades.createdAt,
    })
    .from(trades)
    .where(eq(trades.marketId, marketId))
    .orderBy(asc(trades.createdAt))
    .all();

  if (marketTrades.length === 0) {
    // No trades — all outcomes at equal probability
    const equal = 1 / outcomeCount;
    return [{ time: new Date().toISOString(), prices: Array(outcomeCount).fill(equal) }];
  }

  // Get all outcomes for this market in order
  const marketOutcomes = await db
    .select()
    .from(outcomes)
    .where(eq(outcomes.marketId, marketId))
    .all();

  const outcomeIdToIndex = new Map<number, number>();
  marketOutcomes.forEach((o, i) => outcomeIdToIndex.set(o.id, i));

  // Replay trades to build price snapshots
  const shares = Array(outcomeCount).fill(0);
  const snapshots: PriceSnapshot[] = [];

  // Initial state (equal prices)
  snapshots.push({
    time: marketTrades[0].createdAt,
    prices: lmsrAllPrices(shares, liquidityParam),
  });

  for (const trade of marketTrades) {
    const idx = outcomeIdToIndex.get(trade.outcomeId);
    if (idx === undefined) continue;
    shares[idx] += trade.quantity;
    snapshots.push({
      time: trade.createdAt,
      prices: [...lmsrAllPrices(shares, liquidityParam)],
    });
  }

  return snapshots;
}
