"use client";

import { useState, useTransition } from "react";
import { resolveMarketAction } from "./resolve-action";
import { cn } from "@/lib/utils";

interface ResolveButtonProps {
  outcomes: {
    id: number;
    label: string;
    color: string | null;
  }[];
  marketId: number;
}

export function ResolveButton({ outcomes, marketId }: ResolveButtonProps) {
  const [selectedOutcome, setSelectedOutcome] = useState<number | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleResolve() {
    if (!selectedOutcome) return;

    if (!confirming) {
      setConfirming(true);
      return;
    }

    startTransition(async () => {
      const result = await resolveMarketAction(marketId, selectedOutcome, resolutionNotes.trim() || undefined);
      if (result.error) {
        setError(result.error);
        setConfirming(false);
      }
    });
  }

  return (
    <div className="rounded-2xl border border-warning/30 bg-warning/5 p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-warning via-orange-500 to-warning" />
      <h2 className="font-bold text-lg mb-3 text-warning flex items-center gap-2">
        <div className="h-5 w-1 rounded-full bg-gradient-to-b from-warning to-orange-500" />
        Resolve Market
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        Select the winning outcome. This cannot be undone.
      </p>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {outcomes.map((outcome) => (
          <button
            key={outcome.id}
            onClick={() => {
              setSelectedOutcome(outcome.id);
              setConfirming(false);
            }}
            className={cn(
              "group relative rounded-xl border p-3 text-left transition-all duration-300 overflow-hidden",
              selectedOutcome === outcome.id
                ? "border-warning/50 bg-warning/10 shadow-lg shadow-warning/20 ring-2 ring-warning/30"
                : "border-border hover:border-warning/30 hover:bg-muted/30"
            )}
          >
            <div className="relative flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full transition-transform duration-300 group-hover:scale-125"
                style={{
                  backgroundColor: outcome.color || "#8b5cf6",
                  boxShadow: `0 0 12px ${(outcome.color || "#8b5cf6")}40`,
                }}
              />
              <span className="font-semibold text-sm">{outcome.label}</span>
            </div>
          </button>
        ))}
      </div>
      {selectedOutcome && (
        <>
          <div className="mb-4">
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
              Resolution Notes (optional)
            </label>
            <textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              rows={2}
              placeholder="Add context or evidence for this resolution..."
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 resize-none"
            />
          </div>
          <button
            onClick={handleResolve}
            disabled={isPending}
            className={cn(
              "group relative w-full rounded-xl py-3 text-sm font-bold text-white transition-all duration-300 overflow-hidden",
              confirming
                ? "bg-gradient-to-r from-red-600 to-red-700 hover:shadow-lg hover:shadow-red-600/30"
                : "bg-gradient-to-r from-warning to-orange-500 hover:shadow-lg hover:shadow-warning/30"
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <span className="relative">
              {isPending
                ? "Resolving..."
                : confirming
                ? "Confirm: Resolve Market"
                : "Resolve Market"}
            </span>
          </button>
        </>
      )}
      {confirming && (
        <p className="text-xs text-danger mt-2 text-center">
          Click again to confirm. This pays out winning shares.
        </p>
      )}
      {error && (
        <p className="text-sm text-danger mt-2 text-center">{error}</p>
      )}
    </div>
  );
}
