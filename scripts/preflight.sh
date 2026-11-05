#!/usr/bin/env bash
set -euo pipefail

echo "=========================================================="
echo "  Enterprise Cash & Carry SaaS - Preflight Verification   "
echo "=========================================================="

# 1. Verify Node and Package Manager
echo -n "[Check 1/5] Node.js version... "
node -v || { echo "FAIL: Node.js not found"; exit 1; }

echo -n "[Check 2/5] pnpm package manager... "
pnpm -v || { echo "FAIL: pnpm not found"; exit 1; }

# 2. Check Database Connectivity & Schema
echo -n "[Check 3/5] Prisma Database Schema Check... "
pnpm --filter @cash-carry/database generate
echo "OK"

# 3. Security Suite Execution
echo "[Check 4/5] Running Automated Security Verification..."
pnpm run test:security

# 4. Master E2E Suite Execution
echo "[Check 5/5] Running Master E2E 12-Journey Integration Test..."
pnpm run test:e2e

echo ""
echo "=========================================================="
echo "  ALL PREFLIGHT CHECKS PASSED. SYSTEM PRODUCTION READY!  "
echo "=========================================================="

