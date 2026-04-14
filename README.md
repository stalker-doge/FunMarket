# FunMarket

A prediction market platform where users trade on real-world outcomes using virtual currency. Built with Next.js, SQLite, and an LMSR-based pricing engine.

## Tech Stack

- **Framework:** Next.js 15 (App Router, Server Components, Server Actions)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Database:** SQLite via libSQL + Drizzle ORM
- **Auth:** JWT (jose) + bcrypt password hashing
- **Icons:** Lucide React

## Getting Started

```bash
# Install dependencies
npm install

# Push database schema
npm run db:push

# Start development server
npm dev
```

The app runs at `http://localhost:3000`. Register an account to get started with 5,000 FunBucks.

## Features

### Markets

- **Create markets** with a multi-step wizard — question, description, category, image, closing date, and 2–8 custom outcomes
- **Browse and search** markets with filters for status, category, and sort order
- **Trade shares** on outcomes you predict; prices reflect real-time probabilities via the LMSR algorithm
- **Sell shares** back to the market before resolution
- **Categories:** Sports, Crypto, Tech, Politics, Entertainment, Science, Other

### Market Resolution

- Market creators resolve their markets by selecting the winning outcome
- Optional resolution notes for context and evidence
- Markets auto-close when their closing date passes (trading disabled, resolution still available)
- Winning shares pay out at 1 FunBuck per share

### Dashboard

- Personalized home page with portfolio overview
- Quick stats: balance, net worth, active positions, total invested
- Trending markets, watchlist preview, and recent activity feed

### Portfolio

- Full holdings breakdown with unrealized value and P&L per position
- Summary cards for balance, net worth, invested capital, and total P&L
- Watchlist section showing starred markets
- CSV export of all trade history

### User Profiles

- Editable display name, email display, join date
- Public profiles at `/user/[username]` showing markets created, trade history, and stats
- Leaderboard rankings by net worth with podium for top 3

### Social

- **Comments** on market pages with threaded replies
- **Watchlist** — star markets to track them from your portfolio
- **Activity feed** — site-wide log of market creation, resolution, and other events

### Gamification

- **10 achievements** to unlock (First Steps, Getting Started, Big Winner, High Roller, Market Maker, Prolific Creator, Diversified, Wealthy, Weekly Regular, Commentator)
- Achievement progress bar and badge grid on profile page

### Onboarding

- First-time users see a 4-slide walkthrough explaining how the platform works
- Dismissed permanently after completion

### Other

- **Dark/light theme** toggle with system preference detection
- **Responsive design** with mobile bottom navigation
- **Daily allowance** — claim 1,000 FunBucks every day
- **Real-time price chart** on market detail pages
- **Gravatar avatars** based on email

## Project Structure

```
src/
├── actions/          # Server Actions (mutations)
├── app/
│   ├── (auth)/       # Login, Register
│   ├── (main)/       # Dashboard, Markets, Portfolio, Profile, etc.
│   └── api/auth/     # Auth API routes
├── components/       # React components (client + server)
├── hooks/            # Custom React hooks
├── lib/
│   ├── achievements/ # Achievement definitions and checker
│   ├── auth/         # Session, JWT, password utilities
│   ├── db/
│   │   ├── schema.ts # Drizzle schema (all tables)
│   │   └── queries/  # Database query functions
│   ├── market-engine/# LMSR pricing, resolution, auto-close
│   ├── allowance.ts  # Daily allowance logic
│   ├── categories.ts # Market category definitions
│   ├── gravatar.ts   # Avatar URL helper
│   └── utils.ts      # Shared utilities (formatMoney, cn)
└── types/            # TypeScript type definitions
```

## Database Schema

| Table | Purpose |
|---|---|
| `users` | Accounts with balance, onboarding state |
| `markets` | Prediction questions, status, category, resolution |
| `outcomes` | Possible outcomes per market with share counts |
| `trades` | Buy/sell records with price and quantity |
| `allowance_log` | Daily allowance claim history |
| `watchlist` | User-starred markets |
| `comments` | Threaded market discussions |
| `achievements` | Badge definitions |
| `user_achievements` | Unlocked badges per user |
| `activity_log` | Site-wide event feed |

## Pricing Engine

Markets use the **Logarithmic Market Scoring Rule (LMSR)** for automated market making. The liquidity parameter is set to 100 per market, which determines price sensitivity to trades. Prices for all outcomes always sum to approximately 1.0, representing probabilities.

## Scripts

| Command | Description |
|---|---|
| `npm dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push schema changes to database |
| `npm run db:generate` | Generate migration files |
| `npm run db:migrate` | Run migrations |
