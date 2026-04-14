"use client";

import { useEffect } from "react";

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="rounded-2xl border border-danger/30 bg-card p-10 text-center max-w-md relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-danger via-red-500 to-danger" />
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-danger/10 mb-5">
          <span className="text-3xl">!</span>
        </div>
        <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
        <p className="text-sm text-muted-foreground mb-6">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="group relative rounded-xl bg-gradient-to-r from-primary to-purple-500 px-8 py-3 text-sm font-bold text-white hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          <span className="relative">Try Again</span>
        </button>
      </div>
    </div>
  );
}
