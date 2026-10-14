/**
 * ATTEST RECONCILIATION ENGINE — DETERMINISTIC MATCHER
 * Framework-free, deterministic, configurable matching algorithm.
 * Zero AI dependency, 100% explainable rules.
 */

import {
  BankTxInput,
  LedgerEntryInput,
  MatchCandidate,
  MatcherConfig,
  DEFAULT_MATCHER_CONFIG,
} from "./types";

/**
 * Clean and normalize counterparty strings for comparison.
 */
export function normalizeCounterparty(str?: string | null): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\b(pvt|ltd|limited|co|company|corp|corporation|gmbh|inc|llc|pllc)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Normalized Levenshtein distance similarity [0.0 - 1.0].
 */
export function stringSimilarity(s1: string, s2: string): number {
  const norm1 = normalizeCounterparty(s1);
  const norm2 = normalizeCounterparty(s2);

  if (!norm1 && !norm2) return 1.0;
  if (!norm1 || !norm2) return 0.0;
  if (norm1 === norm2) return 1.0;

  // Check token containment
  const tokens1 = norm1.split(" ").filter(Boolean);
  const tokens2 = norm2.split(" ").filter(Boolean);
  const commonTokens = tokens1.filter((t) => tokens2.includes(t));
  if (tokens1.length > 0 && tokens2.length > 0) {
    const tokenScore = (2.0 * commonTokens.length) / (tokens1.length + tokens2.length);
    if (tokenScore >= 0.8) return Math.min(1.0, tokenScore);
  }

  // Levenshtein distance
  const track = Array(norm2.length + 1)
    .fill(null)
    .map(() => Array(norm1.length + 1).fill(null));

  for (let i = 0; i <= norm1.length; i += 1) track[0][i] = i;
  for (let j = 0; j <= norm2.length; j += 1) track[j][0] = j;

  for (let j = 1; j <= norm2.length; j += 1) {
    for (let i = 1; i <= norm1.length; i += 1) {
      const indicator = norm1[i - 1] === norm2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  const distance = track[norm2.length][norm1.length];
  const maxLen = Math.max(norm1.length, norm2.length);
  return Math.max(0, 1 - distance / maxLen);
}

/**
 * Difference in calendar days between two dates.
 */
export function getDaysDifference(d1: Date, d2: Date): number {
  const t1 = new Date(d1).getTime();
  const t2 = new Date(d2).getTime();
  return Math.abs(t1 - t2) / (1000 * 60 * 60 * 24);
}

export function matchTransactions(
  bankTxs: BankTxInput[],
  ledgerEntries: LedgerEntryInput[],
  config: MatcherConfig = DEFAULT_MATCHER_CONFIG
): MatchCandidate[] {
  // CRITICAL MULTI-CURRENCY SAFETY:
  // Validate currencies across all inputs. Cross-currency matching is strictly prohibited!
  for (const b of bankTxs) {
    const bCurrency = (b.currency || "PKR").toUpperCase();
    for (const l of ledgerEntries) {
      const lCurrency = (l.currency || "PKR").toUpperCase();
      if (bCurrency !== lCurrency) {
        throw new Error(
          `Cross-currency matching prohibited: Bank tx currency (${bCurrency}) does not match ledger currency (${lCurrency})`
        );
      }
    }
  }

  const matches: MatchCandidate[] = [];
  const matchedBankTxIds = new Set<string>();
  const matchedLedgerEntryIds = new Set<string>();

  // Helper to get net amounts
  const getBankAmount = (tx: BankTxInput) =>
    tx.debitPaise > 0 ? tx.debitPaise : tx.creditPaise;
  const getBankType = (tx: BankTxInput) => (tx.debitPaise > 0 ? "DEBIT" : "CREDIT");

  const getLedgerAmount = (entry: LedgerEntryInput) =>
    entry.debitPaise > 0 ? entry.debitPaise : entry.creditPaise;
  const getLedgerType = (entry: LedgerEntryInput) =>
    entry.debitPaise > 0 ? "DEBIT" : "CREDIT";

  // PASS 1: 1:1 Matches & Ambiguous Candidate Detection
  for (const b of bankTxs) {
    if (matchedBankTxIds.has(b.id)) continue;
    const bAmt = getBankAmount(b);
    const bType = getBankType(b);

    // Find candidates within date window
    const candidates: Array<{
      entry: LedgerEntryInput;
      daysDiff: number;
      similarity: number;
      refMatch: boolean;
      exactAmount: boolean;
    }> = [];

    for (const l of ledgerEntries) {
      if (matchedLedgerEntryIds.has(l.id)) continue;
      const lAmt = getLedgerAmount(l);
      const lType = getLedgerType(l);

      // Debit/Credit alignment
      if (bType !== lType) continue;

      const daysDiff = getDaysDifference(b.date, l.date);
      const amountDiff = Math.abs(bAmt - lAmt);
      const exactAmount = amountDiff <= config.amountTolerancePaise;

      // Reference match checking
      let refMatch = false;
      if (config.referenceContains && b.ref && l.ref) {
        const bRef = b.ref.toLowerCase().trim();
        const lRef = l.ref.toLowerCase().trim();
        if (bRef === lRef || bRef.includes(lRef) || lRef.includes(bRef)) {
          refMatch = true;
        }
      }
      if (config.referenceContains && b.ref && l.description.toLowerCase().includes(b.ref.toLowerCase())) {
        refMatch = true;
      }
      if (config.referenceContains && l.ref && b.description.toLowerCase().includes(l.ref.toLowerCase())) {
        refMatch = true;
      }

      const similarity = stringSimilarity(
        b.counterparty || b.description,
        l.counterparty || l.description
      );

      // If within date window and amount matches
      if (daysDiff <= config.dateWindowDays && exactAmount) {
        candidates.push({ entry: l, daysDiff, similarity, refMatch, exactAmount });
      } else if (daysDiff <= config.dateWindowDays && refMatch) {
        candidates.push({ entry: l, daysDiff, similarity, refMatch, exactAmount });
      }
    }

    if (candidates.length === 1) {
      const c = candidates[0];
      const rulesList: string[] = [];

      if (c.exactAmount) rulesList.push("amount_exact");
      if (c.daysDiff <= config.dateWindowDays) rulesList.push("date_window");

      // Check whether it is AUTO_MATCHED or AMBIGUOUS
      if (c.refMatch) {
        rulesList.push("ref_contained");
        matches.push({
          bankTxIds: [b.id],
          ledgerEntryIds: [c.entry.id],
          score: 1.0,
          rule: rulesList.join(" + "),
          status: "AUTO_MATCHED",
          type: "ONE_TO_ONE",
          amountPaise: bAmt,
        });
        matchedBankTxIds.add(b.id);
        matchedLedgerEntryIds.add(c.entry.id);
      } else if (c.similarity >= config.counterpartySimilarityThreshold) {
        rulesList.push(`counterparty_${c.similarity.toFixed(2)}`);
        matches.push({
          bankTxIds: [b.id],
          ledgerEntryIds: [c.entry.id],
          score: Number((0.85 + 0.15 * c.similarity).toFixed(2)),
          rule: rulesList.join(" + "),
          status: "AUTO_MATCHED",
          type: "ONE_TO_ONE",
          amountPaise: bAmt,
        });
        matchedBankTxIds.add(b.id);
        matchedLedgerEntryIds.add(c.entry.id);
      } else {
        // Amount exact but counterparty below threshold -> AMBIGUOUS!
        rulesList.push(`counterparty_low_${c.similarity.toFixed(2)}`);
        matches.push({
          bankTxIds: [b.id],
          ledgerEntryIds: [c.entry.id],
          score: 0.5,
          rule: rulesList.join(" + "),
          status: "AMBIGUOUS",
          type: "ONE_TO_ONE",
          amountPaise: bAmt,
        });
        // Not marking as auto-matched so humans review it
      }
    } else if (candidates.length > 1) {
      // Multiple candidates competing for same bank transaction -> AMBIGUOUS!
      const topCandidates = candidates.filter(
        (c) => c.similarity >= config.counterpartySimilarityThreshold || c.refMatch
      );
      if (topCandidates.length === 1) {
        const c = topCandidates[0];
        const rulesList = ["amount_exact", "date_window"];
        if (c.refMatch) rulesList.push("ref_contained");
        else rulesList.push(`counterparty_${c.similarity.toFixed(2)}`);

        matches.push({
          bankTxIds: [b.id],
          ledgerEntryIds: [c.entry.id],
          score: 0.9,
          rule: rulesList.join(" + "),
          status: "AUTO_MATCHED",
          type: "ONE_TO_ONE",
          amountPaise: bAmt,
        });
        matchedBankTxIds.add(b.id);
        matchedLedgerEntryIds.add(c.entry.id);
      } else {
        // Competitive ambiguity
        for (const c of candidates) {
          matches.push({
            bankTxIds: [b.id],
            ledgerEntryIds: [c.entry.id],
            score: 0.5,
            rule: "competing_multiple_candidates_ambiguous",
            status: "AMBIGUOUS",
            type: "ONE_TO_ONE",
            amountPaise: bAmt,
          });
        }
      }
    }
  }

  // PASS 2: 1:Many (Split Payments: One bank tx splitting across multiple ledger entries)
  for (const b of bankTxs) {
    if (matchedBankTxIds.has(b.id)) continue;
    const bAmt = getBankAmount(b);
    const bType = getBankType(b);

    const eligibleLedger = ledgerEntries.filter((l) => {
      if (matchedLedgerEntryIds.has(l.id)) return false;
      if (getLedgerType(l) !== bType) return false;
      return getDaysDifference(b.date, l.date) <= config.dateWindowDays;
    });

    // Try pairs (2 entries)
    let foundSplit = false;
    for (let i = 0; i < eligibleLedger.length; i++) {
      for (let j = i + 1; j < eligibleLedger.length; j++) {
        const l1 = eligibleLedger[i];
        const l2 = eligibleLedger[j];
        const sumAmt = getLedgerAmount(l1) + getLedgerAmount(l2);

        if (Math.abs(sumAmt - bAmt) <= config.amountTolerancePaise) {
          matches.push({
            bankTxIds: [b.id],
            ledgerEntryIds: [l1.id, l2.id],
            score: 0.95,
            rule: "amount_split_exact + date_window + multi_ledger_sum",
            status: "AUTO_MATCHED",
            type: "ONE_TO_MANY",
            amountPaise: bAmt,
          });
          matchedBankTxIds.add(b.id);
          matchedLedgerEntryIds.add(l1.id);
          matchedLedgerEntryIds.add(l2.id);
          foundSplit = true;
          break;
        }
      }
      if (foundSplit) break;
    }
  }

  // PASS 3: Partial Payments (ledger > bank within window, matching counterparty)
  for (const b of bankTxs) {
    if (matchedBankTxIds.has(b.id)) continue;
    const bAmt = getBankAmount(b);
    const bType = getBankType(b);

    for (const l of ledgerEntries) {
      if (matchedLedgerEntryIds.has(l.id)) continue;
      if (getLedgerType(l) !== bType) continue;
      const lAmt = getLedgerAmount(l);

      const daysDiff = getDaysDifference(b.date, l.date);
      if (daysDiff <= config.dateWindowDays && bAmt < lAmt) {
        const similarity = stringSimilarity(
          b.counterparty || b.description,
          l.counterparty || l.description
        );
        const refMatch =
          b.ref && l.ref && (b.ref.includes(l.ref) || l.ref.includes(b.ref));

        if (similarity >= config.counterpartySimilarityThreshold || refMatch) {
          matches.push({
            bankTxIds: [b.id],
            ledgerEntryIds: [l.id],
            score: 0.8,
            rule: `partial_payment + counterparty_${similarity.toFixed(2)} + date_window`,
            status: "PARTIAL",
            type: "PARTIAL",
            amountPaise: bAmt,
            differencePaise: lAmt - bAmt,
          });
        }
      }
    }
  }

  return matches;
}
