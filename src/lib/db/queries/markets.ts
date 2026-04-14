import { db } from "@/lib/db";
import { markets, outcomes, users, trades } from "@/lib/db/schema";
import { eq, desc, and, or, like, sql, SQL } from "drizzle-orm";

export async function getOpenMarkets() {
  return db
    .select({
      id: markets.id,
      question: markets.question,
      description: markets.description,
      category: markets.category,
      imageUrl: markets.imageUrl,
      status: markets.status,
      closesAt: markets.closesAt,
      createdAt: markets.createdAt,
      creatorName: users.displayName,
      creatorUsername: users.username,
      resolutionOutcomeId: markets.resolutionOutcomeId,
    })
    .from(markets)
    .innerJoin(users, eq(markets.creatorId, users.id))
    .where(eq(markets.status, "open"))
    .orderBy(desc(markets.createdAt))
    .all();
}

export async function getMarketById(id: number) {
  return db
    .select({
      id: markets.id,
      question: markets.question,
      description: markets.description,
      category: markets.category,
      imageUrl: markets.imageUrl,
      status: markets.status,
      closesAt: markets.closesAt,
      createdAt: markets.createdAt,
      creatorId: markets.creatorId,
      creatorName: users.displayName,
      creatorUsername: users.username,
      liquidityParam: markets.liquidityParam,
      resolutionOutcomeId: markets.resolutionOutcomeId,
      resolutionNotes: markets.resolutionNotes,
    })
    .from(markets)
    .innerJoin(users, eq(markets.creatorId, users.id))
    .where(eq(markets.id, id))
    .get();
}

export async function getOutcomesByMarket(marketId: number) {
  return db
    .select()
    .from(outcomes)
    .where(eq(outcomes.marketId, marketId))
    .all();
}

export async function getOutcomeShares(marketId: number): Promise<number[]> {
  const result = await getOutcomesByMarket(marketId);
  return result.map((o) => o.sharesOutstanding);
}

export async function createMarket(
  creatorId: number,
  question: string,
  description: string | null,
  outcomeLabels: string[],
  closesAt: string | null,
  category: string = "other",
  imageUrl: string | null = null
) {
  const marketResult = await db.insert(markets).values({
    creatorId,
    question,
    description,
    category,
    imageUrl,
    closesAt,
  });

  const marketId = Number(marketResult.lastInsertRowid);

  for (let i = 0; i < outcomeLabels.length; i++) {
    await db.insert(outcomes).values({
      marketId,
      label: outcomeLabels[i],
      color: ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4", "#84cc16"][i % 8],
    });
  }

  return marketId;
}

export async function getAllMarkets() {
  return db
    .select({
      id: markets.id,
      question: markets.question,
      description: markets.description,
      category: markets.category,
      imageUrl: markets.imageUrl,
      status: markets.status,
      closesAt: markets.closesAt,
      createdAt: markets.createdAt,
      creatorName: users.displayName,
      creatorUsername: users.username,
      resolutionOutcomeId: markets.resolutionOutcomeId,
    })
    .from(markets)
    .innerJoin(users, eq(markets.creatorId, users.id))
    .orderBy(desc(markets.createdAt))
    .all();
}

type MarketSort = "newest" | "most_traded" | "highest_volume";

export async function searchMarkets(opts: {
  query?: string;
  status?: string;
  category?: string;
  sort?: MarketSort;
  page?: number;
  limit?: number;
}) {
  const {
    query,
    status,
    category,
    sort = "newest",
    page = 1,
    limit = 12,
  } = opts;

  const conditions: SQL[] = [];
  if (status && status !== "all") {
    conditions.push(eq(markets.status, status));
  }
  if (query) {
    conditions.push(or(
      like(markets.question, `%${query}%`),
      like(markets.description, `%${query}%`)
    )!);
  }
  if (category && category !== "all") {
    conditions.push(eq(markets.category, category));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  if (sort === "most_traded" || sort === "highest_volume") {
    const sortExpr = sort === "most_traded"
      ? sql`COUNT(DISTINCT ${trades.id}) DESC`
      : sql`COALESCE(SUM(${trades.quantity}), 0) DESC`;

    const baseQuery = db
      .select({
        id: markets.id,
        question: markets.question,
        description: markets.description,
        category: markets.category,
        imageUrl: markets.imageUrl,
        status: markets.status,
        closesAt: markets.closesAt,
        createdAt: markets.createdAt,
        creatorName: users.displayName,
        creatorUsername: users.username,
        resolutionOutcomeId: markets.resolutionOutcomeId,
      })
      .from(markets)
      .innerJoin(users, eq(markets.creatorId, users.id))
      .leftJoin(trades, eq(trades.marketId, markets.id))
      .groupBy(markets.id)
      .orderBy(sortExpr);

    const allResults = where
      ? await baseQuery.where(where).all()
      : await baseQuery.all();

    const total = allResults.length;
    const paged = allResults.slice((page - 1) * limit, page * limit);
    return { markets: paged, total };
  }

  // Default: sort by newest
  const countResult = where
    ? await db.select({ count: sql<number>`COUNT(*)` }).from(markets).where(where).get()
    : await db.select({ count: sql<number>`COUNT(*)` }).from(markets).get();

  const total = countResult?.count ?? 0;

  const results = where
    ? await db
        .select({
          id: markets.id,
          question: markets.question,
          description: markets.description,
          category: markets.category,
          imageUrl: markets.imageUrl,
          status: markets.status,
          closesAt: markets.closesAt,
          createdAt: markets.createdAt,
          creatorName: users.displayName,
          creatorUsername: users.username,
          resolutionOutcomeId: markets.resolutionOutcomeId,
        })
        .from(markets)
        .innerJoin(users, eq(markets.creatorId, users.id))
        .where(where)
        .orderBy(desc(markets.createdAt))
        .limit(limit)
        .offset((page - 1) * limit)
        .all()
    : await db
        .select({
          id: markets.id,
          question: markets.question,
          description: markets.description,
          category: markets.category,
          imageUrl: markets.imageUrl,
          status: markets.status,
          closesAt: markets.closesAt,
          createdAt: markets.createdAt,
          creatorName: users.displayName,
          creatorUsername: users.username,
          resolutionOutcomeId: markets.resolutionOutcomeId,
        })
        .from(markets)
        .innerJoin(users, eq(markets.creatorId, users.id))
        .orderBy(desc(markets.createdAt))
        .limit(limit)
        .offset((page - 1) * limit)
        .all();

  return { markets: results, total };
}
