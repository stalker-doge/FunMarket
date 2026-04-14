import { db } from "@/lib/db";
import { users, markets, trades } from "@/lib/db/schema";
import { eq, sql, desc } from "drizzle-orm";

export async function getUserByUsername(username: string) {
  return db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      balance: users.balance,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.username, username))
    .get();
}

export async function getUserPublicStats(userId: number) {
  const marketsCreated = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(markets)
    .where(eq(markets.creatorId, userId))
    .get();

  const totalTrades = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(trades)
    .where(eq(trades.userId, userId))
    .get();

  const user = await db
    .select({
      balance: users.balance,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .get();

  return {
    marketsCreated: marketsCreated?.count ?? 0,
    totalTrades: totalTrades?.count ?? 0,
    balance: user?.balance ?? 0,
    joinDate: user?.createdAt ?? new Date().toISOString(),
  };
}

export async function getMarketsByCreator(creatorId: number, limit: number = 10) {
  return db
    .select({
      id: markets.id,
      question: markets.question,
      status: markets.status,
      category: markets.category,
      createdAt: markets.createdAt,
      resolutionOutcomeId: markets.resolutionOutcomeId,
    })
    .from(markets)
    .where(eq(markets.creatorId, creatorId))
    .orderBy(desc(markets.createdAt))
    .limit(limit)
    .all();
}
