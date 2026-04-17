import { db } from "@/lib/db";
import { achievements, userAchievements, trades, markets, comments, users, watchlist, outcomes, allowanceLog } from "@/lib/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { ACHIEVEMENTS } from "./definitions";
import { logActivity } from "@/lib/db/queries/activity";

export async function ensureAchievementsSeeded() {
  const existing = await db.select({ slug: achievements.slug }).from(achievements).all();
  const existingSlugs = new Set(existing.map((e) => e.slug));

  for (const a of ACHIEVEMENTS) {
    if (!existingSlugs.has(a.slug)) {
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

  const allAchievements = await db.select().from(achievements).all();

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
      const r = await tradeCount(userId);
      return r >= 1;
    }
    case "getting_started": {
      const r = await tradeCount(userId);
      return r >= 10;
    }
    case "trading_veteran": {
      const r = await tradeCount(userId);
      return r >= 50;
    }
    case "high_roller": {
      const result = await db.select({ count: sql<number>`COUNT(*)` }).from(trades)
        .where(and(eq(trades.userId, userId), sql`${trades.totalCost} >= 500`)).get();
      return (result?.count ?? 0) >= 1;
    }
    case "market_maker": {
      const r = await createdMarketCount(userId);
      return r >= 1;
    }
    case "prolific_creator": {
      const r = await createdMarketCount(userId);
      return r >= 5;
    }
    case "diversified": {
      const r = await distinctMarketCount(userId);
      return r >= 5;
    }
    case "portfolio_pro": {
      const r = await distinctMarketCount(userId);
      return r >= 15;
    }
    case "wealthy": {
      const user = await db.select({ balance: users.balance }).from(users).where(eq(users.id, userId)).get();
      return (user?.balance ?? 0) >= 10000;
    }
    case "tycoon": {
      const user = await db.select({ balance: users.balance }).from(users).where(eq(users.id, userId)).get();
      return (user?.balance ?? 0) >= 50000;
    }
    case "commentator": {
      const r = await commentCount(userId);
      return r >= 10;
    }
    case "conversation_starter": {
      const r = await commentCount(userId);
      return r >= 50;
    }
    case "big_winner": {
      const bestProfit = await bestResolvedProfit(userId);
      return bestProfit >= 1000;
    }
    case "weekly_regular": {
      const result = await db.select({ count: sql<number>`COUNT(*)` }).from(allowanceLog)
        .where(eq(allowanceLog.userId, userId)).get();
      return (result?.count ?? 0) >= 7;
    }
    case "allowance_collector": {
      const result = await db.select({ count: sql<number>`COUNT(*)` }).from(allowanceLog)
        .where(eq(allowanceLog.userId, userId)).get();
      return (result?.count ?? 0) >= 30;
    }
    case "oracle": {
      // User created a market that has 25+ trades
      const userMarkets = await db.select({ id: markets.id }).from(markets)
        .where(eq(markets.creatorId, userId)).all();
      for (const m of userMarkets) {
        const t = await db.select({ count: sql<number>`COUNT(*)` }).from(trades)
          .where(eq(trades.marketId, m.id)).get();
        if ((t?.count ?? 0) >= 25) return true;
      }
      return false;
    }
    case "resolved_creator": {
      const result = await db.select({ count: sql<number>`COUNT(*)` }).from(markets)
        .where(and(eq(markets.creatorId, userId), eq(markets.status, "resolved"))).get();
      return (result?.count ?? 0) >= 3;
    }
    case "contrarian": {
      // User bought an outcome where avgPrice was <= 0.20
      const result = await db.select({ count: sql<number>`COUNT(*)` }).from(trades)
        .where(and(eq(trades.userId, userId), sql`${trades.avgPrice} <= 0.20`, sql`${trades.quantity} > 0`)).get();
      return (result?.count ?? 0) >= 1;
    }
    case "true_believer": {
      // User bought an outcome where avgPrice was >= 0.80
      const result = await db.select({ count: sql<number>`COUNT(*)` }).from(trades)
        .where(and(eq(trades.userId, userId), sql`${trades.avgPrice} >= 0.80`, sql`${trades.quantity} > 0`)).get();
      return (result?.count ?? 0) >= 1;
    }
    case "watchdog": {
      const result = await db.select({ count: sql<number>`COUNT(*)` }).from(watchlist)
        .where(eq(watchlist.userId, userId)).get();
      return (result?.count ?? 0) >= 10;
    }
    default:
      return false;
  }
}

// --- Helper queries ---

async function tradeCount(userId: number): Promise<number> {
  const result = await db.select({ count: sql<number>`COUNT(*)` }).from(trades)
    .where(and(eq(trades.userId, userId), sql`${trades.quantity} > 0`)).get();
  return result?.count ?? 0;
}

async function createdMarketCount(userId: number): Promise<number> {
  const result = await db.select({ count: sql<number>`COUNT(*)` }).from(markets)
    .where(eq(markets.creatorId, userId)).get();
  return result?.count ?? 0;
}

async function distinctMarketCount(userId: number): Promise<number> {
  const result = await db.select({ count: sql<number>`COUNT(DISTINCT ${trades.marketId})` })
    .from(trades).where(eq(trades.userId, userId)).get();
  return result?.count ?? 0;
}

async function commentCount(userId: number): Promise<number> {
  const result = await db.select({ count: sql<number>`COUNT(*)` }).from(comments)
    .where(eq(comments.userId, userId)).get();
  return result?.count ?? 0;
}

