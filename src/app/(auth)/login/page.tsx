"use client";

import { useState } from "react";
import { loginAction } from "@/actions/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setLoading(true);
    const result = await loginAction(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-primary/5" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float-delayed" />

      <div className="w-full max-w-sm relative z-10">
        {/* Premium branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-500 shadow-xl shadow-primary/30 mb-4">
            <span className="text-2xl font-bold text-white">FM</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent mb-2">
            FunMarket
          </h1>
          <p className="text-muted-foreground">Fake markets, real fun</p>
        </div>

        {/* Glass morphism card */}
        <form
          action={handleSubmit}
          className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl p-8 shadow-2xl space-y-5 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-transparent to-primary/5 pointer-events-none" />

          <div className="relative">
            <h2 className="text-xl font-bold mb-1">Welcome back</h2>
            <p className="text-sm text-muted-foreground">Enter your credentials to continue</p>
          </div>

          {error && (
            <div className="relative rounded-xl bg-danger/10 border border-danger/30 p-4 text-sm text-danger font-medium flex items-start gap-2 animate-slideIn">
              <div className="h-5 w-5 rounded-full bg-danger/20 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold">!</span>
              </div>
              <span>{error}</span>
            </div>
          )}

          <div className="relative space-y-4">
            <div>
              <label className="text-sm font-semibold text-foreground mb-1.5 block">
                Username or Email
              </label>
              <input
                name="identifier"
                type="text"
                required
                className="w-full rounded-xl border border-border bg-background/50 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 placeholder:text-muted-foreground/50"
                placeholder="username or you@example.com"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-1.5 block">
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                className="w-full rounded-xl border border-border bg-background/50 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 placeholder:text-muted-foreground/50"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full rounded-xl bg-gradient-to-r from-primary to-purple-500 py-3 text-sm font-bold text-white hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <span className="relative flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Logging in...
                </>
              ) : (
                "Log In"
              )}
            </span>
          </button>

          <p className="text-sm text-center text-muted-foreground">
            No account?{" "}
            <Link href="/register" className="text-primary font-semibold hover:underline underline-offset-4 transition-all">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
