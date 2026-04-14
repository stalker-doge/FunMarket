import { db } from "@/lib/db";
import { activityLog, users, markets } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function logActivity(opts: {
  type: string;
  userId: number;
  marketId?: number;
  data?: Record<string, unknown>;
}) {
  return db.insert(activityLog).values({
    type: opts.type,
    userId: opts.userId,
    marketId: opts.marketId || null,
    data: opts.data ? JSON.stringify(opts.data) : null,
  });
}

export async function getRecentActivity(limit: number = 20, offset: number = 0) {
  return db
    .select({
      id: activityLog.id,
      type: activityLog.type,
      data: activityLog.data,
      createdAt: activityLog.createdAt,
      userName: users.displayName,
      userUsername: users.username,
      userEmail: users.email,
      marketQuestion: markets.question,
      marketId: activityLog.marketId,
    })
    .from(activityLog)
    .innerJoin(users, eq(activityLog.userId, users.id))
    .leftJoin(markets, eq(activityLog.marketId, markets.id))
    .orderBy(desc(activityLog.createdAt))
    .limit(limit)
    .offset(offset)
    .all();
}
