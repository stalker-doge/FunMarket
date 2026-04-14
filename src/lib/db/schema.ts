import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  balance: real("balance").notNull().default(0),
  lastAllowance: text("last_allowance"),
  onboardingCompleted: integer("onboarding_completed", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const markets = sqliteTable("markets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  question: text("question").notNull(),
  description: text("description"),
  category: text("category").notNull().default("other"),
  imageUrl: text("image_url"),
  status: text("status").notNull().default("open"),
  resolutionOutcomeId: integer("resolution_outcome_id"),
  resolutionNotes: text("resolution_notes"),
  closesAt: text("closes_at"),
  liquidityParam: real("liquidity_param").notNull().default(100),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const outcomes = sqliteTable("outcomes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  marketId: integer("market_id").notNull().references(() => markets.id),
  label: text("label").notNull(),
  color: text("color"),
  sharesOutstanding: real("shares_outstanding").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const trades = sqliteTable("trades", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  outcomeId: integer("outcome_id").notNull().references(() => outcomes.id),
  marketId: integer("market_id").notNull().references(() => markets.id),
  quantity: real("quantity").notNull(),
  avgPrice: real("avg_price").notNull(),
  totalCost: real("total_cost").notNull(),
  tradeType: text("trade_type").notNull().default("buy"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const allowanceLog = sqliteTable("allowance_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: real("amount").notNull(),
  grantedAt: text("granted_at").notNull().default(sql`(datetime('now'))`),
});

export const watchlist = sqliteTable("watchlist", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  marketId: integer("market_id").notNull().references(() => markets.id),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const comments = sqliteTable("comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  marketId: integer("market_id").notNull().references(() => markets.id),
  userId: integer("user_id").notNull().references(() => users.id),
  parentId: integer("parent_id"),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const achievements = sqliteTable("achievements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  category: text("category").notNull().default("general"),
});

export const userAchievements = sqliteTable("user_achievements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  achievementId: integer("achievement_id").notNull().references(() => achievements.id),
  unlockedAt: text("unlocked_at").notNull().default(sql`(datetime('now'))`),
});

export const activityLog = sqliteTable("activity_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type").notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
  marketId: integer("market_id"),
  data: text("data"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});
