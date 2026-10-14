# Attest — Financial Verification & Continuous Assurance Platform

[![Test Suite](https://img.shields.io/badge/Vitest-67%2F67%20Passing-emerald)](file:///tests)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.27-blue)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Mode-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.4.1%20SQLite-indigo)](https://www.prisma.io/)
[![Audit Chain](https://img.shields.io/badge/Security-SHA--256%20Linked%20Chain-emerald)](file:///src/lib/audit.ts)

Attest is a financial verification and continuous assurance platform designed for modern business transparency. Businesses upload bank statements and accounting ledgers into an isolated workspace where a deterministic engine validates arithmetic continuity and reconciles discrepancies into actionable exceptions. Clients resolve exceptions with verifiable evidence, licensed Chartered Accountants review and sign off through pre-issuance gates, and an immutable, cryptographically signed trust certificate is issued that any external stakeholder can independently verify without logging in.

### What Attest is NOT:
- **NOT a Statutory Audit**: Attest does not substitute for a statutory financial audit under the Companies Act or international auditing standards; it delivers deterministic continuous verification and agreed-upon procedures.
- **NOT Bookkeeping Software**: Attest does not replace your ERP (QuickBooks, Xero, SAP); it ingests and cross-examines outputs from your existing systems against banking records.
- **NOT a Credit Bureau**: Attest does not score creditworthiness or issue credit ratings; it produces mathematically corroborated statements of historical financial reality.

---

## 1. Quick Start & Setup Guide

### Prerequisites
- **Node.js**: `v20.0.0` or higher (verified on Node 20 LTS)
- **Package Manager**: `npm` v10+

### Step-by-Step Installation

```bash
# 1. Clone repository and navigate to root directory
git clone https://github.com/attest-assurance/attest.git
cd attest

# 2. Install dependencies
npm install

# 3. Environment configuration
# Copy the example environment file or configure .env as below:
```

Create a `.env` file in the repository root:
```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="attest-development-secret-key-32-chars-long-minimum"
NEXTAUTH_SECRET="attest-development-secret-key-32-chars-long-minimum"
NEXTAUTH_URL="http://localhost:3001"
SIGNING_KEY="attest-dev-secret-signing-key-2026"
SIGNING_MODE="DEVELOPMENT"
DEMO_MODE="true"
NEXT_PUBLIC_DEMO_MODE="true"
```

```bash
# 4. Push database schema & generate Prisma client
npm run db:push
npm run db:generate

# 5. Seed the demonstration dataset (Meridian Textiles, rescaled x10 figures)
npm run db:seed

# 6. Start the local development server (running on port 3001)
npm run dev
```

Open your browser to: **[http://localhost:3001](http://localhost:3001)**

---

## 2. Demo Credentials & 8-Step Walkthrough

Attest includes pre-seeded demonstration personas for **Meridian Textiles (Pvt) Ltd** (a synthetic Pakistani textile exporter).

| Persona | Email | Password | Role / Workspace |
| :--- | :--- | :--- | :--- |
| **Client Owner** | `demo@attest.pk` | `Demo1234!` | Client Portal (`/portal`) — Upload statements, submit evidence |
| **Chartered Accountant** | `ca@attest.pk` | `Demo1234!` | CA Assurance Console (`/ca`) — Review evidence, execute sign-off |
| **Platform Administrator**| `admin@attest.pk`| `Demo1234!` | Governance (`/portal/governance`) — Idempotent demo reset |

### The 8-Step Investor Demo Walkthrough

1. **Sign In (`/auth/signin`)**: Click the **Client Owner** quick-login button (`demo@attest.pk`). The quick-login box is visible only when `DEMO_MODE="true"`.
2. **Explore Dashboard (`/portal`)**: Notice the persistent **DEMONSTRATION DATA** amber ribbon with the **Reset Demo** trigger. Inspect rescaled figures: Opening Balance PKR 800,000.00, Closing Balance PKR 1,636,500.00, and 8 verified statement transactions.
3. **Inspect Uploads & Trigger Verification (`/portal/sources`)**: Inspect the primary bank statement (`HBL_Statement_April_2026.pdf`) and general ledger (`General_Ledger_April_2026.csv`). Click **Run Reconciliation** to execute the deterministic engine.
4. **Inspect Surfaced Exceptions (`/portal/exceptions`)**: Two engineered exceptions appear:
   - **E-101 (Duplicate Payment, HIGH)**: PKR 118,500.00 debit to Zubair Traders on 15 Apr has no second invoice.
   - **E-102 (Unrecorded Credit, HIGH)**: PKR 340,000.00 export credit on 12 Apr has no matching general ledger entry.
5. **Resolve Exception as Client (`/portal/exceptions/e-101`)**: Open E-101. Walk through the 3-step resolution stepper: select *Duplicate payment reversal / supplier credit note*, explain that Zubair Traders credited back the amount on credit advice #9481, accept legal declaration, and click **Submit for CA Review**. Status transitions to `CLIENT_SUBMITTED`.
6. **Switch to CA Console (`/ca`)**: Sign in as **Chartered Accountant** (`ca@attest.pk`). The CA Console dashboard highlights 1 exception pending review. Open E-101, inspect the client's submitted evidence, and click **Accept Resolution**. Status becomes `RESOLVED`.
7. **Evaluate Pre-Issuance Gates & Sign Off (`/ca/sign-off`)**:
   - Inspect the 5 pre-issuance gates:
     - Gate 1: Source Period Statements Present &rarr; **PASS**
     - Gate 2: Arithmetic Continuity (Rules R1–R4) &rarr; **PASS**
     - Gate 3: Zero Open High/Critical Exceptions &rarr; **PASS**
     - Gate 4: Professional Conclusion Note &rarr; **PASS** (enter conclusion &ge; 50 chars)
     - Gate 5: Verification Level Honestly Computed &rarr; **PASS** (Level 2 Corroborated Assurance, 88% coverage)
   - Click **Sign & Issue Certificate**. Confirm in modal. An immutable certificate (`ATTEST-PK-2026-XXXXXX-CK`) is minted.
8. **Verify Publicly Logged-Out (`/verify/[id]`)**: Log out or open an Incognito window to `/verify/[id]`. Anyone can verify the certificate without an account:
   - Status: **VALID & CURRENT** (green shield).
   - Shows cryptographic SHA-256 payload hash and HMAC signature.
   - Displays CA conclusion and disclosed non-material limitations.
   - **Strict Privacy Shield**: Zero bank transactions, running balances, or counterparty accounts leaked.

---

## 3. Honest Limitations & Architectural Boundaries

In accordance with Section 4 of `ATTEST.md`, Attest is built on radical transparency:

1. **CSV-First Ingestion**: CSV bank statements and ledger exports parse with 100% deterministic fidelity. Scanned PDFs without embedded text streams are detected and flagged as `NEEDS_OCR` with zero fabricated rows.
2. **No Bank API Integrations (Client-Provided Statements)**: Attest does not integrate with Pakistani bank open banking APIs (which do not exist publicly). Bank statements are uploaded by the client. Cryptographic SHA-256 hashes prove **integrity-since-upload**, *not* original institutional authenticity.
3. **Single-Currency Enforcement**: All operations within an engagement must share one currency (`PKR`). Cross-currency conversions are strictly blocked to eliminate floating-point currency translation inaccuracies.
4. **Development-Mode Signatures**: In development mode, certificates are signed using HMAC-SHA256 with server-side keys. These are transparently labeled as `"development-mode integrity — not a qualified digital signature"`.
5. **SQLite Single-Server Architecture**: The MVP uses SQLite via Prisma for zero-setup, self-contained local demonstration. Enterprise production deployments migrate to PostgreSQL via standard Prisma datasource configuration.
6. **Certificate ID Enumeration Defense**: Public certificate IDs follow the format `ATTEST-PK-2026-[6-digit-code]-[2-char-suffix]`. The public verifier route `/verify/[id]` enforces an IP-based rate limit of 10 requests per minute with generic responses for unknown IDs to mitigate brute-force enumeration.
7. **Pakistan-Specific Metadata Labeling**: SECP company registration numbers and FBR National Tax Numbers (NTN) collected during onboarding are explicitly labeled in the UI and certificate metadata as: *"user-provided — not independently verified"*.
8. **In-App Notifications Only**: Real-time notifications and alerts are delivered through the in-app Notification Center. External delivery via SMTP email or WhatsApp Business API is deferred to post-MVP roadmap.

---

## 4. Test Suite, Build & Security Verification

Attest maintains 100% passing automated test coverage across 9 test suites:

```bash
# Run the complete Vitest automated test suite
npm test

# Run tests in watch mode
npm run test:watch

# Execute full production build
npm run build
```

### Verified Test Suite Counts

```text
 ✓ tests/hardening.test.ts (15 tests)
   - Money arithmetic edge cases (zero values, Number.MAX_SAFE_INTEGER, negative CSV rows)
   - R4 continuity across Month 1 -> Month 2 -> Month 3 and break detection
   - Matcher idempotency at scale (200 transactions; rerun produces 0 new exceptions)
   - Certificate canonical JSON key ordering invariance & hash stability
   - Concurrent processing-run safety (uniqueness constraint on dedupKey)
   - DEMO_MODE env flag gating quick-login rejection
   - Idempotent resetDemoData() re-seeding and audit chain verification
   - DEMONSTRATION DATA ribbon crawler across all demo routes
   - Auth endpoint IP rate limiting (5 req/min with lockout message)
   - Tenant download isolation (Org B requesting Org A doc -> 403 Forbidden)
   - Session default expiry (24 hours)

 ✓ tests/engine.test.ts (18 tests)
   - Deterministic matching (1:1, 1:Many, Partial)
   - Rule R1–R4 balance verification with 0 tolerance
   - Exception generation E-101 and E-102

 ✓ tests/certificate-verifier.test.ts (10 tests)
   - 5 Pre-issuance sign-off gates
   - HMAC-SHA256 signature verification & tamper detection
   - Certificate revocation and versioning (superseded certificates)
   - Public verifier privacy shield & consent charter download tokens

 ✓ tests/resolution-review.test.ts (9 tests)
   - Exception resolution stepper workflow
   - CA review loop & adjusting ledger entry generation

 ✓ tests/ingestion.test.ts (5 tests)
   - Rescaled Meridian statement parsing
   - Needs-OCR detection on scanned documents
   - Audit trail creation on category override

 ✓ tests/tenant-isolation.test.ts (2 tests)
   - Strict multi-tenant cross-org leakage prevention

 ✓ tests/money.test.ts (4 tests)
   - Integer paise minor units arithmetic & float rejection

 ✓ tests/audit.test.ts (2 tests)
   - SHA-256 linked audit hash chain integrity

 ✓ tests/auth-smoke.test.ts (2 tests)
   - RBAC permissions & password hashing

Test Files:  9 passed (9)
Tests:       67 passed (67)
Duration:    ~8.5s
```

### Security Pass Verification

1. **Client Bundle Secret Leak Audit**:
   ```powershell
   Get-ChildItem -Path .next/static -Recurse -File | Select-String -Pattern "attest-development-secret-key", "attest-dev-secret-signing-key", "NEXTAUTH_SECRET", "SIGNING_KEY"
   # Result: 0 matches found (bundles clean)
   ```
2. **Error Stack Trace Suppression**: All API endpoints catch internal exceptions and return sanitized JSON error payloads (`{ error: string }`) with zero leaked server stack traces.
3. **Tenant Boundary Enforcement**: Tested via `tests/hardening.test.ts` (attempt by tenant B to download tenant A source document returns HTTP 403 Forbidden).

---

## 5. Master Implementation Status Table

| Spec Dimension | Status | Implementation Details | Test Proof & Reference |
| :--- | :--- | :--- | :--- |
| **Money Rule** (Paise Minor Units) | **IMPLEMENTED** | Integer paise arithmetic throughout schema, engine, and UI; float rejection. | `tests/money.test.ts`, `tests/hardening.test.ts` |
| **Ingestion Engine** (CSV/PDF) | **IMPLEMENTED** | Validates headers, sizes, SHA-256 hash deduping; isolates storage by orgId. | `tests/ingestion.test.ts`, `src/lib/parser/csv.ts` |
| **Validation Rules R1–R4** | **IMPLEMENTED** | Balance continuity, running arithmetic, and multi-period R4 continuity checked with zero tolerance. | `tests/ingestion.test.ts`, `tests/hardening.test.ts` |
| **Deterministic Matcher** | **IMPLEMENTED** | Pass 1 (1:1), Pass 2 (1:Many split payments), Pass 3 (Partial payments); zero AI dependency. | `tests/engine.test.ts`, `src/engine/matcher.ts` |
| **Exception Generator** | **IMPLEMENTED** | Generates E-101 duplicate payments, E-102 unrecorded credits, category-aware evidence checks. | `tests/engine.test.ts`, `src/engine/exceptions.ts` |
| **Exception Resolution Loop** | **IMPLEMENTED** | Client 3-step resolution stepper modal; CA review workpaper; auto-adjusting entries on approval. | `tests/resolution-review.test.ts`, `/portal/exceptions` |
| **Pre-Issuance Sign-Off Gates**| **IMPLEMENTED** | Server-enforced 5-gate checklist: statements present, R1-R4 pass, 0 high exceptions, CA note &ge;50 chars, level computed. | `tests/certificate-verifier.test.ts`, `src/lib/gates.ts` |
| **Cryptographic Signing** | **IMPLEMENTED** | Deterministic recursive JSON canonicalization; SHA-256 payload hash; HMAC-SHA256 signature. | `tests/certificate-verifier.test.ts`, `src/lib/certificate.ts` |
| **Public Verifier** (`/verify/[id]`) | **IMPLEMENTED** | Logged-out public verification; zero transaction leaks; rate-limited; revocation & superseded badges. | `tests/certificate-verifier.test.ts`, `/verify/[id]` |
| **Third-Party Consent Charter** | **IMPLEMENTED** | Timed cryptographic download tokens (7 days) for scoped evidence packs; category access controls. | `tests/certificate-verifier.test.ts`, `/api/disclosures` |
| **Demo Mode & Reset Action** | **IMPLEMENTED** | Quick-login gated behind `DEMO_MODE`; idempotent reset button & modal for PlatformAdmin. | `tests/hardening.test.ts`, `src/lib/demoReset.ts` |
| **Security & Tenant Isolation** | **IMPLEMENTED** | Login rate limiting (5/min/IP); org-scoped file downloads; zero client bundle secrets; 24h session expiry. | `tests/hardening.test.ts`, `tests/tenant-isolation.test.ts` |
| **Scanned Document OCR** | **DELIBERATELY DEFERRED** | Scanned PDFs detected and tagged `NEEDS_OCR` without fabricating rows. Full OCR deferred post-MVP. | `tests/ingestion.test.ts` |
| **Direct Bank API Ingestion** | **DELIBERATELY DEFERRED** | Open banking APIs do not exist in Pakistan; statements are client-provided CSV/PDF. | `ATTEST.md` Section 4 |
| **PKI Hardware Qualified Signatures** | **DELIBERATELY DEFERRED** | Production USB cryptographic tokens / Cloud KMS HSM deferred; HMAC development-mode signature active. | `ATTEST.md` Section 4 |
| **Multi-Currency Conversion** | **DELIBERATELY DEFERRED** | Single currency enforced per engagement (`PKR`) to prevent currency conversion rounding inaccuracies. | `src/engine/matcher.ts` |
| **Email / WhatsApp Delivery** | **DELIBERATELY DEFERRED** | Transactional messaging deferred; in-app Notification Center and copyable verification links active. | `src/components/common/NotificationBell.tsx` |

---

## License

This project is proprietary and confidential. Built for continuous financial assurance.
