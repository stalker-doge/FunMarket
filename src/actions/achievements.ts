"use server";

import { getUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { achievements, userAchievements } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { plain } from "@/lib/db";

export async function getAchievementsForUser() {
  const user = await getUser();
  if (!user) return [];

  const allAchievements = await db.select().from(achievements).all();

  const unlocked = await db.select({ achievementId: userAchievements.achievementId, unlockedAt: userAchievements.unlockedAt })
    .from(userAchievements)
    .where(eq(userAchievements.userId, user.id))
    .all();

  const unlockedMap = new Map(unlocked.map((u) => [u.achievementId, u.unlockedAt]));

  return plain(allAchievements.map((a) => ({
    id: a.id,
    slug: a.slug,
    name: a.name,
    description: a.description,
    icon: a.icon,
    category: a.category,
    unlocked: unlockedMap.has(a.id),
    unlockedAt: unlockedMap.get(a.id) || null,
  })));
}
