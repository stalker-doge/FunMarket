import { notFound } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/auth/session";
import { getMarketById, getOutcomesByMarket } from "@/lib/db/queries/markets";
import { getUserMarketHoldings } from "@/lib/db/queries/trades";
import { getPriceHistory } from "@/lib/db/queries/price-history";
import { isInWatchlist } from "@/lib/db/queries/watchlist";
import { autoCloseExpiredMarkets } from "@/lib/market-engine/auto-close";
import { lmsrAllPrices } from "@/lib/market-engine/lmsr";
import { getCategoryMeta } from "@/lib/categories";
import { getCommentsByMarket } from "@/lib/db/queries/comments";
import { OutcomeBar } from "@/components/outcome-bar";
import { TradePanel } from "@/components/trade-panel";
import { PriceChart } from "@/components/price-chart";
import { WatchlistButton } from "@/components/watchlist-button";
import { CommentSection } from "@/components/comment-section";
import { ResolveButton } from "./resolve-button";
import { plain } from "@/lib/db";
import { Calendar, User, CheckCircle, AlertTriangle, FileText } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const marketId = parseInt(id);
  const market = await getMarketById(marketId);
  if (!market) return { title: "Market Not Found" };

  const marketOutcomes = await getOutcomesByMarket(marketId);
  const shares = marketOutcomes.map((o) => o.sharesOutstanding);
  const prices = lmsrAllPrices(shares, market.liquidityParam);

  const oddsStr = marketOutcomes
    .map((o, i) => `${o.label}: ${(prices[i] * 100).toFixed(0)}%`)
    .join(" | ");

  return {
    title: `${market.question} - FunMarket`,
    description: `Current odds: ${oddsStr}. ${market.description || ""}`,
    openGraph: {
      title: market.question,
      description: `Current odds: ${oddsStr}`,
      type: "article",
    },
    twitter: {
      card: "summary",
      title: market.question,
      description: `Current odds: ${oddsStr}`,
    },
  };
}

