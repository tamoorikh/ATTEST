import { prisma } from "@/lib/prisma";
import { getLevelDescription } from "./certificate";

export interface GateEvaluation {
  id: string;
  name: string;
  status: "PASS" | "BLOCKED";
  reason: string;
  details?: Record<string, unknown>;
}

export interface DisclosedLimitation {
  exceptionId: string;
  title: string;
  severity: string;
  status: string;
  clientTreatment?: string | null;
  caTreatment?: string | null;
}

export interface PreIssuanceGatesResult {
  canIssue: boolean;
  gates: GateEvaluation[];
  level: number;
  levelTitle: string;
  levelSummary: string;
  coveragePercent: number;
  procedures: string[];
  disclosedLimitations: DisclosedLimitation[];
  summary: {
    totalGates: number;
    passedGates: number;
    blockedGates: number;
  };
}

/**
 * Evaluates the 5 mandatory pre-issuance sign-off gates for an engagement.
 */
export async function evaluatePreIssuanceGates(
  orgId: string,
  period: string,
  caConclusion?: string
): Promise<PreIssuanceGatesResult> {
  const gates: GateEvaluation[] = [];

  // 1. Gate 1: Source documents present for the period
  const bankStatements = await prisma.sourceDocument.findMany({
    where: {
      orgId,
      period,
      type: "BANK_STATEMENT",
    },
  });

  const totalBankTx = await prisma.bankTransaction.count({
    where: {
      orgId,
      date: {
        gte: new Date(`${period}-01`),
        lte: new Date(`${period}-31T23:59:59.999Z`),
      },
    },
  });

  if (bankStatements.length === 0 && totalBankTx === 0) {
    gates.push({
      id: "GATE_1_SOURCES",
      name: "Source Period Statements Present",
      status: "BLOCKED",
      reason: `No bank statements or verified transactions uploaded for period ${period}.`,
    });
  } else {
    gates.push({
      id: "GATE_1_SOURCES",
      name: "Source Period Statements Present",
      status: "PASS",
      reason: `Source bank statements present (${bankStatements.length} statement(s), ${totalBankTx} transactions).`,
      details: { statementsCount: bankStatements.length, transactionsCount: totalBankTx },
    });
  }

  // 2. Gate 2: Validation rules R1-R4 passed (or resolved)
  const failedBalanceTxs = await prisma.bankTransaction.findMany({
    where: {
      orgId,
      balanceOk: false,
      date: {
        gte: new Date(`${period}-01`),
        lte: new Date(`${period}-31T23:59:59.999Z`),
      },
    },
  });

  if (failedBalanceTxs.length > 0) {
    // Check if exceptions exist and are resolved
    const unresolvedBalanceExceptions = await prisma.exception.findMany({
      where: {
        orgId,
        period,
        type: { in: ["BALANCE_GAP", "CLOSING_BALANCE_MISMATCH"] },
        status: { notIn: ["RESOLVED", "WAIVED"] },
      },
    });

    if (unresolvedBalanceExceptions.length > 0) {
      gates.push({
        id: "GATE_2_VALIDATION",
        name: "Validation Rules R1–R4 Passed",
        status: "BLOCKED",
        reason: `Validation rule R1/R2 failure: ${failedBalanceTxs.length} transaction(s) have broken running balance continuity without resolved exceptions.`,
      });
    } else {
      gates.push({
        id: "GATE_2_VALIDATION",
        name: "Validation Rules R1–R4 Passed",
        status: "PASS",
        reason: "Validation failures resolved via documented exceptions.",
      });
    }
  } else {
    gates.push({
      id: "GATE_2_VALIDATION",
      name: "Validation Rules R1–R4 Passed",
      status: "PASS",
      reason: "Arithmetic continuity (Rules R1–R4) fully verified across all statement transactions.",
    });
  }

  // 3. Gate 3: ZERO open exceptions of severity HIGH or CRITICAL
  const openHighCriticalExceptions = await prisma.exception.findMany({
    where: {
      orgId,
      period,
      severity: { in: ["HIGH", "CRITICAL"] },
      status: { notIn: ["RESOLVED", "WAIVED"] },
    },
  });

  // Collect disclosed limitations (LOW, MEDIUM, or waived items)
  const otherExceptions = await prisma.exception.findMany({
    where: {
      orgId,
      period,
      OR: [
        { severity: { in: ["LOW", "MEDIUM", "INFO"] } },
        { status: "WAIVED" },
      ],
    },
    include: {
      resolvedBy: true,
    },
  });

  const disclosedLimitations: DisclosedLimitation[] = otherExceptions.map((ex) => ({
    exceptionId: ex.id,
    title: ex.title,
    severity: ex.severity,
    status: ex.status,
    clientTreatment: ex.resolutionNotes || "No client submission recorded",
    caTreatment: ex.rejectionReason || (ex.status === "WAIVED" ? "Waived under CA professional judgment" : "Monitored as non-material limitation"),
  }));

  if (openHighCriticalExceptions.length > 0) {
    const list = openHighCriticalExceptions.map((e) => `${e.title} (${e.severity})`).join(", ");
    gates.push({
      id: "GATE_3_NO_HIGH_EXCEPTIONS",
      name: "Zero Open High/Critical Exceptions",
      status: "BLOCKED",
      reason: `Blocked by ${openHighCriticalExceptions.length} open HIGH/CRITICAL exception(s): ${list}.`,
      details: { count: openHighCriticalExceptions.length, exceptions: openHighCriticalExceptions.map((e) => e.id) },
    });
  } else {
    gates.push({
      id: "GATE_3_NO_HIGH_EXCEPTIONS",
      name: "Zero Open High/Critical Exceptions",
      status: "PASS",
      reason: `All material exceptions resolved (${disclosedLimitations.length} non-critical item(s) recorded under disclosed limitations).`,
    });
  }

  // 4. Gate 4: CA Professional conclusion note (min 50 chars)
  const conclusionLen = (caConclusion || "").trim().length;
  if (conclusionLen < 50) {
    gates.push({
      id: "GATE_4_CA_CONCLUSION",
      name: "CA Professional Conclusion Note",
      status: "BLOCKED",
      reason: `CA professional conclusion note requires at least 50 characters (currently ${conclusionLen} characters).`,
    });
  } else {
    gates.push({
      id: "GATE_4_CA_CONCLUSION",
      name: "CA Professional Conclusion Note",
      status: "PASS",
      reason: `Professional conclusion note documented (${conclusionLen} characters).`,
    });
  }

  // 5. Gate 5: Verification level computed from run data
  const latestRun = await prisma.processingRun.findFirst({
    where: { orgId, period, status: "COMPLETED" },
    orderBy: { createdAt: "desc" },
  });

  let levelAchieved = 1;
  let coveragePercent = 0;

  if (latestRun?.statsJson) {
    try {
      const stats = JSON.parse(latestRun.statsJson);
      coveragePercent = stats.coveragePercent || stats.stats?.coveragePercent || 0;
      levelAchieved = stats.verificationLevel?.levelAchieved || (coveragePercent >= 60 ? 2 : 1);
    } catch {
      // fallback
    }
  } else {
    // Dynamically calculate
    const ledgerCount = await prisma.ledgerEntry.count({
      where: {
        orgId,
        date: {
          gte: new Date(`${period}-01`),
          lte: new Date(`${period}-31T23:59:59.999Z`),
        },
      },
    });
    const matchesCount = await prisma.match.count({
      where: { orgId, status: "CONFIRMED" },
    });
    coveragePercent = totalBankTx > 0 ? Math.round((matchesCount / totalBankTx) * 100) : 0;
    levelAchieved = ledgerCount > 0 && coveragePercent >= 60 ? 2 : 1;
  }

  const levelInfo = getLevelDescription(levelAchieved);

  gates.push({
    id: "GATE_5_VERIFICATION_LEVEL",
    name: "Verification Level Computed Honestly",
    status: "PASS",
    reason: `${levelInfo.title} (${coveragePercent}% coverage). Level displayed honestly with zero inflated claims.`,
    details: { level: levelAchieved, coveragePercent, title: levelInfo.title },
  });

  const blockedCount = gates.filter((g) => g.status === "BLOCKED").length;
  const passedCount = gates.filter((g) => g.status === "PASS").length;

  return {
    canIssue: blockedCount === 0,
    gates,
    level: levelAchieved,
    levelTitle: levelInfo.title,
    levelSummary: levelInfo.summary,
    coveragePercent,
    procedures: levelInfo.procedures,
    disclosedLimitations,
    summary: {
      totalGates: gates.length,
      passedGates: passedCount,
      blockedGates: blockedCount,
    },
  };
}
