/**
 * ATTEST RECONCILIATION ENGINE — EXCEPTION GENERATOR
 * Generates plain-language, actionable exceptions with materiality-based severity weighting.
 * Zero AI dependency.
 */

import {
  BankTxInput,
  LedgerEntryInput,
  InvoiceInput,
  MatchCandidate,
  ThreeWayMatchResult,
  ExceptionCandidate,
  SeverityLevel,
  ExceptionType,
} from "./types";
import { formatPaise } from "../lib/money";
import { stringSimilarity, getDaysDifference } from "./matcher";

export interface ExceptionGeneratorConfig {
  materialityThresholdPaise: number; // default: 5,000,000 (PKR 50,000)
  directorNames?: string[]; // e.g. ["Tariq Mahmood", "Zahid Khan"]
}

export const DEFAULT_EXCEPTION_CONFIG: ExceptionGeneratorConfig = {
  materialityThresholdPaise: 5000000, // PKR 50,000
  directorNames: ["Tariq Mahmood"],
};

export function calculateSeverity(
  type: ExceptionType,
  amountPaise: number,
  materiality: number
): SeverityLevel {
  if (type === "BALANCE_DISCREPANCY" || type === "STATEMENT_BALANCE_MISMATCH") {
    return "CRITICAL";
  }

  if (type === "PERSONAL_MIXING_SUSPECTED") {
    return "LOW";
  }

  if (type === "DUPLICATE_PAYMENT") {
    return amountPaise >= materiality ? "HIGH" : "MEDIUM";
  }

  if (type === "UNRECORDED_CREDIT" || type === "UNRECORDED_SALE") {
    if (amountPaise >= materiality * 5) return "CRITICAL";
    if (amountPaise >= materiality) return "HIGH";
    return "MEDIUM";
  }

  if (amountPaise >= materiality) {
    return "HIGH";
  }

  return "MEDIUM";
}

