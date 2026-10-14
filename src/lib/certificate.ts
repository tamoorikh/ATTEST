import crypto from "crypto";

export const ATTEST_SCOPE_LANGUAGE =
  "procedures and results — not opinions; not a statutory audit; no creditworthiness representation";

export const ATTEST_SIGNATURE_DISCLAIMER =
  "development-mode integrity — not a qualified digital signature";

export interface CanonicalCertificatePayload {
  publicId: string;
  organization: {
    name: string;
    taxId?: string | null;
    registrationNumber?: string | null;
    jurisdiction?: string;
  };
  level: string; // e.g. "LEVEL_2"
  levelAchieved: number; // 1, 2, or 3
  levelDescription: string;
  period: {
    start: string; // YYYY-MM-DD
    end: string;   // YYYY-MM-DD
    code: string;  // e.g. "2026-04"
  };
  coveragePercent: number;
  procedures: string[];
  disclosedLimitations: string[];
  scope: string;
  caConclusion: string;
  signatory: {
    name: string;
    email: string;
    credentialLine: string;
  };
  issuedAt: string; // ISO 8601
  signatureMode: "DEVELOPMENT" | "QUALIFIED";
}

/**
 * Sorts all object keys recursively to produce deterministic canonical JSON.
 */
export function canonicalizeJson(obj: unknown): string {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return "[" + obj.map((item) => canonicalizeJson(item)).join(",") + "]";
  }

  const keys = Object.keys(obj as Record<string, unknown>).sort();
  const entries = keys.map((key) => {
    const val = (obj as Record<string, unknown>)[key];
    return `${JSON.stringify(key)}:${canonicalizeJson(val)}`;
  });

  return "{" + entries.join(",") + "}";
}

/**
 * Generates an unpredictable public certificate identifier with a 2-char check suffix.
 * Format: ATTEST-PK-2026-XXXXXX-CK (e.g., ATTEST-PK-2026-894215-9K)
 */
export function generatePublicId(year = 2026): string {
  // Generate 6 random decimal digits (or hex)
  const randomBytes = crypto.randomBytes(4);
  const num = randomBytes.readUInt32BE(0) % 900000 + 100000; // 100000 to 999999
  const randomStr = num.toString();

  // Compute 2-char check suffix from hash of randomStr + year
  const hash = crypto.createHash("sha256").update(`${year}-${randomStr}`).digest("hex");
  const checkSuffix = hash.substring(0, 2).toUpperCase();

  return `ATTEST-PK-${year}-${randomStr}-${checkSuffix}`;
}

/**
 * Computes SHA-256 hash of canonical JSON string.
 */
export function computePayloadHash(canonicalJson: string): string {
  return crypto.createHash("sha256").update(canonicalJson, "utf8").digest("hex");
}

/**
 * Signs payload hash using HMAC-SHA256 with SIGNING_KEY env variable or fallback dev key.
 */
export function signPayloadHash(payloadHash: string, customKey?: string): string {
  const secret = customKey || process.env.SIGNING_KEY || "attest-dev-secret-signing-key-2026";
  return crypto.createHmac("sha256", secret).update(payloadHash, "utf8").digest("hex");
}

/**
 * Verifies payload integrity and HMAC signature.
 */
export function verifyCertificateSignature(
  canonicalJson: string,
  payloadHash: string,
  signature: string,
  customKey?: string
): { valid: boolean; reason?: string } {
  const expectedHash = computePayloadHash(canonicalJson);
  if (expectedHash !== payloadHash) {
    return {
      valid: false,
      reason: "PAYLOAD_HASH_MISMATCH",
    };
  }

  const expectedSignature = signPayloadHash(payloadHash, customKey);
  const sigBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");

  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return {
      valid: false,
      reason: "SIGNATURE_MISMATCH",
    };
  }

  return { valid: true };
}

/**
 * Returns level descriptions that are strictly honest and do not overstate assurance.
 */
export function getLevelDescription(level: number): { title: string; summary: string; procedures: string[] } {
  switch (level) {
    case 3:
      return {
        title: "Level 3: Comprehensive Assurance",
        summary:
          "Three-way corroborated reconciliation across Bank Statements, General Ledger, and external Invoice registers.",
        procedures: [
          "Arithmetic continuity verification of bank statement closing and running balances",
          "Two-way reconciliation between bank debits/credits and general ledger journal entries",
          "Three-way corroboration against external tax invoices and sales/purchase registers",
          "Deterministic exception rule evaluation (duplicate payments, unrecorded sales, amount drift)",
          "CA independent verification and resolution of all material exceptions",
        ],
      };
    case 2:
      return {
        title: "Level 2: Standard Reconciliation",
        summary:
          "Two-way reconciliation between primary Bank Statements and General Ledger entries. Does not perform external three-way invoice corroboration.",
        procedures: [
          "Arithmetic continuity verification of bank statement closing and running balances (Rules R1–R4)",
          "Two-way reconciliation between bank transactions and accounting ledger entries",
          "Deterministic exception identification and documented CA resolution review",
          "Verification of transaction category alignment and payment classifications",
        ],
      };
    case 1:
    default:
      return {
        title: "Level 1: Statements Only",
        summary:
          "Direct validation of bank statement arithmetic continuity and running balances. No general ledger matching performed.",
        procedures: [
          "Arithmetic continuity verification of bank statement closing and running balances (Rules R1–R4)",
          "Integrity check of source PDF/CSV document hash against upload ledger",
          "Detection of statement gaps and balance drift",
        ],
      };
  }
}
