export default function ProfileLoading() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-muted/50 animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-32 bg-muted/50 rounded-lg animate-pulse" />
            <div className="h-4 w-24 bg-muted/50 rounded animate-pulse" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <div className="h-4 w-20 bg-muted/50 rounded animate-pulse" />
            <div className="h-8 w-24 bg-muted/50 rounded animate-pulse" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="h-6 w-40 bg-muted/50 rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 text-center animate-pulse">
              <div className="h-10 w-10 rounded-full bg-muted mx-auto mb-2" />
              <div className="h-3 bg-muted rounded mb-1" />
              <div className="h-2 bg-muted rounded w-3/4 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
