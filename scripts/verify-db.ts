import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";

const prisma = new PrismaClient();

async function verify() {
  console.log("🔍 Running Database Verification Checks (Rescaled x10)...\n");

  const users = await prisma.user.count();
  const orgs = await prisma.organization.count();
  const accounts = await prisma.bankAccount.count();
  const docs = await prisma.sourceDocument.count();
  const bankTxs = await prisma.bankTransaction.findMany({
    orderBy: { date: "asc" },
  });
  const ledgerEntries = await prisma.ledgerEntry.count();
  const matches = await prisma.match.count();
  const exceptions = await prisma.exception.count();
  const auditEvents = await prisma.auditEvent.findMany({
    orderBy: { createdAt: "asc" },
  });

  console.log(`Users: ${users}`);
  console.log(`Organizations: ${orgs}`);
  console.log(`Bank Accounts: ${accounts}`);
  console.log(`Source Documents: ${docs}`);
  console.log(`Bank Transactions: ${bankTxs.length}`);
  console.log(`Ledger Entries: ${ledgerEntries}`);
  console.log(`Matches: ${matches}`);
  console.log(`Exceptions: ${exceptions}`);
  console.log(`Audit Events: ${auditEvents.length}\n`);

  // Verify Bank Transactions Arithmetic (Rescaled Opening: 80,000,000 paisa = PKR 800,000.00)
  let currentBalance = 80000000;
  let allBalancesValid = true;

  console.log("Checking Bank Transaction Running Balances:");
  for (let i = 0; i < bankTxs.length; i++) {
    const tx = bankTxs[i];
    const prev = currentBalance;
    currentBalance = currentBalance - tx.debitPaise + tx.creditPaise;
    const matchesExpected = currentBalance === tx.runningBalancePaise;
    if (!matchesExpected) {
      allBalancesValid = false;
      console.error(
        `❌ Mismatch at Tx ${i + 1} (${tx.description}): expected ${currentBalance}, got ${tx.runningBalancePaise}`
      );
    } else {
      console.log(
        `  ✓ Tx ${i + 1} [${tx.date.toISOString().split("T")[0]}] ${tx.description.padEnd(28)} Debit: ${(tx.debitPaise / 100).toFixed(2).padStart(11)} | Credit: ${(tx.creditPaise / 100).toFixed(2).padStart(11)} | Balance: ${(tx.runningBalancePaise / 100).toFixed(2).padStart(11)}`
      );
    }
  }

  console.log(`\nBank Statement Arithmetic Validation: ${allBalancesValid ? "PASSED ✅" : "FAILED ❌"}`);
  console.log(`Final Closing Balance: ${(currentBalance / 100).toFixed(2)} PKR (${currentBalance} paisa)`);

  // Verify Audit Chain Integrity
  let chainValid = true;
  for (let i = 0; i < auditEvents.length; i++) {
    const evt = auditEvents[i];
    const expectedPrev = i === 0 ? "GENESIS" : auditEvents[i - 1].hash;
    if (evt.prevHash !== expectedPrev) {
      chainValid = false;
      console.error(`❌ Audit event ${evt.id} prevHash broken: expected ${expectedPrev}, found ${evt.prevHash}`);
    }

    const payload = `${evt.prevHash}|${evt.actorId || "SYSTEM"}|${evt.action}|${evt.entityType}|${evt.entityId}|${evt.createdAt.toISOString()}`;
    const calculatedHash = createHash("sha256").update(payload).digest("hex");
    if (calculatedHash !== evt.hash) {
      chainValid = false;
      console.error(`❌ Audit event ${evt.id} hash broken: calculated ${calculatedHash}, stored ${evt.hash}`);
    }
  }

  console.log(`Audit Hash Chain Integrity: ${chainValid ? "PASSED ✅" : "FAILED ❌"}`);
}

verify()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
