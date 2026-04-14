import { db } from "@/lib/db";
import { markets, trades, outcomes, users } from "@/lib/db/schema";
import { logActivity } from "@/lib/db/queries/activity";
import { eq, and, sql } from "drizzle-orm";

export async function resolveMarket(marketId: number, winningOutcomeId: number, resolvedBy: number, resolutionNotes?: string) {
  const market = await db.select().from(markets).where(eq(markets.id, marketId)).get();
  if (!market) throw new Error("Market not found");
  if (market.creatorId !== resolvedBy) throw new Error("Only the creator can resolve");
  if (market.status !== "open" && market.status !== "closed") throw new Error("Market cannot be resolved");

  const winningOutcome = await db.select().from(outcomes).where(eq(outcomes.id, winningOutcomeId)).get();
  if (!winningOutcome || winningOutcome.marketId !== marketId) {
    throw new Error("Invalid outcome for this market");
  }

  // Set market as resolved
  await db.update(markets)
    .set({ status: "resolved", resolutionOutcomeId: winningOutcomeId, resolutionNotes: resolutionNotes || null })
    .where(eq(markets.id, marketId));

  // Find all users who hold winning shares and pay them out
  const winningTrades = await db
    .select({
      userId: trades.userId,
      totalShares: sql<number>`COALESCE(SUM(${trades.quantity}), 0)`,
    })
    .from(trades)
    .where(and(eq(trades.outcomeId, winningOutcomeId), eq(trades.marketId, marketId)))
    .groupBy(trades.userId)
    .all();

  for (const wt of winningTrades) {
    if (wt.totalShares <= 0) continue;
    const payout = wt.totalShares; // 1 FunBuck per winning share
    const user = await db.select().from(users).where(eq(users.id, wt.userId)).get();
    if (!user) continue;

    await db.update(users)
      .set({ balance: user.balance + payout })
      .where(eq(users.id, wt.userId));
  }

  await logActivity({
    type: "market_resolved",
    userId: resolvedBy,
    marketId,
    data: { winningOutcomeId, winningTradesCount: winningTrades.length },
  });

  return { winningTrades: winningTrades.length };
}
