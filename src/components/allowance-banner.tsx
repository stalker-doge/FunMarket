"use client";

import { useState, useTransition } from "react";
import { claimAllowanceAction } from "@/actions/allowance";
import { formatMoney } from "@/lib/utils";
import { Gift, Sparkles } from "lucide-react";

export function AllowanceBanner({ canClaim }: { canClaim: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [claimed, setClaimed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canClaim && !claimed) return null;

  function handleClaim() {
    startTransition(async () => {
      const result = await claimAllowanceAction();
      if (result.success) {
        setClaimed(true);
      } else {
        setError(result.error ?? "Error");
      }
    });
  }

  if (claimed) {
    return (
      <div className="rounded-2xl bg-gradient-to-r from-success/10 via-emerald-500/10 to-success/10 border border-success/30 p-5 relative overflow-hidden">
        <div className="relative flex items-center justify-center gap-3">
          <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-success" />
          </div>
          <div>
            <p className="text-sm font-bold text-success">Daily Allowance Claimed!</p>
            <p className="text-xs text-success/80">Check your portfolio for your new balance</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 border border-primary/30 p-5 relative overflow-hidden">
      <div className="relative flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-lg shadow-primary/30">
            <Gift className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-base font-bold text-foreground">Daily Allowance Available!</p>
            <p className="text-sm text-muted-foreground">
              Claim <span className="font-mono font-bold text-primary">{formatMoney(1000)}</span> to keep betting
            </p>
          </div>
        </div>
        <button
          onClick={handleClaim}
          disabled={isPending}
          className="group shrink-0 rounded-xl bg-gradient-to-r from-primary to-purple-500 px-6 py-3 text-sm font-bold text-white hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          <span className="relative flex items-center gap-2">
            {isPending ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Claiming...
              </>
            ) : (
              <>
                Claim Now
                <Sparkles className="h-4 w-4" />
              </>
            )}
          </span>
        </button>
      </div>
      {error && (
        <div className="relative mt-3 text-sm text-danger font-medium flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-danger" />
          {error}
        </div>
      )}
    </div>
  );
}
