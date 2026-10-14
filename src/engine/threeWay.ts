/**
 * ATTEST RECONCILIATION ENGINE — THREE-WAY PASS
 * Traces: Bank Credit ↔ Ledger Sales Entry ↔ Sales Invoice / Tax Invoice.
 * Level 3 Assurance standard: "Do not award three-way matches on amount alone."
 */

import {
  BankTxInput,
  LedgerEntryInput,
  InvoiceInput,
  MatchCandidate,
  ThreeWayMatchResult,
} from "./types";
import { stringSimilarity, getDaysDifference } from "./matcher";

export function performThreeWayReconciliation(
  bankCredits: BankTxInput[],
  ledgerEntries: LedgerEntryInput[],
  invoices: InvoiceInput[],
  twoWayMatches: MatchCandidate[]
): ThreeWayMatchResult[] {
  const results: ThreeWayMatchResult[] = [];

  for (const b of bankCredits) {
    if (b.creditPaise <= 0) continue;

    // 1. Look for existing 2-way match between Bank Credit and Ledger Sales Entry
    const twoWay = twoWayMatches.find(
      (m) =>
        m.status === "AUTO_MATCHED" &&
        m.bankTxIds.includes(b.id) &&
        m.ledgerEntryIds.length > 0
    );

    const matchedLedger = twoWay
      ? ledgerEntries.find((l) => l.id === twoWay.ledgerEntryIds[0])
      : null;

    // 2. Look for matching invoice
    // Check by:
    // (a) Exact invoice number reference match in bank/ledger
    // (b) Amount match + counterparty similarity >= 0.75 + date window <= 7 days
    let matchingInvoice: InvoiceInput | null = null;
    let matchRule = "";

    for (const inv of invoices) {
      const invNum = inv.invoiceNumber.toLowerCase().trim();
      const bRef = (b.ref || "").toLowerCase();
      const bDesc = b.description.toLowerCase();
      const lRef = (matchedLedger?.ref || "").toLowerCase();
      const lDesc = (matchedLedger?.description || "").toLowerCase();

      // Rule A: Explicit Invoice Number cross-reference
      if (
        (invNum && (bRef.includes(invNum) || bDesc.includes(invNum))) ||
        (invNum && (lRef.includes(invNum) || lDesc.includes(invNum)))
      ) {
        matchingInvoice = inv;
        matchRule = `invoice_number_ref (${inv.invoiceNumber})`;
        break;
      }

      // Rule B: Corroborated Amount + Counterparty + Date Window
      // "Do not award three-way matches on amount alone."
      const amountMatches = inv.amountPaise === b.creditPaise;
      const counterpartyScore = Math.max(
        stringSimilarity(b.counterparty || b.description, inv.counterparty),
        stringSimilarity(matchedLedger?.counterparty || "", inv.counterparty)
      );
      const daysDiff = getDaysDifference(b.date, inv.date);

      if (amountMatches && counterpartyScore >= 0.75 && daysDiff <= 7) {
        matchingInvoice = inv;
        matchRule = `amount_exact + counterparty_${counterpartyScore.toFixed(2)} + date_window`;
        break;
      }
    }

    // 3. Determine Three-Way State
    if (matchedLedger && matchingInvoice) {
      // Bank Credit + Ledger Sales Entry + Invoice Document
      results.push({
        bankTxId: b.id,
        ledgerEntryId: matchedLedger.id,
        invoiceId: matchingInvoice.id,
        invoiceNumber: matchingInvoice.invoiceNumber,
        status: "THREE_WAY_MATCHED",
        score: 1.0,
        rule: `three_way_complete: bank + ledger + ${matchRule}`,
      });
    } else if (matchedLedger && !matchingInvoice && invoices.length > 0) {
      // Bank Credit + Ledger Sales Entry, but missing invoice in register
      results.push({
        bankTxId: b.id,
        ledgerEntryId: matchedLedger.id,
        status: "MISSING_INVOICE",
        score: 0.6,
        rule: "sale without invoice evidence",
      });
    } else if (!matchedLedger && matchingInvoice) {
      // Bank Credit + Invoice Document, but missing general ledger recording (E-102 shape)
      results.push({
        bankTxId: b.id,
        invoiceId: matchingInvoice.id,
        invoiceNumber: matchingInvoice.invoiceNumber,
        status: "UNRECORDED_CREDIT",
        score: 0.5,
        rule: `bank_credit_unrecorded_in_ledger + ${matchRule}`,
      });
    } else {
      results.push({
        bankTxId: b.id,
        status: "NO_MATCH",
        score: 0.0,
        rule: "unmatched_bank_credit",
      });
    }
  }

  return results;
}
