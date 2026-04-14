import { db } from "@/lib/db";
import { achievements, userAchievements, trades, markets, comments, users } from "@/lib/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { ACHIEVEMENTS } from "./definitions";
import { logActivity } from "@/lib/db/queries/activity";

async function ensureAchievementsSeeded() {
  const count = await db.select({ count: sql<number>`COUNT(*)` }).from(achievements).get();
  if (count?.count === 0) {
    for (const a of ACHIEVEMENTS) {
      await db.insert(achievements).values({
        slug: a.slug,
        name: a.name,
        description: a.description,
        icon: a.icon,
        category: a.category,
      });
    }
  }
}

export async function checkAndAwardAchievements(userId: number) {
  await ensureAchievementsSeeded();

  // Get all achievements
  const allAchievements = await db.select().from(achievements).all();

  // Get user's already unlocked achievements
  const unlocked = await db.select({ achievementId: userAchievements.achievementId })
    .from(userAchievements)
    .where(eq(userAchievements.userId, userId))
    .all();
  const unlockedIds = new Set(unlocked.map((u) => u.achievementId));

  const newUnlocks: string[] = [];

  for (const achievement of allAchievements) {
    if (unlockedIds.has(achievement.id)) continue;

    const earned = await checkCondition(userId, achievement.slug);
    if (earned) {
      await db.insert(userAchievements).values({
        userId,
        achievementId: achievement.id,
      });
      newUnlocks.push(achievement.slug);
      await logActivity({
        type: "achievement_unlocked",
        userId,
        data: { slug: achievement.slug, name: achievement.name },
      });
    }
  }

  return newUnlocks;
}

async function checkCondition(userId: number, slug: string): Promise<boolean> {
  switch (slug) {
    case "first_steps": {
      const result = await db.select({ count: sql<number>`COUNT(*)` }).from(trades)
        .where(and(eq(trades.userId, userId), sql`${trades.quantity} > 0`)).get();
      return (result?.count ?? 0) >= 1;
    }
    case "getting_started": {
      const result = await db.select({ count: sql<number>`COUNT(*)` }).from(trades)
        .where(and(eq(trades.userId, userId), sql`${trades.quantity} > 0`)).get();
      return (result?.count ?? 0) >= 10;
    }
    case "high_roller": {
      const result = await db.select({ count: sql<number>`COUNT(*)` }).from(trades)
        .where(and(eq(trades.userId, userId), sql`${trades.totalCost} >= 500`)).get();
      return (result?.count ?? 0) >= 1;
    }
    case "market_maker": {
      const result = await db.select({ count: sql<number>`COUNT(*)` }).from(markets)
        .where(eq(markets.creatorId, userId)).get();
      return (result?.count ?? 0) >= 1;
    }
    case "prolific_creator": {
      const result = await db.select({ count: sql<number>`COUNT(*)` }).from(markets)
        .where(eq(markets.creatorId, userId)).get();
      return (result?.count ?? 0) >= 5;
    }
    case "diversified": {
      const result = await db.select({ count: sql<number>`COUNT(DISTINCT ${trades.marketId})` })
        .from(trades).where(eq(trades.userId, userId)).get();
      return (result?.count ?? 0) >= 5;
    }
    case "wealthy": {
      const user = await db.select({ balance: users.balance }).from(users).where(eq(users.id, userId)).get();
      return (user?.balance ?? 0) >= 10000;
    }
    case "commentator": {
      const result = await db.select({ count: sql<number>`COUNT(*)` }).from(comments)
        .where(eq(comments.userId, userId)).get();
      return (result?.count ?? 0) >= 10;
    }
    case "big_winner": {
      // Check if user has a resolved market where they profited 1000+
      const holdings = await db.select({
        marketId: trades.marketId,
        totalCost: sql<number>`COALESCE(SUM(${trades.totalCost}), 0)`,
      }).from(trades).where(eq(trades.userId, userId)).groupBy(trades.marketId).all();

      for (const h of holdings) {
        const market = await db.select().from(markets).where(eq(markets.id, h.marketId)).get();
        if (market?.status === "resolved") {
          // Simple check: did they profit more than 1000 in total cost difference
          const payoutResult = await db.select({
            totalShares: sql<number>`COALESCE(SUM(CASE WHEN ${trades.outcomeId} = ${market.resolutionOutcomeId} THEN ${trades.quantity} ELSE 0 END), 0)`,
            totalCost: sql<number>`COALESCE(SUM(${trades.totalCost}), 0)`,
          }).from(trades).where(and(eq(trades.userId, userId), eq(trades.marketId, h.marketId))).get();

          if (payoutResult) {
            const profit = payoutResult.totalShares - Math.abs(payoutResult.totalCost);
            if (profit >= 1000) return true;
          }
        }
      }
      return false;
    }
    case "weekly_regular": {
      // Check last 7 allowance claims
      const { allowanceLog } = await import("@/lib/db/schema");
      const result = await db.select({ count: sql<number>`COUNT(*)` }).from(allowanceLog)
        .where(eq(allowanceLog.userId, userId)).get();
      return (result?.count ?? 0) >= 7;
    }
    default:
      return false;
  }
}