async function bestResolvedProfit(userId: number): Promise<number> {
  const holdings = await db.select({
    marketId: trades.marketId,
    totalCost: sql<number>`COALESCE(SUM(${trades.totalCost}), 0)`,
  }).from(trades).where(eq(trades.userId, userId)).groupBy(trades.marketId).all();

  let bestProfit = 0;
  for (const h of holdings) {
    const market = await db.select().from(markets).where(eq(markets.id, h.marketId)).get();
    if (market?.status === "resolved") {
      const payoutResult = await db.select({
        totalShares: sql<number>`COALESCE(SUM(CASE WHEN ${trades.outcomeId} = ${market.resolutionOutcomeId} THEN ${trades.quantity} ELSE 0 END), 0)`,
        totalCost: sql<number>`COALESCE(SUM(${trades.totalCost}), 0)`,
      }).from(trades).where(and(eq(trades.userId, userId), eq(trades.marketId, h.marketId))).get();

      if (payoutResult) {
        const profit = payoutResult.totalShares - Math.abs(payoutResult.totalCost);
        if (profit > bestProfit) bestProfit = profit;
      }
    }
  }
  return bestProfit;
}

// --- Progress ---

export interface AchievementProgress {
  current: number;
  target: number;
  label: string;
}

export async function getAchievementProgress(userId: number, slug: string): Promise<AchievementProgress> {
  switch (slug) {
    case "first_steps": {
      return { current: await tradeCount(userId), target: 1, label: "trades" };
    }
    case "getting_started": {
      return { current: await tradeCount(userId), target: 10, label: "trades" };
    }
    case "trading_veteran": {
      return { current: await tradeCount(userId), target: 50, label: "trades" };
    }
    case "high_roller": {
      const result = await db.select({ count: sql<number>`COUNT(*)` }).from(trades)
        .where(and(eq(trades.userId, userId), sql`${trades.totalCost} >= 500`)).get();
      return { current: result?.count ?? 0, target: 1, label: "big trades" };
    }
    case "market_maker": {
      return { current: await createdMarketCount(userId), target: 1, label: "markets created" };
    }
    case "prolific_creator": {
      return { current: await createdMarketCount(userId), target: 5, label: "markets created" };
    }
    case "diversified": {
      return { current: await distinctMarketCount(userId), target: 5, label: "markets" };
    }
    case "portfolio_pro": {
      return { current: await distinctMarketCount(userId), target: 15, label: "markets" };
    }
    case "wealthy": {
      const user = await db.select({ balance: users.balance }).from(users).where(eq(users.id, userId)).get();
      return { current: Math.min(user?.balance ?? 0, 10000), target: 10000, label: "FB net worth" };
    }
    case "tycoon": {
      const user = await db.select({ balance: users.balance }).from(users).where(eq(users.id, userId)).get();
      return { current: Math.min(user?.balance ?? 0, 50000), target: 50000, label: "FB net worth" };
    }
    case "commentator": {
      return { current: await commentCount(userId), target: 10, label: "comments" };
    }
    case "conversation_starter": {
      return { current: await commentCount(userId), target: 50, label: "comments" };
    }
    case "big_winner": {
      const best = await bestResolvedProfit(userId);
      return { current: Math.min(best, 1000), target: 1000, label: "FB profit" };
    }
    case "weekly_regular": {
      const result = await db.select({ count: sql<number>`COUNT(*)` }).from(allowanceLog)
        .where(eq(allowanceLog.userId, userId)).get();
      return { current: result?.count ?? 0, target: 7, label: "allowance claims" };
    }
    case "allowance_collector": {
      const result = await db.select({ count: sql<number>`COUNT(*)` }).from(allowanceLog)
        .where(eq(allowanceLog.userId, userId)).get();
      return { current: result?.count ?? 0, target: 30, label: "allowance claims" };
    }
    case "oracle": {
      // Max trades across user's created markets
      const userMarkets = await db.select({ id: markets.id }).from(markets)
        .where(eq(markets.creatorId, userId)).all();
      let maxTrades = 0;
      for (const m of userMarkets) {
        const t = await db.select({ count: sql<number>`COUNT(*)` }).from(trades)
          .where(eq(trades.marketId, m.id)).get();
        if ((t?.count ?? 0) > maxTrades) maxTrades = t?.count ?? 0;
      }
      return { current: maxTrades, target: 25, label: "trades on your market" };
    }
    case "resolved_creator": {
      const result = await db.select({ count: sql<number>`COUNT(*)` }).from(markets)
        .where(and(eq(markets.creatorId, userId), eq(markets.status, "resolved"))).get();
      return { current: result?.count ?? 0, target: 3, label: "resolved markets" };
    }
    case "contrarian": {
      const result = await db.select({ count: sql<number>`COUNT(*)` }).from(trades)
        .where(and(eq(trades.userId, userId), sql`${trades.avgPrice} <= 0.20`, sql`${trades.quantity} > 0`)).get();
      return { current: result?.count ?? 0, target: 1, label: "low-odds buys" };
    }
    case "true_believer": {
      const result = await db.select({ count: sql<number>`COUNT(*)` }).from(trades)
        .where(and(eq(trades.userId, userId), sql`${trades.avgPrice} >= 0.80`, sql`${trades.quantity} > 0`)).get();
      return { current: result?.count ?? 0, target: 1, label: "high-odds buys" };
    }
    case "watchdog": {
      const result = await db.select({ count: sql<number>`COUNT(*)` }).from(watchlist)
        .where(eq(watchlist.userId, userId)).get();
      return { current: result?.count ?? 0, target: 10, label: "watched markets" };
    }
    default:
      return { current: 0, target: 1, label: "" };
  }
}
