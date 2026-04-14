import { getUser } from "@/lib/auth/session";
import { getRecentActivity } from "@/lib/db/queries/activity";
import { ActivityFeed } from "@/components/activity-feed";
import { plain } from "@/lib/db";
import { Activity } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Activity - FunMarket",
  description: "Recent activity across FunMarket prediction markets.",
};

export default async function ActivityPage() {
  const user = await getUser();
  if (!user) return null;

  const activities = plain(await getRecentActivity(50));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
          Activity
        </h1>
        <p className="text-muted-foreground mt-1">Recent activity across FunMarket</p>
      </div>

      <ActivityFeed activities={activities} />
    </div>
  );
}
