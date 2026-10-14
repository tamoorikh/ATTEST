/**
 * ATTEST RECONCILIATION ENGINE — CORE TYPE DEFINITIONS
 * Framework-free, deterministic, zero-AI dependency.
 */

export interface BankTxInput {
  id: string;
  orgId: string;
  date: Date;
  description: string;
  counterparty?: string | null;
  ref?: string | null;
  debitPaise: number;
  creditPaise: number;
  currency?: string; // defaults to "PKR"
  runningBalancePaise?: number;
  balanceOk?: boolean;
}

export interface LedgerEntryInput {
  id: string;
  orgId: string;
  date: Date;
  description: string;
  counterparty?: string | null;
  debitPaise: number;
  creditPaise: number;
  account: string;
  ref?: string | null;
  currency?: string; // defaults to "PKR"
}

export interface InvoiceInput {
  id: string;
  orgId: string;
  invoiceNumber: string;
  date: Date;
  counterparty: string;
  amountPaise: number;
  type: "SALES" | "PURCHASE";
  currency?: string; // defaults to "PKR"
  ref?: string | null;
}

export type TransactionCategory =
  | "payroll"
  | "supplier-payment"
  | "revenue-like credit (inferred)"
  | "customer-receipt"
  | "tax-payment"
  | "rent-utilities"
  | "loan-proceeds"
  | "loan-repayment"
  | "inter-account-transfer"
  | "refund"
  | "interest"
  | "cash-withdrawal"
  | "personal-mixing-indicator"
  | "unexplained";

export type ConfidenceLevel = "high" | "medium" | "low";

export interface ClassificationResult {
  bankTxId: string;
  category: TransactionCategory;
  confidence: ConfidenceLevel;
  rule: string;
}

export interface MatcherConfig {
  amountTolerancePaise: number; // default: 0
  dateWindowDays: number; // default: 3
  counterpartySimilarityThreshold: number; // default: 0.75
  referenceContains: boolean; // default: true
}

export const DEFAULT_MATCHER_CONFIG: MatcherConfig = {
  amountTolerancePaise: 0,
  dateWindowDays: 3,
  counterpartySimilarityThreshold: 0.75,
  referenceContains: true,
};

export type MatchStatus = "AUTO_MATCHED" | "AMBIGUOUS" | "PARTIAL";

export interface MatchCandidate {
  bankTxIds: string[];
  ledgerEntryIds: string[];
  score: number;
  rule: string; // e.g. "amount_exact + date_window + counterparty_0.92"
  status: MatchStatus;
  type: "ONE_TO_ONE" | "ONE_TO_MANY" | "MANY_TO_ONE" | "PARTIAL";
  amountPaise: number;
  differencePaise?: number;
}

export interface ThreeWayMatchResult {
  bankTxId: string;
  ledgerEntryId?: string | null;
  invoiceId?: string | null;
  invoiceNumber?: string | null;
  status: "THREE_WAY_MATCHED" | "MISSING_INVOICE" | "UNRECORDED_CREDIT" | "NO_MATCH";
  score: number;
  rule: string;
}

export type ExceptionType =
  | "DUPLICATE_PAYMENT"
  | "UNRECORDED_CREDIT"
  | "UNRECORDED_SALE"
  | "PAYMENT_WITHOUT_INVOICE"
  | "LEDGER_WITHOUT_BANK"
  | "POSSIBLE_DIRECTOR_LOAN"
  | "PAYROLL_MISMATCH"
  | "PERSONAL_MIXING_SUSPECTED"
  | "MISSING_STATEMENT_PERIOD"
  | "BALANCE_DISCREPANCY"
  | "STATEMENT_BALANCE_MISMATCH"
  | "CONSECUTIVE_CONTINUITY_BREAK";

export type SeverityLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface ExceptionCandidate {
  type: ExceptionType;
  title: string;
  explanation: string;
  whyItMatters: string;
  suggestedResolution: string;
  evidenceRequired: string;
  severity: SeverityLevel;
  amountPaise: number;
  period: string;
  bankTxId?: string | null;
  ledgerEntryId?: string | null;
}

export interface VerificationLevelResult {
  levelEligible: 1 | 2 | 3;
  levelAchieved: 1 | 2 | 3;
  levelReason: string;
  nextSteps: string;
}

export interface EngineStats {
  totalBankTransactions: number;
  totalLedgerEntries: number;
  totalInvoices: number;
  matchedCount: number;
  unmatchedBankCount: number;
  unmatchedLedgerCount: number;
  ambiguousCount: number;
  partialCount: number;
  coveragePercent: number;
  exceptionsCount: number;
}

export interface ReconciliationEngineOutput {
  period: string;
  classifications: ClassificationResult[];
  matches: MatchCandidate[];
  threeWayResults: ThreeWayMatchResult[];
  exceptions: ExceptionCandidate[];
  verificationLevel: VerificationLevelResult;
  stats: EngineStats;
}
