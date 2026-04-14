"use server";

import { getUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function completeOnboardingAction() {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  await db.update(users)
    .set({ onboardingCompleted: true })
    .where(eq(users.id, user.id));

  revalidatePath("/dashboard");
  return { success: true };
}
