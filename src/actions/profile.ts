"use server";

import { getUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";

const MAX_FILE_SIZE = 500 * 1024; // 500KB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

function resolveAvatarDir(): string {
  const dbUrl = process.env.DATABASE_URL || "";
  if (dbUrl.startsWith("file:/data/")) {
    return "/data/avatars";
  }
  return join(process.cwd(), "data", "avatars");
}

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

export async function updateAvatarAction(formData: FormData) {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  const file = formData.get("avatar") as File | null;
  if (!file) return { error: "No file provided" };

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Invalid file type. Use JPG, PNG, GIF, or WebP." };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { error: "File too large. Max 500KB." };
  }

  const avatarDir = resolveAvatarDir();
  const ext = EXT_MAP[file.type] || "jpg";

  // Ensure directory exists
  if (!existsSync(avatarDir)) {
    await mkdir(avatarDir, { recursive: true });
  }

  // Remove old avatar files (any extension)
  for (const oldExt of ["webp", "png", "jpg", "jpeg", "gif"]) {
    const oldPath = join(avatarDir, `${user.id}.${oldExt}`);
    if (existsSync(oldPath)) {
      await unlink(oldPath);
    }
  }

  // Write new file
  const buffer = Buffer.from(await file.arrayBuffer());
  const filePath = join(avatarDir, `${user.id}.${ext}`);
  await writeFile(filePath, buffer);

  // Update DB with avatar URL (cache-bust with timestamp)
  const avatarUrl = `/api/avatar?u=${user.username}&t=${Date.now()}`;
  await db.update(users)
    .set({ avatarUrl })
    .where(eq(users.id, user.id));

  revalidatePath("/profile");
  revalidatePath(`/user/${user.username}`);
  return { success: true, avatarUrl };
}
