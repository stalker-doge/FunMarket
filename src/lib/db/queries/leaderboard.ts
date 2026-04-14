import { db } from "@/lib/db";
import { users, trades, outcomes, markets } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { lmsrPrice } from "@/lib/market-engine/lmsr";

export async function getLeaderboard() {
  const allUsers = await db.select({
    id: users.id,
    username: users.username,
    email: users.email,
    displayName: users.displayName,
    avatarUrl: users.avatarUrl,
    balance: users.balance,
  }).from(users).all();

  const rankings = await Promise.all(allUsers.map(async (user) => {
    const holdings = await db
      .select({
        outcomeId: trades.outcomeId,
        marketId: trades.marketId,
        totalShares: sql<number>`COALESCE(SUM(${trades.quantity}), 0)`,
        totalCost: sql<number>`COALESCE(SUM(${trades.totalCost}), 0)`,
      })
      .from(trades)
      .where(eq(trades.userId, user.id))
      .groupBy(trades.outcomeId)
      .having(sql`SUM(${trades.quantity}) > 0`)
      .all();

    let unrealizedValue = 0;
    for (const holding of holdings) {
      const outcome = await db.select().from(outcomes).where(eq(outcomes.id, holding.outcomeId)).get();
      if (!outcome) continue;

      const market = await db.select().from(markets).where(eq(markets.id, holding.marketId)).get();
      if (!market || market.status !== "open") continue;

      const allOutcomes = await db.select().from(outcomes).where(eq(outcomes.marketId, market.id)).all();
      const sharesArray = allOutcomes.map((o) => o.sharesOutstanding);
      const outcomeIndex = allOutcomes.findIndex((o) => o.id === holding.outcomeId);
      const price = lmsrPrice(sharesArray, market.liquidityParam, outcomeIndex);

      unrealizedValue += holding.totalShares * price;
    }

    return {
      ...user,
      netWorth: user.balance + unrealizedValue,
    };
  }));

  return rankings.sort((a, b) => b.netWorth - a.netWorth);
}
