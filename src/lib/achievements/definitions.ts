export const ACHIEVEMENTS = [
  { slug: "first_steps", name: "First Steps", description: "Make your first trade", icon: "Zap", category: "trading" },
  { slug: "getting_started", name: "Getting Started", description: "Make 10 trades", icon: "TrendingUp", category: "trading" },
  { slug: "big_winner", name: "Big Winner", description: "Earn 1,000+ FB profit from a single market", icon: "Trophy", category: "trading" },
  { slug: "high_roller", name: "High Roller", description: "Make a single trade worth 500+ FB", icon: "Crown", category: "trading" },
  { slug: "market_maker", name: "Market Maker", description: "Create your first market", icon: "BarChart3", category: "markets" },
  { slug: "prolific_creator", name: "Prolific Creator", description: "Create 5 markets", icon: "Rocket", category: "markets" },
  { slug: "diversified", name: "Diversified", description: "Hold positions in 5 different markets", icon: "PieChart", category: "trading" },
  { slug: "wealthy", name: "Wealthy", description: "Reach 10,000 FB net worth", icon: "Wallet", category: "wealth" },
  { slug: "weekly_regular", name: "Weekly Regular", description: "Claim allowance 7 days in a row", icon: "Calendar", category: "engagement" },
  { slug: "commentator", name: "Commentator", description: "Write 10 comments", icon: "MessageSquare", category: "engagement" },
] as const;

export type AchievementSlug = typeof ACHIEVEMENTS[number]["slug"];
