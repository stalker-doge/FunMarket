"use client";

import { useState, useTransition } from "react";
import { toggleWatchlistAction } from "@/actions/watchlist";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface WatchlistButtonProps {
  marketId: number;
  isWatched: boolean;
}

export function WatchlistButton({ marketId, isWatched: initial }: WatchlistButtonProps) {
  const [isWatched, setIsWatched] = useState(initial);
  const [isPending, startTransition] = useTransition();

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      const result = await toggleWatchlistAction(marketId);
      if (result.success) {
        setIsWatched(result.watched);
      }
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className={cn(
        "h-8 w-8 rounded-lg border flex items-center justify-center transition-all duration-200",
        isWatched
          ? "border-warning/50 bg-warning/10 text-warning hover:bg-warning/20"
          : "border-border bg-muted/30 text-muted-foreground hover:text-warning hover:border-warning/30"
      )}
    >
      <Star
        className={cn("h-4 w-4 transition-all", isWatched && "fill-warning")}
      />
    </button>
  );
}
