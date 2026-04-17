import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const AVATAR_DIR = process.env.AVATAR_DIR || join(process.cwd(), "data", "avatars");

function resolveAvatarDir(): string {
  // In Docker, DATABASE_URL is file:/data/funmarket.db -> avatars go in /data/avatars
  const dbUrl = process.env.DATABASE_URL || "";
  if (dbUrl.startsWith("file:/data/")) {
    return "/data/avatars";
  }
  return AVATAR_DIR;
}

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("u");
  if (!username) {
    return NextResponse.json({ error: "Missing username" }, { status: 400 });
  }

  const user = await db.select({ id: users.id, avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.username, username))
    .get();

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const avatarDir = resolveAvatarDir();

  // Try common extensions
  for (const ext of ["webp", "png", "jpg", "jpeg", "gif"]) {
    const filePath = join(avatarDir, `${user.id}.${ext}`);
    if (existsSync(filePath)) {
      const buffer = await readFile(filePath);
      const mimeMap: Record<string, string> = {
        webp: "image/webp",
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        gif: "image/gif",
      };
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": mimeMap[ext] || "image/jpeg",
          "Cache-Control": "public, max-age=60",
        },
      });
    }
  }

  return NextResponse.json({ error: "No avatar" }, { status: 404 });
}
