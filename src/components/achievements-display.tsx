"use client";

import { useState, useEffect } from "react";
import { getAchievementsForUser } from "@/actions/achievements";
import { cn } from "@/lib/utils";
import {
  Zap, TrendingUp, Trophy, Crown, BarChart3, Rocket,
  PieChart, Wallet, Calendar, MessageSquare, Lock,
  Flame, Store, Gem, Sparkles,
  Swords, Layers, ShieldAlert, Heart, Eye, CheckCheck,
  Landmark, PiggyBank, MessagesSquare, Binoculars,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  Zap, TrendingUp, Trophy, Crown, BarChart3, Rocket,
  PieChart, Wallet, Calendar, MessageSquare,
  Swords, Layers, ShieldAlert, Heart, Eye, CheckCheck,
  Landmark, PiggyBank, MessagesSquare, Binoculars,
};

const CATEGORY_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  trading: { label: "Trading", color: "text-primary", icon: Flame },
  markets: { label: "Markets", color: "text-purple-500", icon: Store },
  wealth: { label: "Wealth", color: "text-emerald-500", icon: Gem },
  engagement: { label: "Engagement", color: "text-blue-500", icon: Sparkles },
};

interface AchievementProgress {
  current: number;
  target: number;
  label: string;
}

interface Achievement {
  id: number;
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  unlocked: boolean;
  unlockedAt: string | null;
  progress: AchievementProgress;
}

function formatProgressValue(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return value.toString();
}

export function AchievementsDisplay() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAchievementsForUser()
      .then((data) => {
        setAchievements(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load achievements:", err);
        setError("Failed to load achievements");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-7 w-24 rounded-full bg-muted animate-pulse" />
          ))}
        </div>
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
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-danger/30 bg-danger/5 p-6 text-center">
        <p className="text-sm text-danger font-medium">{error}</p>
      </div>
    );
  }

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;
  const pct = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  const categories = [...new Set(achievements.map((a) => a.category))];
  const filtered = activeCategory ? achievements.filter((a) => a.category === activeCategory) : achievements;

  // Sort: unlocked first, then by progress desc
  const sorted = [...filtered].sort((a, b) => {
    if (a.unlocked && !b.unlocked) return -1;
    if (!a.unlocked && b.unlocked) return 1;
    const pctA = a.progress.target > 0 ? a.progress.current / a.progress.target : 0;
    const pctB = b.progress.target > 0 ? b.progress.current / b.progress.target : 0;
    return pctB - pctA;
  });

  return (
    <div className="space-y-4">
      {/* Overall progress */}
      <div className="flex items-center gap-4">
        <div className="relative h-14 w-14 shrink-0">
          <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="4" className="text-muted" />
            <circle
              cx="28" cy="28" r="24" fill="none" strokeWidth="4" strokeLinecap="round"
              className="text-primary"
              style={{
                strokeDasharray: `${2 * Math.PI * 24}`,
                strokeDashoffset: `${2 * Math.PI * 24 * (1 - pct / 100)}`,
                transition: "stroke-dashoffset 0.8s ease",
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold">{pct}%</span>
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold">{unlockedCount}/{totalCount} Achievements</div>
          <div className="text-xs text-muted-foreground">
            {unlockedCount === totalCount ? "All achievements unlocked!" : `${totalCount - unlockedCount} remaining`}
          </div>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setActiveCategory(null)}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold border transition-all",
            !activeCategory
              ? "border-primary/50 bg-primary/10 text-primary"
              : "border-border bg-card text-muted-foreground hover:border-primary/30"
          )}
        >
          All
        </button>
        {categories.map((cat) => {
          const meta = CATEGORY_META[cat];
          if (!meta) return null;
          const catUnlocked = achievements.filter((a) => a.category === cat && a.unlocked).length;
          const catTotal = achievements.filter((a) => a.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold border transition-all flex items-center gap-1.5",
                activeCategory === cat
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/30"
              )}
            >
              <meta.icon className="h-3 w-3" />
              {meta.label}
              <span className="text-[10px] opacity-70">{catUnlocked}/{catTotal}</span>
            </button>
          );
        })}
      </div>

      {/* Achievement grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {sorted.map((a) => {
          const Icon = ICON_MAP[a.icon] || Zap;
          const progressPct = a.progress.target > 0 ? Math.min((a.progress.current / a.progress.target) * 100, 100) : 0;
          const isClose = !a.unlocked && progressPct >= 50;

          return (
            <div
              key={a.id}
              className={cn(
                "group relative rounded-xl border p-4 text-center transition-all duration-300",
                a.unlocked
                  ? "border-primary/30 bg-primary/5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
                  : isClose
                    ? "border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40"
                    : "border-border bg-card opacity-60 hover:opacity-80"
              )}
            >
              <div className={cn(
                "mx-auto mb-2 h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300",
                a.unlocked
                  ? "bg-gradient-to-br from-primary to-purple-500 shadow-lg shadow-primary/20 group-hover:scale-110"
                  : isClose
                    ? "bg-amber-500/10"
                    : "bg-muted"
              )}>
                {a.unlocked ? (
                  <Icon className="h-5 w-5 text-white" />
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className={cn("text-xs font-bold mb-0.5", a.unlocked ? "text-foreground" : "text-muted-foreground")}>
                {a.name}
              </div>
              <div className="text-[10px] text-muted-foreground leading-tight mb-2">
                {a.description}
              </div>

              {/* Progress bar for locked achievements */}
              {!a.unlocked && a.progress.target > 0 && (
                <div className="space-y-1">
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700",
                        isClose
                          ? "bg-gradient-to-r from-amber-500 to-yellow-500"
                          : "bg-gradient-to-r from-primary/60 to-purple-500/60"
                      )}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <div className={cn(
                    "text-[10px] font-medium",
                    isClose ? "text-amber-600" : "text-muted-foreground"
                  )}>
                    {formatProgressValue(a.progress.current)}/{formatProgressValue(a.progress.target)} {a.progress.label}
                    {isClose && " - Almost!"}
                  </div>
                </div>
              )}

              {/* Unlocked date */}
              {a.unlocked && a.unlockedAt && (
                <div className="text-[9px] text-muted-foreground mt-1">
                  Unlocked {new Date(a.unlockedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
