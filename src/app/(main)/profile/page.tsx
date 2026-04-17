import { getUser } from "@/lib/auth/session";
import { getUserHoldings, getRecentTrades } from "@/lib/db/queries/trades";
import { getMarketById, getOutcomesByMarket } from "@/lib/db/queries/markets";
import { lmsrPrice } from "@/lib/market-engine/lmsr";
import { canClaimAllowance } from "@/lib/allowance";
import { formatMoney, cn } from "@/lib/utils";
import { getAvatarUrl } from "@/lib/gravatar";
import { AllowanceBanner } from "@/components/allowance-banner";
import { AchievementsDisplay } from "@/components/achievements-display";
import { AvatarUpload } from "@/components/avatar-upload";
import { ExportButton } from "@/components/export-button";
import { ProfileEditor } from "@/components/profile-editor";
import { plain } from "@/lib/db";
import {
  Wallet, TrendingUp, Calendar, BarChart3,
  Mail, User, ArrowUpRight, ArrowDownRight, Clock
} from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile - FunMarket",
  description: "View and manage your FunMarket profile, stats, and trade history.",
};

export default async function ProfilePage() {
  const user = await getUser();
  if (!user) return null;

  const safeUser = plain(user);
  const canClaim = canClaimAllowance(safeUser.lastAllowance);

  const holdings = await getUserHoldings(safeUser.id);
  const recentTrades = await getRecentTrades(safeUser.id, 15);

  let totalInvested = 0;
  let totalUnrealized = 0;
  let marketsTraded = new Set<number>();

  // Enriched holdings with market/outcome info
  const enrichedHoldings = [];
  for (const h of holdings) {
    totalInvested += h.totalCost;
    marketsTraded.add(h.marketId);
    const market = await getMarketById(h.marketId);
    if (!market) continue;
    const allOutcomes = await getOutcomesByMarket(h.marketId);
    const sharesArray = allOutcomes.map((o) => o.sharesOutstanding);
    const idx = allOutcomes.findIndex((o) => o.id === h.outcomeId);
    const outcome = allOutcomes[idx];
    if (idx < 0 || !outcome) continue;

    let currentValue = 0;
    if (market.status === "open") {
      const price = lmsrPrice(sharesArray, market.liquidityParam, idx);
      currentValue = h.totalShares * price;
      totalUnrealized += currentValue;
    }

    enrichedHoldings.push({
      outcomeId: h.outcomeId,
      marketId: h.marketId,
      shares: h.totalShares,
      avgPrice: h.avgPrice,
      totalCost: h.totalCost,
      currentValue,
      pnl: currentValue - h.totalCost,
      outcomeLabel: outcome.label,
      outcomeColor: outcome.color,
      marketQuestion: market.question,
      marketStatus: market.status,
    });
  }

  const netWorth = safeUser.balance + totalUnrealized;
  const totalPnl = totalUnrealized - totalInvested;

  return (
    <div className="space-y-6">
      {canClaim && <AllowanceBanner canClaim={canClaim} />}

      {/* Profile header */}
      <div className="rounded-2xl border border-border bg-card p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-purple-500 to-primary" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="relative">
            <AvatarUpload
              src={getAvatarUrl(safeUser.email, safeUser.avatarUrl, 96)}
              alt={safeUser.displayName}
              size={80}
            />
          </div>

          <div className="flex-1 min-w-0">
            <ProfileEditor displayName={safeUser.displayName} />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                @{safeUser.username}
              </span>
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {safeUser.email}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                Joined {safeUser.createdAt}
              </span>
            </div>
          </div>

          {/* Net worth callout */}
          <div className="hidden sm:block text-right">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Net Worth</div>
            <div className="text-2xl font-bold font-mono text-primary">{formatMoney(netWorth)}</div>
            {totalPnl !== 0 && (
              <div className={cn(
                "text-sm font-mono font-semibold mt-1 flex items-center justify-end gap-1",
                totalPnl >= 0 ? "text-success" : "text-danger"
              )}>
                {totalPnl >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                {totalPnl >= 0 ? "+" : ""}{formatMoney(totalPnl)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats grid */}
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
            <div className="text-2xl font-bold font-mono">{formatMoney(safeUser.balance)}</div>
          </div>
        </div>

        <div className="group relative rounded-2xl border border-border bg-card p-5 overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-500/10 transition-colors duration-300" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-purple-500" />
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
                <BarChart3 className="h-4 w-4 text-blue-500" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Invested</span>
            </div>
            <div className="text-2xl font-bold font-mono">{formatMoney(totalInvested)}</div>
          </div>
        </div>

        <div className="group relative rounded-2xl border border-border bg-card p-5 overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/10 transition-colors duration-300" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-emerald-500" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Markets</span>
            </div>
            <div className="text-2xl font-bold font-mono">{marketsTraded.size}</div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <div className="h-5 w-1 rounded-full bg-gradient-to-b from-amber-500 to-yellow-500" />
          Achievements
        </h2>
        <AchievementsDisplay />
      </div>

      {/* Active Holdings */}
      {enrichedHoldings.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <div className="h-5 w-1 rounded-full bg-gradient-to-b from-primary to-purple-500" />
            Active Positions
          </h2>
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Market</th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Outcome</th>
                    <th className="px-5 py-3.5 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Shares</th>
                    <th className="px-5 py-3.5 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Avg Price</th>
                    <th className="px-5 py-3.5 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Value</th>
                    <th className="px-5 py-3.5 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {enrichedHoldings.map((h) => (
                    <tr key={h.outcomeId} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors duration-150">
                      <td className="px-5 py-3.5 max-w-[200px]">
                        <Link
                          href={`/markets/${h.marketId}`}
                          className="font-medium hover:text-primary transition-colors truncate block"
                        >
                          {h.marketQuestion}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full shrink-0"
                            style={{
                              backgroundColor: h.outcomeColor || "#8b5cf6",
                              boxShadow: `0 0 8px ${(h.outcomeColor || "#8b5cf6")}40`,
                            }}
                          />
                          <span className="font-medium">{h.outcomeLabel}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono">{h.shares.toFixed(1)}</td>
                      <td className="px-5 py-3.5 text-right font-mono text-muted-foreground">{h.avgPrice.toFixed(2)}</td>
                      <td className="px-5 py-3.5 text-right font-mono font-semibold">
                        {h.marketStatus === "open"
                          ? formatMoney(h.currentValue)
                          : <span className="text-muted-foreground italic">resolved</span>
                        }
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-semibold">
                        {h.marketStatus === "open" ? (
                          <span className={h.pnl >= 0 ? "text-success" : "text-danger"}>
                            {h.pnl >= 0 ? "+" : ""}{formatMoney(h.pnl)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Recent Trades */}
      {recentTrades.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <div className="h-5 w-1 rounded-full bg-gradient-to-b from-blue-500 to-cyan-500" />
            Recent Trades
            <span className="ml-auto"><ExportButton /></span>
          </h2>
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider w-24">Type</th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Market</th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Outcome</th>
                    <th className="px-5 py-3.5 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Qty</th>
                    <th className="px-5 py-3.5 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Price</th>
                    <th className="px-5 py-3.5 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Total</th>
                    <th className="px-5 py-3.5 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider w-32">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTrades.map((t) => {
                    const isBuy = t.tradeType === "buy";
                    const qty = Math.abs(t.quantity);
                    return (
                      <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors duration-150">
                        <td className="px-5 py-3.5">
                          <span className={cn(
                            "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold",
                            isBuy
                              ? "bg-primary/10 text-primary border border-primary/20"
                              : "bg-warning/10 text-warning border border-warning/20"
                          )}>
                            {isBuy ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            {isBuy ? "BUY" : "SELL"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 max-w-[200px]">
                          <Link
                            href={`/markets/${t.marketId}`}
                            className="font-medium hover:text-primary transition-colors truncate block"
                          >
                            {t.marketQuestion}
                          </Link>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: t.outcomeColor || "#8b5cf6" }}
                            />
                            <span className="text-muted-foreground">{t.outcomeLabel}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono">{qty.toFixed(1)}</td>
                        <td className="px-5 py-3.5 text-right font-mono text-muted-foreground">{t.avgPrice.toFixed(2)}</td>
                        <td className="px-5 py-3.5 text-right font-mono font-semibold">
                          {formatMoney(Math.abs(t.totalCost))}
                        </td>
                        <td className="px-5 py-3.5 text-right text-xs text-muted-foreground whitespace-nowrap flex items-center justify-end gap-1">
                          <Clock className="h-3 w-3" />
                          {t.createdAt}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {enrichedHoldings.length === 0 && recentTrades.length === 0 && (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
            <BarChart3 className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-bold mb-2">No trades yet</h3>
          <p className="text-muted-foreground mb-6">
            Head to the markets and place your first bet!
          </p>
          <Link
            href="/markets"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-purple-500 px-6 py-3 text-sm font-bold text-white hover:shadow-lg hover:shadow-primary/30 transition-all duration-300"
          >
            Browse Markets
          </Link>
        </div>
      )}
    </div>
  );
}
