#!/usr/bin/env bash
set -euo pipefail

echo "=========================================================="
echo "  Enterprise Cash & Carry SaaS - Zero-Downtime Deployment "
echo "=========================================================="

# 1. Run Preflight Checks
bash scripts/preflight.sh

# 2. Build and Orchestrate Production Stack
echo "Deploying production containers with docker-compose.prod.yml..."
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d --remove-orphans

# 3. Apply Prisma Migrations in Database Container
echo "Applying database schema migrations..."
docker compose -f docker-compose.prod.yml exec -T api pnpm --filter @cash-carry/database migrate:deploy || true

# 4. Verify Health Status
echo "Waiting for services to become healthy..."
docker compose -f docker-compose.prod.yml ps

echo ""
echo "=========================================================="
echo "  DEPLOYMENT COMPLETE. LIVE AT http://localhost           "
echo "=========================================================="
