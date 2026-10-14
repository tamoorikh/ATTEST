import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import { prisma as defaultPrisma } from "./prisma";

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

export async function resetDemoData(customPrisma?: PrismaClient) {
  const prisma = customPrisma || defaultPrisma;

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

  const adminUser = await prisma.user.create({
    data: {
      email: "admin@attest.pk",
      name: "Attest Platform Admin",
      passwordHash,
    },
  });

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
      onboardingStep: 4,
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

  await prisma.membership.create({
    data: {
      userId: adminUser.id,
      orgId: demoOrg.id,
      role: "PlatformAdmin",
    },
  });

  // 3. Create Bank Account (Habib Bank Limited)
  // Rescaled Opening balance: 80,000,000 paise (PKR 800,000.00)
  const bankAccount = await prisma.bankAccount.create({
    data: {
      orgId: demoOrg.id,
      accountName: "Meridian Textiles (Pvt) Ltd - Operations",
      accountNumber: "00427901842003",
      bankName: "Habib Bank Limited (HBL)",
      branchName: "Kot Lakhpat Industrial Branch, Lahore",
      iban: "PK36HABB0000427901842003",
      currency: "PKR",
      openingBalancePaise: 80000000,
    },
  });

  // 4. Source Documents (Bank Statement, Ledger, Invoices)
  const bankDocSha = createHash("sha256").update("HBL_STATEMENT_APRIL_2026_RESCALED_CONTENT").digest("hex");
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

  const ledgerDocSha = createHash("sha256").update("GENERAL_LEDGER_APRIL_2026_RESCALED_CONTENT").digest("hex");
  const ledgerDoc = await prisma.sourceDocument.create({
    data: {
      orgId: demoOrg.id,
      filename: "General_Ledger_April_2026.csv",
      type: "LEDGER",
      period: "2026-04",
      sha256: ledgerDocSha,
      mime: "text/csv",
      size: 89400,
      parseStatus: "PARSED",
      tier: "PRIMARY",
      uploadedById: demoOwner.id,
    },
  });

  const invoiceDocSha = createHash("sha256").update("PURCHASE_REGISTER_APRIL_2026_RESCALED_CONTENT").digest("hex");
  const invoiceDoc = await prisma.sourceDocument.create({
    data: {
      orgId: demoOrg.id,
      filename: "Purchase_Register_April_2026.csv",
      type: "INVOICE_REGISTER",
      period: "2026-04",
      sha256: invoiceDocSha,
      mime: "text/csv",
      size: 61200,
      parseStatus: "PARSED",
      tier: "CORROBORATING",
      uploadedById: demoOwner.id,
    },
  });

  // 5. Bank Transactions (April 2026) - Rescaled x10
  const rawTxData = [
    {
      date: new Date("2026-04-03T10:30:00Z"),
      description: "HBL Payroll Transfer - April Factory Operations",
      counterparty: "Internal Operations Payroll",
      ref: "FT-20260403-8819",
      debitPaise: 48620000,
      creditPaise: 0,
      category: "payroll",
      expectedEvidenceType: "PAYROLL_REGISTER",
    },
    {
      date: new Date("2026-04-07T14:15:00Z"),
      description: "Direct Export Credit Proceeds - Al-Mansoori Garments Dubai",
      counterparty: "Al-Mansoori Garments",
      ref: "IR-99214812",
      debitPaise: 0,
      creditPaise: 124000000,
      category: "customer-receipt",
      expectedEvidenceType: "SALES_INVOICE",
    },
    {
      date: new Date("2026-04-10T09:45:00Z"),
      description: "Cheque Clearing #48102 - Zubair Traders Yarn Supplies",
      counterparty: "Zubair Traders",
      ref: "CHQ-48102",
      debitPaise: 11850000,
      creditPaise: 0,
      category: "supplier-payment",
      expectedEvidenceType: "TAX_INVOICE",
    },
    {
      date: new Date("2026-04-12T11:20:00Z"),
      description: "Inter-Bank Funds Transfer - Export Rebate Credit SBP",
      counterparty: "State Bank of Pakistan",
      ref: "IBFT-SBP-98214",
      debitPaise: 0,
      creditPaise: 34000000,
      category: "customer-receipt",
      expectedEvidenceType: "SALES_INVOICE",
    },
    {
      date: new Date("2026-04-15T16:00:00Z"),
      description: "Online Vendor Payment - Zubair Traders Yarn Supplies",
      counterparty: "Zubair Traders",
      ref: "OL-992184-ZT",
      debitPaise: 11850000,
      creditPaise: 0,
      category: "supplier-payment",
      expectedEvidenceType: "TAX_INVOICE",
    },
    {
      date: new Date("2026-04-18T13:30:00Z"),
      description: "Pay Order #991024 - Fancy Fabrics Dyeing Process",
      counterparty: "Fancy Fabrics",
      ref: "PO-991024",
      debitPaise: 7430000,
      creditPaise: 0,
      category: "supplier-payment",
      expectedEvidenceType: "TAX_INVOICE",
    },
    {
      date: new Date("2026-04-24T15:10:00Z"),
      description: "Direct Debit - LESCO Industrial Electricity Tariff",
      counterparty: "LESCO Lahore",
      ref: "DD-LESCO-4921",
      debitPaise: 4200000,
      creditPaise: 0,
      category: "rent-utilities",
      expectedEvidenceType: "UTILITY_BILL",
    },
    {
      date: new Date("2026-04-28T12:00:00Z"),
      description: "Local Marketplace Receipts - Cotton Waste Sale",
      counterparty: "Bismillah Traders",
      ref: "CR-881924",
      debitPaise: 0,
      creditPaise: 9600000,
      category: "customer-receipt",
      expectedEvidenceType: "SALES_INVOICE",
    },
  ];

  let runningBalance = bankAccount.openingBalancePaise;
  const createdBankTxs = [];

  for (const item of rawTxData) {
    runningBalance = runningBalance - item.debitPaise + item.creditPaise;
    const tx = await prisma.bankTransaction.create({
      data: {
        orgId: demoOrg.id,
        bankAccountId: bankAccount.id,
        sourceDocumentId: bankDoc.id,
        date: item.date,
        description: item.description,
        counterparty: item.counterparty,
        ref: item.ref,
        debitPaise: item.debitPaise,
        creditPaise: item.creditPaise,
        currency: "PKR",
        runningBalancePaise: runningBalance,
        balanceOk: true,
        category: item.category,
        categoryConfidence: 0.95,
        matchStatus: "UNMATCHED",
      },
    });
    createdBankTxs.push(tx);
  }

  // 6. General Ledger Entries (April 2026) - Rescaled x10
  const rawLedgerData = [
    {
      date: new Date("2026-04-03T10:30:00Z"),
      description: "Wages & Factory Salaries Payable - April 2026",
      counterparty: "Factory Staff Payroll",
      ref: "JV-2026-04-012",
      account: "5010-Salaries-Expense",
      debitPaise: 48620000,
      creditPaise: 0,
    },
    {
      date: new Date("2026-04-07T14:15:00Z"),
      description: "Trade Receivables Settlement - Al-Mansoori Dubai LC #482",
      counterparty: "Al-Mansoori Garments",
      ref: "RV-2026-04-045",
      account: "1020-Accounts-Receivable",
      debitPaise: 0,
      creditPaise: 124000000,
    },
    {
      date: new Date("2026-04-10T09:45:00Z"),
      description: "Payment to Zubair Traders against Bill #ZT-1141",
      counterparty: "Zubair Traders",
      ref: "PV-2026-04-089",
      account: "2010-Accounts-Payable",
      debitPaise: 11850000,
      creditPaise: 0,
    },
    {
      date: new Date("2026-04-18T13:30:00Z"),
      description: "Dyeing & Processing Expenses - Fancy Fabrics PO-991024",
      counterparty: "Fancy Fabrics",
      ref: "PV-2026-04-114",
      account: "5030-Processing-Charges",
      debitPaise: 7430000,
      creditPaise: 0,
    },
    {
      date: new Date("2026-04-24T15:10:00Z"),
      description: "Factory Electricity Charges April 2026 - LESCO",
      counterparty: "LESCO Lahore",
      ref: "PV-2026-04-152",
      account: "5040-Electricity-Power",
      debitPaise: 4200000,
      creditPaise: 0,
    },
    {
      date: new Date("2026-04-28T12:00:00Z"),
      description: "Scrap Sales Proceeds - Bismillah Traders Waste Yarn",
      counterparty: "Bismillah Traders",
      ref: "RV-2026-04-198",
      account: "4020-Scrap-Sales",
      debitPaise: 0,
      creditPaise: 9600000,
    },
    {
      date: new Date("2026-04-30T18:00:00Z"),
      description: "Bank Monthly Account Maintenance & Fed Levy",
      counterparty: "Habib Bank Limited",
      ref: "JV-2026-04-220",
      account: "5090-Bank-Charges",
      debitPaise: 0,
      creditPaise: 0,
    },
  ];

  const createdLedgerEntries = [];
  for (const item of rawLedgerData) {
    const l = await prisma.ledgerEntry.create({
      data: {
        orgId: demoOrg.id,
        sourceDocumentId: ledgerDoc.id,
        date: item.date,
        description: item.description,
        counterparty: item.counterparty,
        ref: item.ref,
        account: item.account,
        debitPaise: item.debitPaise,
        creditPaise: item.creditPaise,
      },
    });
    createdLedgerEntries.push(l);
  }

  // 7. Initial Cryptographic Audit Chain (6 Linked Events)
  const auditEventsData = [
    {
      actorId: adminUser.id,
      action: "ORGANIZATION_CREATED",
      entityType: "Organization",
      entityId: demoOrg.id,
      metadata: { name: demoOrg.name, isDemo: true },
      date: new Date("2026-04-01T08:00:00Z"),
    },
    {
      actorId: demoOwner.id,
      action: "BANK_ACCOUNT_CONFIGURED",
      entityType: "BankAccount",
      entityId: bankAccount.id,
      metadata: { bank: bankAccount.bankName, openingPaise: bankAccount.openingBalancePaise },
      date: new Date("2026-04-01T08:15:00Z"),
    },
    {
      actorId: demoOwner.id,
      action: "DOCUMENT_UPLOADED",
      entityType: "SourceDocument",
      entityId: bankDoc.id,
      metadata: { filename: bankDoc.filename, sha256: bankDoc.sha256 },
      date: new Date("2026-04-01T09:00:00Z"),
    },
    {
      actorId: demoOwner.id,
      action: "DOCUMENT_UPLOADED",
      entityType: "SourceDocument",
      entityId: ledgerDoc.id,
      metadata: { filename: ledgerDoc.filename, sha256: ledgerDoc.sha256 },
      date: new Date("2026-04-01T09:10:00Z"),
    },
    {
      actorId: demoOwner.id,
      action: "TRANSACTIONS_IMPORTED",
      entityType: "BankTransaction",
      entityId: bankAccount.id,
      metadata: { count: createdBankTxs.length, totalDebitsPaise: 83950000, totalCreditsPaise: 167600000 },
      date: new Date("2026-04-01T09:20:00Z"),
    },
    {
      actorId: demoOwner.id,
      action: "LEDGER_IMPORTED",
      entityType: "LedgerEntry",
      entityId: ledgerDoc.id,
      metadata: { count: createdLedgerEntries.length },
      date: new Date("2026-04-01T09:30:00Z"),
    },
  ];

  let prevHash = "GENESIS";
  for (const ev of auditEventsData) {
    const isoDate = ev.date.toISOString();
    const hash = computeHash(prevHash, ev.actorId, ev.action, ev.entityType, ev.entityId, isoDate);
    await prisma.auditEvent.create({
      data: {
        orgId: demoOrg.id,
        actorId: ev.actorId,
        action: ev.action,
        entityType: ev.entityType,
        entityId: ev.entityId,
        metadataJson: JSON.stringify(ev.metadata),
        prevHash,
        hash,
        createdAt: ev.date,
      },
    });
    prevHash = hash;
  }

  return {
    success: true,
    orgId: demoOrg.id,
    ownerId: demoOwner.id,
    caId: caUser.id,
    adminId: adminUser.id,
    bankAccountId: bankAccount.id,
    bankDocId: bankDoc.id,
    ledgerDocId: ledgerDoc.id,
    invoiceDocId: invoiceDoc.id,
    bankTransactionsCount: createdBankTxs.length,
    ledgerEntriesCount: createdLedgerEntries.length,
  };
}
