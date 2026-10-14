import { prisma } from "../prisma";
import { ParsedCsvRow } from "../parser/csv";
import { formatPaise } from "../money";
import { appendAuditEvent } from "../audit";

export interface ValidationInput {
  orgId: string;
  sourceDocumentId: string;
  period: string;
  openingBalancePaise: number;
  closingBalancePaise: number;
  parsedRows: ParsedCsvRow[];
  bankAccountId?: string;
  actorId?: string;
}

export interface ValidationResult {
  runId: string;
  allRulesPassed: boolean;
  r1Passed: boolean;
  r2Passed: boolean;
  r3Passed: boolean;
  r4Passed: boolean;
  calculatedClosingPaise: number;
  totalDebitsPaise: number;
  totalCreditsPaise: number;
  createdTransactionsCount: number;
  createdExceptionsCount: number;
  stats: Record<string, unknown>;
}

export async function validateAndNormalizeBankStatement(
  input: ValidationInput
): Promise<ValidationResult> {
  const {
    orgId,
    sourceDocumentId,
    period,
    openingBalancePaise,
    closingBalancePaise,
    parsedRows,
    bankAccountId,
    actorId,
  } = input;

  const totalDebitsPaise = parsedRows.reduce((sum, r) => sum + r.debitPaise, 0);
  const totalCreditsPaise = parsedRows.reduce((sum, r) => sum + r.creditPaise, 0);
  const calculatedClosingPaise = openingBalancePaise - totalDebitsPaise + totalCreditsPaise;

  // RULE 1: Statement Balance Reconciliation (tolerance: 0)
  const r1Passed = calculatedClosingPaise === closingBalancePaise;

  // RULE 2: Running Balances Chain
  let r2Passed = true;
  let runningBalanceBreakIndex = -1;
  let runningBal = openingBalancePaise;

  const normalizedRows = parsedRows.map((row, idx) => {
    runningBal = runningBal - row.debitPaise + row.creditPaise;
    let balanceOk = true;

    if (row.runningBalancePaise !== undefined) {
      if (row.runningBalancePaise !== runningBal) {
        balanceOk = false;
        r2Passed = false;
        if (runningBalanceBreakIndex === -1) {
          runningBalanceBreakIndex = idx;
        }
      }
    }

    return {
      ...row,
      calculatedRunningBalancePaise: runningBal,
      balanceOk,
    };
  });

  // RULE 3: Duplicate Transaction Detection
  const duplicates: Array<{ idx1: number; idx2: number; desc: string; amountPaise: number }> = [];
  for (let i = 0; i < normalizedRows.length; i++) {
    for (let j = i + 1; j < normalizedRows.length; j++) {
      const a = normalizedRows[i];
      const b = normalizedRows[j];
      const sameAmount = a.debitPaise === b.debitPaise && a.creditPaise === b.creditPaise;
      const sameDesc = a.description.toLowerCase().trim() === b.description.toLowerCase().trim();
      const sameDate = a.date.toISOString().split("T")[0] === b.date.toISOString().split("T")[0];

      if (sameAmount && sameDesc && sameDate && (a.debitPaise > 0 || a.creditPaise > 0)) {
        duplicates.push({
          idx1: i,
          idx2: j,
          desc: a.description,
          amountPaise: a.debitPaise > 0 ? a.debitPaise : a.creditPaise,
        });
      }
    }
  }
  const r3Passed = duplicates.length === 0;

  // RULE 4: Consecutive-Statement Continuity
  // Check previous processing run or statement closing balance from a strictly prior period
  const previousRun = await prisma.processingRun.findFirst({
    where: {
      orgId,
      period: { lt: period },
    },
    orderBy: { period: "desc" },
  });

  let r4Passed = true;
  let previousClosingBalancePaise: number | null = null;

  if (previousRun && previousRun.statsJson) {
    try {
      const stats = JSON.parse(previousRun.statsJson);
      if (stats.closingBalancePaise !== undefined) {
        previousClosingBalancePaise = stats.closingBalancePaise;
        if (previousClosingBalancePaise !== openingBalancePaise) {
          // If opening balance does not equal previous statement's closing balance
          r4Passed = false;
        }
      }
    } catch (e) {}
  }

  const allRulesPassed = r1Passed && r2Passed && r3Passed && r4Passed;

  // Persist BankTransactions
  const createdTransactions = [];
  for (const row of normalizedRows) {
    const tx = await prisma.bankTransaction.create({
      data: {
        orgId,
        bankAccountId,
        sourceDocumentId,
        date: row.date,
        description: row.description,
        counterparty: row.counterparty,
        ref: row.ref,
        debitPaise: row.debitPaise,
        creditPaise: row.creditPaise,
        runningBalancePaise: row.runningBalancePaise ?? row.calculatedRunningBalancePaise,
        balanceOk: row.balanceOk,
        category: "Uncategorized",
        matchStatus: "UNMATCHED",
      },
    });
    createdTransactions.push(tx);
  }

  // Generate Exceptions for failed rules
  const createdExceptions = [];

  if (!r1Passed) {
    const diff = Math.abs(calculatedClosingPaise - closingBalancePaise);
    try {
      const exc = await prisma.exception.create({
        data: {
          orgId,
          type: "STATEMENT_BALANCE_MISMATCH",
          title: "Statement closing balance does not reconcile",
          explanation: `Calculated closing balance (${formatPaise(calculatedClosingPaise)}) differs from stated closing balance (${formatPaise(closingBalancePaise)}) by ${formatPaise(diff)}. Tolerance is strictly 0 paisa.`,
          severity: "CRITICAL",
          status: "OPEN",
          amountPaise: diff,
          period,
          dedupKey: `${orgId}:${period}:STATEMENT_BALANCE_MISMATCH`,
          suggestedResolution:
            "Verify statement transactions against physical paper bank statement or request updated electronic statement from issuing bank.",
        },
      });
      createdExceptions.push(exc);
    } catch (err: any) {
      if (err?.code !== "P2002") throw err;
    }
  }

  if (!r2Passed && runningBalanceBreakIndex !== -1) {
    const brokenTx = createdTransactions[runningBalanceBreakIndex];
    try {
      const exc = await prisma.exception.create({
        data: {
          orgId,
          type: "RUNNING_BALANCE_CHAIN_BREAK",
          title: `Running balance continuity break detected at row ${runningBalanceBreakIndex + 1}`,
          explanation: `Row ${runningBalanceBreakIndex + 1} (${brokenTx.description}) stated running balance does not mathematically equal previous balance plus credits minus debits.`,
          severity: "HIGH",
          status: "OPEN",
          period,
          bankTxId: brokenTx.id,
          dedupKey: `${orgId}:${period}:RUNNING_BALANCE_CHAIN_BREAK:${brokenTx.id}`,
          suggestedResolution: "Inspect statement for omitted or redacted interim transactions.",
        },
      });
      createdExceptions.push(exc);
    } catch (err: any) {
      if (err?.code !== "P2002") throw err;
    }
  }

  if (!r3Passed) {
    for (const dup of duplicates) {
      try {
        const exc = await prisma.exception.create({
          data: {
            orgId,
            type: "POTENTIAL_DUPLICATE_TX",
            title: `Potential duplicate transaction within statement: "${dup.desc}"`,
            explanation: `Identical transaction of ${formatPaise(dup.amountPaise)} appeared multiple times on the same date.`,
            severity: "HIGH",
            status: "OPEN",
            amountPaise: dup.amountPaise,
            period,
            dedupKey: `${orgId}:${period}:POTENTIAL_DUPLICATE_TX:${dup.desc}:${dup.amountPaise}`,
            suggestedResolution: "Verify if vendor was paid twice or bank charged debit twice.",
          },
        });
        createdExceptions.push(exc);
      } catch (err: any) {
        if (err?.code !== "P2002") throw err;
      }
    }
  }

  if (!r4Passed && previousClosingBalancePaise !== null) {
    try {
      const exc = await prisma.exception.create({
        data: {
          orgId,
          type: "CONSECUTIVE_CONTINUITY_BREAK",
          title: "Consecutive statement opening balance mismatch",
          explanation: `Statement opening balance (${formatPaise(openingBalancePaise)}) does not equal prior statement closing balance (${formatPaise(previousClosingBalancePaise)}).`,
          severity: "HIGH",
          status: "OPEN",
          period,
          amountPaise: Math.abs(openingBalancePaise - previousClosingBalancePaise),
          dedupKey: `${orgId}:${period}:CONSECUTIVE_CONTINUITY_BREAK`,
          suggestedResolution: "Ensure statements are ingested in chronological order without date gaps.",
        },
      });
      createdExceptions.push(exc);
    } catch (err: any) {
      if (err?.code !== "P2002") throw err;
    }
  }

  // Persist ProcessingRun with statsJson (Appends run, never overwrites!)
  const stats = {
    totalBankTransactions: createdTransactions.length,
    totalDebitsPaise,
    totalCreditsPaise,
    openingBalancePaise,
    closingBalancePaise,
    calculatedClosingPaise,
    balanceDiscrepancyPaise: Math.abs(calculatedClosingPaise - closingBalancePaise),
    r1BalanceReconciliation: { passed: r1Passed, tolerancePaise: 0 },
    r2RunningBalancesChain: { passed: r2Passed },
    r3DuplicateDetection: { passed: r3Passed, duplicatesCount: duplicates.length },
    r4ConsecutiveContinuity: { passed: r4Passed, previousClosingBalancePaise },
    rulesPassed: [
      ...(r1Passed ? ["R1_BALANCE_RECONCILIATION"] : []),
      ...(r2Passed ? ["R2_RUNNING_BALANCES_CHAIN"] : []),
      ...(r3Passed ? ["R3_DUPLICATE_DETECTION"] : []),
      ...(r4Passed ? ["R4_CONSECUTIVE_CONTINUITY"] : []),
    ],
    rulesFailed: [
      ...(!r1Passed ? ["R1_BALANCE_RECONCILIATION"] : []),
      ...(!r2Passed ? ["R2_RUNNING_BALANCES_CHAIN"] : []),
      ...(!r3Passed ? ["R3_DUPLICATE_DETECTION"] : []),
      ...(!r4Passed ? ["R4_CONSECUTIVE_CONTINUITY"] : []),
    ],
    exceptionsGenerated: createdExceptions.map((e) => ({ id: e.id, type: e.type, title: e.title })),
  };

  const processingRun = await prisma.processingRun.create({
    data: {
      orgId,
      period,
      engineVersion: "v1.0.0-deterministic",
      status: allRulesPassed ? "COMPLETED" : "COMPLETED_WITH_EXCEPTIONS",
      statsJson: JSON.stringify(stats),
    },
  });

  // Audit event
  await appendAuditEvent({
    orgId,
    actorId,
    action: "STATEMENT_NORMALIZED_AND_VALIDATED",
    entityType: "ProcessingRun",
    entityId: processingRun.id,
    metadata: {
      sourceDocumentId,
      transactionsCreated: createdTransactions.length,
      exceptionsCreated: createdExceptions.length,
      allRulesPassed,
    },
  });

  return {
    runId: processingRun.id,
    allRulesPassed,
    r1Passed,
    r2Passed,
    r3Passed,
    r4Passed,
    calculatedClosingPaise,
    totalDebitsPaise,
    totalCreditsPaise,
    createdTransactionsCount: createdTransactions.length,
    createdExceptionsCount: createdExceptions.length,
    stats,
  };
}
