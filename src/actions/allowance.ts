"use server";

import { getUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users, allowanceLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { canClaimAllowance, getDailyAllowanceAmount } from "@/lib/allowance";

export async function claimAllowanceAction() {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  if (!canClaimAllowance(user.lastAllowance)) {
    return { error: "Already claimed today" };
  }

  const amount = getDailyAllowanceAmount();
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");

  await db.update(users)
    .set({
      balance: user.balance + amount,
      lastAllowance: now,
    })
    .where(eq(users.id, user.id));

  await db.insert(allowanceLog).values({
    userId: user.id,
    amount,
  });

  return { success: true, amount, newBalance: user.balance + amount };
}
