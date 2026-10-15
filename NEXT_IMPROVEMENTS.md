# FunMarket — Next Round of Improvements

## Overview

After the first 13 improvements (indexes, transactions, LMSR safety, N+1 fixes, pagination,
validation, rate limiting, revalidatePath, achievements triggers, closing_soon sort, error
boundaries, loading states, Docker health checks), these are the next actionable items ordered
by impact.

---

## Phase 1: N+1 Query Elimination in Pages

### 1. Batch outcomes in markets listing — `src/app/(main)/markets/page.tsx`

**Problem**: Lines 51-56 fetch outcomes per-market in a `Promise.all` loop. With 12 markets
per page that's 12 separate DB round-trips.

**Fix**: Add a `getOutcomesByMarketIds(ids: number[])` query to
`src/lib/db/queries/markets.ts` that fetches all outcomes for a list of market IDs in one
query using `inArray()`. Group results in-memory by `marketId`. Replace the per-market loop.

### 2. Batch holdings enrichment in dashboard — `src/app/(main)/dashboard/page.tsx`

**Problem**: Lines 43-71 loop over up to 5 holdings, calling `getMarketById` +
`getOutcomesByMarket` per holding (up to 10 queries).

**Fix**: Collect all unique `marketId` values, batch-fetch markets + outcomes in 2 queries,
then join in-memory.

### 3. Batch holdings enrichment in profile — `src/app/(main)/profile/page.tsx`

**Problem**: Same pattern — lines 42-73 loop over every holding, fetching market + outcomes
individually (2N queries for N holdings).

**Fix**: Same approach as dashboard — batch by market IDs.

### 4. Batch holdings enrichment in portfolio — `src/app/(main)/portfolio/page.tsx`

**Problem**: Lines 21-52 do the exact same per-holding loop. Also lines 62-86 loop over
watchlist IDs with per-market fetches.

**Fix**: Batch both holdings and watchlist market data.

---

## Phase 2: Security Hardening

### 5. Harden CSP — remove `unsafe-inline` and `unsafe-eval` — `src/middleware.ts`

**Problem**: `script-src 'self' 'unsafe-inline' 'unsafe-eval'` defeats most XSS protection.
Next.js requires `unsafe-eval` in dev, but production builds don't need it.

**Fix**: In production (`NODE_ENV === 'production'`), set `script-src 'self'` with a nonce
or hash. Keep `unsafe-eval` only in development. Add `'strict-dynamic'` if using nonces.

### 6. Add `Strict-Transport-Security` header — `src/middleware.ts`

**Problem**: No HSTS header is set. Even with Caddy providing TLS, the browser doesn't know
to always use HTTPS.

**Fix**: Add `"Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload"` to
the `securityHeaders` object.

### 7. Rate limit on registration — `src/app/(main)/register/page.tsx` + `src/lib/rate-limit.ts`

**Problem**: Registration is already rate-limited in the action, but the rate limiter is
in-memory only and resets on restart. For a small app this is acceptable, but should also
rate-limit per-IP not just per-email.

**Fix**: Add IP-based rate limiting (5 registrations per hour per IP) in the register server
action, checking `x-forwarded-for` from Caddy.

### 8. Input sanitization for user-generated content — `src/lib/validators.ts`

**Problem**: Market questions, descriptions, comments, and display names accept arbitrary
text including HTML/JS. While React auto-escapes, the API could serve this data to non-React
consumers in the future. Also `imageUrl` accepts any URL without validation.

**Fix**: Add Zod transforms to:
- Strip HTML tags from `question`, `description`, `displayName`, `comment` content
- Validate `imageUrl` is a valid HTTP(S) URL (reject `javascript:`, `data:`, etc.)
- Enforce max lengths (question: 200 chars, description: 2000 chars, comment: 1000 chars)

---

## Phase 3: Market Resolution Improvements

### 9. Resolution payout in a transaction — `src/lib/market-engine/resolver.ts`

**Problem**: The resolver credits winning share holders but if it crashes mid-way, some users
get paid and others don't. Needs verification.

**Fix**: Ensure the entire resolution (status change + all payouts) is wrapped in
`db.transaction()`. If it already is, verify it's correct. Add a `resolutionLog` table or
at least ensure idempotency via a `resolutionOutcomeId` check.

### 10. Market resolution activity log — `src/lib/market-engine/resolver.ts`

**Problem**: When a market resolves, no activity log entry is created. Users following the
activity feed won't see resolution events.

**Fix**: After successful resolution, call `logActivity({ type: "market_resolved",
userId: creatorId, marketId, data: JSON.stringify({ winningOutcomeId, winningTrades }) })`.

---

## Phase 4: Auto-Close Optimization

### 11. Move auto-close out of request path — `src/lib/market-engine/auto-close.ts`

**Problem**: `autoCloseExpiredMarkets()` runs on **every** market detail page load
(`src/app/(main)/markets/[id]/page.tsx:70`). This adds a DB query (SELECT + potentially
multiple UPDATEs) to every single page view.

**Fix options**:
  - **A) Cron job via API route**: Add `src/app/api/cron/auto-close/route.ts` with a
    `GET` handler. Protect it with a `CRON_SECRET` env var check. Add a `curl` call to
    the docker-compose or use Caddy's built-in scheduler, or a simple external cron
    hitting the endpoint every 5 minutes.
  - **B) Lazy singleton**: Cache the last run timestamp in-memory. Only actually query
    the DB if more than 5 minutes have passed since the last check. Much simpler, no
    infra changes.

**Recommendation**: Option B — add a module-level `let lastChecked = 0` and skip the
DB call if `Date.now() - lastChecked < 5 * 60 * 1000`.

