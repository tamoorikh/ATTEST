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
- **Automated Bookkeeping Reconciler (P2)**: Multi-way matching engine linking bank transactions against ledger and invoices (P2).
- **Hardware Security Module (HSM) PKI Signing (P3)**: Qualified digital signatures for production deployment (currently development-mode SHA-256 hash signatures).

---

### 4. What is Blocked
- **None**: All dependencies, builds, tests, and runtime verification scripts execute cleanly with zero errors.

---

### 5. Verification Test & Build Log
- `npm test`: 4 test suites passed, 10 tests passed (100%).
- `npm run build`: 19 routes successfully compiled and optimized.
- Dev server runtime: Automated script `scripts/exercise-dev-server.ts` validated all routes, redirects, and authenticated sessions.

---

## Phase: P1: Client Ingestion
**Date**: October 14, 2026  
**Status**: COMPLETE ✅  
**Commit Message**: `P1: ingestion`

---

### 1. Phase 0 Review Corrections
1. **Meridian Figures Rescaled 10x**:
   - Opening Balance: PKR 800,000.00 (80,000,000 paisa)
   - Payroll: PKR 486,200.00 (48,620,000 paisa)
   - Export Credit: PKR 1,240,000.00 (124,000,000 paisa)
   - Zubair Traders (x2 payments): PKR 118,500.00 each (11,850,000 paisa each)
   - Fancy Fabrics: PKR 74,300.00 (7,430,000 paisa)
   - 12 Apr Credit: PKR 340,000.00 (34,000,000 paisa)
   - Utilities: PKR 42,000.00 (4,200,000 paisa)
   - Marketplace Settlement: PKR 96,000.00 (9,600,000 paisa)
   - Closing Balance: PKR 1,636,500.00 (163,650,000 paisa)
   - Net Movement: ~PKR 17M monthly movement.
   - Running balance arithmetic continuity verified: 100% pass (`balanceOk: true`).
2. **Demo Persona Gating**:
   - Added rule to `ATTEST.md`: *"Persona quick-login must be gated behind DEMO_MODE env flag; forbidden when DEMO_MODE is not 'true'."*
   - Implemented gate in `src/app/auth/signin/page.tsx` rendering quick-login only when `NEXT_PUBLIC_DEMO_MODE === "true"`.

---

### 2. What Works (Fully Functional & Verified)

#### A. Resumable Onboarding Wizard (`/portal/onboarding`)
- 4-step wizard:
  1. **Company Profile**: Legal Name, NTN, SECP Registration with mandatory badge: *"user-provided — not independently verified"*.
  2. **Sources Declared**: Bank accounts, ERP/accounting system, sales register declarations.
  3. **Authorizations & Consents**: Explicit legal checkboxes for third-party disclosure and statutory compliance.
  4. **Readiness Summary**: Onboarding readiness score and submission handler.
- Resumable: Stores `onboardingStep` in `CompanyProfile`; users resume where they left off. Writes `COMPANY_ONBOARDING_COMPLETED` audit event.

#### B. Document Upload & Storage Workspace (`/portal/sources`)
- Server-side validation: Accepts `.csv` and `.pdf`, enforces 25MB max size.
- Cryptographic Deduping: Computes SHA-256 hash before disk/DB write; rejects duplicates with clear 409 error explaining audit trail protection.
- Isolated Storage: Stores files under `./storage/[orgId]/[sha256]_[filename]`.
- Permission-Checked Downloads: Access gated via `/api/documents/[id]/download`, verifying tenant membership before streaming bytes.

#### C. Ingestion Parser Service
- **CSV Parser (`src/lib/parser/csv.ts`)**: Auto-detects delimiters (`,`, `;`, `\t`, `|`), discovers header columns (Date, Description, Counterparty, Ref, Debit, Credit, Balance), parses ISO and Pakistani date formats (`DD/MM/YYYY`, `YYYY-MM-DD`), and parses minor units (paisa) without float representation.
- **PDF Parser (`src/lib/parser/pdf.ts`)**: Uses `pdf-parse` class loader. When scanned or lacking structured table text, marks `parseStatus = "NEEDS_OCR"` with honest message: *"scanned PDF requires OCR — not available in MVP; upload the CSV from your bank."* ZERO fabricated rows.

#### D. Deterministic Normalization & Validation Engine (`src/lib/validator/rules.ts`)
- Normalizes rows into `BankTransaction` records with integer paisa amounts.
- Persists validation metrics in `ProcessingRun.statsJson`:
  - **R1 (Balance Reconciliation)**: `opening + credits - debits = closing` with strictly 0 paisa tolerance. On mismatch, generates `STATEMENT_BALANCE_MISMATCH` Critical Exception.
  - **R2 (Running Balance Chaining)**: Verifies row-by-row arithmetic chain.
  - **R3 (Duplicate Transaction Detection)**: Identifies identical debits/credits on same date with same description.
  - **R4 (Consecutive Statement Continuity)**: Validates opening balance chains from prior period's closing balance.
