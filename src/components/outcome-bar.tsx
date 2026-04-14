import { cn } from "@/lib/utils";

interface OutcomeBarProps {
  label: string;
  probability: number;
  color: string;
  shares?: number;
  onClick?: () => void;
  selected?: boolean;
  resolved?: boolean;
  isWinner?: boolean;
}

export function OutcomeBar({
  label,
  probability,
  color,
  shares,
  onClick,
  selected,
  resolved,
  isWinner,
}: OutcomeBarProps) {
  const pct = Math.round(probability * 100);

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "group relative w-full rounded-xl border p-3.5 text-left transition-all duration-300 overflow-hidden",
        selected
          ? "border-primary/50 bg-primary/5 shadow-lg shadow-primary/10 ring-2 ring-primary/30"
          : "border-border hover:border-primary/30 hover:bg-muted/30 hover:shadow-md",
        resolved && isWinner && "border-success/50 bg-success/5 shadow-lg shadow-success/10",
        resolved && !isWinner && "opacity-30"
      )}
    >
      <div className="relative flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2.5">
          <div
            className="h-3.5 w-3.5 rounded-full transition-transform duration-300 group-hover:scale-110"
            style={{
              backgroundColor: color,
              boxShadow: `0 0 12px ${color}40`,
            }}
          />
          <span className="font-semibold text-sm">{label}</span>
        </div>
        <span
          className="text-sm font-mono font-bold transition-all duration-300 group-hover:scale-105"
          style={{
            color,
            textShadow: `0 0 10px ${color}30`,
          }}
        >
          {pct}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden relative">
        <div
          className="h-full rounded-full transition-all duration-500 relative"
          style={{
            width: `${pct}%`,
            backgroundColor: color,
            boxShadow: `0 0 20px ${color}50`,
          }}
        />
      </div>
      {shares !== undefined && shares > 0 && (
        <div className="mt-2 text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-primary/50" />
          {shares.toFixed(1)} shares held
        </div>
      )}
    </button>
  );
}
