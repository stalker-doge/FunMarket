"use server";

import { getUser } from "@/lib/auth/session";
import { createMarket, getMarketById, getOutcomesByMarket, deleteMarket } from "@/lib/db/queries/markets";
import { getUserMarketHoldings } from "@/lib/db/queries/trades";
import { getPriceHistory } from "@/lib/db/queries/price-history";
import { logActivity } from "@/lib/db/queries/activity";
import { lmsrAllPrices } from "@/lib/market-engine/lmsr";
import { plain } from "@/lib/db";
import { redirect } from "next/navigation";
import { marketSchema } from "@/lib/validators";
import { checkAndAwardAchievements } from "@/lib/achievements/checker";

export async function createMarketAction(formData: FormData) {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  const outcomeLabels: string[] = [];
  let i = 0;
  while (true) {
    const label = formData.get(`outcome_${i}`) as string;
    if (!label) break;
    const trimmed = label.trim();
    if (trimmed) outcomeLabels.push(trimmed);
    i++;
  }

  const raw = {
    question: (formData.get("question") as string)?.trim() ?? "",
    description: (formData.get("description") as string)?.trim() || null,
    category: (formData.get("category") as string) || "other",
    imageUrl: (formData.get("imageUrl") as string)?.trim() || null,
    closesAt: (formData.get("closesAt") as string) || null,
    outcomes: outcomeLabels,
  };

  const parsed = marketSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { question, description, category, imageUrl, closesAt, outcomes } = parsed.data;

  const marketId = await createMarket(user.id, question, description, outcomes, closesAt, category, imageUrl);

  await logActivity({ type: "market_created", userId: user.id, marketId });
  await checkAndAwardAchievements(user.id);

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