---

## Phase 5: Data Integrity

### 12. Soft-delete markets instead of hard delete — `src/lib/db/queries/markets.ts`

**Problem**: `deleteMarket()` permanently removes all market data including trades. Users who
held shares lose all history. This is also a moderation risk.

**Fix**: Add a `deletedAt` column to the `markets` schema. Instead of deleting, set
`deletedAt = datetime('now')` and `status = 'deleted'`. Filter out deleted markets in all
queries by adding `deletedAt IS NULL` to the where clause.

### 13. Add `updated_at` timestamps to key tables — `src/lib/db/schema.ts`

**Problem**: `markets`, `outcomes`, `users` have no `updatedAt` field, making it impossible
to know when data was last modified. Useful for caching, debugging, and audit trails.

**Fix**: Add `updatedAt: text("updated_at")` to `markets`, `users`, and `outcomes` tables.
Update these fields in relevant mutation queries. Drizzle's `sql`(datetime('now'))` works
for defaults.

---

## Phase 6: UX Improvements

### 14. Trade history pagination on profile — `src/app/(main)/profile/page.tsx`

**Problem**: `getRecentTrades(userId, 15)` always fetches the last 15 trades. If a user has
hundreds, they can't see older ones.

**Fix**: Add URL search params for page/limit to the profile page. Pass pagination to
`getRecentTrades`. Add the existing `Pagination` component below the table.

### 15. Real-time price refresh on market detail page — `src/components/trade-panel.tsx`

**Problem**: Prices on the market detail page are static — they only update on full page
reload. If another user trades, the displayed prices are stale.

**Fix**: Use the existing `getMarketLiveAction` server action with a client-side polling
interval (e.g., every 15 seconds). Update prices, holdings, and balance without full reload.
Use `useTransition` for non-blocking updates.

### 16. Notification toast for achievements — `src/components/achievements-display.tsx`

**Problem**: When a user unlocks an achievement (after a trade, comment, etc.), they see no
immediate feedback. They have to navigate to the profile to discover it.

**Fix**: After server actions that trigger `checkAndAwardAchievements`, return the list of
newly unlocked achievement names. Show a toast notification with the achievement icon and
name using the existing `Toast` component.

---

## Phase 7: Infrastructure & DevEx

### 17. Add `WATCHLIST_MARKET_ID_IDX` index — `src/lib/db/schema.ts`

**Problem**: The watchlist table is indexed on `userId` but not on `marketId`. When checking
if a market is watched (`isInWatchlist`) or removing watchlist entries on market deletion,
the query scans without an index on `marketId`.

**Fix**: Add `watchlistMarketIdIdx: index("watchlist_market_id_idx").on(t.marketId)` to the
watchlist table definition.

### 18. Add `COMMENTS_MARKET_ID_IDX` index — `src/lib/db/schema.ts`

**Problem**: Comments are fetched by `marketId` but there's no index on that column. With
many comments across markets, this becomes a full table scan.

**Fix**: Add an index callback to the `comments` table:
`commentsMarketIdIdx: index("comments_market_id_idx").on(t.marketId)`.

### 19. Leaderboard pagination support — `src/lib/db/queries/leaderboard.ts`

**Problem**: `getLeaderboard` accepts `limit` and `offset` parameters, but the
leaderboard page loads all users into memory and computes net worth for all of them,
then slices. This is O(all users) even if only showing 50.

**Fix**: The current approach needs all users to rank them (net worth calculation requires
all data). Acceptable for small-scale. Add a comment documenting this trade-off and a
TODO for when user count exceeds ~1000 (would need a materialized leaderboard table).

### 20. Caddy compression and caching — `Caddyfile`

**Problem**: Caddy serves static assets without explicit compression or cache headers.
Static assets (JS/CSS chunks) have content hashes in filenames but no `Cache-Control`
headers are set.

**Fix**: Add to Caddyfile:
```
funmarket.yuriforge.com {
    reverse_proxy localhost:3000
    encode gzip
    @static path /_next/static/*
    header @static Cache-Control "public, max-age=31536000, immutable"
}
```

---

## Summary

| # | Item | Files Changed | Priority |
|---|------|--------------|----------|
| 1 | Batch outcomes in markets listing | queries/markets.ts, markets/page.tsx | High |
| 2 | Batch holdings in dashboard | dashboard/page.tsx, queries/markets.ts | High |
| 3 | Batch holdings in profile | profile/page.tsx, queries/markets.ts | High |
| 4 | Batch holdings in portfolio | portfolio/page.tsx, queries/markets.ts | High |
| 5 | Harden CSP (remove unsafe-inline/eval) | middleware.ts | High |
| 6 | Add HSTS header | middleware.ts | Medium |
| 7 | Per-IP registration rate limit | register action, rate-limit.ts | Medium |
| 8 | Input sanitization | validators.ts | Medium |
| 9 | Resolution payout transaction | resolver.ts | High |
| 10 | Resolution activity log | resolver.ts | Low |
| 11 | Throttle auto-close | auto-close.ts | High |
| 12 | Soft-delete markets | schema.ts, queries/markets.ts | Medium |
| 13 | Add updated_at timestamps | schema.ts | Low |
| 14 | Trade history pagination | profile/page.tsx | Medium |
| 15 | Real-time price refresh | trade-panel.tsx | Medium |
| 16 | Achievement toast notifications | trade-panel, actions/* | Medium |
| 17 | Watchlist marketId index | schema.ts | Low |
| 18 | Comments marketId index | schema.ts | Low |
| 19 | Leaderboard pagination docs | leaderboard.ts | Low |
| 20 | Caddy compression + caching | Caddyfile | Low |
