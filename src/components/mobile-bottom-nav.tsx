"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart3, Briefcase, Trophy, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileBottomNavProps {
  displayName: string;
}

export function MobileBottomNav({ displayName }: MobileBottomNavProps) {
  const pathname = usePathname();

  const tabs = [
    { href: "/dashboard", label: "Home", Icon: Home },
    { href: "/markets", label: "Markets", Icon: BarChart3 },
    { href: "/portfolio", label: "Portfolio", Icon: Briefcase },
    { href: "/leaderboard", label: "Rankings", Icon: Trophy },
    { href: "/profile", label: "Profile", Icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-card/80 backdrop-blur-xl sm:hidden">
      <div className="flex items-center justify-around px-2 py-2 pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href ||
            (tab.href !== "/profile" && pathname.startsWith(tab.href + "/"));
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "relative p-1.5 rounded-lg transition-all duration-200",
                  isActive && "bg-primary/10"
                )}
              >
                <tab.Icon
                  className={cn(
                    "h-5 w-5 transition-all duration-200",
                    isActive && "text-primary"
                  )}
                />
                {isActive && (
                  <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-gradient-to-r from-primary to-purple-400" />
                )}
              </div>
              <span className={cn("text-[10px] font-medium", isActive && "font-bold")}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
