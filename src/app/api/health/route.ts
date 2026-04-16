import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    await db.select({ count: sql<number>`1` }).from(users).limit(1).get();
    return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
  } catch {
    return NextResponse.json({ status: "error", timestamp: new Date().toISOString() }, { status: 503 });
  }
}
