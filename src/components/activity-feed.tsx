import Link from "next/link";
import { getAvatarUrl } from "@/lib/gravatar";
import { Activity, Zap, Trophy, MessageSquare, BarChart3 } from "lucide-react";

interface ActivityItem {
  id: number;
  type: string;
  data: string | null;
  createdAt: string;
  userName: string;
  userUsername: string | null;
  userEmail: string | null;
  marketQuestion: string | null;
  marketId: number | null;
}

function timeAgo(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getActivityIcon(type: string) {
  switch (type) {
    case "market_created": return <BarChart3 className="h-4 w-4 text-primary" />;
    case "large_trade": return <Zap className="h-4 w-4 text-yellow-500" />;
    case "market_resolved": return <Trophy className="h-4 w-4 text-success" />;
    case "achievement_unlocked": return <Activity className="h-4 w-4 text-purple-500" />;
    default: return <Activity className="h-4 w-4 text-muted-foreground" />;
  }
}

function getActivityDescription(item: ActivityItem): string {
  switch (item.type) {
    case "market_created": return "created a new market";
    case "large_trade": return "made a large trade";
    case "market_resolved": return "resolved a market";
    case "achievement_unlocked": return "unlocked an achievement";
    default: return "did something";
  }
}

export function ActivityFeed({ activities }: { activities: ActivityItem[] }) {
  if (activities.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((item) => {
        const avatarUrl = getAvatarUrl(item.userEmail || "");
        return (
          <div key={item.id} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:border-primary/30">
            <img src={avatarUrl} alt="" className="h-8 w-8 rounded-full shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {item.userUsername ? (
                  <Link href={`/user/${item.userUsername}`} className="text-sm font-semibold hover:text-primary transition-colors">
                    {item.userName}
                  </Link>
                ) : (
                  <span className="text-sm font-semibold">{item.userName}</span>
                )}
                <span className="text-sm text-muted-foreground">{getActivityDescription(item)}</span>
              </div>
              {item.marketQuestion && item.marketId && (
                <Link href={`/markets/${item.marketId}`} className="text-sm text-primary hover:underline line-clamp-1 block mt-0.5">
                  {item.marketQuestion}
                </Link>
              )}
              <div className="flex items-center gap-2 mt-1.5">
                {getActivityIcon(item.type)}
                <span className="text-xs text-muted-foreground">{timeAgo(item.createdAt)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
