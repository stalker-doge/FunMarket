import { db } from "@/lib/db";
import { watchlist } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function addToWatchlist(userId: number, marketId: number) {
  await db.insert(watchlist).values({ userId, marketId }).onConflictDoNothing();
}

export async function removeFromWatchlist(userId: number, marketId: number) {
  await db.delete(watchlist).where(
    and(eq(watchlist.userId, userId), eq(watchlist.marketId, marketId))
  );
}

export async function isInWatchlist(userId: number, marketId: number): Promise<boolean> {
  const row = await db.select({ id: watchlist.id })
    .from(watchlist)
    .where(and(eq(watchlist.userId, userId), eq(watchlist.marketId, marketId)))
    .get();
  return !!row;
}

export async function getUserWatchlistIds(userId: number): Promise<Set<number>> {
  const rows = await db.select({ marketId: watchlist.marketId })
    .from(watchlist)
    .where(eq(watchlist.userId, userId))
    .all();
  return new Set(rows.map((r) => r.marketId));
}
