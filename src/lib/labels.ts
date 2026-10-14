/**
 * ATTEST PLATFORM — CANONICAL LABEL & ENUM DICTIONARY
 * Converts raw database enums and technical keys into plain, professional English.
 * Rule: Zero raw database enums and zero underscores in any user-facing UI.
 */

export const ENUM_LABELS: Record<string, string> = {
  // Exception Types
  DUPLICATE_PAYMENT: "Possible duplicate payment",
  UNRECORDED_CREDIT: "Receipt not recorded in books",
  UNRECORDED_SALE: "Unrecorded sale deposit",
  PAYMENT_WITHOUT_INVOICE: "Payment without invoice evidence",
  PAYROLL_EVIDENCE_MISSING: "Payroll register entry missing",
  UTILITIES_BILL_MISSING: "Supporting utility bill missing",
  LEDGER_WITHOUT_BANK: "Book entry without bank clearing",
  POSSIBLE_DIRECTOR_LOAN: "Director financing credit",
  PAYROLL_MISMATCH: "Payroll register discrepancy",
  PERSONAL_MIXING_SUSPECTED: "Personal expenditure suspected",
  STATEMENT_BALANCE_MISMATCH: "Statement closing balance mismatch",
  CONSECUTIVE_CONTINUITY_BREAK: "Statement opening balance mismatch",
  BALANCE_DISCREPANCY: "Statement balance discrepancy",
  MISSING_STATEMENT_PERIOD: "Missing statement period",
  AMOUNT_MISMATCH: "Amount mismatch",
  POTENTIAL_DUPLICATE_TX: "Duplicate transaction in statement",

  // Exception Statuses
  OPEN: "Action required",
  CLIENT_SUBMITTED: "Awaiting professional review",
  CA_REVIEW: "Under CA review",
  IN_REVIEW: "Under CA review",
  MORE_INFO_REQUESTED: "More evidence requested",
  RESOLVED: "Resolved with evidence",
  WAIVED: "Waived by CA",
  REJECTED: "Submission rejected",
  ESCALATED: "Escalated for senior review",

  // Severity Levels
  CRITICAL: "Critical",
  HIGH: "High priority",
  MEDIUM: "Medium priority",
  LOW: "Low priority",
  INFO: "Informational",

  // Match Statuses
  AUTO_MATCHED: "Auto-matched",
  AMBIGUOUS: "Needs review",
  PARTIAL: "Partial payment",
  CONFIRMED: "Confirmed match",
  UNMATCHED: "Unmatched",
  MATCHED: "Reconciled",
  EXCEPTION: "Exception flagged",
  THREE_WAY_MATCHED: "3-Way fully verified",
  MISSING_INVOICE: "Missing invoice evidence",
  CANDIDATE: "Candidate match",

  // Match Rule Types
  EXACT_AMOUNT_DATE: "Exact amount & date",
  INVOICE_REF_MATCH: "Invoice reference match",
  HEURISTIC: "Heuristic pattern match",
  ONE_TO_ONE: "1:1 exact match",
  ONE_TO_MANY: "Split payment (1:many)",
  MANY_TO_ONE: "Consolidated payment (many:1)",

  // Document Types & Statuses
  BANK_STATEMENT: "Bank Statement",
  LEDGER: "General Ledger",
  INVOICE_REGISTER: "Sales & Invoices Register",
  TAX_FILING: "Statutory Tax Filing",
  PRIMARY: "Primary Source",
  SECONDARY: "Secondary Books",
  CORROBORATING: "Corroborating Evidence",
  PENDING: "Pending processing",
  PARSED: "Successfully parsed",
  NEEDS_OCR: "Requires OCR (Scanned)",
  FAILED: "Processing failed",

  // Audit Events
  RECONCILIATION_ENGINE_EXECUTED: "Verification run completed",
  STATEMENT_INGESTED: "Statement uploaded and parsed",
  TRANSACTION_CATEGORY_OVERRIDDEN: "Transaction category updated",
  COMPANY_ONBOARDING_COMPLETED: "Company onboarding submitted",
  EXCEPTION_RESOLUTION_SUBMITTED: "Resolution submitted by client",
  EXCEPTION_RESOLVED: "Resolution approved by CA",
  EXCEPTION_RESOLUTION_REJECTED: "Resolution rejected by CA",
  EXCEPTION_MORE_INFO_REQUESTED: "More evidence requested by CA",
  EXCEPTION_ESCALATED: "Exception escalated to senior signatory",
  EXCEPTION_WAIVED: "Exception waived by CA",
  CERTIFICATE_ISSUED: "Trust certificate issued",
  INITIAL_CHAIN_GENESIS: "Audit anchor initialized",
  DOCUMENT_UPLOADED: "Source document archived",
  USER_LOGIN: "User session authenticated",
  DISCLOSURE_REQUESTED: "Third-party disclosure requested",
  REVIEW_NOTE_ADDED: "CA review note recorded",
  NOTIFICATION_CREATED: "Notification dispatched",

  // Resolution Types
  DUPLICATE_REVERSAL: "Duplicate disbursement reversal",
  MISSING_EVIDENCE: "Missing supporting evidence",
  EXPLANATION: "Written accounting explanation",
  DISPUTE: "Dispute finding",

  // Review Note Statuses
  INTERNAL: "CA Internal Note",
  SHARED_WITH_CLIENT: "Shared with Client",
  ACTION_REQUIRED: "Client Action Required",

  // Assurance Levels
  STANDARD_ASSURANCE: "Level 2 — Standard Assurance",
  COMPREHENSIVE: "Level 3 — Comprehensive Assurance",
  STATEMENTS_ONLY: "Level 1 — Statements Verified",
};

/**
 * Convert any enum or snake_case string into polished human English.
 */
export function formatEnumLabel(value: string | null | undefined): string {
  if (!value) return "";
  if (ENUM_LABELS[value]) {
    return ENUM_LABELS[value];
  }

  // Fallback: title-case without underscores
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Truncate SHA-256 hash to short human-readable 8-char reference.
 */
export function formatShortHash(hash: string | null | undefined, chars: number = 8): string {
  if (!hash) return "";
  if (hash.length <= chars) return hash;
  return `${hash.slice(0, chars)}...`;
}

/**
 * Relative time formatter ("2 hours ago", "Yesterday", etc.)
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 172800) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
