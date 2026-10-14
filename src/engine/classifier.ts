/**
 * ATTEST RECONCILIATION ENGINE — DETERMINISTIC CLASSIFIER
 * Framework-free, zero-AI dependency, pure regex/keyword pattern matching.
 */

import { BankTxInput, ClassificationResult, TransactionCategory } from "./types";

interface ClassifierOptions {
  /** If an invoice or verified sales match exists for this transaction */
  hasVerifiedSalesMatch?: boolean;
}

export function classifyTransaction(
  tx: BankTxInput,
  options?: ClassifierOptions
): ClassificationResult {
  const text = `${tx.description} ${tx.counterparty || ""} ${tx.ref || ""}`.toLowerCase().trim();
  const isDebit = tx.debitPaise > 0;
  const isCredit = tx.creditPaise > 0;

  // 1. Payroll rule
  if (/salary|salaries|payroll|wages|staff pay|remuneration/.test(text)) {
    return {
      bankTxId: tx.id,
      category: "payroll",
      confidence: "high",
      rule: "RULE_PAYROLL_KEYWORDS",
    };
  }

  // 2. Tax payment rule
  if (/fbr|tax|challan|withholding|pra|srb|kpbra|customs duty|sales tax/.test(text)) {
    return {
      bankTxId: tx.id,
      category: "tax-payment",
      confidence: "high",
      rule: "RULE_TAX_KEYWORDS",
    };
  }

  // 3. Rent & Utilities rule
  if (/k-electric|lesco|sngpl|ptcl|ssgc|iesco|fesco|mepco|gepco|utility|utilities|bill|electricity|water|gas|internet|office rent|factory rent/.test(text)) {
    return {
      bankTxId: tx.id,
      category: "rent-utilities",
      confidence: "high",
      rule: "RULE_UTILITIES_KEYWORDS",
    };
  }

  // 4. Cash withdrawal rule
  if (isDebit && /cash withdrawal|atm withdrawal|cheque withdrawal|self withdrawal|counter cash/.test(text)) {
    return {
      bankTxId: tx.id,
      category: "cash-withdrawal",
      confidence: "high",
      rule: "RULE_CASH_WITHDRAWAL",
    };
  }

  // 5. Inter-account transfer rule
  if (/internal transfer|sweep|inter-account|own account transfer|transfer between accounts/.test(text)) {
    return {
      bankTxId: tx.id,
      category: "inter-account-transfer",
      confidence: "high",
      rule: "RULE_INTER_ACCOUNT_TRANSFER",
    };
  }

  // 6. Refund rule
  if (/refund|reversal|chargeback|returned payment|returned cheque/.test(text)) {
    return {
      bankTxId: tx.id,
      category: "refund",
      confidence: "high",
      rule: "RULE_REFUND_KEYWORDS",
    };
  }

  // 7. Interest rule
  if (/profit on debt|interest income|bank profit|interest paid|markup on deposit|financial charges/.test(text)) {
    return {
      bankTxId: tx.id,
      category: "interest",
      confidence: "high",
      rule: "RULE_INTEREST_KEYWORDS",
    };
  }

  // 8. Personal mixing indicator (heuristic)
  if (/personal transfer|director draw|owner drawing|family expense|household|personal loan/.test(text)) {
    return {
      bankTxId: tx.id,
      category: "personal-mixing-indicator",
      confidence: "medium",
      rule: "RULE_PERSONAL_MIXING",
    };
  }

  // 9. Loan proceeds (credit)
  if (isCredit && /loan disburs|financing credit|term loan proceeds|borrowing|credit facility/.test(text)) {
    return {
      bankTxId: tx.id,
      category: "loan-proceeds",
      confidence: "high",
      rule: "RULE_LOAN_PROCEEDS",
    };
  }

  // 10. Loan repayment (debit)
  if (isDebit && /loan repay|principal installment|markup payment|finance lease|installment/.test(text)) {
    return {
      bankTxId: tx.id,
      category: "loan-repayment",
      confidence: "high",
      rule: "RULE_LOAN_REPAYMENT",
    };
  }

  // 11. Supplier / Vendor payment (debit)
  if (isDebit && /traders|fabrics|mills|supplies|procurement|vendor|chemicals|yarn|textiles|corp|ltd|pvt|invoice|inv|bill|materials/.test(text)) {
    return {
      bankTxId: tx.id,
      category: "supplier-payment",
      confidence: "medium",
      rule: "RULE_SUPPLIER_KEYWORDS",
    };
  }

  // 12. Revenue / Customer receipt credits
  // HARD RULE: never label a credit "customer-receipt" as a confirmed fact
  // unless a confirmed matching sales/invoice record exists!
  if (isCredit) {
    const isRevenueLike =
      /buyer remittance|export|sale|sales|customer|marketplace|settlement|daraz|inward remittance|deposit|transfer in|client/.test(text);

    if (options?.hasVerifiedSalesMatch) {
      return {
        bankTxId: tx.id,
        category: "customer-receipt",
        confidence: "high",
        rule: "RULE_CONFIRMED_CUSTOMER_RECEIPT_MATCH",
      };
    }

    if (isRevenueLike) {
      return {
        bankTxId: tx.id,
        category: "revenue-like credit (inferred)",
        confidence: "medium",
        rule: "RULE_REVENUE_LIKE_CREDIT_INFERRED",
      };
    }
  }

  // 13. Honest Fallback: unexplained
  return {
    bankTxId: tx.id,
    category: "unexplained",
    confidence: "low",
    rule: "RULE_UNEXPLAINED_FALLBACK",
  };
}

export function classifyTransactions(
  txs: BankTxInput[],
  verifiedMatchMap?: Map<string, boolean>
): ClassificationResult[] {
  return txs.map((tx) =>
    classifyTransaction(tx, {
      hasVerifiedSalesMatch: verifiedMatchMap?.get(tx.id) ?? false,
    })
  );
}
