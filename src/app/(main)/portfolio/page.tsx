import { getUser } from "@/lib/auth/session";
import { getUserHoldings } from "@/lib/db/queries/trades";
import { getMarketById, getOutcomesByMarket } from "@/lib/db/queries/markets";
import { getUserWatchlistIds } from "@/lib/db/queries/watchlist";
import { lmsrPrice, lmsrAllPrices } from "@/lib/market-engine/lmsr";
import { getCategoryMeta } from "@/lib/categories";
import { canClaimAllowance } from "@/lib/allowance";
import { formatMoney, cn } from "@/lib/utils";
import { AllowanceBanner } from "@/components/allowance-banner";
import { ExportButton } from "@/components/export-button";
import { Wallet, PieChart, TrendingUp, TrendingDown, Star } from "lucide-react";
import Link from "next/link";
import { plain } from "@/lib/db";

export default async function PortfolioPage() {
  const user = await getUser();
  if (!user) return null;

  const holdings = await getUserHoldings(user.id);

  const enriched = await Promise.all(holdings.map(async (h) => {
    const market = await getMarketById(h.marketId);
    const allOutcomes = await getOutcomesByMarket(h.marketId);
    const outcome = allOutcomes.find((o) => o.id === h.outcomeId);
    if (!market || !outcome) return null;

    let currentValue = 0;
    if (market.status === "open") {
      const sharesArray = allOutcomes.map((o) => o.sharesOutstanding);
      const outcomeIndex = allOutcomes.findIndex((o) => o.id === h.outcomeId);
      const price = lmsrPrice(sharesArray, market.liquidityParam, outcomeIndex);
      currentValue = h.totalShares * price;
    } else if (market.status === "resolved") {
      currentValue = market.resolutionOutcomeId === h.outcomeId ? h.totalShares : 0;
    }

    const pnl = currentValue - h.totalCost;

    return {
      marketId: h.marketId,
      marketQuestion: market.question,
      marketStatus: market.status,
      outcomeId: h.outcomeId,
      outcomeLabel: outcome.label,
      outcomeColor: outcome.color || "#8b5cf6",
      shares: h.totalShares,
      avgPrice: h.avgPrice,
      totalCost: h.totalCost,
      currentValue,
      pnl,
    };
  }));

  const validHoldings = enriched.filter(Boolean) as NonNullable<typeof enriched[number]>[];
  const totalUnrealized = validHoldings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalPnl = validHoldings.reduce((sum, h) => sum + h.pnl, 0);
  const netWorth = user.balance + totalUnrealized;
  const canClaim = canClaimAllowance(user.lastAllowance);

  // Fetch watchlist
  const watchlistIds = await getUserWatchlistIds(user.id);
  const watchedMarkets = await Promise.all(
    Array.from(watchlistIds).map(async (id) => {
      const market = await getMarketById(id);
      if (!market) return null;
      const outcomes = await getOutcomesByMarket(id);
      const shares = outcomes.map((o) => o.sharesOutstanding);
      const prices = lmsrAllPrices(shares, market.liquidityParam);
      const cat = getCategoryMeta(market.category ?? "other");
      return plain({
        id: market.id,
        question: market.question,
        status: market.status,
        resolutionOutcomeId: market.resolutionOutcomeId,
        category: market.category,
        outcomes: outcomes.map((o, i) => ({
          id: o.id,
          label: o.label,
          color: o.color,
          price: prices[i],
        })),
        catColor: cat.color,
        catLabel: cat.label,
      });
    })
  );
  const validWatched = watchedMarkets.filter(Boolean) as NonNullable<typeof watchedMarkets[number]>[];

  return (
    <div className="space-y-6">
      {canClaim && <AllowanceBanner canClaim={canClaim} />}

      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              Portfolio
            </h1>
            <p className="text-muted-foreground mt-1">Track your investments and performance</p>
          </div>
          <ExportButton />
        </div>
      </div>

      {/* Premium summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="group relative rounded-2xl border border-border bg-card p-5 overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors duration-300" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wallet className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Balance</span>
            </div>
            <div className="text-2xl font-bold font-mono">{formatMoney(user.balance)}</div>
          </div>
        </div>

        <div className="group relative rounded-2xl border border-border bg-card p-5 overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-500/10 transition-colors duration-300" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <PieChart className="h-4 w-4 text-purple-500" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Net Worth</span>
            </div>
            <div className="text-2xl font-bold font-mono">{formatMoney(netWorth)}</div>
          </div>
        </div>

        <div className="group relative rounded-2xl border border-border bg-card p-5 overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/10 transition-colors duration-300" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Invested</span>
            </div>
            <div className="text-2xl font-bold font-mono">
              {formatMoney(validHoldings.reduce((s, h) => s + h.totalCost, 0))}
            </div>
          </div>
        </div>

        <div className={cn(
          "group relative rounded-2xl border bg-card p-5 overflow-hidden transition-all duration-300 hover:shadow-xl",
          totalPnl >= 0 ? "border-success/30 hover:shadow-success/10" : "border-danger/30 hover:shadow-danger/10"
        )}>
          <div className={cn(
            "absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:opacity-100 transition-opacity duration-300",
            totalPnl >= 0 ? "bg-success/5" : "bg-danger/5"
          )} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center",
                totalPnl >= 0 ? "bg-success/10" : "bg-danger/10"
              )}>
                {totalPnl >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-success" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-danger" />
                )}
              </div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total P/L</span>
            </div>
            <div className={cn("text-2xl font-bold font-mono", totalPnl >= 0 ? "text-success" : "text-danger")}>
              {totalPnl >= 0 ? "+" : ""}{formatMoney(totalPnl)}
            </div>
          </div>
        </div>
      </div>

      {/* Watchlist */}
      {validWatched.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            Watchlist
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {validWatched.map((m) => (
              <Link key={m.id} href={`/markets/${m.id}`}>
                <div className="group rounded-2xl border border-border bg-card p-4 transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2">
                      {m.question}
                    </h3>
                    <span className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold",
                      m.status === "open" ? "bg-primary/10 text-primary" : "bg-success/10 text-success"
                    )}>
                      {m.status === "open" ? "Open" : "Resolved"}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {m.outcomes.slice(0, 3).map((o: { id: number; label: string; color: string | null; price: number }) => (
                      <div key={o.id} className="flex items-center gap-2 text-xs">
                        <div
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: o.color || "#8b5cf6" }}
                        />
                        <span className="text-muted-foreground truncate">{o.label}</span>
                        <span className="ml-auto font-mono font-medium">{(o.price * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                    {m.outcomes.length > 3 && (
                      <span className="text-xs text-muted-foreground">+{m.outcomes.length - 3} more</span>
                    )}
                  </div>
                  <div className="mt-3 pt-2 border-t border-border/50">
                    <span
                      className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold border"
                      style={{
                        color: m.catColor,
                        borderColor: `${m.catColor}40`,
                        backgroundColor: `${m.catColor}10`,
                      }}
                    >
                      {m.catLabel}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Holdings table */}
      {validHoldings.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-16 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
            <PieChart className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground mb-2 text-lg">No holdings yet</p>
          <p className="text-sm text-muted-foreground mb-6">Start trading to build your portfolio</p>
          <Link
            href="/markets"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-purple-500 px-6 py-3 text-sm font-semibold text-white hover:shadow-lg hover:shadow-primary/30 transition-all duration-300"
          >
            Browse Markets
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-5 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Market</th>
                  <th className="px-5 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Outcome</th>
                  <th className="px-5 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Shares</th>
                  <th className="px-5 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Avg Price</th>
                  <th className="px-5 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Value</th>
                  <th className="px-5 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">P/L</th>
                </tr>
              </thead>
              <tbody>
                {validHoldings.map((h) => (
                  <tr key={`${h.marketId}-${h.outcomeId}`} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors duration-150">
                    <td className="px-5 py-4">
                      <Link href={`/markets/${h.marketId}`} className="font-medium hover:text-primary transition-colors duration-200">
                        {h.marketQuestion}
                      </Link>
                      {h.marketStatus === "resolved" && (
                        <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">
                          <div className="h-1 w-1 rounded-full bg-success" />
                          Resolved
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{
                            backgroundColor: h.outcomeColor,
                            boxShadow: `0 0 8px ${h.outcomeColor}40`,
                          }}
                        />
                        <span className="font-medium">{h.outcomeLabel}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right font-mono font-semibold">{h.shares.toFixed(1)}</td>
                    <td className="px-5 py-4 text-right font-mono text-muted-foreground">{h.avgPrice.toFixed(3)}</td>
                    <td className="px-5 py-4 text-right font-mono font-semibold">{h.currentValue.toFixed(1)}</td>
                    <td className={cn("px-5 py-4 text-right font-mono font-bold", h.pnl >= 0 ? "text-success" : "text-danger")}>
                      {h.pnl >= 0 ? "+" : ""}{h.pnl.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
