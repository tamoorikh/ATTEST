import { PrismaClient } from "@prisma/client";
import { executeOrchestratorForPeriod } from "../src/engine/orchestrator";
import { formatPaise } from "../src/lib/money";

const prisma = new PrismaClient();

async function main() {
  console.log("================================================================================");
  console.log("              ATTEST PLATFORM — PHASE 2 RECONCILIATION ENGINE                   ");
  console.log("================================================================================\n");

  const org = await prisma.organization.findFirst({
    where: { slug: "meridian-textiles" },
    include: {
      bankAccounts: true,
      memberships: { include: { user: true } },
    },
  });

  if (!org) {
    throw new Error("Meridian Textiles demo organization not found.");
  }

  const owner = org.memberships.find((m) => m.role === "Owner")?.user;

  console.log(`[TARGET TENANT]: ${org.name} (${org.id})`);
  console.log(`[ACTOR]: ${owner?.name} <${owner?.email}>`);
  console.log(`[PERIOD]: 2026-04\n`);

  console.log(">>> Executing Orchestrator for April 2026...");
  const result = await executeOrchestratorForPeriod({
    orgId: org.id,
    period: "2026-04",
    actorId: owner?.id,
    prismaClient: prisma,
  });

  console.log("\n--------------------------------------------------------------------------------");
  console.log("ENGINE EXECUTION SUMMARY");
  console.log("--------------------------------------------------------------------------------");
  console.log(`ProcessingRun ID:     ${result.runId}`);
  console.log(`Status:                ${result.status}`);
  console.log(`Diff Summary:          ${result.diffSummary}`);
  console.log(`Verification Level:    Level ${result.verificationLevel.levelAchieved} Achieved (Eligible: Level ${result.verificationLevel.levelEligible})`);
  console.log(`Level Reason:          ${result.verificationLevel.levelReason}`);
  console.log(`Next Steps:            ${result.verificationLevel.nextSteps}\n`);

  console.log("--------------------------------------------------------------------------------");
  console.log("METRICS & COUNTS");
  console.log("--------------------------------------------------------------------------------");
  console.log(`Total Bank Tx:         ${result.stats.totalBankTransactions}`);
  console.log(`Total Ledger Entries:  ${result.stats.totalLedgerEntries}`);
  console.log(`Total Invoices:        ${result.stats.totalInvoices}`);
  console.log(`Matched Transactions:  ${result.stats.matchedCount} (${result.stats.coveragePercent}% Coverage)`);
  console.log(`Unmatched Bank Tx:     ${result.stats.unmatchedBankCount}`);
  console.log(`Unmatched Ledger:      ${result.stats.unmatchedLedgerCount}`);
  console.log(`Ambiguous Candidates:  ${result.stats.ambiguousCount}`);
  console.log(`Partial Payments:      ${result.stats.partialCount}`);
  console.log(`Total Exceptions:      ${result.stats.exceptionsCount}\n`);

  console.log("--------------------------------------------------------------------------------");
  console.log("SURFACED EXCEPTIONS (PORTAL RESOLUTION DESK)");
  console.log("--------------------------------------------------------------------------------");

  const exceptions = await prisma.exception.findMany({
    where: { orgId: org.id, period: "2026-04" },
    include: { bankTx: true, ledgerEntry: true },
    orderBy: { createdAt: "asc" },
  });

  exceptions.forEach((exc, idx) => {
    console.log(`[EXCEPTION ${idx + 1}]: ${exc.type} (${exc.severity})`);
    console.log(`  ID:          ${exc.id}`);
    console.log(`  Title:       ${exc.title}`);
    console.log(`  Amount:      ${formatPaise(exc.amountPaise)} (${exc.amountPaise} paisa)`);
    console.log(`  Status:      ${exc.status}`);
    console.log(`  Bank Tx:     ${exc.bankTx ? `${exc.bankTx.description} (${exc.bankTx.id})` : "None"}`);
    console.log(`  Ledger Entry:${exc.ledgerEntry ? `${exc.ledgerEntry.description} (${exc.ledgerEntry.id})` : "None"}`);
    console.log(`  Explanation: ${exc.explanation}`);
    console.log(`  Resolution:  ${exc.suggestedResolution}\n`);
  });

  console.log("================================================================================");
  console.log("              ENGINE EXECUTION & EXCEPTION VERIFICATION COMPLETE                ");
  console.log("================================================================================\n");

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Execution failed:", err);
  process.exit(1);
});
