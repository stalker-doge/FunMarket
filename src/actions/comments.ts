"use server";

import { getUser } from "@/lib/auth/session";
import { createComment, deleteComment } from "@/lib/db/queries/comments";
import { revalidatePath } from "next/cache";

export async function createCommentAction(marketId: number, content: string, parentId?: number) {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  const trimmed = content.trim();
  if (!trimmed) return { error: "Comment cannot be empty" };
  if (trimmed.length > 1000) return { error: "Comment too long (max 1000 characters)" };

  try {
    await createComment(user.id, marketId, trimmed, parentId);
    revalidatePath(`/markets/${marketId}`);
    return { success: true };
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }
}

export async function deleteCommentAction(commentId: number, marketId: number) {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  try {
    await deleteComment(commentId, user.id);
    revalidatePath(`/markets/${marketId}`);
    return { success: true };
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }
}
