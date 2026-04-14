import { MarketCardSkeleton } from "@/components/skeleton";

export default function MarketsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-9 w-36 bg-muted/50 rounded-lg animate-pulse" />
          <div className="h-4 w-56 bg-muted/50 rounded-lg animate-pulse mt-2" />
        </div>
        <div className="h-10 w-32 bg-muted/50 rounded-xl animate-pulse" />
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <MarketCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
