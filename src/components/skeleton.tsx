import { cn } from "@/lib/utils";

function SkeletonBox({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg bg-muted/50 animate-pulse",
        className
      )}
    />
  );
}

export function MarketCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <SkeletonBox className="h-5 w-3/4" />
        <SkeletonBox className="h-5 w-14 rounded-full" />
      </div>
      <SkeletonBox className="h-4 w-full" />
      <div className="space-y-3">
        <div className="space-y-2">
          <div className="flex justify-between">
            <SkeletonBox className="h-3 w-20" />
            <SkeletonBox className="h-3 w-10" />
          </div>
          <SkeletonBox className="h-2 w-full rounded-full" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <SkeletonBox className="h-3 w-16" />
            <SkeletonBox className="h-3 w-10" />
          </div>
          <SkeletonBox className="h-2 w-full rounded-full" />
        </div>
      </div>
      <div className="pt-3 border-t border-border/50">
        <SkeletonBox className="h-3 w-32" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center gap-2">
        <SkeletonBox className="h-8 w-8 rounded-lg" />
        <SkeletonBox className="h-3 w-16" />
      </div>
      <SkeletonBox className="h-7 w-24" />
    </div>
  );
}

export function TableRowSkeleton({ cols }: { cols: number }) {
  return (
    <tr className="border-b border-border">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-5 py-4">
          <SkeletonBox className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

export function ChartSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <SkeletonBox className="h-9 w-full rounded-lg" />
      <div className="flex gap-5">
        <SkeletonBox className="h-4 w-24" />
        <SkeletonBox className="h-4 w-24" />
      </div>
      <SkeletonBox className="h-48 w-full" />
    </div>
  );
}

export function TradePanelSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
      <SkeletonBox className="h-6 w-20" />
      <div className="grid grid-cols-2 gap-3">
        <SkeletonBox className="h-16 rounded-xl" />
        <SkeletonBox className="h-16 rounded-xl" />
      </div>
      <SkeletonBox className="h-11 w-full rounded-xl" />
      <SkeletonBox className="h-28 w-full rounded-xl" />
      <SkeletonBox className="h-11 w-full rounded-xl" />
    </div>
  );
}
