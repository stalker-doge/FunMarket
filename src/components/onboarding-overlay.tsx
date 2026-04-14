"use client";

import { useState, useTransition } from "react";
import { completeOnboardingAction } from "@/actions/onboarding";
import { Rocket, TrendingUp, Wallet, Sparkles, ChevronRight, X } from "lucide-react";

const SLIDES = [
  {
    icon: Rocket,
    title: "Welcome to FunMarket!",
    description: "Trade on prediction markets with fake money. Predict real-world outcomes and see how you stack up against other traders.",
    gradient: "from-primary to-purple-500",
  },
  {
    icon: TrendingUp,
    title: "How Trading Works",
    description: "Each market has multiple outcomes. Buy shares in outcomes you think will happen. Prices reflect the probability of each outcome occurring.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Wallet,
    title: "Daily Allowance",
    description: "You start with 5,000 FunBucks and can claim 1,000 more every day. Use them to trade across any market on the platform.",
    gradient: "from-success to-emerald-500",
  },
  {
    icon: Sparkles,
    title: "Ready to Go!",
    description: "Browse markets, place your bets, create your own markets, and climb the leaderboard. Good luck, trader!",
    gradient: "from-amber-500 to-orange-500",
  },
];

export function OnboardingOverlay() {
  const [slide, setSlide] = useState(0);
  const [isPending, startTransition] = useTransition();

  function handleDismiss() {
    startTransition(async () => {
      await completeOnboardingAction();
    });
  }

  function handleNext() {
    if (slide < SLIDES.length - 1) {
      setSlide(slide + 1);
    } else {
      handleDismiss();
    }
  }

  const current = SLIDES[slide];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-2xl">
        {/* Skip button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon */}
        <div className={`mx-auto mb-6 h-16 w-16 rounded-2xl bg-gradient-to-br ${current.gradient} flex items-center justify-center shadow-lg`}>
          <current.icon className="h-8 w-8 text-white" />
        </div>

        {/* Content */}
        <h2 className="text-xl font-bold text-center mb-3">{current.title}</h2>
        <p className="text-sm text-muted-foreground text-center leading-relaxed mb-8">
          {current.description}
        </p>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === slide ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          {slide > 0 ? (
            <button
              onClick={() => setSlide(slide - 1)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Back
            </button>
          ) : (
            <button
              onClick={handleDismiss}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-purple-500 px-5 py-2.5 text-sm font-semibold text-white hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 disabled:opacity-70"
          >
            {slide === SLIDES.length - 1 ? "Get Started" : "Next"}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
