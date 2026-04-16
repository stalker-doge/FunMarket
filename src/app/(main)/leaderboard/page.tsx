import Link from "next/link";
import Image from "next/image";
import { getLeaderboard } from "@/lib/db/queries/leaderboard";
import { formatMoney } from "@/lib/utils";
import { getAvatarUrl } from "@/lib/gravatar";
import { Trophy, Medal, Award } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard - FunMarket",
  description: "Top traders on FunMarket ranked by net worth. See who's winning at prediction markets.",
  openGraph: {
    title: "FunMarket Leaderboard",
    description: "Top traders ranked by net worth.",
  },
};

export default async function LeaderboardPage() {
  const rankings = await getLeaderboard();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-purple-400 to-primary bg-clip-text text-transparent">
          Leaderboard
        </h1>
        <p className="text-muted-foreground mt-1">Top traders on FunMarket</p>
      </div>

      {rankings.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-16 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground">No users yet</p>
        </div>
      ) : (
        <>
          {/* Podium for top 3 */}
          {rankings.length >= 3 && (
            <div className="grid grid-cols-3 gap-4">
              {/* 2nd place */}
              <div className="order-2 md:order-1">
                <div className="relative rounded-2xl border border-border bg-gradient-to-br from-slate-400/10 to-slate-500/5 p-6 text-center transform hover:scale-105 transition-transform duration-300">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-slate-400 to-slate-500 shadow-lg">
                      <Medal className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="mt-4 mb-3">
                    <Image
                      src={getAvatarUrl(rankings[1].email, rankings[1].avatarUrl, 56)}
                      alt={rankings[1].displayName}
                      width={56}
                      height={56}
                      className="inline-flex h-14 w-14 rounded-full text-xl font-bold text-white shadow-lg ring-2 ring-slate-400/30"
                    />
                  </div>
                  <div className="font-semibold text-sm mb-1">
                    <Link href={`/user/${rankings[1].username}`} className="hover:text-primary transition-colors">{rankings[1].displayName}</Link>
                  </div>
                  <div className="text-xs text-muted-foreground mb-3">@{rankings[1].username}</div>
                  <div className="rounded-xl bg-slate-500/10 p-3">
                    <div className="text-xs text-muted-foreground mb-1">Net Worth</div>
                    <div className="font-mono font-bold text-lg text-slate-400">
                      {formatMoney(rankings[1].netWorth)}
                    </div>
                  </div>
                </div>
              </div>

              {/* 1st place */}
              <div className="order-1 md:order-2">
                <div className="relative rounded-2xl border border-yellow-400/30 bg-gradient-to-br from-yellow-400/10 to-amber-500/5 p-6 text-center transform hover:scale-105 transition-transform duration-300">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 shadow-xl shadow-yellow-400/30">
                      <Trophy className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="mt-6 mb-3">
                    <Image
                      src={getAvatarUrl(rankings[0].email, rankings[0].avatarUrl, 64)}
                      alt={rankings[0].displayName}
                      width={64}
                      height={64}
                      className="inline-flex h-16 w-16 rounded-full text-2xl font-bold text-white shadow-xl shadow-yellow-400/30 ring-4 ring-yellow-400/20"
                    />
                  </div>
                  <div className="font-bold text-base mb-1 text-yellow-400">
                    <Link href={`/user/${rankings[0].username}`} className="hover:text-yellow-300 transition-colors">{rankings[0].displayName}</Link>
                  </div>
                  <div className="text-xs text-muted-foreground mb-3">@{rankings[0].username}</div>
                  <div className="rounded-xl bg-yellow-400/10 p-3">
                    <div className="text-xs text-muted-foreground mb-1">Net Worth</div>
                    <div className="font-mono font-bold text-xl text-yellow-400">
                      {formatMoney(rankings[0].netWorth)}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3rd place */}
              <div className="order-3">
                <div className="relative rounded-2xl border border-border bg-gradient-to-br from-orange-400/10 to-orange-500/5 p-6 text-center transform hover:scale-105 transition-transform duration-300">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-500 shadow-lg">
                      <Award className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="mt-4 mb-3">
                    <Image
                      src={getAvatarUrl(rankings[2].email, rankings[2].avatarUrl, 56)}
                      alt={rankings[2].displayName}
                      width={56}
                      height={56}
                      className="inline-flex h-14 w-14 rounded-full text-xl font-bold text-white shadow-lg ring-2 ring-orange-400/30"
                    />
                  </div>
                  <div className="font-semibold text-sm mb-1">
                    <Link href={`/user/${rankings[2].username}`} className="hover:text-primary transition-colors">{rankings[2].displayName}</Link>
                  </div>
                  <div className="text-xs text-muted-foreground mb-3">@{rankings[2].username}</div>
                  <div className="rounded-xl bg-orange-500/10 p-3">
                    <div className="text-xs text-muted-foreground mb-1">Net Worth</div>
                    <div className="font-mono font-bold text-lg text-orange-400">
                      {formatMoney(rankings[2].netWorth)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rest of rankings in table */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-lg">
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
                {rankings.map((user, i) => (
                  <tr key={user.id} className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors duration-150 ${i < 3 && rankings.length >= 3 ? "hidden" : ""}`}>
                    <td className="px-5 py-4">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted/50 font-bold text-muted-foreground">
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Image
                          src={getAvatarUrl(user.email, user.avatarUrl, 40)}
                          alt={user.displayName}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-full shadow-lg shadow-primary/20 ring-2 ring-primary/20"
                        />
                        <div>
                          <Link href={`/user/${user.username}`} className="font-semibold hover:text-primary transition-colors">{user.displayName}</Link>
                          <div className="text-xs text-muted-foreground">@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-muted-foreground">{formatMoney(user.balance)}</td>
                    <td className="px-5 py-4 text-right font-mono font-bold text-primary">{formatMoney(user.netWorth)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