export function generateExceptions(
  period: string,
  bankTxs: BankTxInput[],
  ledgerEntries: LedgerEntryInput[],
  invoices: InvoiceInput[],
  matches: MatchCandidate[],
  threeWayResults: ThreeWayMatchResult[],
  config: ExceptionGeneratorConfig = DEFAULT_EXCEPTION_CONFIG
): ExceptionCandidate[] {
  const exceptions: ExceptionCandidate[] = [];
  const materiality = config.materialityThresholdPaise;

  const matchedBankIds = new Set<string>();
  const matchedLedgerIds = new Set<string>();

  for (const m of matches) {
    if (m.status === "AUTO_MATCHED") {
      m.bankTxIds.forEach((id) => matchedBankIds.add(id));
      m.ledgerEntryIds.forEach((id) => matchedLedgerIds.add(id));
    }
  }

  // 1. DUPLICATE PAYMENT DETECTION (E-101 shape)
  // Two bank debits, same counterparty & amount within window, but only 1 invoice/liability exists
  const debits = bankTxs.filter((b) => b.debitPaise > 0);
  for (let i = 0; i < debits.length; i++) {
    for (let j = i + 1; j < debits.length; j++) {
      const b1 = debits[i];
      const b2 = debits[j];

      if (b1.debitPaise === b2.debitPaise && b1.debitPaise > 0) {
        const similarity = stringSimilarity(
          b1.counterparty || b1.description,
          b2.counterparty || b2.description
        );
        const days = getDaysDifference(b1.date, b2.date);

        if (similarity >= 0.75 && days <= 30) {
          // Check how many invoices exist for this counterparty and amount
          const matchingInvoices = invoices.filter((inv) => {
            const invSim = stringSimilarity(inv.counterparty, b1.counterparty || b1.description);
            return invSim >= 0.75 && inv.amountPaise === b1.debitPaise;
          });

          // If there is only 1 invoice or purchase liability for 2 identical debits
          if (matchingInvoices.length <= 1) {
            const secondTx = b1.date > b2.date ? b1 : b2;
            const counterpartyName = secondTx.counterparty || secondTx.description;
            const amountFormatted = formatPaise(secondTx.debitPaise);

            exceptions.push({
              type: "DUPLICATE_PAYMENT",
              title: `Potential duplicate payment of ${amountFormatted} to ${counterpartyName}`,
              explanation: `Two debit transactions of ${amountFormatted} occurred within ${Math.round(days)} days (${b1.date.toISOString().split("T")[0]} and ${b2.date.toISOString().split("T")[0]}). However, only one corresponding invoice exists in the purchase records.`,
              whyItMatters:
                "Duplicate disbursements deplete cash reserves, create unrecoverable supplier overpayments, and distort cost-of-goods-sold.",
              suggestedResolution:
                "Verify whether the second debit was an accidental duplicate payment or an advance disbursement for a subsequent order. If erroneous, seek a credit note or cash refund.",
              evidenceRequired:
                "Vendor account statement, corroborated second purchase invoice, or refund credit note.",
              severity: calculateSeverity("DUPLICATE_PAYMENT", secondTx.debitPaise, materiality),
              amountPaise: secondTx.debitPaise,
              period,
              bankTxId: secondTx.id,
            });
          }
        }
      }
    }
  }

  // 2. UNRECORDED CREDIT DETECTION (E-102 shape)
  // Bank credit with no ledger entry
  const credits = bankTxs.filter((b) => b.creditPaise > 0);
  for (const b of credits) {
    if (!matchedBankIds.has(b.id)) {
      const formattedAmount = formatPaise(b.creditPaise);
      const cpName = b.counterparty || "unidentified remitter";

      // Check if invoice exists (from threeWay results)
      const threeWay = threeWayResults.find((tw) => tw.bankTxId === b.id);
      const invoiceNotice = threeWay?.invoiceNumber
        ? ` Sales tax invoice #${threeWay.invoiceNumber} exists in sales register.`
        : "";

      exceptions.push({
        type: "UNRECORDED_CREDIT",
        title: `Unrecorded bank deposit of ${formattedAmount} from ${cpName}`,
        explanation: `Bank deposit of ${formattedAmount} received on ${b.date.toISOString().split("T")[0]} has no matching general ledger entry.${invoiceNotice}`,
        whyItMatters:
          "Unrecorded receipts result in unstated revenue, under-reported sales tax liability under FBR regulations, and reconciliation gaps.",
        suggestedResolution:
          "Post an adjusting journal entry debiting Cash at Bank and crediting Sales Revenue or Accounts Receivable.",
        evidenceRequired:
          "FBR Annexure-C sales tax invoice, customer contract, or remittance advice note.",
        severity: calculateSeverity("UNRECORDED_CREDIT", b.creditPaise, materiality),
        amountPaise: b.creditPaise,
        period,
        bankTxId: b.id,
      });
    }
  }

  // 3. PAYMENT WITHOUT INVOICE
  // Debit matches ledger payable but no invoice document in purchase records
  for (const m of matches) {
    if (m.status === "AUTO_MATCHED") {
      const bankTx = bankTxs.find((b) => m.bankTxIds.includes(b.id) && b.debitPaise > 0);
      if (bankTx) {
        // Check if there is an invoice matching this debit
        const hasInvoice = invoices.some((inv) => {
          const sim = stringSimilarity(inv.counterparty, bankTx.counterparty || bankTx.description);
          return sim >= 0.75 && inv.amountPaise === bankTx.debitPaise;
        });

        if (!hasInvoice && invoices.length > 0) {
          // Only flag if invoice register has records but this debit is missing invoice
          const formatted = formatPaise(bankTx.debitPaise);
          exceptions.push({
            type: "PAYMENT_WITHOUT_INVOICE",
            title: `Disbursement of ${formatted} lacks vendor invoice evidence`,
            explanation: `Payment of ${formatted} to ${bankTx.counterparty || bankTx.description} on ${bankTx.date.toISOString().split("T")[0]} matches ledger booking but has no supporting tax invoice.`,
            whyItMatters:
              "Disbursements without statutory invoices risk disallowance under tax audits and failure of audit assertion of occurrence.",
            suggestedResolution: "Obtain and archive the signed supplier bill or receipt voucher.",
            evidenceRequired: "Supplier tax invoice with NTN and STRN.",
            severity: calculateSeverity("PAYMENT_WITHOUT_INVOICE", bankTx.debitPaise, materiality),
            amountPaise: bankTx.debitPaise,
            period,
            bankTxId: bankTx.id,
          });
        }
      }
    }
  }

  // 4. LEDGER WITHOUT BANK
  // Ledger entry with no bank match within period
  for (const l of ledgerEntries) {
    if (!matchedLedgerIds.has(l.id)) {
      const amt = l.debitPaise > 0 ? l.debitPaise : l.creditPaise;
      const formattedAmt = formatPaise(amt);
      exceptions.push({
        type: "LEDGER_WITHOUT_BANK",
        title: `Book entry of ${formattedAmt} has no clearing bank transaction`,
        explanation: `Ledger entry "${l.description}" (${l.account}) dated ${l.date.toISOString().split("T")[0]} has not cleared through the bank account.`,
        whyItMatters:
          "Uncleared book entries may represent unpresented cheques, unposted deposits, or fictional ledger entries.",
        suggestedResolution:
          "Investigate whether payment instrument is in transit or void unpresented entry if expired.",
        evidenceRequired: "Physical cheque copy, counterfoil, or bank clearing advice.",
        severity: calculateSeverity("LEDGER_WITHOUT_BANK", amt, materiality),
        amountPaise: amt,
        period,
        ledgerEntryId: l.id,
      });
    }
  }

  // 5. POSSIBLE DIRECTOR LOAN
  // Counterparty matches director/shareholder names, credit in
  if (config.directorNames && config.directorNames.length > 0) {
    for (const b of credits) {
      const text = `${b.description} ${b.counterparty || ""}`.toLowerCase();
      const isDirector = config.directorNames.some((d) =>
        text.includes(d.toLowerCase())
      );
      if (isDirector || /director loan|loan from director|shareholder deposit/.test(text)) {
        const formatted = formatPaise(b.creditPaise);
        exceptions.push({
          type: "POSSIBLE_DIRECTOR_LOAN",
          title: `Director/shareholder financing credit of ${formatted}`,
          explanation: `Inward remittance of ${formatted} on ${b.date.toISOString().split("T")[0]} originates from a company director or shareholder (${b.counterparty || "Director"}).`,
          whyItMatters:
            "Director loans require board resolution approval, disclosure under SECP regulations, and clear documentation as equity injection or subordinated loan.",
          suggestedResolution:
            "Provide board resolution and loan agreement specifying markup terms and repayment horizon.",
          evidenceRequired: "Board minutes, loan agreement, and remitter CNIC/NTN.",
          severity: "MEDIUM",
          amountPaise: b.creditPaise,
          period,
          bankTxId: b.id,
        });
      }
    }
  }

  // 6. PERSONAL MIXING SUSPECTED (Heuristic, Low Severity)
  for (const b of bankTxs) {
    const text = `${b.description} ${b.counterparty || ""}`.toLowerCase();
    if (/grocery|school fee|tuition|personal medical|club membership|household/.test(text)) {
      const amt = b.debitPaise > 0 ? b.debitPaise : b.creditPaise;
      exceptions.push({
        type: "PERSONAL_MIXING_SUSPECTED",
        title: `Suspected personal expenditure of ${formatPaise(amt)} in corporate account`,
        explanation: `Transaction "${b.description}" on ${b.date.toISOString().split("T")[0]} indicates personal or non-corporate activity.`,
        whyItMatters:
          "Commingling personal and corporate funds pierces corporate veil and causes tax audit disallowances.",
        suggestedResolution:
          "Reclassify as director withdrawal or reimburse company from personal funds.",
        evidenceRequired: "Director drawing voucher or reimbursement bank receipt.",
        severity: "LOW",
        amountPaise: amt,
        period,
        bankTxId: b.id,
      });
    }
  }

  return exceptions;
}
