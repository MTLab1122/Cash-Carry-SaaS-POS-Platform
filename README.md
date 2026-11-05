# Enterprise Cash & Carry Management & POS SaaS Platform

Production-grade, multi-tenant Cash & Carry Management SaaS and Point-of-Sale (POS) ecosystem built for supermarkets, retail chains, wholesalers, and cash-and-carry businesses.

![Cash & Carry Management SaaS](./C:/Users/muham/.gemini/antigravity/brain/7adf4b8a-9398-4524-8475-857e0ad35f73/.user_uploaded/media_1793896356580_86538f7c.jpg)

---

## 🚀 Key Deliverables

1. **Web Management Portal (`apps/web`)**
   - Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide Icons.
   - Comprehensive multi-branch dashboard, branch switching, product catalog with GS1 EAN-13 barcodes, thermal label generator, inventory ledger, purchasing (GRN), customer credit accounts, profit & loss statements, cashier performance rankings, and SaaS Super Admin panel.
   - Integrated full-screen POS Billing mode with barcode scanner support, tax computation (18% GST), split payments, and thermal receipt printing.

2. **Backend API (`apps/api`)**
   - Modular Monolith in NestJS, TypeScript, REST API (`/api/v1`), Swagger OpenAPI (`/api/docs`), and WebSockets.
   - Granular RBAC (`SUPER_ADMIN`, `BUSINESS_OWNER`, `BRANCH_MANAGER`, `CASHIER`, `INVENTORY_MANAGER`, etc.).
   - Atomic database transactions for checkout, stock movements, and ledger verification.
   - Multi-tenant tenant boundary enforcement at API, service, and database levels.

3. **Database & Persistence (`packages/database`)**
   - Prisma ORM with relational models for tenants, branches, warehouses, products, batches, stock ledgers, sales, payments, purchases, expenses, and cash sessions.
   - Seeded with Pakistani retail demo data matching real market products (Olper's Milk, Dalda Cooking Oil, Shan Masala, Tapal Tea, Fresh Produce).

4. **Windows Desktop POS with Offline Synchronization (`apps/desktop`)**
   - Dedicated Electron application with local offline database and durable queue.
   - Idempotent transaction synchronization with backend using UUID-based `localId`.
   - Auto-retry sync engine when connection is restored.
   - Hardware integration hooks for ESC/POS 80mm thermal receipt printers and RJ11 cash drawers.

5. **Cross-Platform Mobile Application (`apps/mobile`)**
   - Flutter / Dart application for store owners and mobile managers.
   - Today's sales trajectory, camera barcode scanner, real-time inventory balances, low-stock notifications, and AI business assistant chat.

6. **AI Business Intelligence Engine**
   - Natural language business advisor answering profitability, revenue, and margin queries.
   - Predictive demand forecasting and automated reorder recommendations.

7. **Pakistan Market Localization & FBR Readiness**
   - Standard default currency: PKR.
   - Timezone: `Asia/Karachi` (PKT +05:00).
   - Sales tax (GST) rate configurations (default 18%).
   - Business NTN and STRN tracking on invoices and receipts.
   - Tier-1 POS integration hooks with verifiable QR codes.

---

## 🔑 Seeded Demo Credentials

| Role | Email | Password | Scope |
| :--- | :--- | :--- | :--- |
| **SaaS Super Admin** | `superadmin@system.local` | `Admin123!` | Global Platform Governance |
| **Business Owner** | `admin@abcmart.pk` | `Admin123!` | ABC Mart & Cash Carry (Head Office) |
| **Branch Manager** | `manager@abcmart.pk` | `Admin123!` | Gulberg Superstore (Main Branch) |
| **POS Cashier** | `cashier@abcmart.pk` | `Admin123!` | Lane 1 - Express Counter |
| **Inventory Manager** | `inventory@abcmart.pk` | `Admin123!` | Central Warehouse Ledger |

---

## 🛠️ Quick Start & Running Locally

### 1. Prerequisites
- Node.js >= 18
- pnpm >= 9 (`npm install -g pnpm`)

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Initialize & Seed Database
```bash
pnpm --filter @cash-carry/database db:push
pnpm --filter @cash-carry/database seed
```

### 4. Run Automated Scenario Test Suite (12 Core Tests)
```bash
pnpm --filter @cash-carry/database test:scenarios
```

### 5. Start Backend API
```bash
pnpm --filter @cash-carry/api start
# API available at http://localhost:4000/api/v1
# Swagger docs at http://localhost:4000/api/docs
```

### 6. Start Web Application & POS
```bash
pnpm --filter @cash-carry/web dev
# Web app running at http://localhost:3000
# POS interface at http://localhost:3000/pos
```

### 7. Start Windows Desktop POS
```bash
pnpm --filter @cash-carry/desktop start
```

---

## 🧪 Acceptance Scenarios Verification Results

The automated test runner (`pnpm --filter @cash-carry/database test:scenarios`) verifies all 12 mandatory criteria:

- `[PASS]` **01. Multi-tenant Data Isolation**: Isolated businesses cannot view or query each other's catalogs or sales.
- `[PASS]` **02. Barcode Scanning**: Scanner directly resolves product details, authorized pricing, and active stock.
- `[PASS]` **03. Barcode Generation**: Produces GS1-compliant EAN-13 barcodes with valid modulo-10 checksum validation.
- `[PASS]` **04. Atomic Stock Deductions**: Completed sales decrement stock balances exactly once and generate immutable ledger entries.
- `[PASS]` **05. Payment Integrity**: Failed or declined payments rollback transactions and never produce phantom sales.
- `[PASS]` **06. Returns & Refunds**: Sales returns restore physical warehouse stock and record auditable financial refunds.
- `[PASS]` **07. Idempotent Offline Sync**: Re-sent offline sales with existing `localId` are safely de-duplicated without double-charging or stock drift.
- `[PASS]` **08. Concurrent Checkout**: Concurrent checkout transactions preserve atomic balance consistency.
- `[PASS]` **09. Cashier RBAC**: Restricts cashiers from deleting products or tampering with business configurations.
- `[PASS]` **10. Subscription Limits**: Restricts branch and terminal creation past provisioned plan limits.
- `[PASS]` **11. Financial Reconciliation**: Revenue and profit metrics accurately reconcile with transaction sums.
- `[PASS]` **12. AI Isolation**: Business intelligence assistant queries strictly within tenant boundaries.
