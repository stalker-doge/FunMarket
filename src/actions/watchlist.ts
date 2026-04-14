"use server";

import { getUser } from "@/lib/auth/session";
import { addToWatchlist, removeFromWatchlist, isInWatchlist } from "@/lib/db/queries/watchlist";
import { revalidatePath } from "next/cache";

export async function toggleWatchlistAction(marketId: number) {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  const watched = await isInWatchlist(user.id, marketId);
  if (watched) {
    await removeFromWatchlist(user.id, marketId);
  } else {
    await addToWatchlist(user.id, marketId);
  }

  revalidatePath("/markets");
  revalidatePath("/portfolio");
  return { success: true, watched: !watched };
}
