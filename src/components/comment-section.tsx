"use client";

import { useState, useTransition } from "react";
import { createCommentAction, deleteCommentAction } from "@/actions/comments";
import { cn } from "@/lib/utils";
import { getAvatarUrl } from "@/lib/gravatar";
import Link from "next/link";
import { MessageSquare, Reply, Trash2, Send } from "lucide-react";

interface Comment {
  id: number;
  marketId: number;
  userId: number;
  parentId: number | null;
  content: string;
  createdAt: string;
  userName: string;
  userUsername: string | null;
  userEmail: string | null;
}

interface CommentSectionProps {
  marketId: number;
  comments: Comment[];
  currentUserId: number;
}

function timeAgo(dateStr: string) {
  const now = new Date();
  // SQLite datetime('now') stores UTC without timezone suffix — append Z to parse as UTC
  const date = new Date(dateStr.endsWith("Z") ? dateStr : dateStr + "Z");
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function CommentItem({ comment, currentUserId, marketId, onReply }: {
  comment: Comment;
  currentUserId: number;
  marketId: number;
  onReply: (parentId: number, userName: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const isAuthor = comment.userId === currentUserId;
  const avatarUrl = getAvatarUrl(comment.userEmail || "");

  return (
    <div className="group">
      <div className="flex gap-3">
        <img
          src={avatarUrl}
          alt=""
          className="h-8 w-8 rounded-full shrink-0 mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {comment.userUsername ? (
              <Link
                href={`/user/${comment.userUsername}`}
                className="text-sm font-semibold hover:text-primary transition-colors"
              >
                {comment.userName}
              </Link>
            ) : (
              <span className="text-sm font-semibold">{comment.userName}</span>
            )}
            <span className="text-xs text-muted-foreground">{timeAgo(comment.createdAt)}</span>
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {comment.content}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => onReply(comment.id, comment.userName)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              <Reply className="h-3 w-3" />
              Reply
            </button>
            {isAuthor && (
              <button
                onClick={() => startTransition(async () => {
                  await deleteCommentAction(comment.id, marketId);
                })}
                disabled={isPending}
                className="text-xs text-muted-foreground hover:text-danger transition-colors inline-flex items-center gap-1 opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CommentSection({ marketId, comments, currentUserId }: CommentSectionProps) {
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: number; name: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Split into top-level and replies
  const topLevel = comments.filter((c) => !c.parentId);
  const repliesMap: Record<number, Comment[]> = {};
  for (const c of comments) {
    if (c.parentId) {
      if (!repliesMap[c.parentId]) repliesMap[c.parentId] = [];
      repliesMap[c.parentId].push(c);
    }
  }

  function handleSubmit() {
    if (!content.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await createCommentAction(marketId, content, replyTo?.id);
      if (result?.error) {
        setError(result.error);
      } else {
        setContent("");
        setReplyTo(null);
      }
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-lg relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-purple-500 to-primary" />
      <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
        <div className="h-5 w-1 rounded-full bg-gradient-to-b from-primary to-purple-500" />
        <MessageSquare className="h-5 w-5 text-primary" />
        Discussion
        {comments.length > 0 && (
          <span className="text-sm font-normal text-muted-foreground">({comments.length})</span>
        )}
      </h2>

      {/* Input form */}
      <div className="mb-6">
        {replyTo && (
          <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
            <Reply className="h-3 w-3" />
            Replying to <span className="font-medium text-foreground">{replyTo.name}</span>
            <button
              onClick={() => setReplyTo(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              &times;
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={replyTo ? `Reply to ${replyTo.name}...` : "Share your thoughts..."}
            rows={2}
            className="flex-1 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                handleSubmit();
              }
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={isPending || !content.trim()}
            className="shrink-0 self-end rounded-xl bg-gradient-to-r from-primary to-purple-500 px-4 py-3 text-white hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        {error && (
          <p className="text-xs text-danger mt-2">{error}</p>
        )}
      </div>

      {/* Comment list */}
      {topLevel.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          No comments yet. Start the discussion!
        </p>
      ) : (
        <div className="space-y-5">
          {topLevel.map((comment) => (
            <div key={comment.id}>
              <CommentItem
                comment={comment}
                currentUserId={currentUserId}
                marketId={marketId}
                onReply={(id, name) => setReplyTo({ id, name })}
              />
              {/* Replies */}
              {repliesMap[comment.id] && (
                <div className="ml-11 mt-3 pl-4 border-l-2 border-border space-y-4">
                  {repliesMap[comment.id].map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      currentUserId={currentUserId}
                      marketId={marketId}
                      onReply={(id, name) => setReplyTo({ id, name })}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
