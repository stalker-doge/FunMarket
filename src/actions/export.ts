"use server";

import { getUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { trades, outcomes, markets } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function exportTradesCsv() {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  const userTrades = await db
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
      marketQuestion: markets.question,
    })
    .from(trades)
    .innerJoin(outcomes, eq(trades.outcomeId, outcomes.id))
    .innerJoin(markets, eq(trades.marketId, markets.id))
    .where(eq(trades.userId, user.id))
    .orderBy(desc(trades.createdAt))
    .all();

  const headers = ["ID", "Date", "Type", "Market", "Outcome", "Quantity", "Avg Price", "Total Cost"];
  const rows = userTrades.map((t) => [
    t.id,
    t.createdAt,
    t.tradeType || "buy",
    `"${(t.marketQuestion || "").replace(/"/g, '""')}"`,
    `"${(t.outcomeLabel || "").replace(/"/g, '""')}"`,
    t.quantity.toFixed(2),
    t.avgPrice.toFixed(4),
    t.totalCost.toFixed(2),
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const filename = `funmarket-trades-${new Date().toISOString().split("T")[0]}.csv`;

  return { csv, filename };
}
