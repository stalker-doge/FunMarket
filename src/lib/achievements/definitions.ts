export const ACHIEVEMENTS = [
  // Trading
  { slug: "first_steps", name: "First Steps", description: "Make your first trade", icon: "Zap", category: "trading" },
  { slug: "getting_started", name: "Getting Started", description: "Make 10 trades", icon: "TrendingUp", category: "trading" },
  { slug: "trading_veteran", name: "Trading Veteran", description: "Make 50 trades", icon: "Swords", category: "trading" },
  { slug: "big_winner", name: "Big Winner", description: "Earn 1,000+ FB profit from a single market", icon: "Trophy", category: "trading" },
  { slug: "high_roller", name: "High Roller", description: "Make a single trade worth 500+ FB", icon: "Crown", category: "trading" },
  { slug: "diversified", name: "Diversified", description: "Hold positions in 5 different markets", icon: "PieChart", category: "trading" },
  { slug: "portfolio_pro", name: "Portfolio Pro", description: "Hold positions in 15 different markets", icon: "Layers", category: "trading" },
  { slug: "contrarian", name: "Contrarian", description: "Buy an outcome at 20% or lower odds", icon: "ShieldAlert", category: "trading" },
  { slug: "true_believer", name: "True Believer", description: "Buy an outcome at 80% or higher odds", icon: "Heart", category: "trading" },

  // Markets
  { slug: "market_maker", name: "Market Maker", description: "Create your first market", icon: "BarChart3", category: "markets" },
  { slug: "prolific_creator", name: "Prolific Creator", description: "Create 5 markets", icon: "Rocket", category: "markets" },
  { slug: "oracle", name: "Oracle", description: "Create a market that gets 25+ trades", icon: "Eye", category: "markets" },
  { slug: "resolved_creator", name: "Resolution Master", description: "Have 3 of your markets resolved", icon: "CheckCheck", category: "markets" },

  // Wealth
  { slug: "wealthy", name: "Wealthy", description: "Reach 10,000 FB net worth", icon: "Wallet", category: "wealth" },
  { slug: "tycoon", name: "Tycoon", description: "Reach 50,000 FB net worth", icon: "Landmark", category: "wealth" },
  { slug: "allowance_collector", name: "Allowance Collector", description: "Claim your daily allowance 30 times", icon: "PiggyBank", category: "wealth" },

  // Engagement
  { slug: "weekly_regular", name: "Weekly Regular", description: "Claim allowance 7 days in a row", icon: "Calendar", category: "engagement" },
  { slug: "commentator", name: "Commentator", description: "Write 10 comments", icon: "MessageSquare", category: "engagement" },
  { slug: "conversation_starter", name: "Conversation Starter", description: "Write 50 comments", icon: "MessagesSquare", category: "engagement" },
  { slug: "watchdog", name: "Watchdog", description: "Add 10 markets to your watchlist", icon: "Binoculars", category: "engagement" },
] as const;

export type AchievementSlug = typeof ACHIEVEMENTS[number]["slug"];
