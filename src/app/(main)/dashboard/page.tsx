import { getUser } from "@/lib/auth/session";
import { getUserHoldings } from "@/lib/db/queries/trades";
import { getMarketById, getOutcomesByMarket, searchMarkets } from "@/lib/db/queries/markets";
import { getUserWatchlistIds } from "@/lib/db/queries/watchlist";
import { getRecentActivity } from "@/lib/db/queries/activity";
import { canClaimAllowance } from "@/lib/allowance";
import { lmsrPrice, lmsrAllPrices } from "@/lib/market-engine/lmsr";
import { formatMoney } from "@/lib/utils";
import { AllowanceBanner } from "@/components/allowance-banner";
import { ActivityFeed } from "@/components/activity-feed";
import { OnboardingOverlay } from "@/components/onboarding-overlay";
import { plain } from "@/lib/db";
import Link from "next/link";
import {
  Wallet, TrendingUp, TrendingDown, BarChart3,
  Plus, ArrowRight, Star, Eye,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard - FunMarket",
  description: "Your FunMarket dashboard with portfolio overview, trending markets, and recent activity.",
};

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) return null;
  const safeUser = plain(user);

  // User holdings
  const holdings = await getUserHoldings(user.id);
  let totalUnrealized = 0;
  const activePositions: {
    marketId: number;
    question: string;
    outcomeLabel: string;
    outcomeColor: string;
    shares: number;
    currentValue: number;
    price: number;
  }[] = [];

  for (const h of holdings.slice(0, 5)) {
    const market = await getMarketById(h.marketId);
    const allOutcomes = await getOutcomesByMarket(h.marketId);
    const outcome = allOutcomes.find((o) => o.id === h.outcomeId);
    if (!market || !outcome) continue;

    let currentValue = 0;
    let price = 0;
    if (market.status === "open") {
      const sharesArray = allOutcomes.map((o) => o.sharesOutstanding);
      const outcomeIndex = allOutcomes.findIndex((o) => o.id === h.outcomeId);
      price = lmsrPrice(sharesArray, market.liquidityParam, outcomeIndex);
      currentValue = h.totalShares * price;
    } else if (market.status === "resolved" && market.resolutionOutcomeId === h.outcomeId) {
      currentValue = h.totalShares;
      price = 1;
    }
    totalUnrealized += currentValue;

    activePositions.push({
      marketId: h.marketId,
      question: market.question,
      outcomeLabel: outcome.label,
      outcomeColor: outcome.color || "#8b5cf6",
      shares: h.totalShares,
      currentValue,
      price,
    });
  }

  const netWorth = safeUser.balance + totalUnrealized;
  const totalInvested = holdings.reduce((sum, h) => sum + h.totalCost, 0);
  const canClaim = canClaimAllowance(safeUser.lastAllowance);

  // Trending markets
  const { markets: trendingMarkets } = await searchMarkets({
    sort: "most_traded",
    limit: 4,
  });

  const enrichedTrending = await Promise.all(
    trendingMarkets.map(async (m) => {
      const outcomes = await getOutcomesByMarket(m.id);
      const shares = outcomes.map((o) => o.sharesOutstanding);
      const prices = lmsrAllPrices(shares, 100);
      return { ...m, outcomes: outcomes.map((o, i) => ({ ...o, price: prices[i] })) };
    })
  );

  // Watchlist preview
  const watchlistIds = await getUserWatchlistIds(user.id);
  const watchedMarkets = await Promise.all(
    Array.from(watchlistIds).slice(0, 3).map(async (id) => {
      const market = await getMarketById(id);
      if (!market) return null;
      return { id: market.id, question: market.question, status: market.status };
    })
  );
  const validWatched = watchedMarkets.filter(Boolean) as NonNullable<typeof watchedMarkets[number]>[];

  // Recent activity
  const recentActivity = plain(await getRecentActivity(5));

  return (
    <>
      {!safeUser.onboardingCompleted && <OnboardingOverlay />}
      <div className="space-y-6">
      {canClaim && <AllowanceBanner canClaim={canClaim} />}

      {/* Welcome header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            Welcome back, {safeUser.displayName}
          </h1>
          <p className="text-muted-foreground mt-1">Here's your market overview</p>
        </div>
        <Link
          href="/markets/new"
          className="hidden sm:inline-flex group items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-purple-500 px-5 py-2.5 text-sm font-semibold text-white hover:shadow-lg hover:shadow-primary/30 transition-all duration-300"
        >
          <Plus className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
          New Market
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border bg-card p-5 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wallet className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xs font-semibold text-muted-foreground uppercase">Balance</span>
          </div>
          <div className="text-2xl font-bold font-mono">{formatMoney(safeUser.balance)}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </div>
            <span className="text-xs font-semibold text-muted-foreground uppercase">Net Worth</span>
          </div>
          <div className="text-2xl font-bold font-mono">{formatMoney(netWorth)}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-blue-500" />
            </div>
            <span className="text-xs font-semibold text-muted-foreground uppercase">Positions</span>
          </div>
          <div className="text-2xl font-bold">{activePositions.length}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <span className="text-xs font-semibold text-muted-foreground uppercase">Invested</span>
          </div>
          <div className="text-2xl font-bold font-mono">{formatMoney(totalInvested)}</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Active Positions */}
        <div className="rounded-2xl border border-border bg-card p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-purple-500 to-primary" />
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <div className="h-5 w-1 rounded-full bg-gradient-to-b from-primary to-purple-500" />
              Active Positions
            </h2>
            {activePositions.length > 0 && (
              <Link href="/portfolio" className="text-xs text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
          {activePositions.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-3">No active positions yet</p>
              <Link href="/markets" className="text-sm text-primary hover:underline">Browse markets</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {activePositions.map((pos, i) => (
                <Link key={i} href={`/markets/${pos.marketId}`}>
                  <div className="rounded-xl bg-muted/30 p-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: pos.outcomeColor }} />
                      <div className="min-w-0">
                        <div className="text-sm font-medium line-clamp-1">{pos.question}</div>
                        <div className="text-xs text-muted-foreground">{pos.outcomeLabel} &middot; {pos.shares.toFixed(1)} shares</div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <div className="text-sm font-mono font-semibold">{pos.currentValue.toFixed(1)} FB</div>
                      <div className="text-xs text-muted-foreground">{(pos.price * 100).toFixed(0)}% probability</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Trending Markets */}
        <div className="rounded-2xl border border-border bg-card p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-purple-500 to-primary" />
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <div className="h-5 w-1 rounded-full bg-gradient-to-b from-primary to-purple-500" />
              Trending Markets
            </h2>
            <Link href="/markets" className="text-xs text-primary hover:underline flex items-center gap-1">
              Browse all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {enrichedTrending.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-3">No markets yet</p>
              <Link href="/markets/new" className="text-sm text-primary hover:underline">Create one</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {enrichedTrending.map((m) => (
                <Link key={m.id} href={`/markets/${m.id}`}>
                  <div className="rounded-xl bg-muted/30 p-3 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-sm font-medium line-clamp-1">{m.question}</h3>
                      <span className="shrink-0 text-xs text-primary font-medium">
                        {m.status === "open" ? "Open" : "Resolved"}
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      {m.outcomes.slice(0, 4).map((o: { id: number; label: string; color: string | null; price: number }) => (
                        <div
                          key={o.id}
                          className="flex-1 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{
                            backgroundColor: o.color || "#8b5cf6",
                            width: `${Math.max(o.price * 100, 10)}%`,
                          }}
                        >
                          {(o.price * 100).toFixed(0)}
                        </div>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Watchlist */}
        {validWatched.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                Watchlist
              </h2>
              <Link href="/portfolio" className="text-xs text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {validWatched.map((m) => (
                <Link key={m.id} href={`/markets/${m.id}`}>
                  <div className="rounded-lg bg-muted/30 p-3 hover:bg-muted/50 transition-colors flex items-center justify-between">
                    <span className="text-sm font-medium line-clamp-1">{m.question}</span>
                    <span className={m.status === "open" ? "text-xs text-primary" : "text-xs text-success"}>
                      {m.status === "open" ? "Open" : "Resolved"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className={validWatched.length > 0 ? "" : "lg:col-span-2"}>
          <div className="rounded-2xl border border-border bg-card p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-purple-500 to-primary" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <div className="h-5 w-1 rounded-full bg-gradient-to-b from-primary to-purple-500" />
                Recent Activity
              </h2>
              <Link href="/activity" className="text-xs text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <ActivityFeed activities={recentActivity} />
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
