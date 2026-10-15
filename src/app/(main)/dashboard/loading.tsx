export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-9 w-32 bg-muted/50 rounded-lg animate-pulse" />
        <div className="h-4 w-48 bg-muted/50 rounded-lg animate-pulse mt-2" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <div className="h-4 w-20 bg-muted/50 rounded animate-pulse" />
            <div className="h-8 w-24 bg-muted/50 rounded animate-pulse" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
        <div className="h-6 w-40 bg-muted/50 rounded-lg animate-pulse" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-muted/50 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}
