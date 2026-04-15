FROM node:22-alpine AS base

# --- Dependencies ---
FROM base AS deps
WORKDIR /app
COPY package.json ./
RUN npm install

# --- Builder ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# --- Migrator (full deps for drizzle-kit) ---
FROM base AS migrator
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY drizzle.config.ts .
COPY src/lib/db/schema.ts ./src/lib/db/schema.ts
CMD ["npx", "drizzle-kit", "push"]

# --- Runner ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone build output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy native modules not included in standalone output
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@libsql ./node_modules/@libsql

# Create data directory for SQLite database
RUN mkdir -p /data && chown nextjs:nodejs /data

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
