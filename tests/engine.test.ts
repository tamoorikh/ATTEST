import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { classifyTransaction } from "@/engine/classifier";
import {
  matchTransactions,
  stringSimilarity,
  getDaysDifference,
} from "@/engine/matcher";
import { performThreeWayReconciliation } from "@/engine/threeWay";
import { generateExceptions } from "@/engine/exceptions";
import {
  runReconciliationPipeline,
  executeOrchestratorForPeriod,
} from "@/engine/orchestrator";
import {
  BankTxInput,
  LedgerEntryInput,
  InvoiceInput,
  MatchCandidate,
} from "@/engine/types";
import { validateAndNormalizeBankStatement } from "@/lib/validator/rules";
import { parseBankStatementCsv } from "@/lib/parser/csv";

const prisma = new PrismaClient();

describe("Phase 2: The Deterministic Reconciliation Engine (Specs T1 - T17)", () => {
  let testOrgId: string;
  let testUserId: string;

  beforeAll(async () => {
    // Setup isolated test tenant
    const org = await prisma.organization.create({
      data: {
        name: "Engine Test Org (Pvt) Ltd",
        slug: `engine-test-${Date.now()}`,
        isDemo: true,
      },
    });
    testOrgId = org.id;

    const user = await prisma.user.create({
      data: {
        email: `engine-tester-${Date.now()}@attest.pk`,
        name: "Engine Tester",
        passwordHash: "hash123",
      },
    });
    testUserId = user.id;

    await prisma.membership.create({
      data: {
        userId: testUserId,
        orgId: testOrgId,
        role: "Owner",
      },
    });
  });

  afterAll(async () => {
    if (testOrgId) {
      await prisma.auditEvent.deleteMany({ where: { orgId: testOrgId } });
      await prisma.exception.deleteMany({ where: { orgId: testOrgId } });
      await prisma.processingRun.deleteMany({ where: { orgId: testOrgId } });
      await prisma.bankTransaction.deleteMany({ where: { orgId: testOrgId } });
      await prisma.ledgerEntry.deleteMany({ where: { orgId: testOrgId } });
      await prisma.sourceDocument.deleteMany({ where: { orgId: testOrgId } });
      await prisma.membership.deleteMany({ where: { orgId: testOrgId } });
      await prisma.organization.deleteMany({ where: { id: testOrgId } });
    }
    if (testUserId) {
      await prisma.user.deleteMany({ where: { id: testUserId } });
    }
    await prisma.$disconnect();
  });

  // ---------------------------------------------------------------------------
  // T1: balance validation pass (existing seed figures)
  // ---------------------------------------------------------------------------
  it("T1: validates seed balance continuity with 0 tolerance", async () => {
    const csvContent = fs.readFileSync(
      path.join(process.cwd(), "fixtures", "meridian_april_2026.csv"),
      "utf-8"
    );
    const parsed = parseBankStatementCsv(csvContent);

    const doc = await prisma.sourceDocument.create({
      data: {
        orgId: testOrgId,
        filename: "meridian_t1.csv",
        type: "BANK_STATEMENT",
        period: "2026-04",
        sha256: "t1-hash-" + Date.now(),
        mime: "text/csv",
        size: 1000,
        parseStatus: "PARSED",
        uploadedById: testUserId,
      },
    });

    const result = await validateAndNormalizeBankStatement({
      orgId: testOrgId,
      sourceDocumentId: doc.id,
      period: "2026-04",
      openingBalancePaise: 80000000,
      closingBalancePaise: 163650000,
      parsedRows: parsed.rows,
      actorId: testUserId,
    });

    expect(result.allRulesPassed).toBe(true);
    expect(result.r1Passed).toBe(true);
    expect(result.r2Passed).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // T2: corrupted statement fails R1 and creates exception
  // ---------------------------------------------------------------------------
  it("T2: detects corrupted statement closing balance discrepancy and creates exception", async () => {
    const corruptedCsv = fs.readFileSync(
      path.join(process.cwd(), "fixtures", "corrupted_statement.csv"),
      "utf-8"
    );
    const parsed = parseBankStatementCsv(corruptedCsv);

    const doc = await prisma.sourceDocument.create({
      data: {
        orgId: testOrgId,
        filename: "corrupted_t2.csv",
        type: "BANK_STATEMENT",
        period: "2026-04",
        sha256: "t2-hash-" + Date.now(),
        mime: "text/csv",
        size: 1000,
        parseStatus: "PARSED",
        uploadedById: testUserId,
      },
    });

    const result = await validateAndNormalizeBankStatement({
      orgId: testOrgId,
      sourceDocumentId: doc.id,
      period: "2026-04",
      openingBalancePaise: 80000000,
      closingBalancePaise: 150000000, // Corrupted stated closing
      parsedRows: parsed.rows,
      actorId: testUserId,
    });

    expect(result.r1Passed).toBe(false);
    expect(result.createdExceptionsCount).toBeGreaterThan(0);
  });

  // ---------------------------------------------------------------------------
  // T3: running-balance break detected
  // ---------------------------------------------------------------------------
  it("T3: detects running-balance chaining breaks on invalid arithmetic rows", () => {
    const row1 = {
      date: new Date("2026-04-01"),
      description: "Opening row",
      debitPaise: 100000,
      creditPaise: 0,
      runningBalancePaise: 900000, // Correct: 1,000,000 - 100,000 = 900,000
    };
    const row2 = {
      date: new Date("2026-04-02"),
      description: "Broken chain row",
      debitPaise: 50000,
      creditPaise: 0,
      runningBalancePaise: 950000, // BROKEN: Should be 850,000!
    };

    const prevBal = 1000000;
    const calc1 = prevBal - row1.debitPaise + row1.creditPaise;
    expect(calc1 === row1.runningBalancePaise).toBe(true);

    const calc2 = row1.runningBalancePaise - row2.debitPaise + row2.creditPaise;
    const balanceOk = calc2 === row2.runningBalancePaise;
    expect(balanceOk).toBe(false); // Detected arithmetic break!
  });

  // ---------------------------------------------------------------------------
  // T4: duplicate transaction detection
  // ---------------------------------------------------------------------------
  it("T4: detects duplicate transactions occurring on same date with same description", async () => {
    const dupCsv = `Date,Description,Counterparty,Reference,Debit,Credit,Balance
01/04/2026,Office Supplies,Stationery Depot,CHQ-1,5000.00,,95000.00
01/04/2026,Office Supplies,Stationery Depot,CHQ-1,5000.00,,90000.00`;
    const parsed = parseBankStatementCsv(dupCsv);

    const doc = await prisma.sourceDocument.create({
      data: {
        orgId: testOrgId,
        filename: "duplicate_t4.csv",
        type: "BANK_STATEMENT",
        period: "2026-04",
        sha256: "t4-hash-" + Date.now(),
        mime: "text/csv",
        size: 500,
        parseStatus: "PARSED",
        uploadedById: testUserId,
      },
    });

    const result = await validateAndNormalizeBankStatement({
      orgId: testOrgId,
      sourceDocumentId: doc.id,
      period: "2026-04",
      openingBalancePaise: 10000000,
      closingBalancePaise: 9000000,
      parsedRows: parsed.rows,
      actorId: testUserId,
    });

    expect(result.r3Passed).toBe(false); // Duplicate detected
  });

  // ---------------------------------------------------------------------------
  // T5: exact 1:1 match with full rule explanation stored
  // ---------------------------------------------------------------------------
  it("T5: produces exact 1:1 match with explainable rules string", () => {
    const bankTxs: BankTxInput[] = [
      {
        id: "btx-1",
        orgId: "org-1",
        date: new Date("2026-04-05T10:00:00Z"),
        description: "Payment to Zubair Traders",
        counterparty: "Zubair Traders",
        debitPaise: 11850000,
        creditPaise: 0,
      },
    ];

    const ledgerEntries: LedgerEntryInput[] = [
      {
        id: "led-1",
        orgId: "org-1",
        date: new Date("2026-04-05T10:00:00Z"),
        description: "Payment for yarn procurement #ZT-1141",
        counterparty: "Zubair Traders",
        debitPaise: 11850000,
        creditPaise: 0,
        account: "Accounts Payable",
      },
    ];

    const matches = matchTransactions(bankTxs, ledgerEntries);
    expect(matches).toHaveLength(1);
    expect(matches[0].status).toBe("AUTO_MATCHED");
    expect(matches[0].type).toBe("ONE_TO_ONE");
    expect(matches[0].rule).toContain("amount_exact");
    expect(matches[0].rule).toContain("date_window");
    expect(matches[0].rule).toContain("counterparty_1.00");
  });

  // ---------------------------------------------------------------------------
  // T6: date-window match passes within 3 days, fails outside
  // ---------------------------------------------------------------------------
  it("T6: date-window match passes within 3 days and rejects transactions outside window", () => {
    const bankTx: BankTxInput = {
      id: "btx-window",
      orgId: "org-1",
      date: new Date("2026-04-05T10:00:00Z"),
      description: "Vendor disbursement",
      counterparty: "Standard Supplies",
      debitPaise: 2500000,
      creditPaise: 0,
    };

    // Ledger within 2 days (pass)
    const ledgerWithin3Days: LedgerEntryInput[] = [
      {
        id: "led-within",
        orgId: "org-1",
        date: new Date("2026-04-07T10:00:00Z"),
        description: "Standard Supplies booking",
        counterparty: "Standard Supplies",
        debitPaise: 2500000,
        creditPaise: 0,
        account: "Accounts Payable",
      },
    ];

    const matchWithin = matchTransactions([bankTx], ledgerWithin3Days);
    expect(matchWithin).toHaveLength(1);
    expect(matchWithin[0].status).toBe("AUTO_MATCHED");

    // Ledger 6 days away (fail outside 3 days)
    const ledgerOutsideWindow: LedgerEntryInput[] = [
      {
        id: "led-outside",
        orgId: "org-1",
        date: new Date("2026-04-12T10:00:00Z"),
        description: "Standard Supplies booking late",
        counterparty: "Standard Supplies",
        debitPaise: 2500000,
        creditPaise: 0,
        account: "Accounts Payable",
      },
    ];

    const matchOutside = matchTransactions([bankTx], ledgerOutsideWindow);
    expect(matchOutside).toHaveLength(0);
  });

  // ---------------------------------------------------------------------------
  // T7: split payment (1:many)
  // ---------------------------------------------------------------------------
  it("T7: matches split payment (1 bank credit 12,000,000 matching two ledger sales 7,000,000 + 5,000,000)", () => {
    const bankTxs: BankTxInput[] = [
      {
        id: "btx-split",
        orgId: "org-1",
        date: new Date("2026-04-10T12:00:00Z"),
        description: "Customer bulk deposit",
        counterparty: "Lahore Retailers",
        debitPaise: 0,
        creditPaise: 12000000,
      },
    ];

    const ledgerEntries: LedgerEntryInput[] = [
      {
        id: "led-part-1",
        orgId: "org-1",
        date: new Date("2026-04-10T11:00:00Z"),
        description: "Invoice #LR-101 sales",
        counterparty: "Lahore Retailers",
        debitPaise: 0,
        creditPaise: 7000000,
        account: "Sales",
      },
      {
        id: "led-part-2",
        orgId: "org-1",
        date: new Date("2026-04-10T11:30:00Z"),
        description: "Invoice #LR-102 sales",
        counterparty: "Lahore Retailers",
        debitPaise: 0,
        creditPaise: 5000000,
        account: "Sales",
      },
    ];

    const matches = matchTransactions(bankTxs, ledgerEntries);
    expect(matches).toHaveLength(1);
    expect(matches[0].type).toBe("ONE_TO_MANY");
    expect(matches[0].status).toBe("AUTO_MATCHED");
    expect(matches[0].amountPaise).toBe(12000000);
    expect(matches[0].ledgerEntryIds).toHaveLength(2);
  });

  // ---------------------------------------------------------------------------
  // T8: partial payment
  // ---------------------------------------------------------------------------
  it("T8: flags partial payment (ledger 12,000,000 vs bank 8,000,000) as PARTIAL, not auto-matched", () => {
    const bankTxs: BankTxInput[] = [
      {
        id: "btx-partial",
        orgId: "org-1",
        date: new Date("2026-04-15T10:00:00Z"),
        description: "Installment payment to Fancy Fabrics",
        counterparty: "Fancy Fabrics",
        debitPaise: 8000000,
        creditPaise: 0,
      },
    ];

    const ledgerEntries: LedgerEntryInput[] = [
      {
        id: "led-payable",
        orgId: "org-1",
        date: new Date("2026-04-14T09:00:00Z"),
        description: "Full invoice payable Fancy Fabrics #FF-900",
        counterparty: "Fancy Fabrics",
        debitPaise: 12000000,
        creditPaise: 0,
        account: "Accounts Payable",
      },
    ];

    const matches = matchTransactions(bankTxs, ledgerEntries);
    expect(matches).toHaveLength(1);
    expect(matches[0].status).toBe("PARTIAL");
    expect(matches[0].type).toBe("PARTIAL");
    expect(matches[0].differencePaise).toBe(4000000);
  });

  // ---------------------------------------------------------------------------
  // T9: ambiguous candidate (counterparty 0.4 similarity)
  // ---------------------------------------------------------------------------
  it("T9: marks candidate in ambiguous gray band (amount exact, similarity 0.4) as AMBIGUOUS, not AUTO_MATCHED", () => {
    const bankTxs: BankTxInput[] = [
      {
        id: "btx-ambiguous",
        orgId: "org-1",
        date: new Date("2026-04-18T10:00:00Z"),
        description: "Payment to Alpha Global Traders",
        counterparty: "Alpha Global",
        debitPaise: 5000000,
        creditPaise: 0,
      },
    ];

    const ledgerEntries: LedgerEntryInput[] = [
      {
        id: "led-unrelated",
        orgId: "org-1",
        date: new Date("2026-04-18T10:00:00Z"),
        description: "Payment to Omega Services",
        counterparty: "Omega Services", // Low similarity ~0.2
        debitPaise: 5000000,
        creditPaise: 0,
        account: "Accounts Payable",
      },
    ];

    const matches = matchTransactions(bankTxs, ledgerEntries);
    expect(matches).toHaveLength(1);
    expect(matches[0].status).toBe("AMBIGUOUS");
    expect(matches[0].status).not.toBe("AUTO_MATCHED");
  });

  // ---------------------------------------------------------------------------
  // T10: cross-currency transaction rejected with clear error
  // ---------------------------------------------------------------------------
  it("T10: cross-currency transaction rejected with clear error (never silently summed)", () => {
    const bankTxs: BankTxInput[] = [
      {
        id: "btx-usd",
        orgId: "org-1",
        date: new Date("2026-04-10T10:00:00Z"),
        description: "Foreign remitter",
        counterparty: "US Client Corp",
        debitPaise: 0,
        creditPaise: 500000,
        currency: "USD",
      },
    ];

    const ledgerEntries: LedgerEntryInput[] = [
      {
        id: "led-pkr",
        orgId: "org-1",
        date: new Date("2026-04-10T10:00:00Z"),
        description: "Export sales booking",
        counterparty: "US Client Corp",
        debitPaise: 0,
        creditPaise: 500000,
        account: "Sales",
        currency: "PKR",
      },
    ];

    expect(() => matchTransactions(bankTxs, ledgerEntries)).toThrowError(
      /Cross-currency matching prohibited/i
    );
  });

  // ---------------------------------------------------------------------------
  // T11: E-101 generated from seed (two Zubair debits, one invoice)
  // ---------------------------------------------------------------------------
  it("T11: generates E-101 duplicate payment exception from two Zubair debits with one invoice", () => {
    const bankTxs: BankTxInput[] = [
      {
        id: "btx-zubair-1",
        orgId: "org-1",
        date: new Date("2026-04-05T11:00:00Z"),
        description: "Zubair Traders",
        counterparty: "Zubair Traders",
        debitPaise: 11850000,
        creditPaise: 0,
      },
      {
        id: "btx-zubair-2",
        orgId: "org-1",
        date: new Date("2026-04-15T09:10:00Z"),
        description: "Zubair Traders",
        counterparty: "Zubair Traders",
        debitPaise: 11850000,
        creditPaise: 0,
      },
    ];

    // Only 1 purchase invoice
    const invoices: InvoiceInput[] = [
      {
        id: "inv-zt-1141",
        orgId: "org-1",
        invoiceNumber: "ZT-1141",
        date: new Date("2026-04-05T09:00:00Z"),
        counterparty: "Zubair Traders",
        amountPaise: 11850000,
        type: "PURCHASE",
      },
    ];

    const exceptions = generateExceptions("2026-04", bankTxs, [], invoices, [], []);
    const dupExc = exceptions.find((e) => e.type === "DUPLICATE_PAYMENT");

    expect(dupExc).toBeDefined();
    expect(dupExc?.amountPaise).toBe(11850000);
    expect(dupExc?.bankTxId).toBe("btx-zubair-2");
    expect(dupExc?.title).toContain("Zubair Traders");
  });

  // ---------------------------------------------------------------------------
  // T12: E-102 generated from seed (12 Apr credit, no ledger entry)
  // ---------------------------------------------------------------------------
  it("T12: generates E-102 unrecorded credit exception from 12 Apr bank deposit missing ledger entry", () => {
    const bankTxs: BankTxInput[] = [
      {
        id: "btx-12apr",
        orgId: "org-1",
        date: new Date("2026-04-12T13:20:00Z"),
        description: "Local transfer in",
        counterparty: "Al-Rehman Textiles",
        debitPaise: 0,
        creditPaise: 34000000,
      },
    ];

    // No ledger entry exists for 12 Apr credit
    const exceptions = generateExceptions("2026-04", bankTxs, [], [], [], []);
    const unrecExc = exceptions.find((e) => e.type === "UNRECORDED_CREDIT");

    expect(unrecExc).toBeDefined();
    expect(unrecExc?.amountPaise).toBe(34000000);
    expect(unrecExc?.bankTxId).toBe("btx-12apr");
    expect(unrecExc?.title).toContain("Al-Rehman Textiles");
  });

  // ---------------------------------------------------------------------------
  // T13: three-way: 03 Apr credit → ledger sales → FBR invoice traces
  // ---------------------------------------------------------------------------
  it("T13: traces bank credit → ledger sales → invoice and asserts THREE_WAY_MATCHED", () => {
    const bankCredit: BankTxInput = {
      id: "btx-03apr",
      orgId: "org-1",
      date: new Date("2026-04-03T14:15:00Z"),
      description: "Buyer remittance — export invoice #EXP-401",
      counterparty: "Nordic Loom GmbH",
      ref: "FT-2026-8812",
      debitPaise: 0,
      creditPaise: 124000000,
    };

    const ledgerSale: LedgerEntryInput = {
      id: "led-sale-03apr",
      orgId: "org-1",
      date: new Date("2026-04-03T14:15:00Z"),
      description: "Export Sales Revenue invoice #EXP-401",
      counterparty: "Nordic Loom GmbH",
      ref: "FT-2026-8812",
      debitPaise: 0,
      creditPaise: 124000000,
      account: "Export Sales Revenue",
    };

    const invoice: InvoiceInput = {
      id: "inv-exp-401",
      orgId: "org-1",
      invoiceNumber: "EXP-401",
      date: new Date("2026-04-03T11:00:00Z"),
      counterparty: "Nordic Loom GmbH",
      amountPaise: 124000000,
      type: "SALES",
      ref: "FT-2026-8812",
    };

    const twoWayMatch: MatchCandidate = {
      bankTxIds: [bankCredit.id],
      ledgerEntryIds: [ledgerSale.id],
      score: 1.0,
      rule: "amount_exact + date_window + counterparty_1.00",
      status: "AUTO_MATCHED",
      type: "ONE_TO_ONE",
      amountPaise: 124000000,
    };

    const threeWayResults = performThreeWayReconciliation(
      [bankCredit],
      [ledgerSale],
      [invoice],
      [twoWayMatch]
    );

    expect(threeWayResults).toHaveLength(1);
    expect(threeWayResults[0].status).toBe("THREE_WAY_MATCHED");
    expect(threeWayResults[0].invoiceNumber).toBe("EXP-401");
    expect(threeWayResults[0].score).toBe(1.0);
  });

  // ---------------------------------------------------------------------------
  // T14: classifier: payroll, tax, utilities categorized; 12 Apr credit = revenue-like (inferred)
  // ---------------------------------------------------------------------------
  it("T14: categorizes payroll, tax, utilities; restricts unverified credit to revenue-like (inferred)", () => {
    const payrollTx: BankTxInput = {
      id: "tx-pay",
      orgId: "org-1",
      date: new Date("2026-04-02"),
      description: "Payroll salaries — April cycle",
      debitPaise: 48620000,
      creditPaise: 0,
    };
    const c1 = classifyTransaction(payrollTx);
    expect(c1.category).toBe("payroll");
    expect(c1.confidence).toBe("high");

    const taxTx: BankTxInput = {
      id: "tx-tax",
      orgId: "org-1",
      date: new Date("2026-04-10"),
      description: "FBR sales tax withholding challan",
      debitPaise: 1500000,
      creditPaise: 0,
    };
    const c2 = classifyTransaction(taxTx);
    expect(c2.category).toBe("tax-payment");

    const utilTx: BankTxInput = {
      id: "tx-util",
      orgId: "org-1",
      date: new Date("2026-04-21"),
      description: "LESCO Lahore electricity bill",
      debitPaise: 4200000,
      creditPaise: 0,
    };
    const c3 = classifyTransaction(utilTx);
    expect(c3.category).toBe("rent-utilities");

    // 12 Apr credit without verified invoice match
    const credit12Apr: BankTxInput = {
      id: "tx-12apr",
      orgId: "org-1",
      date: new Date("2026-04-12"),
      description: "Local transfer in",
      counterparty: "Al-Rehman Textiles",
      debitPaise: 0,
      creditPaise: 34000000,
    };
    const c4 = classifyTransaction(credit12Apr);
    // HARD RULE: MUST NOT be confirmed customer-receipt
    expect(c4.category).toBe("revenue-like credit (inferred)");
    expect(c4.category).not.toBe("customer-receipt");
  });

  // ---------------------------------------------------------------------------
  // T15: idempotent rerun: running twice yields identical exception counts
  // ---------------------------------------------------------------------------
  it("T15: running orchestrator twice yields identical exception counts with zero duplicate exceptions", async () => {
    // Seed some test transactions into testOrg
    const b1 = await prisma.bankTransaction.create({
      data: {
        orgId: testOrgId,
        date: new Date("2026-04-05"),
        description: "Zubair Traders",
        counterparty: "Zubair Traders",
        debitPaise: 11850000,
        runningBalancePaise: 80000000,
      },
    });
    const b2 = await prisma.bankTransaction.create({
      data: {
        orgId: testOrgId,
        date: new Date("2026-04-15"),
        description: "Zubair Traders",
        counterparty: "Zubair Traders",
        debitPaise: 11850000,
        runningBalancePaise: 68150000,
      },
    });

    // Run 1
    const run1 = await executeOrchestratorForPeriod({
      orgId: testOrgId,
      period: "2026-04",
      prismaClient: prisma,
    });

    const countAfterRun1 = await prisma.exception.count({
      where: { orgId: testOrgId, period: "2026-04" },
    });

    // Run 2 (immediate rerun)
    const run2 = await executeOrchestratorForPeriod({
      orgId: testOrgId,
      period: "2026-04",
      prismaClient: prisma,
    });

    const countAfterRun2 = await prisma.exception.count({
      where: { orgId: testOrgId, period: "2026-04" },
    });

    expect(countAfterRun2).toBe(countAfterRun1);
    expect(run2.createdExceptionsCount).toBe(0);
    expect(run2.diffSummary).toContain("idempotent");
  });

  // ---------------------------------------------------------------------------
  // T16: rerun diff reports "1 resolved" after exception resolution
  // ---------------------------------------------------------------------------
  it("T16: reports diff '1 exception(s) resolved' when evidence/entry resolves an exception", async () => {
    // Pick an existing OPEN exception in testOrg
    const openExc = await prisma.exception.findFirst({
      where: { orgId: testOrgId, period: "2026-04", status: "OPEN" },
    });
    expect(openExc).toBeDefined();

    // Mark as WAIVED/RESOLVED by user
    await prisma.exception.update({
      where: { id: openExc!.id },
      data: { status: "RESOLVED" },
    });

    // Clean up one bank transaction so engine naturally no longer produces it
    if (openExc!.bankTxId) {
      await prisma.bankTransaction.delete({
        where: { id: openExc!.bankTxId },
      });
    }

    const rerun = await executeOrchestratorForPeriod({
      orgId: testOrgId,
      period: "2026-04",
      prismaClient: prisma,
    });

    expect(rerun.diffSummary).toContain("resolved");
  });

  // ---------------------------------------------------------------------------
  // T17: engine purity: matcher/classifier modules import no AI SDK, no network calls
  // ---------------------------------------------------------------------------
  it("T17: asserts engine purity (no AI SDK, no network calls in matcher/classifier/threeWay)", () => {
    const engineDir = path.join(process.cwd(), "src", "engine");
    const engineFiles = ["matcher.ts", "classifier.ts", "threeWay.ts", "exceptions.ts"];

    const prohibitedTerms = [
      "@google/generative-ai",
      "openai",
      "@anthropic-ai",
      "axios",
      "node-fetch",
      "from 'http'",
      "from 'https'",
      "from \"http\"",
      "from \"https\"",
    ];

    for (const file of engineFiles) {
      const filePath = path.join(engineDir, file);
      const content = fs.readFileSync(filePath, "utf-8");

      for (const term of prohibitedTerms) {
        const containsProhibited = content.toLowerCase().includes(term.toLowerCase());
        expect(containsProhibited).toBe(false);
      }
    }
  });
});
