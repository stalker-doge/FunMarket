"use server";

import { getUser } from "@/lib/auth/session";
import { resolveMarket } from "@/lib/market-engine/resolver";
import { revalidatePath } from "next/cache";

export async function resolveMarketAction(marketId: number, winningOutcomeId: number, resolutionNotes?: string) {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  try {
    await resolveMarket(marketId, winningOutcomeId, user.id, resolutionNotes);
    revalidatePath(`/markets/${marketId}`);
    revalidatePath("/markets");
    revalidatePath("/portfolio");
    revalidatePath("/leaderboard");
    return { success: true };
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }
}
