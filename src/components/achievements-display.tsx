"use client";

import { useState, useEffect } from "react";
import { getAchievementsForUser } from "@/actions/achievements";
import { cn } from "@/lib/utils";
import {
  Zap, TrendingUp, Trophy, Crown, BarChart3, Rocket,
  PieChart, Wallet, Calendar, MessageSquare, Lock,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  Zap, TrendingUp, Trophy, Crown, BarChart3, Rocket,
  PieChart, Wallet, Calendar, MessageSquare,
};

interface Achievement {
  id: number;
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  unlocked: boolean;
  unlockedAt: string | null;
}

export function AchievementsDisplay() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAchievementsForUser().then((data) => {
      setAchievements(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 text-center animate-pulse">
            <div className="h-10 w-10 rounded-full bg-muted mx-auto mb-2" />
            <div className="h-3 bg-muted rounded mb-1" />
            <div className="h-2 bg-muted rounded w-3/4 mx-auto" />
          </div>
        ))}
      </div>
    );
  }

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted-foreground">
          {unlockedCount}/{achievements.length} unlocked
        </div>
        <div className="h-2 w-32 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-500"
            style={{ width: `${(unlockedCount / achievements.length) * 100}%` }}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {achievements.map((a) => {
          const Icon = ICON_MAP[a.icon] || Zap;
          return (
            <div
              key={a.id}
              className={cn(
                "group relative rounded-xl border p-4 text-center transition-all duration-300",
                a.unlocked
                  ? "border-primary/30 bg-primary/5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
                  : "border-border bg-card opacity-60 hover:opacity-80"
              )}
            >
              <div className={cn(
                "mx-auto mb-2 h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300",
                a.unlocked
                  ? "bg-gradient-to-br from-primary to-purple-500 shadow-lg shadow-primary/20 group-hover:scale-110"
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
              <div className="text-[10px] text-muted-foreground leading-tight">
                {a.description}
              </div>
              {a.unlocked && a.unlockedAt && (
                <div className="text-[9px] text-muted-foreground mt-1">
                  {new Date(a.unlockedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
