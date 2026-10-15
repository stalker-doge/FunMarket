import { db } from "@/lib/db";
import { users, trades, outcomes, markets } from "@/lib/db/schema";
import { eq, sql, inArray } from "drizzle-orm";
import { lmsrPrice } from "@/lib/market-engine/lmsr";

export async function getLeaderboard(limit: number = 50, offset: number = 0) {
  // 1. All users
  const allUsers = await db.select({
    id: users.id,
    username: users.username,
    email: users.email,
    displayName: users.displayName,
    avatarUrl: users.avatarUrl,
    balance: users.balance,
  }).from(users).all();

  // 2. All holdings aggregated by userId + outcomeId
  const allHoldings = await db.select({
    userId: trades.userId,
    outcomeId: trades.outcomeId,
    marketId: trades.marketId,
    totalShares: sql<number>`COALESCE(SUM(${trades.quantity}), 0)`,
  }).from(trades)
    .groupBy(trades.userId, trades.outcomeId)
    .having(sql`SUM(${trades.quantity}) > 0`)
    .all();

  // 3. All open markets
  const openMarkets = await db.select().from(markets)
    .where(eq(markets.status, "open")).all();
  const openMarketIds = new Set(openMarkets.map(m => m.id));

  // 4. All outcomes for open markets
  const openMarketOutcomes = openMarketIds.size > 0
    ? await db.select().from(outcomes)
        .where(inArray(outcomes.marketId, [...openMarketIds])).all()
    : [];

  // Build marketId -> outcomes map
  const outcomesByMarket = new Map<number, typeof openMarketOutcomes>();
  for (const o of openMarketOutcomes) {
    const arr = outcomesByMarket.get(o.marketId) || [];
    arr.push(o);
    outcomesByMarket.set(o.marketId, arr);
  }

  // Compute net worth per user
  const userNetWorth = new Map<number, number>();
  for (const user of allUsers) userNetWorth.set(user.id, user.balance);

  for (const h of allHoldings) {
    if (!openMarketIds.has(h.marketId)) continue;
    const mktOutcomes = outcomesByMarket.get(h.marketId);
    if (!mktOutcomes) continue;

    const market = openMarkets.find(m => m.id === h.marketId);
    if (!market) continue;

    const sharesArray = mktOutcomes.map(o => o.sharesOutstanding);
    const idx = mktOutcomes.findIndex(o => o.id === h.outcomeId);
    if (idx === -1) continue;

    const price = lmsrPrice(sharesArray, market.liquidityParam, idx);
    const current = userNetWorth.get(h.userId) ?? 0;
    userNetWorth.set(h.userId, current + h.totalShares * price);
  }

  const rankings = allUsers.map(u => ({
    ...u,
    netWorth: userNetWorth.get(u.id) ?? u.balance,
  }));

  return rankings.sort((a, b) => b.netWorth - a.netWorth).slice(offset, offset + limit);
}
