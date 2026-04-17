"use server";

import { getUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { achievements, userAchievements } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { plain } from "@/lib/db";
import { ensureAchievementsSeeded, checkAndAwardAchievements, getAchievementProgress } from "@/lib/achievements/checker";

interface AchievementWithProgress {
  id: number;
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  unlocked: boolean;
  unlockedAt: string | null;
  progress: {
    current: number;
    target: number;
    label: string;
  };
}

export async function getAchievementsForUser(): Promise<AchievementWithProgress[]> {
  const user = await getUser();
  if (!user) return [];

  // Ensure all achievements exist in DB and check for new unlocks
  await ensureAchievementsSeeded();
  await checkAndAwardAchievements(user.id);

  const allAchievements = await db.select().from(achievements).all();

  const unlocked = await db.select({ achievementId: userAchievements.achievementId, unlockedAt: userAchievements.unlockedAt })
    .from(userAchievements)
    .where(eq(userAchievements.userId, user.id))
    .all();

  const unlockedMap = new Map(unlocked.map((u) => [u.achievementId, u.unlockedAt]));

  const results = await Promise.all(
    allAchievements.map(async (a) => {
      const isUnlocked = unlockedMap.has(a.id);
      let progress: { current: number; target: number; label: string };

      if (isUnlocked) {
        progress = { current: 1, target: 1, label: "" };
      } else {
        try {
          progress = await getAchievementProgress(user.id, a.slug);
        } catch {
          progress = { current: 0, target: 1, label: "" };
        }
      }

      return {
        id: a.id,
        slug: a.slug,
        name: a.name,
        description: a.description,
        icon: a.icon,
        category: a.category,
        unlocked: isUnlocked,
        unlockedAt: unlockedMap.get(a.id) || null,
        progress,
      };
    })
  );

  return plain(results);
}
