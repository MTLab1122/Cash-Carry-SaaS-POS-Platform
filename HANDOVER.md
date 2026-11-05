# Enterprise Cash & Carry Management & POS SaaS — Production Handover Runbook

## 1. System Architecture & Overview

The **Enterprise Cash & Carry Management SaaS** is an offline-first, multi-tenant retail management and point-of-sale platform designed specifically for high-throughput grocery stores, supermarkets, cash-and-carry wholesalers, and retail chains in Pakistan and South Asia.

```mermaid
graph TD
    ClientWeb["Next.js 14 Web Console<br/>Port 3000"] --> Nginx["Nginx Reverse Proxy<br/>Port 80/443"]
    ClientDesktop["Electron Desktop POS<br/>Offline SQLite Engine"] --> Nginx
    ClientMobile["Flutter Mobile App<br/>Camera Barcode Scanner"] --> Nginx

    Nginx --> ApiGateway["NestJS API Gateway & Services<br/>Port 4000 (/api/v1)"]
    
    ApiGateway --> SecurityMiddleware["Security Hardening Pipeline<br/>Helmet CSP, Rate Limiter, ProblemDetails"]
    SecurityMiddleware --> AppModules["Modular Monolith Services<br/>POS, Inventory, Finance, AI, Sync"]
    
    AppModules --> PostgresDB[("PostgreSQL 16 Multi-Tenant DB<br/>Row-Level Tenant Isolation")]
    AppModules --> RedisCache[("Redis 7 Cache & BullMQ Queue")]
    AppModules --> AIEngine["AI Plug & Play Gateway<br/>OpenAI, Anthropic, Gemini, Ollama"]
```

---

## 2. Platform Deliverables & Ports

| Application / Service | Technology | Port | Access URL |
| :--- | :--- | :--- | :--- |
| **Nginx Reverse Proxy** | Nginx Alpine | `80`, `443` | `http://localhost/` |
| **Web Management Console** | Next.js 14 App Router | `3000` | `http://localhost:3000/` |
| **Backend REST & WebSocket API** | NestJS, Socket.io | `4000` | `http://localhost:4000/api/v1` |
| **Swagger OpenAPI Docs** | Swagger UI | `4000` | `http://localhost:4000/api/docs` |
| **Desktop POS Terminal** | Electron, React, Durable Queue | Local Client | Windows Standalone Executable |
| **Mobile Retail Monitor** | Flutter, Dart | Mobile OS | Android / iOS Package |
| **PostgreSQL Database** | PostgreSQL 16 Alpine | `5432` | `localhost:5432` |
| **Redis Cache / Queue** | Redis 7 Alpine | `6379` | `localhost:6379` |

---

## 3. Pakistan Market Localization & FBR Readiness

- **Currency:** Pakistani Rupee (`PKR`) formatted across all checkout screens, receipts, invoices, and ledgers.
- **Taxation:** Automatic 18% General Sales Tax (`GST`) calculation on applicable grocery, confectionery, and household items.
- **FBR Tier-1 Invoicing Readiness:** Sales headers track `fbrInvoiceNo` and `fbrQrCode` generation ready for the FBR POS fiscalization API integration.
- **Tax Identity Records:** Full tenant and supplier fields for National Tax Number (`NTN`) and Sales Tax Registration Number (`STRN`).
- **Timezone:** Standardized on `Asia/Karachi` (`UTC+05:00`).

---

## 4. Hardware Configuration Guide

1. **Thermal Receipt Printers:**
   - Supports any standard 80mm or 58mm ESC/POS thermal printer (USB, Network/Ethernet, or Bluetooth).
   - Character width: 48 columns (80mm) or 32 columns (58mm).
2. **Barcode Scanners:**
   - Compatible with all plug-and-play USB, 2.4GHz wireless, and Bluetooth 1D/2D barcode scanners operating in HID keyboard emulation mode.
   - Fast sub-500ms automatic lookups for EAN-13, Code 128, and custom SKU barcodes.
3. **Cash Drawers:**
   - Standard RJ11/RJ12 drawer kick interface connected via thermal receipt printer pin 2/5 (`\x1B\x70\x00\x19\xFA`).

---

## 5. Security & Isolation Matrix

- **Multi-Tenant Boundaries:** Every database query, inventory ledger mutation, and AI prompt context explicitly filters `WHERE tenant_id = :currentTenantId`.
- **HTTP Security Hardening:** Helmet configured with strict CSP (`defaultSrc: ["'self'"]`, `frameAncestors: ["'none'"]`), HSTS with 1-year max-age, and `frameguard: { action: 'deny' }`.
- **Sliding-Window Rate Limiting:**
  - Global API: Max 100 requests per 60 seconds per IP.
  - Auth Endpoints (`/login`, `/register`, `/forgot-password`, `/reset-password`): Max 5 requests per 15 minutes per IP/email returning HTTP `429 Too Many Requests` with standard `Retry-After` headers.
- **Cryptographic Auth Flows:**
  - Password Reset: 32-byte crypto random tokens stored as SHA-256 hashes with 15-minute TTL, single-use consumption, and automatic refresh session invalidation.
  - Password Hashing: Bcrypt with cost factor 12.
- **Problem Details Exception Filter:** RFC 7807 problem details compliant JSON responses with unique `traceId` and structured observability logging.

---

## 6. Environment Variables Reference

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `NODE_ENV` | Runtime environment | `production` / `development` |
| `PORT` | API server port | `4000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres123@localhost:5432/cashcarry_saas` |
| `REDIS_URL` | Redis cache connection string | `redis://localhost:6379` |
| `JWT_SECRET` | Secret key for signing JWTs | `super-secret-jwt-key-min-32-chars-2026` |
| `ENCRYPTION_MASTER_KEY` | AES-256-GCM key for BYOK credentials | `cc_saas_enterprise_master_key_32b_2026` |
| `ALLOWED_ORIGINS` | Permitted CORS frontend origins | `http://localhost:3000,http://localhost` |
| `NEXT_PUBLIC_API_URL` | Frontend API target | `http://localhost:4000/api/v1` |

---

## 7. Verification Test Suite Matrix

The entire platform is backed by self-healing, automated verification test suites:

```bash
# 1. Architecture & Security Hardening Verification
pnpm run test:security

# 2. Navigation, Routing & RBAC Verification
pnpm run test:routing

# 3. Public Landing Page, SEO, AEO & Schema.org Verification
pnpm run test:seo

# 4. Financial Flows, Returns Engine & Ledger Verification
pnpm run test:financials

# 5. AI Engine, BYOK Encryption & PII Scrubbing Verification
pnpm run test:ai-isolation

# 6. Desktop Offline POS & Idempotent Replay Verification
pnpm run test:offline-sync

# 7. Master End-to-End 12-Journey Integration Suite
pnpm run test:e2e
```

---

## 8. Day-2 Operations & Runbook

### Database Backup
```bash
docker exec -t cashcarry-postgres-prod pg_dump -U postgres cashcarry_saas > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Database Restore
```bash
cat backup_file.sql | docker exec -i cashcarry-postgres-prod psql -U postgres -d cashcarry_saas
```

### Redis Cache Flush
```bash
docker exec -it cashcarry-redis-prod redis-cli FLUSHALL
```

### Rotation of Encryption Master Key
1. Export unencrypted BYOK keys via the internal administrative key migration utility.
2. Update `ENCRYPTION_MASTER_KEY` in environment secrets.
3. Re-encrypt all tenant API keys and restart the API gateway.
