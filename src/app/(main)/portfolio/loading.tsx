import { StatCardSkeleton, TableRowSkeleton } from "@/components/skeleton";

export default function PortfolioLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-9 w-32 bg-muted/50 rounded-lg animate-pulse" />
        <div className="h-4 w-60 bg-muted/50 rounded-lg animate-pulse mt-2" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
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
            {Array.from({ length: 3 }).map((_, i) => (
              <TableRowSkeleton key={i} cols={6} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