- Generates actionable exceptions with clear remediation suggestions.
- Reruns append new `ProcessingRun` records, never overwriting historical runs.

#### E. Transaction Explorer (`/portal/transactions`)
- Server-side paginated explorer with search, period filters, and category filters.
- Shows Date, Description, Counterparty, Debit, Credit, Balance, Category, Match Status, and validation tags.
- Slide-over detail drawer displaying source document provenance, cryptographic SHA-256 hash, and arithmetic flags.
- **Category Override Protocol**: Modifying a transaction category strictly requires a substantive reason (>= 5 chars); preserves `originalCategory`, records `overrideReason`, and writes an immutable `AuditEvent` to the cryptographic hash chain.

---

### 3. Acceptance Verification Outputs

```
================================================================================
              ATTEST PLATFORM — PHASE 1 ACCEPTANCE VERIFICATION                 
================================================================================

[SETUP] Target Tenant: Meridian Textiles (Pvt) Ltd (cmv809fxs0002wdfc7hcaauf7)
[SETUP] Authenticated Actor: Tariq Mahmood <demo@attest.pk>

--------------------------------------------------------------------------------
TEST 1: Upload Rescaled Meridian 8 Transactions CSV (10x Rescaled Figures)
--------------------------------------------------------------------------------
[1.1] CSV Parser Output:
      Success: true
      Rows Extracted: 8
      Detected Delimiter: ","
      Headers: [Date, Description, Counterparty, Reference, Debit, Credit, Balance]

[1.2] Deterministic Rule Validation (R1-R4):
      All Rules Passed: true
      R1 (Statement Balance: Opening + Credits - Debits == Closing): PASS ✓
      R2 (Running Balance Chaining): PASS ✓
      R3 (Duplicate Transaction Detection): PASS ✓
      R4 (Consecutive Statement Continuity): PASS ✓
      Transactions Created: 8
      Exceptions Created: 0

[1.3] ProcessingRun Recorded:
      Run ID: cmv80slis000jwd6ky54ugc32
      Status: COMPLETED
      Stats JSON Summary:
        Opening Balance: PKR 800,000.00 (80000000 paisa)
        Total Debits:    PKR 839,500.00 (83950000 paisa)
        Total Credits:   PKR 1,676,000.00 (167600000 paisa)
        Closing Balance: PKR 1,636,500.00 (163650000 paisa)
        Calculated Net:  PKR 1,636,500.00 (163650000 paisa)
        Discrepancy:     0 paisa

--------------------------------------------------------------------------------
TEST 2: Upload Corrupted CSV (Closing Balance Mismatch)
--------------------------------------------------------------------------------
[2.1] Validation Result:
      All Rules Passed: false (R1 Failed as expected)
      Exceptions Created: 2
[2.2] Created Exception in Portal Desk:
      ID: cmv80sllg0015wd6kt4qg185q
      Type: STATEMENT_BALANCE_MISMATCH
      Title: "Statement closing balance does not reconcile"
      Severity: CRITICAL
      Discrepancy Amount: PKR 136,500.00 (13650000 paisa)
      Explanation: Calculated closing balance (PKR 1,636,500.00) differs from stated closing balance (PKR 1,500,000.00) by PKR 136,500.00. Tolerance is strictly 0 paisa.

--------------------------------------------------------------------------------
TEST 3: Duplicate File Re-upload Rejection by SHA-256
--------------------------------------------------------------------------------
[3.1] Attempting re-upload of identical file...
      Target SHA-256: a9484d9ce3845e8c84e0d5e44deb469f35dce6e567a18a129442852f8c89102a
      Server Decision: REJECTED
      Response: "409 Conflict: This exact document has already been uploaded with SHA-256: a9484d9ce3845e8c84e0d5e44deb469f35dce6e567a18a129442852f8c89102a. Duplicate uploads are prohibited to maintain audit chain integrity."

--------------------------------------------------------------------------------
TEST 4: Scanned PDF Parser (NEEDS_OCR & Zero Fabrication Rule)
--------------------------------------------------------------------------------
[4.1] PDF Parser Output:
      Parse Status: NEEDS_OCR
      Success: false
      Rows Extracted: 0 (ZERO fabricated rows)
      Honest Disclosure Message: "scanned PDF requires OCR — not available in MVP; upload the CSV from your bank."

--------------------------------------------------------------------------------
TEST 5: Category Override with Mandatory Justification & Audit Event
--------------------------------------------------------------------------------
[5.1] Original Transaction:
      Tx ID: cmv809fyv000iwdfcujcpkpcn
      Description: "Payroll salaries"
      Amount: PKR 486,200.00
      Current Category: "Payroll"

[5.2] Attempt 1 (Empty reason):
      Valid: false
      Server Decision: 400 Bad Request — A substantive reason (minimum 5 characters) is required to reclassify financial transactions.

[5.3] Attempt 2 (With substantive reason):
      Status: 200 OK — Reclassification persisted
      Updated Category: "Direct Materials Procurement"
      Original Category Preserved: "Payroll"
      Override Reason: "Reclassified after vendor trade registration confirmation"
      Audit Event Appended:
        Event ID: cmv80slu3001dwd6k5mk8xe1z
        Action: TRANSACTION_CATEGORY_OVERRIDDEN
        Hash: d24623f20fe7881c55f04a041e0af855166a025df0f299c8cda2bbf3423a5a8d
        Previous Hash: e50186861ffcaa16688df02d5184edc4602119bae2e09d8a4b76c8c7b784009b

================================================================================
                   ALL 5 ACCEPTANCE CRITERIA VERIFIED                           
================================================================================
```

