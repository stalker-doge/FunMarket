"use server";

import { getUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateDisplayNameAction(newName: string) {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  const trimmed = newName.trim();
  if (!trimmed) return { error: "Display name cannot be empty" };
  if (trimmed.length > 40) return { error: "Display name too long (max 40 characters)" };

  await db.update(users)
    .set({ displayName: trimmed })
    .where(eq(users.id, user.id));

  revalidatePath("/profile");
  return { success: true, displayName: trimmed };
}
