import { db } from "@/lib/db";
import { trades, outcomes, markets, users } from "@/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { lmsrBuyCost, lmsrSellCost } from "@/lib/market-engine/lmsr";

export async function executeTrade(userId: number, outcomeId: number, quantity: number) {
  const outcome = await db.select().from(outcomes).where(eq(outcomes.id, outcomeId)).get();
  if (!outcome) throw new Error("Outcome not found");

  const market = await db.select().from(markets).where(eq(markets.id, outcome.marketId)).get();
  if (!market) throw new Error("Market not found");
  if (market.status !== "open") throw new Error("Market is not open");
  if (quantity <= 0) throw new Error("Quantity must be positive");
  if (quantity < 1) throw new Error("Minimum trade is 1 share");

  const allOutcomes = await db.select().from(outcomes).where(eq(outcomes.marketId, market.id)).all();
  const sharesArray = allOutcomes.map((o) => o.sharesOutstanding);
  const outcomeIndex = allOutcomes.findIndex((o) => o.id === outcomeId);

  const cost = lmsrBuyCost(sharesArray, market.liquidityParam, outcomeIndex, quantity);
  const avgPrice = cost / quantity;

  const user = await db.select().from(users).where(eq(users.id, userId)).get();
  if (!user) throw new Error("User not found");
  if (user.balance < cost) throw new Error("Insufficient balance");

  // Insert trade
  await db.insert(trades).values({
    userId,
    outcomeId,
    marketId: market.id,
    quantity,
    avgPrice,
    totalCost: cost,
  });

  // Update outcome shares
  await db.update(outcomes)
    .set({ sharesOutstanding: outcome.sharesOutstanding + quantity })
    .where(eq(outcomes.id, outcomeId));

  // Deduct from user balance
  await db.update(users)
    .set({ balance: user.balance - cost })
    .where(eq(users.id, userId));

  return { cost, avgPrice, quantity };
}

export async function getUserHoldings(userId: number) {
  return db
    .select({
      marketId: trades.marketId,
      outcomeId: trades.outcomeId,
      totalShares: sql<number>`COALESCE(SUM(${trades.quantity}), 0)`,
      totalCost: sql<number>`COALESCE(SUM(${trades.totalCost}), 0)`,
      avgPrice: sql<number>`COALESCE(SUM(${trades.totalCost}) / SUM(${trades.quantity}), 0)`,
    })
    .from(trades)
    .where(eq(trades.userId, userId))
    .groupBy(trades.outcomeId)
    .having(sql`SUM(${trades.quantity}) > 0`)
    .all();
}

export async function getUserMarketHoldings(userId: number, marketId: number) {
  return db
    .select({
      outcomeId: trades.outcomeId,
      totalShares: sql<number>`COALESCE(SUM(${trades.quantity}), 0)`,
      totalCost: sql<number>`COALESCE(SUM(${trades.totalCost}), 0)`,
    })
    .from(trades)
    .where(and(eq(trades.userId, userId), eq(trades.marketId, marketId)))
    .groupBy(trades.outcomeId)
    .having(sql`SUM(${trades.quantity}) > 0`)
    .all();
}

export async function previewTrade(outcomeId: number, quantity: number) {
  const outcome = await db.select().from(outcomes).where(eq(outcomes.id, outcomeId)).get();
  if (!outcome) throw new Error("Outcome not found");

  const market = await db.select().from(markets).where(eq(markets.id, outcome.marketId)).get();
  if (!market) throw new Error("Market not found");

  const allOutcomes = await db.select().from(outcomes).where(eq(outcomes.marketId, market.id)).all();
  const sharesArray = allOutcomes.map((o) => o.sharesOutstanding);
  const outcomeIndex = allOutcomes.findIndex((o) => o.id === outcomeId);

  const cost = lmsrBuyCost(sharesArray, market.liquidityParam, outcomeIndex, quantity);
  const avgPrice = cost / quantity;

  return { cost, avgPrice, quantity, outcomeLabel: outcome.label };
}

export async function executeSell(userId: number, outcomeId: number, quantity: number) {
  const outcome = await db.select().from(outcomes).where(eq(outcomes.id, outcomeId)).get();
  if (!outcome) throw new Error("Outcome not found");

  const market = await db.select().from(markets).where(eq(markets.id, outcome.marketId)).get();
  if (!market) throw new Error("Market not found");
  if (market.status !== "open") throw new Error("Market is not open");
  if (quantity <= 0) throw new Error("Quantity must be positive");

  // Check user has enough shares
  const holding = await db
    .select({
      totalShares: sql<number>`COALESCE(SUM(${trades.quantity}), 0)`,
    })
    .from(trades)
    .where(and(eq(trades.userId, userId), eq(trades.outcomeId, outcomeId)))
    .get();

  const heldShares = holding?.totalShares ?? 0;
  if (heldShares < quantity) throw new Error("Not enough shares to sell");

  const allOutcomes = await db.select().from(outcomes).where(eq(outcomes.marketId, market.id)).all();
  const sharesArray = allOutcomes.map((o) => o.sharesOutstanding);
  const outcomeIndex = allOutcomes.findIndex((o) => o.id === outcomeId);

  const refund = lmsrSellCost(sharesArray, market.liquidityParam, outcomeIndex, quantity);
  if (refund < 0) throw new Error("Invalid sell: negative refund");
  const avgPrice = refund / quantity;

  // Insert sell trade with negative quantity
  await db.insert(trades).values({
    userId,
    outcomeId,
    marketId: market.id,
    quantity: -quantity,
    avgPrice,
    totalCost: -refund,
    tradeType: "sell",
  });

  // Decrease outcome shares outstanding
  await db.update(outcomes)
    .set({ sharesOutstanding: Math.max(0, outcome.sharesOutstanding - quantity) })
    .where(eq(outcomes.id, outcomeId));

  // Add refund to user balance
  const user = await db.select().from(users).where(eq(users.id, userId)).get();
  if (!user) throw new Error("User not found");
  await db.update(users)
    .set({ balance: user.balance + refund })
    .where(eq(users.id, userId));

  return { refund, avgPrice, quantity };
}

export async function getRecentTrades(userId: number, limit: number = 10) {
  return db
    .select({
      id: trades.id,
      outcomeId: trades.outcomeId,
      marketId: trades.marketId,
      quantity: trades.quantity,
      avgPrice: trades.avgPrice,
      totalCost: trades.totalCost,
      tradeType: trades.tradeType,
      createdAt: trades.createdAt,
      outcomeLabel: outcomes.label,
      outcomeColor: outcomes.color,
      marketQuestion: markets.question,
    })
    .from(trades)
    .innerJoin(outcomes, eq(trades.outcomeId, outcomes.id))
    .innerJoin(markets, eq(trades.marketId, markets.id))
    .where(eq(trades.userId, userId))
    .orderBy(desc(trades.createdAt))
    .limit(limit)
    .all();
}