---

### 4. Verification Test & Build Log
- `npm test`: 5 test suites passed, 15 tests passed (100%).
  - `tests/money.test.ts` (4 tests)
  - `tests/audit.test.ts` (2 tests)
  - `tests/tenant-isolation.test.ts` (2 tests)
  - `tests/auth-smoke.test.ts` (2 tests)
  - `tests/ingestion.test.ts` (5 tests)
- `npm run build`: 23 routes successfully compiled and optimized.

---

## Phase: P2: The Reconciliation Engine
**Date**: October 14, 2026  
**Status**: COMPLETE ✅  
**Commit Message**: `P2: engine`

---

### 1. Architectural Summary & Engine Core IP
- **Pure Deterministic Framework-Free Engine** (`src/engine/`):
  - Completely decoupled from Next.js, HTTP, and database frameworks for pure unit testing and mathematical reproducibility.
  - Same input always produces the identical deterministic output.
  - Zero AI dependency: absolutely no imports of `@google/generative-ai`, `openai`, `@anthropic-ai`, or network HTTP packages.

---

### 2. What Works (Fully Functional & Verified)

#### A. Deterministic Rule-Based Classifier (`src/engine/classifier.ts`)
- Keyword pattern matching covering 13 operational and accounting categories:
  - `payroll` (high confidence)
  - `supplier-payment` (medium confidence)
  - `tax-payment` (high confidence)
  - `rent-utilities` (high confidence)
  - `loan-proceeds` & `loan-repayment`
  - `inter-account-transfer`
  - `refund` & `interest`
  - `cash-withdrawal`
  - `personal-mixing-indicator` (medium confidence)
  - `unexplained` (low confidence fallback)
- **Constitutional Hard Rule**:
  - Never labels a bank credit "customer-receipt" as a confirmed fact without corroborated sales/invoice matching.
  - Always assigns `"revenue-like credit (inferred)"` until verified against sales records.

#### B. Explainable Multi-Pass Matcher (`src/engine/matcher.ts`)
- Configurable matching engine (`amountTolerancePaise: 0`, `dateWindowDays: 3`, `counterpartySimilarityThreshold: 0.75`, `referenceContains: true`).
- **1:1 Exact Matching**: Combines exact minor units, calendar date windows, and normalized Levenshtein/token string similarity. Stores granular explanation (e.g., `"amount_exact + date_window + counterparty_1.00"`).
- **1:Many Split Payments**: Identifies single bank credits/debits matching combinations of ledger entries (e.g., 12,000,000 paisa matching 7,000,000 + 5,000,000).
- **Partial Payments**: Detects installments (e.g., ledger 12,000,000 vs bank 8,000,000); flags candidate as `PARTIAL` without auto-resolving.
- **Ambiguity Gray Band**: Transactions with matching amounts but sub-threshold counterparty similarity (e.g., 0.40) or competing candidates are marked `AMBIGUOUS` for human review.
- **Multi-Currency Safety**: Cross-currency matching (e.g., USD vs PKR) is strictly prohibited and throws an explicit error rather than silently summing.

#### C. Level 3 Three-Way Corroborator (`src/engine/threeWay.ts`)
- Traces: `Bank Credit` ↔ `General Ledger Sales Entry` ↔ `FBR/Sales Invoice`.
- Reconciles by invoice number references, dates, and amounts.
- Enforces Level 3 standard: *"Do not award three-way matches on amount alone."*
- Flags `THREE_WAY_MATCHED`, `MISSING_INVOICE`, and `UNRECORDED_CREDIT`.

