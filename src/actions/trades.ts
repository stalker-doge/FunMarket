"use server";

import { getUser } from "@/lib/auth/session";
import { executeTrade, previewTrade, executeSell } from "@/lib/db/queries/trades";
import { revalidatePath } from "next/cache";

export async function buySharesAction(outcomeId: number, quantity: number) {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  try {
    const result = await executeTrade(user.id, outcomeId, quantity);
    revalidatePath("/markets");
    revalidatePath("/portfolio");
    revalidatePath("/leaderboard");
    return { success: true, ...result };
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }
}

export async function sellSharesAction(outcomeId: number, quantity: number) {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  try {
    const result = await executeSell(user.id, outcomeId, quantity);
    revalidatePath("/markets");
    revalidatePath("/portfolio");
    revalidatePath("/leaderboard");
    return { success: true, ...result };
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }
}

export async function previewTradeAction(outcomeId: number, quantity: number) {
  try {
    const result = await previewTrade(outcomeId, quantity);
    return { success: true, ...result };
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }
}
