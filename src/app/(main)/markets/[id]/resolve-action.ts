"use server";

import { getUser } from "@/lib/auth/session";
import { resolveMarket } from "@/lib/market-engine/resolver";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

export async function resolveMarketAction(marketId: number, winningOutcomeId: number, resolutionNotes?: string) {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  try {
    const result = await resolveMarket(marketId, winningOutcomeId, user.id, resolutionNotes);
    logger.info("Market resolved", { marketId, winningOutcomeId, resolvedBy: user.id, winningTrades: result.winningTrades });
    revalidatePath(`/markets/${marketId}`);
    revalidatePath("/markets");
    revalidatePath("/portfolio");
    revalidatePath("/leaderboard");
    return { success: true };
  } catch (e: unknown) {
    logger.error("Market resolution failed", { marketId, winningOutcomeId, resolvedBy: user.id, error: (e as Error).message });
    return { error: (e as Error).message };
  }
}
