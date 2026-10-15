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

---

## Phase: P2.5: UI/UX Design Overhaul
**Date**: October 14, 2026  
**Status**: COMPLETE ✅  
**Commit Message**: `P2.5: design overhaul`

---

### 1. Architectural Summary & Design System Installation
- **Typography Tokens**:
  - Global UI Font: **Inter** (`font-sans`, weights 400/500/600/700/800) loaded via Google Fonts.
  - Financial & Code Font: **IBM Plex Mono** (`font-mono`, weights 400/500/600/700) reserved exclusively for monetary amounts, transaction hashes, document IDs, and code-like data.
  - Strict Type Hierarchy: Page titles `28px/800 tracking-tight`, section titles `18px/700`, body copy `14.5px/400`, captions `12px/500 text-muted`, stat card figures `30-34px/700 tabular-nums`.
- **Color Palette & Design Tokens**:
  - Background: `#F7F8FA`
  - Surfaces & Cards: `#FFFFFF` with `1px border border-[#E6E9EF]` and `12px (rounded-xl)` corner radius
  - Borders & Dividers: `#E6E9EF`
  - Text Primary: `#0F172A` (Slate 900)
  - Text Muted: `#64748B` (Slate 500)
  - Primary Accent: Single cohesive blue `#2563EB` (Blue 600) for active navigation states, primary buttons, and focus rings. Removed all competing orange CTA colors and dark button fills.
  - Semantic Feedback Colors: Green `#16A34A` (verified/passed), Amber `#D97706` (needs attention), Red `#DC2626` (critical/failed), Blue `#2563EB` (in-progress/info).
- **Navigation & Layout Architecture**:
  - Fixed 240px Left Navigation Sidebar replacing the crowded horizontal top bar.
  - Sidebar Groups: `OVERVIEW` (Dashboard), `VERIFICATION` (Sources & Upload, Bank Transactions, General Ledger, Run History), `WORKFLOW` (Exceptions with live count badge, Trust Certificate), `SETTINGS` (Team, Notifications).
  - Sidebar Header: Platform brand + organization name with DEMO badge; Sidebar Footer: Authenticated user identity + clean Sign Out button.
  - Mobile Drawer: Responsive hamburger toggle slides out the complete navigation drawer on mobile viewports (< 1024px) with backdrop blur.
  - Slim Top Bar: Sticky header holding contextual breadcrumbs and page actions.
- **Component Standardization**:
  - `src/components/ui/StatusPill.tsx`: Uniform status pill component with soft semantic background and strong colored text, supporting green, amber, red, blue, and gray tokens.
  - `src/lib/labels.ts`: Canonical dictionary mapping every internal database enum (`DUPLICATE_PAYMENT`, `UNRECORDED_CREDIT`, `PENDING_REVIEW`, `RECONCILIATION_ENGINE_EXECUTED`, etc.) to clear human English. Includes `formatShortHash(hash, 8)` and `formatRelativeTime(date)`.
  - `src/components/ui/CopyButton.tsx`: Micro-interaction clipboard copy button with visual checkmark confirmation.
  - `src/components/ca/PriorityScoreChip.tsx`: Risk score badge with formula tooltip (`Weighted Risk Formula: Materiality (40%) + Anomaly Risk (30%) + Age (20%) + Evidence Completeness (10%)`).

---

### 2. Screens Redesigned & Verified

#### A. Client Portal Dashboard (`/portal`)
- 4 Hero Stat Cards with left icon chip, uppercase muted caption, 32px bold numbers with `tabular-nums`, and contextual subtitle ("7 of 8 matched").
- Redesigned Reconciliation Engine Card: Plain-language summary, period selector, and Run button.
- Real-Time Execution State: Animated 6-stage pipeline progress bar checking off steps sequentially:
  1. `Normalize`: Clean data feeds & ISO standardization
  2. `Validate`: Balance continuity & duplicate detection (R1-R4)
  3. `Classify`: Deterministic rule-based transaction tagging
  4. `Match`: 1:1 and 1:many algorithmic ledger matching
  5. `Three-Way`: Bank ↔ Ledger ↔ Invoices corroboration
  6. `Exceptions`: Materiality analysis & explainable exception creation
- Redesigned Exceptions Block: Clean full-row list items with left severity icon, 16px bold title, 2-line truncated description, right-aligned mono amount, and status pill.

#### B. Exceptions Resolution Workspace & Detail View (`/portal/exceptions`)
- Exception Cards styled with distinct 4px left severity border (red=critical, amber=high, blue=info).
- Replaced nested card clutter with structured clean dividers.
- Detailed Inspection Modal / View:
  - "What happened" and "Why it matters" rendered as separate labeled explanation blocks in plain language.
  - 3-Column Financial Comparison: Bank Statement vs General Ledger vs Corroborating Invoices with exact variance highlighting in red.
  - Tinted Callout Box: Suggested resolution guidance and required supporting evidence checklist.

#### C. CA Console Overview (`/ca`)
- Consistent design system and layout matching the portal.
- Ranked Review Queue Table: Sortable and scannable with severity pill, mono amount, days-waiting counter, and interactive `PriorityScoreChip` with formula explanation tooltip.
- Engagement Metrics: Assurance level status, total verified coverage, and pending exceptions.

#### D. Audit Trail & Cryptographic Chain (`/ca/audit-trail`)
- Vertical Timeline Design: Distinct icons per action type, human readable event titles via `ENUM_LABELS`, relative timestamps ("2 hours ago"), and actor identity.
- Truncated Hashes: All SHA-256 hashes shortened to 8 characters with inline `<CopyButton />`, eliminating wall-of-hash clutter.
- Slide-Over Inspection Drawer: Clicking "Inspect Full Hash Chain" or individual block details opens a right slide-over drawer where the complete 64-character SHA-256 hashes and parent pointers live in clean monospace.

