# ==========================================
# Stage 1: Build Dependencies
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@12.16.1

# Copy workspace configurations
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/database/package.json ./packages/database/
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source trees
COPY packages/shared ./packages/shared
COPY packages/database ./packages/database
COPY apps/api ./apps/api

# Generate Prisma Client & Build packages
RUN pnpm --filter @cash-carry/shared build
RUN pnpm --filter @cash-carry/database generate
RUN pnpm --filter @cash-carry/api build

# ==========================================
# Stage 2: Production Runner
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Install pnpm
RUN npm install -g pnpm@12.16.1

# Copy package manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/database/package.json ./packages/database/
COPY apps/api/package.json ./apps/api/

# Copy built artifacts and Prisma schemas
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Install production-only dependencies
RUN pnpm install --prod --frozen-lockfile
RUN pnpm --filter @cash-carry/database generate

# Non-root security user
USER node

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/v1/sync/ping || exit 1

CMD ["node", "apps/api/dist/main"]

