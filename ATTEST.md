# ATTEST — Constitution & Core Architectural Principles

> **Project Mission**: Attest is a financial verification and continuous assurance platform. Businesses upload bank statements and accounting books; a deterministic engine validates and reconciles them, creating exceptions; clients resolve exceptions with verifiable evidence; a licensed Chartered Accountant (CA) reviews and signs off; and a live "trust certificate" is issued that anyone can verify publicly by unique ID without logging in. Three interfaces share one unified backend: **Client Portal**, **CA Console**, and **Public Verifier**.

---

## 1. Fixed Technology Stack
No deviation or substitution permitted without explicit user instruction:
- **Framework**: Next.js 15 (App Router) + TypeScript (strict mode)
- **Styling**: Tailwind CSS (clean utility-first styling adhering to the design system)
- **Database & ORM**: SQLite via Prisma ORM (pragmatic local development, strict schema migrations)
- **Authentication**: NextAuth.js (v4 / Auth.js) with Credentials Provider and bcrypt password hashing
- **Validation**: Zod (for all API request bodies, forms, and data boundary parsing)
- **Testing**: Vitest + Testing Library (unit, integration, and security tenant-isolation tests)
- **Runtime**: Node.js 20+

---

## 2. The Money Rule
- **Absolute Rule**: All monetary values MUST be stored and computed as **integer minor units** (`paisa`, 1 PKR = 100 paisa, or equivalent cents).
- **Prohibition**: NEVER use floating-point types (`FLOAT`, `DOUBLE`, `Number` with decimals) for currency storage or monetary calculation.
- **Display**: Convert minor units to formatted major units exclusively at the UI presentation boundary (e.g., `(paise / 100).toLocaleString('en-PK', { minimumFractionDigits: 2 })`).

---

## 3. The Sacred Authority Rule
> **"AI proposes. Deterministic code validates. Authorized humans approve."**

- An LLM or AI assistant **NEVER** changes certificate status.
- An LLM **NEVER** approves exception resolutions.
- An LLM **NEVER** generates or applies digital signatures.
- **Core Operations**: No LLM or generative AI is required for core reconciliation or assurance operations. MVP operates on pure deterministic, rule-based algorithms with absolute auditability.

---

## 4. Honesty & Integrity Rules
- **No Mocked Integrations**: Never pretend or fake an external banking or government API connection. If simulated or synthetic, clearly state it as simulated.
- **Untrusted Inputs**: Every uploaded document (CSV, PDF, Excel) is untrusted input. Validate file headers, content length, MIME types, and sanitize data before parsing.
- **File Integrity vs Authenticity**: A cryptographic file hash (SHA-256) proves *integrity-since-upload* only. It does **not** prove the original authenticity or provenance of the uploaded file.
- **Demonstration Data Transparency**: Any demo organization, synthetic dataset, or mock ledger MUST display a persistent, visible badge labeled:
  `DEMONSTRATION DATA — NOT FOR REAL-WORLD FINANCIAL RELIANCE`
  on every screen of that organization.
- **Development-Mode Signatures**: Cryptographic signatures generated in development or without hardware/PKI qualification must explicitly state:
  `"development-mode integrity — not a qualified digital signature"`.
- **Demo Persona Gating**: Persona quick-login must be gated behind DEMO_MODE env flag; forbidden when DEMO_MODE is not 'true'.

---

## 5. Security & Multi-Tenant Isolation
- **Server-Side Authorization**: Every API route and Server Action must explicitly enforce role-based access control (RBAC). Allowed roles:
  - `Owner`
  - `FinanceManager`
  - `Accountant`
  - `CA-reviewer`
  - `PlatformAdmin`
- **Tenant Isolation**: Every database read/write query for organization-scoped data MUST explicitly filter on `orgId` derived from the verified user session. Cross-tenant leakage is a critical vulnerability.
- **Zero Client Secrets**: No server secrets, signing keys, or privileged credentials exposed in client bundles.
- **Append-Only Audit Log**: Every state-changing action creates an immutable `AuditEvent` with actor, action, timestamp, target entity, and a cryptographically linked hash chain (`prevHash` -> `hash`).
- **Public Rate Limiting**: The public verification endpoint (`/verify/[id]`) and disclosure endpoints must be strictly rate-limited against brute-force or denial-of-service enumeration.

---

## 6. UI / UX Design Direction
Inspired by modern fintech standards (Stripe, Linear, Mercury):
- **Background**: Light warm-neutral background (`#F7F7F5`).
- **Text & Structure**: Deep ink text (`#0B1220`) for high-contrast clarity.
- **Accent Palette**:
  - `Electric Blue` (`#2456E6`) — Reserved strictly for "verified / passed / trust issued".
  - `Amber / Orange` (`#D97706` / `#F59E0B`) — Warnings, pending review, actionable exceptions.
  - `Crimson Red` (`#DC2626`) — Failures, rejected items, reconciliation mismatches, critical alerts.
  - `Muted Slate / Gray` (`#E5E7EB` / `#6B7280`) — Borders, subtle table headers, secondary metadata.
- **Typography**: Inter (sans-serif) for body and titles; IBM Plex Mono (monospace) for all transaction numbers, hashes, amounts, and dates.
- **Motion & Polish**: Restrained micro-interactions; zero jarring transitions. Every view must provide explicit Loading, Empty, and Error states, fully responsive across desktop and tablet viewports.

---

## 7. Definition of Done (DoD)
A phase or feature is only complete when:
1. `npm run build` succeeds without TypeScript or bundling warnings/errors.
2. `npm test` passes completely with zero skipped or failing tests.
3. The flows have been manually verified and exercised on the local dev server.
4. `WORKLOG.md` is updated with an honest status report: what is fully working, what is partial, and what remains blocked or deferred.