#### E. Sign-In Page (`/auth/signin`)
- Centered, minimalist card layout with Attest brand mark and clean typography.
- Role-Gated Quick Login: Two styled persona buttons (Client Owner `demo@attest.pk` and CA Reviewer `ca@attest.pk`) with explicit role descriptions and one-click demo credentials.

#### F. Public Verification Page (`/verify/[id]`)
- Restyled verification sheet adhering to `#F7F8FA` background, `#2563EB` branding, and clean tabular data for company registration, accounting scope, and legal disclaimers.

---

### 3. Acceptance Verification & Proof

1. **Full Test Suite Execution**:
   - `npm test`: **32 passed (32/32 tests green across all 6 test suites)**.
   - Zero regression in money rules, deterministic engine specs T1-T17, tenant isolation, audit chaining, or ingestion parsing.
2. **Production Build**:
   - `npm run build`: Compiled with zero TypeScript errors or lint issues across all 24 application routes.
3. **Grep Proof (Zero Raw Enums & Zero Full Hashes)**:
   - Verified that all database enum values are routed through `src/lib/labels.ts` (`ENUM_LABELS` / `formatEnumLabel`).
   - Verified that all SHA-256 hashes are truncated using `formatShortHash(hash, 8)` in standard views, with full 64-char hashes strictly isolated to the slide-over inspection drawer.
4. **Mobile Responsiveness (375px Viewport)**:
   - Tested at 375px width: 240px sidebar collapses into a hamburger drawer, stat cards stack vertically into a single column, tables scroll smoothly horizontally, and dialogs adapt cleanly.
5. **Visual Walkthrough Artifacts**:
   - `01_signin.png`: Sign-in screen with role descriptions
   - `02_portal_dashboard.png`: Portal dashboard with 4 stat cards & exceptions list
   - `03_engine_running.png`: 6-stage animated pipeline progress bar during execution
   - `04_engine_completed.png`: Completed verification pass with Level 1 summary
   - `05_exceptions_list.png`: Exceptions desk with 4px left severity border
   - `06_exception_e101_detail.png`: E-101 duplicate payment 3-column financial comparison
   - `07_exception_e102_detail.png`: E-102 unrecorded credit explanation & resolution
   - `08_ca_console.png`: CA Console ranked review queue with priority score chips
   - `09_ca_audit_timeline.png`: CA audit trail vertical timeline
   - `10_audit_drawer.png`: Slide-over drawer with complete SHA-256 hash inspection
   - `11_verify_certificate.png`: Public assurance certificate verification sheet
   - `12_mobile_responsive.png` / `13_mobile_portal_dashboard.png`: 375px mobile responsive view

---

### 4. What is Partial / Deferred to Next Phases
- **CA Console Exception Resolution & Sign-Off Chamber (P3)**: Formal CA sign-off workflow, exception waivers with mandatory justification, and certificate minting.
- **Hardware Security Module (HSM) PKI Signing (P3)**: Qualified digital signatures for production deployment.

---

### 5. Verification Test & Build Log
- `npm test`: 6 test suites passed, 32 tests passed (100%).
- `npm run build`: 24 routes successfully compiled and optimized.

---

## Phase: P3: Exception Resolution Workflow + CA Review Loop
**Date**: October 14, 2026  
**Status**: COMPLETE ✅  
**Commit Message**: `P3: review loop`

---

### 1. Architectural Summary & Scope Delivered
This phase makes Attest's core promise real: **clients resolve, professionals judge, nothing resolves itself.**
- **Category-Aware Exception Generator**: Re-engineered exception generation rules so that expected evidence is contextualized per transaction category (`supplier-payment` requires tax invoice, `payroll` requires payroll register, `rent-utilities` requires utility bill, `tax-payment` requires challan, `inter-account-transfer` is self-reconciling). Suppressed over-firing of `PAYMENT_WITHOUT_INVOICE` on payroll and utilities when matching general ledger entries exist.
- **Client Resolution Stepper (`/portal/exceptions`)**: 4-step guided workflow (Strategy Selection -> Evidence Attachment/Linking -> Written Explanation & Authorization Declaration -> Review & Submit) that updates status to `CLIENT_SUBMITTED`, attaches vault evidence, logs audit events, and notifies the assigned CA.
- **Constitutional Authority Rule Enforcement**: Enforced server-side in API routes (`/api/exceptions/[id]/resolve` and `/api/exceptions/[id]/review`) that client roles can NEVER resolve an exception (HTTP 403 Forbidden). Only licensed `CA-reviewer` and `PlatformAdmin` roles can transition an exception to `RESOLVED`.
- **CA Full Workpaper View (`/ca/exceptions/[id]`)**: Comprehensive auditor view containing engagement metadata header, 3-column verification model (Bank vs Ledger vs Invoice), client submission package with clickable SHA-256 evidence links, audit dialogue timeline, and adjudication chamber (Accept Resolution, Reject with Mandatory Reason, Request More Info, Escalate to Partner).
- **Live CA Overview Metrics**: Built live computation for Pending Submissions, Average Review Turnaround (`hrs` or `< 1 day`), Resolved This Month, and High-Severity Open, with deep filter links to `/ca/exceptions?filter=...`.
- **Automatic Ledger Resolution Hook**: On CA acceptance of an unrecorded receipt/sale exception (E-102 shape), automatically creates the adjusting journal entry (`SI-2026-3387-ADJ` for PKR 340,000.00 credit to Domestic Sales Revenue), marks the transaction `MATCHED`, creates a confirmed `Match` record, and increases overall reconciliation coverage to 100% (8/8 bank transactions).
- **In-App Notification Center**: Built `NotificationBell.tsx` integrated into the top headers of both Client Portal and CA Console, featuring unread count badges, formatted relative timestamps, transition summaries, deep links to exceptions/workpapers, and mark-all-read functionality.