export default async function MarketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser();
  if (!user) return null;

  const marketId = parseInt(id);

  // Auto-close expired markets lazily
  await autoCloseExpiredMarkets();

  const market = await getMarketById(marketId);
  if (!market) notFound();

  const marketOutcomes = plain(await getOutcomesByMarket(marketId));
  const shares = marketOutcomes.map((o) => o.sharesOutstanding);
  const prices = lmsrAllPrices(shares, market.liquidityParam);

  const holdings = plain(await getUserMarketHoldings(user.id, marketId));
  const holdingsMap: Record<number, number> = {};
  for (const h of holdings) {
    holdingsMap[h.outcomeId] = h.totalShares;
  }

  const priceHistory = plain(
    await getPriceHistory(marketId, marketOutcomes.length, market.liquidityParam)
  );

  const safeUser = plain(user);
  const safeMarket = plain(market);
  const isCreator = safeUser.id === safeMarket.creatorId;
  const isOpen = safeMarket.status === "open";
  const isResolved = safeMarket.status === "resolved";
  const isClosed = safeMarket.status === "closed";
  const isWatched = await isInWatchlist(user.id, marketId);
  const cat = getCategoryMeta(safeMarket.category ?? "other");

  const outcomeLabels = marketOutcomes.map((o) => o.label);
  const outcomeColors = marketOutcomes.map((o) => o.color || "#8b5cf6");

  const rawComments = plain(await getCommentsByMarket(marketId));

  return (
    <div className="space-y-6">
      {/* Enhanced header */}
      <div>
        <div className="flex items-start gap-3 mb-2">
          <h1 className="text-3xl font-bold">{safeMarket.question}</h1>
          <div className="flex items-center gap-2 shrink-0 mt-1">
            {isResolved && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 border border-success/30 px-3 py-1 text-xs font-semibold text-success">
                <CheckCircle className="h-3.5 w-3.5" />
                Resolved
              </span>
            )}
            <WatchlistButton marketId={marketId} isWatched={isWatched} />
          </div>
        </div>
        {safeMarket.description && (
          <p className="text-muted-foreground text-base leading-relaxed mt-3">
            {safeMarket.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
          <span
            className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold border"
            style={{
              color: cat.color,
              borderColor: `${cat.color}40`,
              backgroundColor: `${cat.color}10`,
            }}
          >
            {cat.label}
          </span>
          <div className="flex items-center gap-1.5">
            <User className="h-4 w-4" />
            <span>Created by{" "}
              {safeMarket.creatorUsername ? (
                <Link href={`/user/${safeMarket.creatorUsername}`} className="font-medium text-foreground hover:text-primary transition-colors">
                  {safeMarket.creatorName}
                </Link>
              ) : (
                <span className="font-medium text-foreground">{safeMarket.creatorName}</span>
              )}
            </span>
          </div>
          {safeMarket.closesAt && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>Closes <span className="font-medium text-foreground">{safeMarket.closesAt}</span></span>
            </div>
          )}
        </div>
      </div>

      {/* Closed market warning */}
      {isClosed && (
        <div className="rounded-xl bg-warning/10 border border-warning/30 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-warning text-sm">Market Closed</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              This market has passed its closing date and can no longer be traded.
              {isCreator && " You can still resolve it below."}
            </p>
          </div>
        </div>
      )}

      {/* Resolution notes */}
      {isResolved && safeMarket.resolutionNotes && (
        <div className="rounded-xl bg-muted/50 border border-border p-4 flex items-start gap-3">
          <FileText className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Resolution Notes</p>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {safeMarket.resolutionNotes}
            </p>
          </div>
        </div>
      )}

      {/* Price chart */}
      <PriceChart
        snapshots={priceHistory}
        outcomeLabels={outcomeLabels}
        outcomeColors={outcomeColors}
      />

      {/* Outcome probabilities detail */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-purple-500 to-primary" />
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
          <div className="h-5 w-1 rounded-full bg-gradient-to-b from-primary to-purple-500" />
          Current Probabilities
        </h2>
        <div className="space-y-2.5">
          {marketOutcomes.map((outcome, i) => (
            <OutcomeBar
              key={outcome.id}
              label={outcome.label}
              probability={prices[i]}
              color={outcome.color || "#8b5cf6"}
              shares={holdingsMap[outcome.id] || 0}
              resolved={isResolved}
              isWinner={safeMarket.resolutionOutcomeId === outcome.id}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Trade panel */}
        {isOpen && (
          <TradePanel
            outcomes={marketOutcomes}
            marketId={marketId}
            liquidityParam={safeMarket.liquidityParam}
            userBalance={safeUser.balance}
            userHoldings={holdingsMap}
          />
        )}

        {/* Holdings summary */}
        {holdings.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-purple-500 to-primary" />
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <div className="h-5 w-1 rounded-full bg-gradient-to-b from-primary to-purple-500" />
              Your Holdings
            </h2>
            <div className="space-y-3">
              {marketOutcomes.map((outcome, i) => {
                const held = holdingsMap[outcome.id] || 0;
                if (held <= 0) return null;
                const currentValue = held * prices[i];
                return (
                  <div key={outcome.id} className="rounded-xl bg-muted/30 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{
                          backgroundColor: outcome.color || "#8b5cf6",
                          boxShadow: `0 0 10px ${(outcome.color || "#8b5cf6")}50`,
                        }}
                      />
                      <div>
                        <div className="font-semibold text-sm">{outcome.label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {prices[i].toFixed(3)} / share
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-base">{held.toFixed(1)} <span className="text-xs font-normal text-muted-foreground">shares</span></div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        ~{currentValue.toFixed(1)} FB value
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Resolve button for creator */}
      {isCreator && (isOpen || isClosed) && (
        <ResolveButton outcomes={marketOutcomes} marketId={marketId} />
      )}

      {/* Comments */}
      <CommentSection
        marketId={marketId}
        comments={rawComments}
        currentUserId={safeUser.id}
      />
    </div>
  );
}
