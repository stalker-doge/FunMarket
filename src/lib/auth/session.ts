import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "./jwt";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await verifyToken(token);
    const result = await db.select().from(users).where(eq(users.id, payload.userId as number)).get();
    return result ?? null;
  } catch {
    return null;
  }
}
