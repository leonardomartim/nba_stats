# Multi-stage Dockerfile for NBA Live API (Bun + TypeScript)
FROM oven/bun:1.2-alpine AS base
WORKDIR /app

# Step 1: Dependencies installation
FROM base AS dependencies
COPY package.json bun.lock* ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

RUN bun install --frozen-lockfile || bun install

# Step 2: Build
FROM dependencies AS builder
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Step 3: Production runner
FROM oven/bun:1.2-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api ./apps/api

EXPOSE 3001

WORKDIR /app/apps/api
CMD ["bun", "src/index.ts"]
