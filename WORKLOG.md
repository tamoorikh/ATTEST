# WORKLOG — Attest Platform Engineering Log

## Phase: P0: Foundation
**Date**: October 14, 2026  
**Status**: COMPLETE ✅  
**Commit Message**: `P0: foundation`

---

### 1. Architectural Summary & Stack
- **Framework**: Next.js 15 (App Router) + TypeScript (strict mode)
- **Styling**: Tailwind CSS adhering to fintech aesthetic (light warm-neutral `#F7F7F5`, deep ink `#0B1220`, verified accent `#2456E6`, warning amber `#D97706`, error crimson `#DC2626`)
- **Database & ORM**: SQLite (`dev.db`) via Prisma ORM v6
- **Authentication**: NextAuth.js Credentials Provider with bcrypt password hashing
- **Validation**: Zod schema validation
- **Testing**: Vitest with unit and multi-tenant isolation integration test suites

---

### 2. What Works (Fully Functional & Verified)

#### A. Database Schema (Prisma v1)
- Implemented all 18 models org-owned with cascade deletion rules and `orgId` indexes everywhere:
  `User`, `Organization`, `Membership`, `CompanyProfile`, `BankAccount`, `SourceDocument`, `BankTransaction`, `LedgerEntry`, `Match`, `Exception`, `ExceptionComment`, `ExceptionEvidence`, `ReviewNote`, `ProcessingRun`, `Certificate`, `DisclosureRequest`, `Notification`, `AuditEvent`.
- SQLite database generated and synced via `prisma db push`.

#### B. The Money Rule
- All currency values stored and calculated as integer minor units (`paisa`).
- Zero floating-point representation in monetary calculations.
- Display formatting utility `formatPaise` handles conversion to major units at presentation boundary only (`PKR 48,620.00`).
- Tested with Vitest (`tests/money.test.ts`), confirming rejection of floats.

#### C. The Sacred Authority Rule
- Core business logic: *"AI proposes. Deterministic code validates. Authorized humans approve."*
- Certificate issuance and exception waivers are explicitly reserved for licensed Chartered Accountants (`CA-reviewer` role). LLMs have zero write access to certificate state or signing keys.

#### D. Honesty & Disclosure Rules
- Built persistent `DEMONSTRATION DATA — NOT FOR REAL-WORLD FINANCIAL RELIANCE` banners across all screens belonging to demo organizations (`isDemo: true`).
- Development-mode signature disclaimer (`development-mode integrity — not a qualified digital signature`) displayed in CA Sign-off Chamber and Public Verifier.
- File integrity notice clearly explains that SHA-256 hashes certify upload-integrity, not source provenance.

#### E. Append-Only Cryptographic Audit Log
- Built `src/lib/audit.ts` with SHA-256 hash chaining (`prevHash` -> `hash`).
- Each state transition links to its predecessor. Tested and verified in `tests/audit.test.ts`.

#### F. Multi-Tenant Isolation & Role Authorization
- Tenant isolation helpers (`validateTenantAccess`) ensure sessions cannot leak or read cross-tenant data.
- Cross-tenant test (`tests/tenant-isolation.test.ts`) provisions a secondary tenant (`Lahore Garments Co`) with confidential transactions and proves that queries filtered by Org A's tenant boundary strictly return zero records from Org B.
- Middleware guards `/portal` for client roles and `/ca` for CA reviewers.

#### G. Seed Dataset (Meridian Textiles Pvt Ltd)
- Seed script `prisma/seed.ts` executed and verified via `scripts/verify-db.ts`:
  - Demo Organization: "Meridian Textiles (Pvt) Ltd" (Lahore, `isDemo: true`).
  - Users: `demo@attest.pk` (Owner) and `ca@attest.pk` (CA-reviewer), password `Demo1234!`.
  - 8 Bank Transactions (April 2026): Opening balance 8,000,000 paisa, running balances calculated sequentially with 100% arithmetic continuity validation (`balanceOk: true`), closing balance 16,365,000 paisa.
  - 7 General Ledger Entries: Missing entry for 12 Apr credit (E-102 unrecorded sale).
  - Purchase Register: Contains only 1 Zubair Traders invoice (#ZT-1141 for 1,185,000 paisa) against two bank payments (E-101 duplicate payment).
  - Sales Register: FBR invoice #SI-2026-3387 dated 11 Apr for 3,400,000 paisa.
  - Cryptographic audit hash chain initialized with 6 linked events.

#### H. Three Unified Interface Shells
1. **Client Portal (`/portal`)**:
   - `/portal`: Dashboard with assurance metrics, reconciliation progress, and actionable exception cards.
   - `/portal/transactions`: Bank statements and running balance arithmetic breakdown.
   - `/portal/ledger`: General ledger accounts.
   - `/portal/exceptions`: Resolution desk for submitting evidence and explanations.
   - `/portal/documents`: Cryptographic source document repository.
   - `/portal/certificate`: Trust certificate preview and public sharing link.
2. **CA Console (`/ca`)**:
   - `/ca`: Assurance review chamber and engagement overview.
   - `/ca/exceptions`: Independent CA review of exceptions and corroborating evidence.
   - `/ca/reconciliation`: Deterministic engine rules inspection.
   - `/ca/audit-trail`: Cryptographic hash chain viewer with SHA-256 parent link inspection.
   - `/ca/sign-off`: CA digital signing chamber with open exception blockers and dev-mode disclosure.
3. **Public Verifier (`/verify`)**:
   - `/verify`: Unauthenticated public search by Certificate ID.
   - `/verify/[id]`: Live public verification view (e.g. `/verify/CERT-2026-04-MTL-001`) with scope, coverage, legal registry info, and third-party disclosure request form.

---

### 3. What is Partial / Deferred to Next Phases
- **File Parser Ingestion Pipeline (P1)**: Custom PDF/CSV parsing pipeline for user-uploaded bank statements (currently seeded via deterministic dataset).
- **Rule Engine Execution Trigger (P1)**: Interactive web trigger to re-run reconciliation algorithms dynamically upon new file upload.
- **Hardware Security Module (HSM) PKI Signing (P2)**: Qualified digital signatures for production deployment (currently development-mode SHA-256 hash signatures).

---

### 4. What is Blocked
- **None**: All dependencies, builds, tests, and runtime verification scripts execute cleanly with zero errors.

---

### 5. Verification Test & Build Log
- `npm test`: 4 test suites passed, 10 tests passed (100%).
- `npm run build`: 19 routes successfully compiled and optimized.
- Dev server runtime: Automated script `scripts/exercise-dev-server.ts` validated all routes, redirects, and authenticated sessions.
