import { Trophy, Bitcoin, Cpu, Landmark, Clapperboard, FlaskConical, MoreHorizontal } from "lucide-react";

export const MARKET_CATEGORIES = [
  { value: "sports", label: "Sports", color: "#f59e0b" },
  { value: "crypto", label: "Crypto", color: "#f97316" },
  { value: "tech", label: "Tech", color: "#3b82f6" },
  { value: "politics", label: "Politics", color: "#ef4444" },
  { value: "entertainment", label: "Entertainment", color: "#ec4899" },
  { value: "science", label: "Science", color: "#10b981" },
  { value: "other", label: "Other", color: "#8b5cf6" },
] as const;

export type CategoryValue = typeof MARKET_CATEGORIES[number]["value"];

export function getCategoryMeta(value: string) {
  return MARKET_CATEGORIES.find((c) => c.value === value) ?? MARKET_CATEGORIES[MARKET_CATEGORIES.length - 1];
}