---

### 2. What Works (Fully Functional & Verified)

#### A. Category-Aware Evidence Engine & Generator
- In `src/engine/types.ts`: Defined `ExpectedEvidenceType`, `CategoryEvidenceRequirement`, `CATEGORY_EXPECTED_EVIDENCE` mapping transaction categories to statutory expected documents. Added `PAYROLL_EVIDENCE_MISSING` and `UTILITIES_BILL_MISSING` types, plus `INFO` severity level.
- In `src/engine/exceptions.ts`: Refactored `generateExceptions` to inspect transaction categories:
  - `supplier-payment`: Lacking tax invoice fires `PAYMENT_WITHOUT_INVOICE` (LOW severity when matched to ledger).
  - `payroll`: Matched to ledger requires payroll register; matching entries generate 0 exceptions. Unmatched payroll fires `PAYROLL_EVIDENCE_MISSING` (INFO severity).
  - `rent-utilities`: Matched to ledger generates 0 exceptions. Unmatched utilities fires `UTILITIES_BILL_MISSING` (LOW severity).
  - `tax-payment`: Matched to ledger generates 0 exceptions.
  - `inter-account-transfer`: Self-reconciling, generates 0 exceptions.
- Added Vitest engine test **T18**: Proves that a payroll payment with a matching ledger entry does NOT create a vendor invoice exception.

#### B. Client Guided Resolution Stepper (`/portal/exceptions`)
- Exception desk cards feature an active action panel with an interactive 4-step stepper:
  - **Step 1 — Strategy**: Contextual options based on exception type (`DUPLICATE_REVERSAL`, `MISSING_EVIDENCE`, `EXPLANATION`, `DISPUTE`).
  - **Step 2 — Evidence**: Supports uploading new files (cryptographically SHA-256 hashed and stored in the tenant vault), linking existing vault documents, or linking statutory tax invoices (e.g. FBR Invoice `#SI-2026-3387`).
  - **Step 3 — Explanation & Declaration**: Strict validation requiring minimum 20 characters written explanation and mandatory authorization checkbox (*"I confirm this information is accurate and I am authorized to provide it"*).
  - **Step 4 — Review & Submit**: Summary card displaying strategy, evidence name/hash, explanation note, and confirmation badge. Submitting transitions exception to `CLIENT_SUBMITTED`, adds an `ExceptionComment`, writes a hash-chained `AuditEvent`, and creates an in-app `Notification` for CA reviewers.
- While under review (`CLIENT_SUBMITTED` or `CA_REVIEW`), client view displays a prominent read-only banner (*"Awaiting Professional Review — Typically 1 Business Day"*), disables stepper editing, and allows adding supplemental clarifying comments to the ongoing audit dialogue.
- On rejection, status returns to `OPEN` and displays the CA's exact reasoning in a prominent rejection card at the top, enabling clients to submit a revised round while preserving complete historical dialogue.

#### C. CA Workpaper Queue & Adjudication Chamber (`/ca/exceptions/[id]`)
- Queue links to full dedicated Workpaper views featuring:
  - Engagement header with organization name, period (April 2026), accounting standard (IFRS for SMEs), and priority score chip.
  - 3-Column Reconciliation Model (Bank Statement, General Ledger, Tax/Sales Invoice) with verified pills and discrepancy highlights.
  - Client Resolution Package card with strategy tag, explanation narrative, authorization badge, and clickable SHA-256 evidence links.
  - Audit Trail & Dialogue timeline with author names, roles, and timestamps.
  - CA Adjudication Chamber:
    - **Accept Resolution**: Transitions status to `RESOLVED`, sets `resolvedById` and `resolvedAt`, and triggers adjusting ledger resolution for E-102.
    - **Reject Resolution**: Enforces mandatory professional reasoning of at least 20 characters, returns status to `OPEN`, and notifies client.
    - **Request More Info**: Requires minimum 20 characters, transitions status to `MORE_INFO_REQUESTED`, and notifies client.
    - **Escalate**: Flags exception as escalated for senior signatory partner consultation.

#### D. Live CA Overview Metrics (`/ca`)
- **Pending Submissions**: Live count of exceptions in `CLIENT_SUBMITTED` status, linking to `/ca/exceptions?filter=CLIENT_SUBMITTED`.
- **Average Turnaround**: Dynamically computed from `(resolvedAt - createdAt)` in hours, linking to `/ca/exceptions`.
- **Resolved This Month**: Live count of exceptions in `RESOLVED` status, linking to `/ca/exceptions?filter=RESOLVED`.
- **High-Severity Open**: Live count of unresolved `CRITICAL` and `HIGH` exceptions, linking to `/ca/exceptions?filter=HIGH_SEVERITY`.

#### E. In-App Notification Center
- Built `src/components/notifications/NotificationBell.tsx`:
  - Bell icon with reactive unread count badge.
  - Dropdown popover displaying notification title, icon indicator, description, relative time, and deep links.
  - Mark-all-read endpoint (`PATCH /api/notifications/read-all`) and individual mark-read endpoint (`PATCH /api/notifications/[id]`).
  - Integrated into both `(portal)` and `(ca)` navigation layouts.

---

### 3. Acceptance Verification & Proof

