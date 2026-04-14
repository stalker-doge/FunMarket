import { notFound } from "next/navigation";
import Link from "next/link";
import { getUserByUsername, getUserPublicStats, getMarketsByCreator } from "@/lib/db/queries/users";
import { getOutcomesByMarket } from "@/lib/db/queries/markets";
import { getRecentTrades } from "@/lib/db/queries/trades";
import { lmsrAllPrices } from "@/lib/market-engine/lmsr";
import { getCategoryMeta } from "@/lib/categories";
import { getAvatarUrl } from "@/lib/gravatar";
import { plain } from "@/lib/db";
import { Calendar, BarChart3, ShoppingBag, Trophy } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const profile = await getUserByUsername(username);
  if (!profile) return { title: "User Not Found" };

  return {
    title: `${profile.displayName} (@${profile.username}) - FunMarket`,
    description: `View ${profile.displayName}'s profile on FunMarket.`,
  };
}

export default async function PublicUserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await getUserByUsername(username);
  if (!profile) notFound();

  const safeProfile = plain(profile);
  const safeStats = plain(await getUserPublicStats(safeProfile.id));
  const createdMarkets = plain(await getMarketsByCreator(safeProfile.id, 10));
  const recentTrades = plain(await getRecentTrades(safeProfile.id, 10));
  const avatarUrl = safeProfile.avatarUrl || getAvatarUrl(safeProfile.email || "");

  // Enrich markets with outcomes/prices
  const enrichedMarkets = await Promise.all(
    createdMarkets.map(async (m) => {
      const outcomes = await getOutcomesByMarket(m.id);
      const shares = outcomes.map((o) => o.sharesOutstanding);
      const prices = lmsrAllPrices(shares, 100);
      const cat = getCategoryMeta(m.category ?? "other");
      return { ...m, outcomes: outcomes.map((o, i) => ({ ...o, price: prices[i] })), catColor: cat.color, catLabel: cat.label };
    })
  );

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <div className="rounded-2xl border border-border bg-card p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-purple-500 to-primary" />
        <div className="flex items-center gap-5">
          <img
            src={avatarUrl}
            alt={safeProfile.displayName}
            className="h-20 w-20 rounded-full border-2 border-border"
          />
          <div>
            <h1 className="text-2xl font-bold">{safeProfile.displayName}</h1>
            <p className="text-muted-foreground text-sm">@{safeProfile.username}</p>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              Joined {new Date(safeStats.joinDate).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground font-medium">Markets</span>
          </div>
          <div className="text-2xl font-bold">{safeStats.marketsCreated}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <ShoppingBag className="h-4 w-4 text-purple-500" />
            <span className="text-xs text-muted-foreground font-medium">Trades</span>
          </div>
          <div className="text-2xl font-bold">{safeStats.totalTrades}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <span className="text-xs text-muted-foreground font-medium">Net Worth</span>
          </div>
          <div className="text-2xl font-bold font-mono">{safeStats.balance.toFixed(0)}</div>
        </div>
      </div>

      {/* Created Markets */}
      {enrichedMarkets.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Created Markets</h2>
          <div className="space-y-3">
            {enrichedMarkets.map((m) => (
              <Link key={m.id} href={`/markets/${m.id}`}>
                <div className="group rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-1">
                        {m.question}
                      </h3>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold border"
                          style={{ color: m.catColor, borderColor: `${m.catColor}40`, backgroundColor: `${m.catColor}10` }}
                        >
                          {m.catLabel}
                        </span>
                        <span className={m.status === "open" ? "text-xs text-primary font-medium" : m.status === "resolved" ? "text-xs text-success font-medium" : "text-xs text-muted-foreground"}>
                          {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {m.outcomes.slice(0, 3).map((o: { id: number; label: string; color: string | null; price: number }) => (
                        <div
                          key={o.id}
                          className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ backgroundColor: o.color || "#8b5cf6" }}
                          title={`${o.label}: ${(o.price * 100).toFixed(0)}%`}
                        >
                          {(o.price * 100).toFixed(0)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Trades */}
      {recentTrades.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Recent Trades</h2>
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Market</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Outcome</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-muted-foreground uppercase">Type</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase">Qty</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTrades.map((t) => (
                    <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/markets/${t.marketId}`} className="font-medium hover:text-primary transition-colors line-clamp-1">
                          {t.marketQuestion}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.outcomeColor || "#8b5cf6" }} />
                          <span className="text-xs">{t.outcomeLabel}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={t.tradeType === "sell" ? "text-xs font-semibold text-danger" : "text-xs font-semibold text-success"}>
                          {t.tradeType === "sell" ? "SELL" : "BUY"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs">{Math.abs(t.quantity).toFixed(1)}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs">{Math.abs(t.totalCost).toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
