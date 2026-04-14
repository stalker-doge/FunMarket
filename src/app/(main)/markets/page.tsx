import Link from "next/link";
import { Suspense } from "react";
import { getUser } from "@/lib/auth/session";
import { searchMarkets, getOutcomesByMarket } from "@/lib/db/queries/markets";
import { getUserWatchlistIds } from "@/lib/db/queries/watchlist";
import { MarketCard } from "@/components/market-card";
import { MarketFilters } from "@/components/market-filters";
import { Pagination } from "@/components/pagination";
import { canClaimAllowance } from "@/lib/allowance";
import { AllowanceBanner } from "@/components/allowance-banner";
import { plain } from "@/lib/db";
import { Plus, TrendingUp } from "lucide-react";
import { MarketCardSkeleton } from "@/components/skeleton";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Markets - FunMarket",
  description: "Browse and trade on prediction markets. Create events, bet with fake money, and see real-time odds.",
  openGraph: {
    title: "FunMarket - Prediction Markets",
    description: "Browse and trade on prediction markets with fake money.",
  },
};

const PAGE_SIZE = 12;

export default async function MarketsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; category?: string; sort?: string; page?: string }>;
}) {
  const user = await getUser();
  if (!user) return null;

  const params = await searchParams;
  const safeUser = plain(user);
  const canClaim = canClaimAllowance(safeUser.lastAllowance);

  const page = parseInt(params.page || "1");
  const { markets: marketsList, total } = await searchMarkets({
    query: params.q,
    status: params.status,
    category: params.category,
    sort: (params.sort as "newest" | "most_traded" | "highest_volume") || "newest",
    page,
    limit: PAGE_SIZE,
  });

  const watchlistIds = await getUserWatchlistIds(user.id);

  const marketsWithOutcomes = await Promise.all(
    marketsList.map(async (m) => {
      const outcomes = await getOutcomesByMarket(m.id);
      return plain({ ...m, outcomes, liquidityParam: 100, isWatched: watchlistIds.has(m.id) });
    })
  );

  return (
    <div className="space-y-6">
      {canClaim && <AllowanceBanner canClaim={canClaim} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            Markets
          </h1>
          <p className="text-muted-foreground mt-1">Browse and trade prediction markets</p>
        </div>
        <Link
          href="/markets/new"
          className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-purple-500 px-5 py-2.5 text-sm font-semibold text-white hover:shadow-lg hover:shadow-primary/30 transition-all duration-300"
        >
          <Plus className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
          New Market
        </Link>
      </div>

      <Suspense>
        <MarketFilters />
      </Suspense>

      {marketsWithOutcomes.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-16 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground mb-4 text-lg">
            {params.q ? `No markets matching "${params.q}"` : "No markets yet"}
          </p>
          {!params.q && (
            <>
              <p className="text-sm text-muted-foreground mb-6">Be the first to create a prediction market</p>
              <Link
                href="/markets/new"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-purple-500 px-6 py-3 text-sm font-semibold text-white hover:shadow-lg hover:shadow-primary/30 transition-all duration-300"
              >
                <Plus className="h-4 w-4" />
                Create the First Market
              </Link>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2">
            {marketsWithOutcomes.map((market) => (
              <MarketCard key={market.id} {...market} />
            ))}
          </div>
          <Pagination total={total} pageSize={PAGE_SIZE} />
        </>
      )}
    </div>
  );
}