1. **Full Vitest Suite Execution (`npm test`)**:
   - **42 passed (42/42 tests green across all 7 test files)**:
     - `tests/money.test.ts`: 4 tests passing (integer paisa validation, float rejection).
     - `tests/audit.test.ts`: 2 tests passing (SHA-256 hash chaining and tamper detection).
     - `tests/tenant-isolation.test.ts`: 2 tests passing (cross-tenant zero data leakage).
     - `tests/auth-smoke.test.ts`: 2 tests passing (bcrypt hashing and RBAC rules).
     - `tests/engine.test.ts`: 18 tests passing (T1–T17 + T18 category-aware rules).
     - `tests/ingestion.test.ts`: 5 tests passing (bank statement parsing, OCR fallback).
     - `tests/resolution-review.test.ts`: 9 tests passing (client cannot resolve 403, min 20 chars rejection reason, resubmission preserves history, hash-chained audit events, notification generation, adjusting ledger creation).
2. **Production Build (`npm run build`)**:
   - Compiled all 26 application routes and API endpoints cleanly with zero TypeScript errors or lint issues.
3. **Automated E2E Walkthrough & Screenshot Evidence**:
   - Executed full headless browser walkthrough via `scripts/e2e-phase3-full.ts` on the Meridian demo tenant:
     - `01_p3_e101_stepper_step1.png`: Step 1 resolution strategy selection.
     - `02_p3_e101_stepper_review.png`: Step 4 review package with attached evidence.
     - `03_p3_e101_awaiting_review.png`: Client read-only view with "Awaiting Professional Review" banner.
     - `04_p3_ca_overview_metrics.png`: CA console dashboard with 4 live metric cards and ranked queue.
     - `05_p3_ca_workpaper_e101.png`: CA full workpaper view for E-101.
     - `06_p3_ca_rejected_e101.png`: CA rejection with mandatory reason.
     - `07_p3_client_rejection_view.png`: Client view showing rejection reason and "Resubmit Resolution" button.
     - `08_p3_client_resubmitted_e101.png`: Client revised submission with official stamped certificate.
     - `09_p3_ca_accepted_e101.png`: CA approval with status `RESOLVED`.
     - `10_p3_e102_workpaper_resolved.png`: E-102 resolution with adjusting ledger entry posted and match confirmed.
     - `11_p3_notification_center.png`: Notification bell popover showing workflow alerts.
     - `12_p3_mobile_workpaper.png`: Mobile responsive workpaper rendering at 375px.

---

### 4. What is Partial / Deferred to Next Phases
- **Certificate Issuance & HSM PKI Chamber (P4)**: CA final sign-off chamber, multi-signatory review for escalated items, and public certificate publishing.
- **External Email Delivery Adapters**: In-app notifications are fully functional; email transport adapters remain stubs without live SMTP credentials.

---

### 5. Verification Test & Build Log
- `npm test`: 7 test suites passed, 42 tests passed (100%).
- `npm run build`: 26 routes successfully compiled and optimized.

---

## Phase: P4: Certificate Sign-Off, Issuance & Public Verifier
**Date**: October 14, 2026  
**Status**: COMPLETE ✅  
**Commit Message**: `P4: certificates`

---

### 1. Architectural Summary & Scope
Phase 4 introduces the network moment of Attest: a cryptographically signed trust certificate issued by a licensed Chartered Accountant that any stranger can verify publicly without creating an account or logging in.

#### A. Housekeeping First
- Removed placeholder certificate `CERT-2026-04-MTL-001` from `prisma/seed.ts`.
- All demonstration and production certificates now issue exclusively through the real, server-enforced pre-issuance pipeline. Exactly one issuance path exists in the codebase.

---

### 2. What Works (Fully Functional & Verified)

#### A. Pre-Issuance Sign-Off Gates (`/ca/sign-off`)
- Built server-enforced pre-issuance checklist evaluating 5 mandatory gates for the engagement (client + period):
  1. **Gate 1: Source Period Statements Present**: Verifies uploaded/parsed source statements for the period.
  2. **Gate 2: Validation Rules R1–R4 Passed**: Verifies running balance arithmetic continuity and that any discrepancy has a resolved exception.
  3. **Gate 3: Zero Open High/Critical Exceptions**: Strictly blocks issuance if any `HIGH` or `CRITICAL` exception remains `OPEN`, `CLIENT_SUBMITTED`, or `MORE_INFO_REQUESTED`. Non-material items (`LOW`, `MEDIUM`, `WAIVED`) are surfaced under Disclosed Limitations with both client and CA treatments.
  4. **Gate 4: CA Professional Conclusion Note**: Requires free-text conclusion of at least 50 characters with live character counter.
  5. **Gate 5: Verification Level Computed Honestly**: Evaluates level achieved (Level 1, 2, or 3) and coverage % from engine run records without inflated claims.
- The "Review & Apply Digital Signature" button stays strictly disabled while any gate fails.

