# Multi-stage Dockerfile for NBA Live Web (React + Vite + Nginx)
FROM oven/bun:1.2-alpine AS builder
WORKDIR /app

# Dependencies
COPY package.json bun.lock* ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/

RUN bun install --frozen-lockfile || bun install

# Source code & compilation
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

WORKDIR /app/apps/web
RUN bun run build

# Production Nginx image
FROM nginx:alpine AS runner
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
