"use client";

import Link from "next/link";
import Image from "next/image";
import { OutcomeBar } from "./outcome-bar";
import { lmsrAllPrices } from "@/lib/market-engine/lmsr";
import { getCategoryMeta } from "@/lib/categories";
import { cn } from "@/lib/utils";

interface MarketCardProps {
  id: number;
  question: string;
  description: string | null;
  category?: string;
  imageUrl?: string | null;
  creatorName: string;
  creatorUsername?: string;
  status: string;
  resolutionOutcomeId: number | null;
  isWatched?: boolean;
  outcomes: {
    id: number;
    label: string;
    color: string | null;
    sharesOutstanding: number;
  }[];
  liquidityParam: number;
}

export function MarketCard({
  id,
  question,
  description,
  category,
  imageUrl,
  creatorName,
  creatorUsername,
  status,
  resolutionOutcomeId,
  isWatched,
  outcomes,
  liquidityParam,
}: MarketCardProps) {
  const shares = outcomes.map((o) => o.sharesOutstanding);
  const prices = lmsrAllPrices(shares, liquidityParam);
  const isResolved = status === "resolved";
  const cat = getCategoryMeta(category ?? "other");

  return (
    <Link href={`/markets/${id}`}>
      <div className="group relative rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1">
        {/* Image thumbnail */}
        {imageUrl && (
          <div className="h-32 w-full overflow-hidden bg-muted/30 relative">
            <Image src={imageUrl} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
          </div>
        )}

        <div className="p-5">
          <div className="relative">
            <div className="flex items-start justify-between gap-2 mb-3">
              <h3 className="font-semibold leading-tight text-base group-hover:text-primary transition-colors duration-200">
                {question}
              </h3>
              <div className="flex items-center gap-1.5 shrink-0">
                {isResolved && (
                  <span className="rounded-full bg-success/10 border border-success/30 px-2.5 py-1 text-xs font-semibold text-success flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                    Resolved
                  </span>
                )}
                {status === "open" && (
                  <span className="rounded-full bg-primary/10 border border-primary/30 px-2.5 py-1 text-xs font-semibold text-primary">
                    Open
                  </span>
                )}
              </div>
            </div>
            {description && (
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
                {description}
              </p>
            )}
            <div className="space-y-2.5">
              {outcomes.map((outcome, i) => (
                <OutcomeBar
                  key={outcome.id}
                  label={outcome.label}
                  probability={prices[i]}
                  color={outcome.color || "#8b5cf6"}
                  resolved={isResolved}
                  isWinner={resolutionOutcomeId === outcome.id}
                />
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold border"
                  style={{
                    color: cat.color,
                    borderColor: `${cat.color}40`,
                    backgroundColor: `${cat.color}10`,
                  }}
                >
                  {cat.label}
                </span>
                <span>
                  by{" "}
                  {creatorUsername ? (
                    <Link
                      href={`/user/${creatorUsername}`}
                      onClick={(e) => e.stopPropagation()}
                      className="font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {creatorName}
                    </Link>
                  ) : (
                    <span className="font-medium text-foreground">{creatorName}</span>
                  )}
                </span>
              </div>
              <span>
                {outcomes.length} outcome{outcomes.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