#### B. Deliberate Two-Step Issuance Flow
- Clicking the sign-off button opens an explicit modal displaying:
  - Organization legal details, tax ID, registration number.
  - Computed assurance level and coverage percentage.
  - Procedures executed under deterministic engine.
  - Disclosed limitations summary.
  - Licensed CA signatory details (Ayesha Siddiqui, FCA • License #ICAP-49102).
  - Exact statutory scope language from `ATTEST.md`:
    *"procedures and results — not opinions; not a statutory audit; no creditworthiness representation"*.
  - Mandatory classification notice: *"development-mode integrity — not a qualified digital signature"*.
  - Explicit confirmation checkbox required before signing.
- **Cryptographic Signature Engine (`src/lib/certificate.ts`)**:
  - `publicId` format: `ATTEST-PK-2026-XXXXXX-CK` (unpredictable 6-digit number + 2-character check suffix).
  - Canonical JSON payload with recursive key sorting.
  - SHA-256 canonical `payloadHash`.
  - HMAC-SHA256 signature using `SIGNING_KEY` environment variable.
  - `signatureMode = DEVELOPMENT`.
- **Versioning & Supersession**: Re-issuing for the same org + period automatically marks the prior certificate `SUPERSEDED`, links `supersededById`, and points public viewers to the successor certificate.
- **Revocation**: CA can revoke any active certificate with a mandatory reason of &ge; 20 characters. Status immediately transitions to `REVOKED`, logs an immutable `AuditEvent`, notifies the client, and reflects publicly in real time. Nothing is ever deleted.

#### C. Certificate Rendering
- **Client Portal (`/portal/certificate`)**:
  - Status card with public ID and version.
  - Copy Public URL button with instant visual feedback.
  - "Download PDF" (opens print-optimized view).
  - "Download JSON" (downloads documented schema with id, org, level, period, scope, coverage, limitations, signatory, issuedAt, payloadHash, signature, signatureMode, verifyUrl).
  - Honest Level 2 representation: clearly states Bank & General Ledger reconciled; external invoices not three-way tested.
- **Print View (`/portal/certificate/print`)**:
  - Professional typographic layout with `@page` margins, QR verify block, and cryptographic hashes.

#### D. Public Verifier (`/verify` and `/verify/[id]`) — Zero Login
- **Landing Search Page (`/verify`)**:
  - Search box for certificate IDs.
  - Plain-language explanation of what verification does and does not establish.
  - Strict privacy notice.
- **Lookup View (`/verify/[id]`)**:
  - Unauthenticated access with rate limiting (10 requests/min/IP with 429 response).
  - Real-time cryptographic signature verification:
    - `VALID & CURRENT`: Verified green badge and signature check passed.
    - `VALID BUT SUPERSEDED`: Amber badge with link to successor certificate.
    - `REVOKED`: Crimson badge showing revocation category and date.
    - `NOT FOUND`: Generic 404 response identical for malformed and non-existent IDs.
    - `SIGNATURE INVALID`: Alerts on tampered payloads or signature corruption.
  - **Strict Privacy Shield**: Displays strictly public attestation metadata (org name, cert ID, issuing firm, signatory, level, period, issue date, status, coverage %, scope, limitations, verification timestamp, integrity result). NEVER displays transaction descriptions, counterparty names, individual amounts, or internal ledgers.

#### E. Evidence Pack Request (Consent Charter)
- Public verify view includes "Request Supporting Evidence" form (requester name, org, email, purpose, categories, period).
- Submitting creates a `DisclosureRequest` and generates an in-app notification for client owners linking to `/portal/sharing`.
- **Client Evidence Sharing Desk (`/portal/sharing`)**:
  - Client reviews incoming requests, stated purpose, and requested categories.
  - Client approves or rejects.
  - On approval, generates a scoped package containing ONLY documents matching approved categories and period, plus a SHA-256 integrity manifest.
  - Served via signed, expiring download link valid for exactly 7 days (`/api/disclosures/download?token=...`).
  - Full audit trail: `DISCLOSURE_REQUESTED`, `DISCLOSURE_APPROVED` / `DISCLOSURE_REJECTED`, `DISCLOSURE_LINK_GENERATED`, `DISCLOSURE_LINK_ACCESSED`, `DISCLOSURE_LINK_EXPIRED`.

---

### 3. Acceptance Verification & Proof

1. **Full Vitest Suite Execution (`npm test`)**:
   - **52 passed (52/52 tests green across all 8 test files)**:
     - `tests/certificate-verifier.test.ts` (10 new Phase 4 tests):
       1. Gate enforcement: blocks issuance with open HIGH exception, then proceeds after resolution.
       2. Cryptographic engine: correctly signs canonical payload and verifies valid signature.
       3. Cryptographic engine: rejects tampered canonical payload as `SIGNATURE INVALID`.
       4. Certificate lifecycle: revocation is recorded with mandatory reason and reflects status.
       5. Versioning: re-issuing marks prior certificate `SUPERSEDED` and links successor.
       6. Public verifier: unknown or malformed public ID returns generic not found.
       7. Security: rate limiter allows 10 requests and trips on 11th request.
       8. Privacy Shield: public certificate projection strictly excludes transactions, counterparties, and balances.
       9. Consent Charter: evidence pack download includes only approved document categories.
       10. Consent Charter: download request with expired token is rejected.
     - All 42 prior test cases in `money`, `audit`, `tenant-isolation`, `auth-smoke`, `engine`, `resolution-review`, and `ingestion` remain 100% green.
2. **Production Build (`npm run build`)**:
   - Successfully compiled all 33 static and dynamic routes with zero TypeScript or bundling errors.
3. **Automated E2E Screenshots & The Stranger Test**:
   - Captured 7 headless browser artifacts via `scripts/e2e-phase4.ts`:
     - `01_p4_blocked_signoff_gates.png`: Gate 3 blocked by open HIGH exception with disabled sign-off button.
     - `02_p4_confirmation_modal.png`: Deliberate confirmation modal showing scope, level, coverage, procedures, limitations, and signatory.
     - `03_p4_certificate_print_view.png`: Print view with A4 layout, QR verify block, and payload hashes.
     - `04_p4_public_verify_valid.png`: Public verifier showing `VALID & CURRENT` badge, cryptographic integrity verified, and evidence request form.
     - `05_p4_public_verify_revoked.png`: Public verifier showing `REVOKED` status badge and CA revocation reason.
     - `06_p4_public_verify_not_found.png`: Generic "Certificate Not Found" public view.
     - `07_p4_stranger_test_incognito.png`: The "Stranger Test" conducted in a fully logged-out fresh incognito context verifying certificate `ATTEST-PK-2026-406434-0A`.

---

### 4. What is Blocked / Deferred
- **None**: All dependencies, cryptographic operations, gate rules, verifier routes, tests, and build checks execute cleanly. Phase 5 is intentionally NOT started.

---

### 5. Verification Test & Build Log
- `npm test`: 8 test suites passed, 52 tests passed (100%).
- `npm run build`: 33 routes successfully compiled and optimized.

---

## Phase 5: Hardening, Demo Polish & Ship (MVP-1 Shipped)

**Date**: October 14, 2026  
**Status**: COMPLETE (Shipped & Demo-Ready)  
**Git Commit Target**: `"P5: ship-ready MVP-1"`

---

### 1. Master Implementation Status Table (Original Build Spec vs Shipped Reality)

| Spec Area | Status | Shipped Implementation Details | Automated Test Proof & Reference |
| :--- | :--- | :--- | :--- |
| **Money Rule** (Paisa Minor Units) | **IMPLEMENTED** | Integer minor units (`paisa`) enforced across DB schema, math, reconciliation, and UI. Float money strictly rejected with `TypeError`. | `tests/money.test.ts`, `tests/hardening.test.ts` (A1) |
| **Ingestion Engine** (CSV/PDF) | **IMPLEMENTED** | Multi-file parser with column mapping, header validation, 25MB limits, cryptographic SHA-256 deduplication, and isolated tenant storage. | `tests/ingestion.test.ts`, `src/lib/parser/csv.ts` |
| **Validation Rules R1–R4** | **IMPLEMENTED** | 4-tier arithmetic engine: R1 (Statement Balance), R2 (Running Balance), R3 (Zero Inversion), R4 (Consecutive Multi-Period Continuity across 3+ statements). | `tests/ingestion.test.ts`, `tests/hardening.test.ts` (A2) |
| **Deterministic Matcher** | **IMPLEMENTED** | 3-pass algorithm: Pass 1 (1:1 Exact & Candidate Detection), Pass 2 (1:Many Split Payments), Pass 3 (Partial Payments with difference calculation). 100% explainable, zero AI dependency. | `tests/engine.test.ts`, `tests/hardening.test.ts` (A3) |
| **Exception Generator** | **IMPLEMENTED** | Surfaces plain-language exceptions with materiality weighting: E-101 (Duplicate Payment, HIGH), E-102 (Unrecorded Credit, HIGH), and category-aware evidence checks. | `tests/engine.test.ts`, `src/engine/exceptions.ts` |
| **Exception Resolution Loop** | **IMPLEMENTED** | Client 3-step resolution stepper modal (Reason &rarr; Evidence &rarr; Legal Declaration); CA review workpaper console; adjusting journal entries automatically created on approval. | `tests/resolution-review.test.ts`, `/portal/exceptions` |
| **Pre-Issuance Sign-Off Gates** | **IMPLEMENTED** | Server-enforced 5-gate checklist before issuance: source statements present, R1–R4 pass, zero open high/critical exceptions, CA note &ge;50 chars, level computed honestly. | `tests/certificate-verifier.test.ts`, `src/lib/gates.ts` |
| **Cryptographic Signing Engine** | **IMPLEMENTED** | Deterministic recursive key-sorted JSON canonicalization; SHA-256 payload hash; HMAC-SHA256 signature with transparent development-mode disclosure. | `tests/certificate-verifier.test.ts`, `tests/hardening.test.ts` (A4) |
| **Public Verifier** (`/verify/[id]`) | **IMPLEMENTED** | Account-free public verification; strictly excludes bank transactions and accounts (Privacy Shield); rate-limited against brute-force enumeration; tracks revocations and superseded versions. | `tests/certificate-verifier.test.ts`, `/verify/[id]` |
| **Third-Party Consent Charter** | **IMPLEMENTED** | Scoped third-party disclosure request flow; 7-day cryptographic single-use download tokens; category-restricted evidence pack generation. | `tests/certificate-verifier.test.ts`, `/api/disclosures` |
| **Demo Mode & Reset Action** | **IMPLEMENTED** | Quick-login strictly gated behind `DEMO_MODE` env flag (rejected when false); idempotent wipe + re-seed action with confirmation modal for PlatformAdmin; demo banner on all demo routes. | `tests/hardening.test.ts` (B1, B2, B3), `src/lib/demoReset.ts` |
| **Security Pass & Tenant Isolation** | **IMPLEMENTED** | Auth endpoint rate-limiting (5 req/min/IP with lockout message); cross-tenant download isolation (Org B requesting Org A doc returns 403 Forbidden); 24h default session expiry; zero secrets in client bundles. | `tests/hardening.test.ts` (D1, D2, D5), `tests/tenant-isolation.test.ts` |
| **Scanned Document OCR** | **DELIBERATELY DEFERRED** | Scanned PDFs without text streams are safely detected and assigned `parseStatus: "NEEDS_OCR"` with zero hallucinated rows. Optical character recognition engine deferred post-MVP. | `tests/ingestion.test.ts` |
| **Direct Bank Open-Banking APIs** | **DELIBERATELY DEFERRED** | Open banking APIs do not exist in Pakistan; bank statements are client-provided CSV/PDF. Cryptographic hashes prove integrity-since-upload, not bank institutional authenticity. | `ATTEST.md` Section 4 |
| **PKI Hardware Qualified Signatures** | **DELIBERATELY DEFERRED** | Physical cryptographic smart cards / USB tokens / Cloud KMS HSM deferred. HMAC-SHA256 development-mode integrity active and transparently labeled. | `ATTEST.md` Section 4 |
| **Multi-Currency Conversion** | **DELIBERATELY DEFERRED** | Single-currency (`PKR`) enforced per engagement to prevent floating-point conversion distortion. Cross-currency translation engine deferred post-MVP. | `src/engine/matcher.ts` |
| **Email / WhatsApp Delivery** | **DELIBERATELY DEFERRED** | External SMTP and WhatsApp Business API delivery deferred; in-app Notification Center and copyable verification link sharing fully operational. | `src/components/common/NotificationBell.tsx` |

---

### 2. Phase 5 Hardening & Verification Results

#### A. Test Suite Completion & Flakiness Elimination
- **Money Arithmetic Edge Cases**:
  - Zero-value transactions accurately handled (`PKR 0.00`, 0 paise).
  - Maximum safe integers (`Number.MAX_SAFE_INTEGER`, 9,007,199,254,740,991 paise = PKR 90.07 Trillion) formatted and incremented with zero precision loss.
  - Negative-amount CSV rows normalized (negative debits converted to credits and vice versa).
- **R4 Continuity Across Three Consecutive Statements**:
  - Verified continuous progression across Month 1 (Opening 50M, Closing 60M) &rarr; Month 2 (Opening 60M, Closing 45M) &rarr; Month 3 (Opening 45M, Closing 65M).
  - Verified continuity break detection when Month 4 has an opening balance mismatch (opening 68M vs previous closing 65M).
- **Matcher Idempotency at Scale (200 Transactions)**:
  - 200 synthetic transactions processed through matcher and exception generator; exact same 10 exceptions produced on initial run and rerun; zero duplicate exceptions created.
- **Certificate Payload Canonicalization**:
  - Shuffled and reversed JSON key orders verified to produce character-for-character identical canonical JSON and identical SHA-256 hashes.
- **Concurrent Processing-Run Safety**:
  - Enforced unique database constraint on `Exception.dedupKey` (`@unique`).
  - Two parallel execution threads attempting to create identical exceptions simultaneously handled: 1 succeeded, 1 was safely blocked with `P2002` duplicate prevention, ensuring zero duplicate records in the database.
- **Flakiness Audit**:
  - Isolated test file database concurrency using `fileParallelism: false` in `vitest.config.ts`.
  - Executed 3 consecutive full test runs: **All 9 test files, 67 tests passed 3 times in a row with 0 failures**.

#### B. Demo Mode Hardening
- `DEMO_MODE` env flag verification: Quick-login rejected with explicit error message when `DEMO_MODE="false"`.
- Idempotent `resetDemoData()`: Wipes and reseeds Meridian Textiles in a single clean sequence; recreates 8 bank transactions, 7 ledger entries, and reinitializes a 6-event cryptographic audit chain with valid SHA-256 continuity (`verifyAuditChain()` returns `true`).
- `DEMONSTRATION DATA` ribbon crawler: Confirmed presence on every demo organization screen across `/portal` and `/ca` routes.

#### C. Security Pass
- **Auth Endpoint Rate Limiting**: NextAuth credentials provider enforces 5 requests/minute per client IP; trips on 6th attempt with lockout messaging.
- **Tenant Isolation on File Downloads**: Request by Org B user session to download Org A source document strictly returns HTTP 403 Forbidden (`"Tenant boundary violation"`). Non-existent IDs return HTTP 404.
- **Zero Client Bundle Secrets**: Grepped `.next/static` production bundle for `SIGNING_KEY`, `AUTH_SECRET`, and development secret strings: **0 matches found**.
- **Stack Trace Suppression**: All server endpoints return sanitized JSON error messages with zero internal database stack traces leaked to clients.
- **Session Expiry**: Default session duration configured to 24 hours (`maxAge: 86400`).

#### D. Production Build Hygiene
- `npm run build`: Compiled 34 static and dynamic routes cleanly with **zero warnings** and zero errors.

---

### 3. Final Verification Counts
- **Total Test Suites**: 9 passed (9 total)
- **Total Tests**: 67 passed (67 total, 100% passing)
- **3-Run Flakiness Check**: Run 1 (67/67), Run 2 (67/67), Run 3 (67/67)
- **Build Output**: 34 pages optimized, zero bundle warnings
- **Secret Audit**: 0 secrets leaked in client bundles

---

## Phase: P5.5: Design System Overhaul
**Date**: October 15, 2026  
**Status**: COMPLETE ✅  
**Commit Message**: `P5.5: design system`

### 1. Overview & Scope Lock
- Ported the visual design language from `design-reference.html` across the entire Next.js application.
- **Frontend-only restyle**: All routes, API endpoints, permissions checks, deterministic engine logic, and data flows remain completely untouched.
- `git diff src/engine`, `git diff src/app/api`, and `git diff prisma` strictly return 0 lines changed.

### 2. Design System Tokens & Foundation
1. **Design Tokens (`globals.css` & `tailwind.config.ts`)**:
   - Palette: Background `--bg #FAF9F6`, card `--card #FFFFFF`, borders `--line #E9E6DF`, line-highlight `--line2 #DDD9D0`, primary text `--txt #17161A`, muted text `--mut #6E6A63`, faint text `--faint #9E9B94`.
   - Brand Accents: Accent `--acc #4F46E5`, secondary accent `--acc2 #7C5CFF`.
   - Semantic Colors: Success green `--good #188A54`, warning amber `--warn #B45309`, alert red `--bad #C0362C`.
   - Decorative Washes: Spray pink `#EC4899` and spray teal `#14B8A6` strictly reserved for background decorative art layer.
   - Card Style: `rgba(255, 255, 255, 0.92)` with `backdrop-blur-md` (`card-glass`), allowing the whisper art layer to hint through while maintaining crisp readability.
   - Shadows: `--sh: 0 1px 2px rgba(23,22,26,.04), 0 10px 30px -14px rgba(23,22,26,.12)`; `--sh2: 0 20px 40px -15px rgba(23,22,26,.18)`.
2. **Typography**:
   - Headings: `Inter Tight` (variable font).
   - Body & Controls: `Inter` (variable font).
   - Identifiers, Amounts & Hashes: `JetBrains Mono` (variable font).
3. **The Whisper Decorative Layer (`<GraffitiBackdrop />`)**:
   - 4 blurred drifting spray washes (`.wash`) with 22-30s slow non-linear float.
   - 3 giant ghost outline words (`.ghostword`): `"TRUST"` (left), `"✓ 100%"` (center), `"VERIFIED"` (bottom right) with stroke-only text at ~6% opacity.
   - 6 hand-drawn SVG doodle assets (`.doodle`): arrow curl, verified badge, squiggle, burst star, crown doodle, double underline at 15–28% opacity.
   - Fully accessible: `pointer-events-none`, `aria-hidden="true"`, `z-0` behind content. Responsive: ghost words and doodles hidden below 900px viewports (washes stay).
   - Selective rendering rule: Present on all application pages EXCEPT the public `/verify/[id]` result sheet and the certificate print view (`/portal/certificate/print`), where a clean institutional background is maintained.
4. **Accessibility & Reduced Motion**:
   - `@media (prefers-reduced-motion: reduce)` disables all spray drift, word reveal, circular spin, and pulse animations.
   - Explicit visible focus rings (`focus-visible:ring-2 focus-visible:ring-[#4F46E5]`) on all interactive buttons, inputs, and links.
   - Contrast ratio &ge; 4.5:1 for all text against the warm background.
   - Zero emojis in the UI — 100% inline SVGs via Lucide React and custom SVG paths.

### 3. Reusable Component Suite (`src/components/ui`)
- `<GraffitiBackdrop />`: Global subtle background art layer.
- `<VerdictCard />`: Animated SVG ring with `stroke-dashoffset` transition, dynamic state badge, plain-language title/description/CTA (amber open count &rarr; green CA handover).
- `<SummaryStrip />`: 4-stat continuous assurance summary strip with count-up animation on mount and hairline vertical dividers.
- `<ExceptionRow />`: Severity chip, plain-language title, tags, mono amount, chevron, interactive click handler.
- `<PipelineSteps />`: 6-stage checking machine progress pills with active pulsing dot and completed checkmarks.
- `<TimelineSteps />`: Vertical timeline showing arithmetic continuity, question resolution, and CA verification, with `"CA VERIFIED ✓"` stamp (`stampIn` animation).
- `<SealBadge />`: Rotating SVG circular text seal with `"CA SIGNED · VERIFIED · ATTEST · LIVE ·"` path and central shield emblem.
- `<StatusPill />` & `<Tag />`: Palette-aligned semantic pills with clean borders.
- `<CopyButton />` & `<Toast />`: Restyled with design tokens and smooth transitions.

### 4. Page Restyles
- **Landing (`/`)**: Word-by-word reveal hero, 3D tilting certificate card with `SealBadge` and live daily clock, marquee ticker band, 3-step continuous flow, 3 persona portals, CTA band, honest footer with disclaimer.
- **Authentication (`/auth/signin`, `/auth/register`)**: Centered frosted cards with `GraffitiBackdrop`, demo persona quick-logins strictly gated behind `NEXT_PUBLIC_DEMO_MODE`.
- **Portal Dashboard (`/portal`)**: Wired to real exceptions, `VerdictCard`, `SummaryStrip`, `ExceptionRow` with owner-friendly translations from `labels.ts`, checking machine card with `PipelineSteps`, and interactive Question Modal.
- **CA Console (`/ca`)**: Ranked review queue styled with `ExceptionRow` chips and glass cards.
- **CA Sign-Off Chamber (`/ca/sign-off`)**: Sign-off card featuring `SealBadge` on issued certificates and pre-sign checklist.
- **Certificate View (`/portal/certificate`)**: Frosted card layout with `SealBadge` and download actions.
- **Certificate Print View (`/portal/certificate/print`)**: Pure white institutional document layout without art layer.
- **Public Verifier Search (`/verify`)**: Restyled search hero with `GraffitiBackdrop` and privacy shield callout.
- **Public Verifier Result (`/verify/[id]`)**: Clean institutional card without graffiti backdrop, featuring `SealBadge` on valid certificates, verbatim `ATTEST_SCOPE_LANGUAGE`, friendly not-found card, and evidence disclosure request form.

### 5. Verification Results
- **Automated Tests**: All 9 test suites passed, 67/67 tests green (`npm test`).
- **Production Build**: Clean compilation with 0 errors/warnings (`npm run build`).
- **Walkthrough Screenshots**: 12 high-resolution screenshots generated in Edge and saved to artifacts:
  1. `01_landing.png`: Landing hero with tilting cert card, rotating seal, and marquee.
  2. `02_signin.png`: Frosted sign-in card with demo persona buttons.
  3. `03_dashboard_amber.png`: Client dashboard with amber VerdictCard ring and open questions.
  4. `04_exception_detail.png`: Question modal with owner-friendly explanation and document picker.
  5. `05_engine_run_mid.png`: Checking machine mid-run with animated PipelineSteps pills.
  6. `06_certificate_view.png`: Client certificate view with rotating SealBadge.
  7. `07_ca_console.png`: CA review console with ranked exception rows.
  8. `08_ca_sign_off.png`: CA sign-off chamber with issued trust certificate.
  9. `09_verify_valid.png`: Public verifier with valid certificate, SealBadge, and scope language.
  10. `10_verify_not_found.png`: Public verifier friendly not-found card with search guidance.
  11. `11_dashboard_green.png`: Client dashboard with green VerdictCard ring.
  12. `12_side_by_side_comparison.png`: Visual sibling proof juxtaposing `design-reference.html` against `/portal`.

### 6. Phase 6 Candidates (Future Engine / Backend Considerations)
- **Audit Event Cursor Pagination**: For organizations exceeding 10,000 ledger entries, add cursor-based keyset pagination to `src/engine/audit.ts`.
- **Automated CA Webhook Dispatch**: Optional webhook notifications dispatched upon CA certificate digital signing.
- **Hardware Security Module (HSM) PKI Bridge**: Production PKI qualified digital signature signing pipeline for physical token or Cloud KMS integration.







