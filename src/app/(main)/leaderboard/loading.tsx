import { TableRowSkeleton } from "@/components/skeleton";

export default function LeaderboardLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-9 w-40 bg-muted/50 rounded-lg animate-pulse" />
        <div className="h-4 w-40 bg-muted/50 rounded-lg animate-pulse mt-2" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-6 text-center space-y-3">
            <div className="mx-auto h-14 w-14 rounded-full bg-muted/50 animate-pulse" />
            <div className="h-4 w-20 bg-muted/50 rounded animate-pulse mx-auto" />
            <div className="h-3 w-16 bg-muted/50 rounded animate-pulse mx-auto" />
            <div className="h-10 bg-muted/50 rounded-xl animate-pulse" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-5 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider w-20">Rank</th>
              <th className="px-5 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Player</th>
              <th className="px-5 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Balance</th>
              <th className="px-5 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Net Worth</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRowSkeleton key={i} cols={4} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
