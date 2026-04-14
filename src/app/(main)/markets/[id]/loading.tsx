import { ChartSkeleton, TradePanelSkeleton } from "@/components/skeleton";

export default function MarketDetailLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-9 w-3/4 bg-muted/50 rounded-lg animate-pulse" />
        <div className="h-4 w-1/2 bg-muted/50 rounded-lg animate-pulse mt-3" />
        <div className="flex gap-4 mt-4">
          <div className="h-4 w-32 bg-muted/50 rounded animate-pulse" />
          <div className="h-4 w-32 bg-muted/50 rounded animate-pulse" />
        </div>
      </div>
      <ChartSkeleton />
      <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
        <div className="h-6 w-40 bg-muted/50 rounded-lg animate-pulse" />
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <div className="h-4 w-24 bg-muted/50 rounded animate-pulse" />
                <div className="h-4 w-12 bg-muted/50 rounded animate-pulse" />
              </div>
              <div className="h-2 w-full bg-muted/50 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <TradePanelSkeleton />
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div className="h-6 w-32 bg-muted/50 rounded-lg animate-pulse" />
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
