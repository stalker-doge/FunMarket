"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { cn } from "@/lib/utils";
import { getAvatarUrl } from "@/lib/gravatar";

interface NavBarProps {
  username: string;
  displayName: string;
  email: string;
  balance: number;
  avatarUrl?: string | null;
}

export function NavBar({ username, displayName, email, balance, avatarUrl }: NavBarProps) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "dark";
    const stored = localStorage.getItem("theme") as "light" | "dark" | null;
    if (stored) return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    function handleChange(e: MediaQueryListEvent) {
      if (!localStorage.getItem("theme")) {
        setTheme(e.matches ? "dark" : "light");
      }
    }
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  function toggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  const links = [
    { href: "/dashboard", label: "Home" },
    { href: "/markets", label: "Markets" },
    { href: "/portfolio", label: "Portfolio" },
    { href: "/leaderboard", label: "Leaderboard" },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 backdrop-blur-xl bg-card/70">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none" />
      <div className="mx-auto max-w-6xl px-4 relative">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="relative group">
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                FunMarket
              </span>
              <div className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-purple-400 group-hover:w-full transition-all duration-300" />
            </Link>
            <div className="hidden sm:flex items-center gap-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                    pathname === link.href ||
                      pathname.startsWith(link.href + "/")
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {link.label}
                  {(pathname === link.href ||
                    pathname.startsWith(link.href + "/")) && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
                  )}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-sm">
              <span className="text-muted-foreground">Balance: </span>
              <span className="font-mono font-semibold text-primary">
                {balance.toLocaleString()}
              </span>{" "}
              <span className="text-muted-foreground">FB</span>
            </div>

            <button
              onClick={toggleTheme}
              className="h-9 w-9 rounded-lg border border-border bg-muted/50 flex items-center justify-center hover:bg-muted transition-all duration-200 hover:scale-105 active:scale-95"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-primary" />
              )}
            </button>

            <Link
              href="/profile"
              className={cn(
                "flex items-center gap-2.5 pl-3 border-l border-border rounded-lg py-1 pr-2 transition-all duration-200 hover:bg-muted/50",
                pathname === "/profile" && "bg-primary/5"
              )}
            >
              <div className="relative">
                <img
                  src={getAvatarUrl(email, avatarUrl, 36)}
                  alt={displayName}
                  className="h-9 w-9 rounded-full shadow-lg shadow-primary/25 ring-2 ring-primary/20"
                />
              </div>
              <span className={cn(
                "hidden sm:inline text-sm font-medium transition-colors",
                pathname === "/profile" ? "text-primary" : ""
              )}>
                {displayName}
              </span>
            </Link>

            <form action={logoutAction}>
              <button
                type="submit"
                className="text-sm text-muted-foreground hover:text-destructive transition-colors px-2"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  );
}
