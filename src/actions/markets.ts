"use server";

import { getUser } from "@/lib/auth/session";
import { createMarket, getMarketById, getOutcomesByMarket, deleteMarket } from "@/lib/db/queries/markets";
import { getUserMarketHoldings } from "@/lib/db/queries/trades";
import { getPriceHistory } from "@/lib/db/queries/price-history";
import { logActivity } from "@/lib/db/queries/activity";
import { lmsrAllPrices } from "@/lib/market-engine/lmsr";
import { plain } from "@/lib/db";
import { redirect } from "next/navigation";

export async function createMarketAction(formData: FormData) {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  const question = (formData.get("question") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const category = (formData.get("category") as string) || "other";
  const imageUrl = (formData.get("imageUrl") as string)?.trim() || null;

  if (imageUrl) {
    try {
      const parsed = new URL(imageUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return { error: "Image URL must use http or https" };
      }
    } catch {
      return { error: "Invalid image URL" };
    }
  }
  const closesAt = (formData.get("closesAt") as string) || null;

  const outcomeLabels: string[] = [];
  let i = 0;
  while (true) {
    const label = formData.get(`outcome_${i}`) as string;
    if (!label) break;
    const trimmed = label.trim();
    if (trimmed) outcomeLabels.push(trimmed);
    i++;
  }

  if (!question) return { error: "Question is required" };
  if (outcomeLabels.length < 2) return { error: "At least 2 outcomes are required" };

  const marketId = await createMarket(user.id, question, description, outcomeLabels, closesAt, category, imageUrl);

  await logActivity({ type: "market_created", userId: user.id, marketId });

  redirect(`/markets/${marketId}`);
}

export async function getMarketLiveAction(marketId: number) {
  const user = await getUser();
  if (!user) return null;

  const market = await getMarketById(marketId);
  if (!market) return null;

  const marketOutcomes = await getOutcomesByMarket(marketId);
  const shares = marketOutcomes.map((o) => o.sharesOutstanding);
  const prices = lmsrAllPrices(shares, market.liquidityParam);

  const holdings = await getUserMarketHoldings(user.id, marketId);
  const holdingsMap: Record<number, number> = {};
  for (const h of holdings) {
    holdingsMap[h.outcomeId] = h.totalShares;
  }

  const priceHistory = await getPriceHistory(marketId, marketOutcomes.length, market.liquidityParam);

  return plain({
    market: {
      id: market.id,
      status: market.status,
      resolutionOutcomeId: market.resolutionOutcomeId,
    },
    outcomes: marketOutcomes.map((o, i) => ({
      id: o.id,
      label: o.label,
      color: o.color,
      sharesOutstanding: o.sharesOutstanding,
      price: prices[i],
    })),
    holdings: holdingsMap,
    priceHistory,
    userBalance: (await getUser())?.balance ?? 0,
  });
}

export async function deleteMarketAction(marketId: number) {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  const market = await getMarketById(marketId);
  if (!market) return { error: "Market not found" };
  if (market.creatorId !== user.id) return { error: "Only the creator can delete this market" };

  await deleteMarket(marketId);
  redirect("/markets");
}
