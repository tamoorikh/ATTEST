import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";

const prisma = new PrismaClient();

function computeHash(
  prevHash: string,
  actorId: string,
  action: string,
  entityType: string,
  entityId: string,
  createdAtIso: string
): string {
  const payload = `${prevHash}|${actorId}|${action}|${entityType}|${entityId}|${createdAtIso}`;
  return createHash("sha256").update(payload).digest("hex");
}

async function main() {
  console.log("🌱 Starting Attest database seed...");

  // Clear existing data cleanly in reverse-dependency order
  await prisma.auditEvent.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.disclosureRequest.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.processingRun.deleteMany();
  await prisma.reviewNote.deleteMany();
  await prisma.exceptionEvidence.deleteMany();
  await prisma.exceptionComment.deleteMany();
  await prisma.exception.deleteMany();
  await prisma.match.deleteMany();
  await prisma.ledgerEntry.deleteMany();
  await prisma.bankTransaction.deleteMany();
  await prisma.sourceDocument.deleteMany();
  await prisma.bankAccount.deleteMany();
  await prisma.companyProfile.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();

  console.log("🧹 Cleaned database tables.");

  // Password hash for Demo1234!
  const passwordHash = await bcrypt.hash("Demo1234!", 10);

  // 1. Create Users
  const demoOwner = await prisma.user.create({
    data: {
      email: "demo@attest.pk",
      name: "Tariq Mahmood",
      passwordHash,
    },
  });

  const caUser = await prisma.user.create({
    data: {
      email: "ca@attest.pk",
      name: "Ayesha Siddiqui, FCA",
      passwordHash,
    },
  });

  console.log("👤 Created users: demo@attest.pk (Owner) and ca@attest.pk (CA-reviewer)");

  // 2. Create Demo Organization
  const demoOrg = await prisma.organization.create({
    data: {
      name: "Meridian Textiles (Pvt) Ltd",
      slug: "meridian-textiles",
      isDemo: true,
    },
  });

  // Company Profile
  await prisma.companyProfile.create({
    data: {
      orgId: demoOrg.id,
      legalName: "Meridian Textiles (Pvt) Ltd",
      registrationNumber: "0094182-LHR",
      taxId: "NTN-4892184-7",
      jurisdiction: "PK",
      city: "Lahore",
      address: "Plot 42, Quaid-e-Azam Industrial Estate, Kot Lakhpat, Lahore",
    },
  });

  // Memberships
  await prisma.membership.create({
    data: {
      userId: demoOwner.id,
      orgId: demoOrg.id,
      role: "Owner",
    },
  });

  await prisma.membership.create({
    data: {
      userId: caUser.id,
      orgId: demoOrg.id,
      role: "CA-reviewer",
    },
  });

  console.log("🏢 Created Demo Org: Meridian Textiles (Pvt) Ltd with memberships");

  // 3. Create Bank Account (Habib Bank Limited)
  // Opening balance: 8,000,000 paise (PKR 80,000.00)
  const bankAccount = await prisma.bankAccount.create({
    data: {
      orgId: demoOrg.id,
      accountName: "Meridian Textiles (Pvt) Ltd - Operations",
      accountNumber: "00427901842003",
      bankName: "Habib Bank Limited (HBL)",
      branchName: "Kot Lakhpat Industrial Branch, Lahore",
      iban: "PK36HABB0000427901842003",
      currency: "PKR",
      openingBalancePaise: 8000000,
    },
  });

  // 4. Source Documents (Bank Statement, Ledger, Invoices)
  const bankDocSha = createHash("sha256").update("HBL_STATEMENT_APRIL_2026_MOCK_CONTENT").digest("hex");
  const bankDoc = await prisma.sourceDocument.create({
    data: {
      orgId: demoOrg.id,
      filename: "HBL_Statement_April_2026.pdf",
      type: "BANK_STATEMENT",
      period: "2026-04",
      sha256: bankDocSha,
      mime: "application/pdf",
      size: 142850,
      parseStatus: "PARSED",
      tier: "PRIMARY",
      uploadedById: demoOwner.id,
    },
  });

  const ledgerDocSha = createHash("sha256").update("GENERAL_LEDGER_APRIL_2026_MOCK_CONTENT").digest("hex");
  const ledgerDoc = await prisma.sourceDocument.create({
    data: {
      orgId: demoOrg.id,
      filename: "General_Ledger_April_2026.xlsx",
      type: "LEDGER",
      period: "2026-04",
      sha256: ledgerDocSha,
      mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      size: 98400,
      parseStatus: "PARSED",
      tier: "SECONDARY",
      uploadedById: demoOwner.id,
    },
  });

  const invoiceDocSha = createHash("sha256").update("INVOICE_REGISTER_APRIL_2026_MOCK_CONTENT").digest("hex");
  const invoiceDoc = await prisma.sourceDocument.create({
    data: {
      orgId: demoOrg.id,
      filename: "Invoice_Register_April_2026.csv",
      type: "INVOICE_REGISTER",
      period: "2026-04",
      sha256: invoiceDocSha,
      mime: "text/csv",
      size: 45200,
      parseStatus: "PARSED",
      tier: "CORROBORATING",
      uploadedById: demoOwner.id,
    },
  });

  console.log("📄 Created 3 Source Documents");

  // 5. Bank Transactions (April 2026)
  // Opening: 8,000,000 paise
  // 1: 02 Apr debit 4,862,000 "Payroll salaries" -> balance 3,138,000
  // 2: 03 Apr credit 12,400,000 "Buyer remittance — export" -> balance 15,538,000
  // 3: 05 Apr debit 1,185,000 "Zubair Traders" -> balance 14,353,000
  // 4: 09 Apr debit 743,000 "Fancy Fabrics" -> balance 13,610,000
  // 5: 12 Apr credit 3,400,000 "Local transfer in" -> balance 17,010,000
  // 6: 15 Apr debit 1,185,000 "Zubair Traders" -> balance 15,825,000
  // 7: 21 Apr debit 420,000 "Utility bills" -> balance 15,405,000
  // 8: 26 Apr credit 960,000 "Marketplace settlement" -> balance 16,365,000
  // Exact mathematical integrity across each step (balanceOk: true)
  const bankTxData = [
    {
      date: new Date("2026-04-02T10:30:00Z"),
      description: "Payroll salaries",
      counterparty: "Staff Payroll",
      ref: "SAL-2026-04-01",
      debitPaise: 4862000,
      creditPaise: 0,
      runningBalancePaise: 3138000,
      balanceOk: true,
      category: "Payroll",
      categoryConfidence: 0.98,
      matchStatus: "MATCHED",
    },
    {
      date: new Date("2026-04-03T14:15:00Z"),
      description: "Buyer remittance — export",
      counterparty: "Nordic Loom GmbH",
      ref: "FT-2026-8812",
      debitPaise: 0,
      creditPaise: 12400000,
      runningBalancePaise: 15538000,
      balanceOk: true,
      category: "Revenue",
      categoryConfidence: 0.99,
      matchStatus: "MATCHED",
    },
    {
      date: new Date("2026-04-05T11:00:00Z"),
      description: "Zubair Traders",
      counterparty: "Zubair Traders",
      ref: "IBFT-48192",
      debitPaise: 1185000,
      creditPaise: 0,
      runningBalancePaise: 14353000,
      balanceOk: true,
      category: "Direct Materials",
      categoryConfidence: 0.95,
      matchStatus: "MATCHED",
    },
    {
      date: new Date("2026-04-09T16:45:00Z"),
      description: "Fancy Fabrics",
      counterparty: "Fancy Fabrics",
      ref: "CHQ-009182",
      debitPaise: 743000,
      creditPaise: 0,
      runningBalancePaise: 13610000,
      balanceOk: true,
      category: "Direct Materials",
      categoryConfidence: 0.94,
      matchStatus: "MATCHED",
    },
    {
      date: new Date("2026-04-12T13:20:00Z"),
      description: "Local transfer in",
      counterparty: "Al-Rehman Textiles",
      ref: "IBFT-90124",
      debitPaise: 0,
      creditPaise: 3400000,
      runningBalancePaise: 17010000,
      balanceOk: true,
      category: "Uncategorized Deposit",
      categoryConfidence: 0.45,
      matchStatus: "EXCEPTION", // Future E-102 unrecorded sale
    },
    {
      date: new Date("2026-04-15T09:10:00Z"),
      description: "Zubair Traders",
      counterparty: "Zubair Traders",
      ref: "IBFT-48991",
      debitPaise: 1185000,
      creditPaise: 0,
      runningBalancePaise: 15825000,
      balanceOk: true,
      category: "Direct Materials",
      categoryConfidence: 0.95,
      matchStatus: "EXCEPTION", // Future E-101 duplicate payment
    },
    {
      date: new Date("2026-04-21T15:30:00Z"),
      description: "Utility bills",
      counterparty: "LESCO Lahore",
      ref: "UTIL-042-881",
      debitPaise: 420000,
      creditPaise: 0,
      runningBalancePaise: 15405000,
      balanceOk: true,
      category: "Utilities",
      categoryConfidence: 0.99,
      matchStatus: "MATCHED",
    },
    {
      date: new Date("2026-04-26T12:00:00Z"),
      description: "Marketplace settlement",
      counterparty: "Daraz Financial",
      ref: "SETTL-DZ-41",
      debitPaise: 0,
      creditPaise: 960000,
      runningBalancePaise: 16365000,
      balanceOk: true,
      category: "Revenue",
      categoryConfidence: 0.92,
      matchStatus: "MATCHED",
    },
  ];

  const createdBankTxs = [];
  for (const tx of bankTxData) {
    const created = await prisma.bankTransaction.create({
      data: {
        orgId: demoOrg.id,
        bankAccountId: bankAccount.id,
        sourceDocumentId: bankDoc.id,
        currency: "PKR",
        ...tx,
      },
    });
    createdBankTxs.push(created);
  }

  console.log(`💳 Created ${createdBankTxs.length} Bank Transactions`);

  // 6. 7 Ledger Entries (matching all except 12 Apr credit, 15 Apr is duplicate payment)
  const ledgerData = [
    {
      date: new Date("2026-04-02T10:30:00Z"),
      description: "Payroll salaries — April cycle",
      counterparty: "Staff Payroll",
      debitPaise: 4862000,
      creditPaise: 0,
      account: "Salaries & Wages Expense",
      ref: "SAL-2026-04-01",
    },
    {
      date: new Date("2026-04-03T14:15:00Z"),
      description: "Buyer remittance — export invoice #EXP-401",
      counterparty: "Nordic Loom GmbH",
      debitPaise: 0,
      creditPaise: 12400000,
      account: "Export Sales Revenue",
      ref: "FT-2026-8812",
    },
    {
      date: new Date("2026-04-05T11:00:00Z"),
      description: "Payment for yarn procurement #ZT-1141",
      counterparty: "Zubair Traders",
      debitPaise: 1185000,
      creditPaise: 0,
      account: "Accounts Payable",
      ref: "ZT-1141",
    },
    {
      date: new Date("2026-04-09T16:45:00Z"),
      description: "Payment for dye chemical batch #FF-882",
      counterparty: "Fancy Fabrics",
      debitPaise: 743000,
      creditPaise: 0,
      account: "Direct Materials Expense",
      ref: "CHQ-009182",
    },
    // Note: 12 Apr credit 3,400,000 has NO ledger entry (E-102 unrecorded sale)!
    {
      date: new Date("2026-04-15T09:10:00Z"),
      description: "Second payment booking — Zubair Traders #ZT-1141",
      counterparty: "Zubair Traders",
      debitPaise: 1185000,
      creditPaise: 0,
      account: "Accounts Payable",
      ref: "ZT-1141-DUP",
    },
    {
      date: new Date("2026-04-21T15:30:00Z"),
      description: "LESCO Electricity Bill April 2026",
      counterparty: "LESCO Lahore",
      debitPaise: 420000,
      creditPaise: 0,
      account: "Utilities Expense",
      ref: "UTIL-042-881",
    },
    {
      date: new Date("2026-04-26T12:00:00Z"),
      description: "Daraz Marketplace Sales Payout April",
      counterparty: "Daraz Financial",
      debitPaise: 0,
      creditPaise: 960000,
      account: "Domestic Sales Revenue",
      ref: "SETTL-DZ-41",
    },
  ];

  const createdLedgerEntries = [];
  for (const entry of ledgerData) {
    const created = await prisma.ledgerEntry.create({
      data: {
        orgId: demoOrg.id,
        sourceDocumentId: ledgerDoc.id,
        ...entry,
      },
    });
    createdLedgerEntries.push(created);
  }

  console.log(`📒 Created ${createdLedgerEntries.length} Ledger Entries`);

  // 7. Matches for the 5 straightforward matched transactions
  const matchConfigs = [
    { bankIdx: 0, ledgerIdx: 0, rule: "EXACT_AMOUNT_DATE", score: 1.0 },
    { bankIdx: 1, ledgerIdx: 1, rule: "EXACT_AMOUNT_DATE", score: 1.0 },
    { bankIdx: 2, ledgerIdx: 2, rule: "INVOICE_REF_MATCH", score: 0.98 },
    { bankIdx: 3, ledgerIdx: 3, rule: "EXACT_AMOUNT_DATE", score: 1.0 },
    { bankIdx: 6, ledgerIdx: 5, rule: "EXACT_AMOUNT_DATE", score: 1.0 },
    { bankIdx: 7, ledgerIdx: 6, rule: "EXACT_AMOUNT_DATE", score: 0.95 },
  ];

  for (const m of matchConfigs) {
    await prisma.match.create({
      data: {
        orgId: demoOrg.id,
        bankTxId: createdBankTxs[m.bankIdx].id,
        ledgerEntryId: createdLedgerEntries[m.ledgerIdx].id,
        rule: m.rule,
        score: m.score,
        status: "CONFIRMED",
      },
    });
  }

  // 8. Exceptions
  // E-101: Duplicate payment to Zubair Traders
  const exc1 = await prisma.exception.create({
    data: {
      orgId: demoOrg.id,
      type: "DUPLICATE_PAYMENT",
      title: "E-101: Potential duplicate payment of PKR 11,850.00 to Zubair Traders",
      explanation:
        "Two debit transactions of PKR 11,850.00 occurred on 05 Apr and 15 Apr. However, the purchase register only contains one invoice (#ZT-1141) from Zubair Traders.",
      severity: "HIGH",
      status: "OPEN",
      amountPaise: 1185000,
      period: "2026-04",
      bankTxId: createdBankTxs[5].id, // 15 Apr transaction
      ledgerEntryId: createdLedgerEntries[4].id,
      suggestedResolution:
        "Verify whether 15 Apr was an erroneous double disbursement or advance payment for subsequent order. If erroneous, request vendor credit note or refund.",
    },
  });

  // E-102: Unrecorded sale (12 Apr credit 3,400,000 has invoice #SI-2026-3387 but no ledger entry)
  const exc2 = await prisma.exception.create({
    data: {
      orgId: demoOrg.id,
      type: "UNRECORDED_SALE",
      title: "E-102: Unrecorded bank deposit of PKR 34,000.00 from Al-Rehman Textiles",
      explanation:
        "Bank deposit of PKR 34,000.00 received on 12 Apr has no matching general ledger entry. FBR sales tax invoice #SI-2026-3387 dated 11 Apr exists in invoice register.",
      severity: "CRITICAL",
      status: "OPEN",
      amountPaise: 3400000,
      period: "2026-04",
      bankTxId: createdBankTxs[4].id, // 12 Apr transaction
      suggestedResolution:
        "Post adjusting journal entry debiting Cash/Bank and crediting Sales Revenue / Accounts Receivable referencing invoice #SI-2026-3387.",
    },
  });

  // Add sample evidence record for invoice register
  await prisma.exceptionEvidence.create({
    data: {
      exceptionId: exc2.id,
      uploadedById: demoOwner.id,
      filename: "FBR_Sales_Invoice_SI-2026-3387.pdf",
      sha256: createHash("sha256").update("FBR_INVOICE_SI_2026_3387").digest("hex"),
      notes: "Official FBR Annexure-C compliant invoice issued to Al-Rehman Textiles for 3,400,000 paisa.",
    },
  });

  // 9. Processing Run record
  await prisma.processingRun.create({
    data: {
      orgId: demoOrg.id,
      period: "2026-04",
      engineVersion: "v1.0.0-deterministic",
      status: "COMPLETED",
      statsJson: JSON.stringify({
        totalBankTransactions: 8,
        totalLedgerEntries: 7,
        matchedCount: 6,
        exceptionCount: 2,
        openingBalancePaise: 8000000,
        closingBalancePaise: 16365000,
        arithmeticVerified: true,
      }),
    },
  });

  // 10. Sample Certificate in PENDING_REVIEW state
  const certPublicId = "CERT-2026-04-MTL-001";
  await prisma.certificate.create({
    data: {
      orgId: demoOrg.id,
      publicId: certPublicId,
      level: "STANDARD_ASSURANCE",
      periodStart: new Date("2026-04-01T00:00:00Z"),
      periodEnd: new Date("2026-04-30T23:59:59Z"),
      status: "PENDING_REVIEW",
      scopeJson: JSON.stringify({
        bankAccountsIncluded: ["Habib Bank Limited (HBL) - 00427901842003"],
        period: "April 2026",
        accountingStandard: "IFRS for SMEs (Pakistan)",
        reconciliationTier: "Bank-to-Book Level 2",
      }),
      coverageJson: JSON.stringify({
        reconciledVolumePaise: 24750000,
        exceptionVolumePaise: 4585000,
        exceptionCount: 2,
        resolvedExceptions: 0,
      }),
      version: 1,
    },
  });

  // 11. Cryptographic AuditEvent Hash Chain Initialization
  const auditEvents = [
    {
      action: "ORGANIZATION_INITIALIZED",
      entityType: "Organization",
      entityId: demoOrg.id,
      actorId: demoOwner.id,
      metadata: { name: demoOrg.name, isDemo: true },
      date: new Date("2026-04-01T09:00:00Z"),
    },
    {
      action: "SOURCE_DOCUMENT_UPLOADED",
      entityType: "SourceDocument",
      entityId: bankDoc.id,
      actorId: demoOwner.id,
      metadata: { filename: bankDoc.filename, sha256: bankDoc.sha256 },
      date: new Date("2026-04-30T10:00:00Z"),
    },
    {
      action: "BANK_TRANSACTIONS_INGESTED",
      entityType: "SourceDocument",
      entityId: bankDoc.id,
      actorId: demoOwner.id,
      metadata: { count: 8, openingBalance: 8000000, closingBalance: 16365000 },
      date: new Date("2026-04-30T10:05:00Z"),
    },
    {
      action: "RECONCILIATION_RUN_COMPLETED",
      entityType: "ProcessingRun",
      entityId: demoOrg.id,
      actorId: null,
      metadata: { matched: 6, exceptions: 2 },
      date: new Date("2026-04-30T10:10:00Z"),
    },
    {
      action: "EXCEPTION_LOGGED",
      entityType: "Exception",
      entityId: exc1.id,
      actorId: null,
      metadata: { code: "E-101", amount: 1185000 },
      date: new Date("2026-04-30T10:10:01Z"),
    },
    {
      action: "EXCEPTION_LOGGED",
      entityType: "Exception",
      entityId: exc2.id,
      actorId: null,
      metadata: { code: "E-102", amount: 3400000 },
      date: new Date("2026-04-30T10:10:02Z"),
    },
  ];

  let prevHash = "GENESIS";
  for (const evt of auditEvents) {
    const createdAtIso = evt.date.toISOString();
    const hash = computeHash(
      prevHash,
      evt.actorId || "SYSTEM",
      evt.action,
      evt.entityType,
      evt.entityId,
      createdAtIso
    );

    await prisma.auditEvent.create({
      data: {
        orgId: demoOrg.id,
        actorId: evt.actorId,
        action: evt.action,
        entityType: evt.entityType,
        entityId: evt.entityId,
        metadataJson: JSON.stringify(evt.metadata),
        prevHash,
        hash,
        createdAt: evt.date,
      },
    });

    prevHash = hash;
  }

  console.log(`⛓️ Initialized AuditEvent hash chain with ${auditEvents.length} cryptographically linked events`);
  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
