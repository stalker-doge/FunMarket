import { db } from "@/lib/db";
import { markets } from "@/lib/db/schema";
import { eq, and, lt, isNotNull, ne } from "drizzle-orm";

export async function autoCloseExpiredMarkets() {
  const now = new Date().toISOString();

  const expired = await db
    .select({ id: markets.id })
    .from(markets)
    .where(
      and(
        eq(markets.status, "open"),
        isNotNull(markets.closesAt),
        lt(markets.closesAt, now)
      )
    )
    .all();

  for (const m of expired) {
    await db
      .update(markets)
      .set({ status: "closed" })
      .where(eq(markets.id, m.id));
  }

  return expired.length;
}
