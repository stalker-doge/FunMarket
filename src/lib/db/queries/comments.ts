import { db } from "@/lib/db";
import { comments, users } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function getCommentsByMarket(marketId: number, limit: number = 50, offset: number = 0) {
  const countResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(comments)
    .where(eq(comments.marketId, marketId))
    .get();

  const rows = await db
    .select({
      id: comments.id,
      marketId: comments.marketId,
      userId: comments.userId,
      parentId: comments.parentId,
      content: comments.content,
      createdAt: comments.createdAt,
      userName: users.displayName,
      userUsername: users.username,
      userEmail: users.email,
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.marketId, marketId))
    .orderBy(desc(comments.createdAt))
    .limit(limit)
    .offset(offset)
    .all();

  return { comments: rows, total: countResult?.count ?? 0 };
}

export async function createComment(userId: number, marketId: number, content: string, parentId?: number) {
  return db.insert(comments).values({
    userId,
    marketId,
    content,
    parentId: parentId || null,
  });
}

export async function deleteComment(commentId: number, userId: number) {
  const comment = await db.select().from(comments).where(eq(comments.id, commentId)).get();
  if (!comment) throw new Error("Comment not found");
  if (comment.userId !== userId) throw new Error("Only the author can delete comments");
  await db.delete(comments).where(eq(comments.id, commentId));
}
