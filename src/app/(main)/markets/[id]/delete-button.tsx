"use client";

import { useState, useTransition } from "react";
import { deleteMarketAction } from "@/actions/markets";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeleteButtonProps {
  marketId: number;
}

export function DeleteButton({ marketId }: DeleteButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    if (!confirming) {
      setConfirming(true);
      return;
    }

    startTransition(async () => {
      const result = await deleteMarketAction(marketId);
      if (result?.error) {
        setError(result.error);
        setConfirming(false);
      }
    });
  }

  return (
    <div className="rounded-2xl border border-danger/30 bg-danger/5 p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-danger via-red-500 to-danger" />
      <h2 className="font-bold text-lg mb-3 text-danger flex items-center gap-2">
        <div className="h-5 w-1 rounded-full bg-gradient-to-b from-danger to-red-500" />
        Delete Market
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        This will permanently delete this market and all associated data (trades, comments, outcomes). This cannot be undone.
      </p>
      <button
        onClick={handleDelete}
        disabled={isPending}
        className={cn(
          "group relative w-full rounded-xl py-3 text-sm font-bold text-white transition-all duration-300 overflow-hidden",
          confirming
            ? "bg-gradient-to-r from-red-600 to-red-700 hover:shadow-lg hover:shadow-red-600/30"
            : "bg-gradient-to-r from-danger to-red-500 hover:shadow-lg hover:shadow-danger/30"
        )}
      >
        <span className="relative flex items-center justify-center gap-2">
          {isPending ? (
            <>
              <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Deleting...
            </>
          ) : confirming ? (
            <>
              <Trash2 className="h-4 w-4" />
              Confirm: Delete Market
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4" />
              Delete Market
            </>
          )}
        </span>
      </button>
      {confirming && !isPending && (
        <p className="text-xs text-danger mt-2 text-center">
          Click again to confirm. All data will be permanently removed.
        </p>
      )}
      {error && (
        <p className="text-sm text-danger mt-2 text-center">{error}</p>
      )}
    </div>
  );
}