#### D. Explainable Exception Generator (`src/engine/exceptions.ts`)
- Generates structured exceptions with plain-language title, "what happened" (`explanation`), "why it matters", suggested resolution, and required evidence:
  - `DUPLICATE_PAYMENT` (E-101 shape): Identifies duplicate disbursements lacking second invoice.
  - `UNRECORDED_CREDIT` (E-102 shape): Identifies receipts lacking ledger booking.
  - `PAYMENT_WITHOUT_INVOICE`: Ledger disbursements lacking vendor invoice documentation.
  - `LEDGER_WITHOUT_BANK`: Book entries lacking clearing bank credits/debits.
  - `POSSIBLE_DIRECTOR_LOAN`: Corporate financing from shareholder/director accounts.
  - `PERSONAL_MIXING_SUSPECTED`: Low-severity heuristic flags for personal/household expenditures.
- Severity weighting (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) dynamically computed based on materiality (5,000,000 paisa / PKR 50,000 threshold).

#### E. Idempotent Run Orchestrator & Diff Tracker (`src/engine/orchestrator.ts`)
- Connects pure engine to database records and persists results into `ProcessingRun.statsJson`.
- **Idempotent Execution**: Repeated runs on identical data create 0 duplicate exceptions and report `"Reconciliation state unchanged since last run (idempotent pass)."`.
- **Rerun Diffing**: Automatically compares against `previousRun.statsJson` to report exact counts of resolved and new exceptions (e.g., `"1 exception(s) resolved since last run; 1 new exception(s) created."`).
- **Audit Logging**: Appends cryptographic `AuditEvent` chaining every reconciliation execution.

#### F. Tiered Verification Levels
- Computes `levelEligible` and `levelAchieved` (Levels 1, 2, 3) with plain-language explanations and actionable next steps.
- Embedded into the Client Portal dashboard via interactive `<VerificationTrigger />` component.

---

### 3. Acceptance Verification (Specs T1 - T17)
All 17 required acceptance specifications implemented and verified green in `tests/engine.test.ts`:
- **T1**: Balance validation pass (existing seed figures, 0 tolerance).
- **T2**: Corrupted statement fails R1 and creates exception (PKR 136,500.00 discrepancy).
- **T3**: Running-balance break detected.
- **T4**: Duplicate transaction detection on same date/description.
- **T5**: Exact 1:1 match with full rule explanation stored (`amount_exact + date_window + counterparty_1.00`).
- **T6**: Date-window match passes within 3 days, fails outside window.
- **T7**: Split payment 1:many (12,000,000 matches 7,000,000 + 5,000,000).
- **T8**: Partial payment (ledger 12,000,000 vs bank 8,000,000) flagged as `PARTIAL`.
- **T9**: Ambiguous candidate (counterparty 0.4 similarity) marked `AMBIGUOUS`.
- **T10**: Cross-currency transaction rejected with clear error.
- **T11**: E-101 generated from seed (two Zubair debits, one invoice).
- **T12**: E-102 generated from seed (12 Apr credit, no ledger entry).
- **T13**: Three-way trace (03 Apr credit → ledger sales → FBR invoice traces to `THREE_WAY_MATCHED`).
- **T14**: Classifier rules categorize payroll, tax, utilities; restricts unverified credit to `revenue-like credit (inferred)`.
- **T15**: Idempotent rerun: running orchestrator twice yields identical exception counts.
- **T16**: Rerun diff reports `"1 resolved"` after exception resolution.
- **T17**: Engine purity: zero AI SDKs and zero network HTTP calls imported in engine core.

---

### 4. What is Partial / Deferred to Next Phases
- **Automated Bookkeeping Reconciler (P2 Complete)**: Deterministic 2-way and 3-way matching engine is complete.
- **CA Console Exception Resolution & Sign-Off Chamber (P3)**: Reviewer sign-off workflow, exception waiver protocol, and certificate minting (scheduled for Phase 3).
- **Hardware Security Module (HSM) PKI Signing (P3)**: Qualified digital signatures for production deployment.

---

### 5. Verification Test & Build Log
- `npm test`: 6 test suites passed, 32 tests passed (100%).
  - `tests/money.test.ts` (4 tests)
  - `tests/audit.test.ts` (2 tests)
  - `tests/tenant-isolation.test.ts` (2 tests)
  - `tests/auth-smoke.test.ts` (2 tests)
  - `tests/ingestion.test.ts` (5 tests)
  - `tests/engine.test.ts` (17 tests)
- `npm run build`: 24 routes successfully compiled and optimized.


