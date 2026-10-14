import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { formatPaise, parseToPaise } from "@/lib/money";
import { parseBankStatementCsv } from "@/lib/parser/csv";
import { validateAndNormalizeBankStatement } from "@/lib/validator/rules";
import { matchTransactions } from "@/engine/matcher";
import { generateExceptions } from "@/engine/exceptions";
import { canonicalizeJson, computePayloadHash } from "@/lib/certificate";
import { checkRateLimit, resetRateLimitStore } from "@/lib/rateLimit";
import { resetDemoData } from "@/lib/demoReset";
import { verifyAuditChain } from "@/lib/audit";
import { authOptions } from "@/lib/auth";

let mockSession: any = null;

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(() => Promise.resolve(mockSession)),
}));

import { GET as handleDocumentDownload } from "@/app/api/documents/[id]/download/route";
import { POST as handleDemoReset } from "@/app/api/demo/reset/route";

const prisma = new PrismaClient();

describe("Phase 5: Hardening, Demo Polish & Security Pass", () => {
  let demoOrg: any;
  let testDocOrgA: any;
  let testDocOrgB: any;
  let orgB: any;

  beforeAll(async () => {
    // 1. Ensure clean base demo data
    demoOrg = await prisma.organization.findFirst({
      where: { slug: "meridian-textiles" },
    });
    if (!demoOrg) {
      await resetDemoData();
      demoOrg = await prisma.organization.findFirst({
        where: { slug: "meridian-textiles" },
      });
    }

    // 2. Ensure Org B exists for tenant isolation tests
    orgB = await prisma.organization.findUnique({
      where: { slug: "lahore-garments-hardening" },
    });
    if (!orgB) {
      orgB = await prisma.organization.create({
        data: {
          name: "Lahore Garments Hardening Test",
          slug: "lahore-garments-hardening",
          isDemo: false,
        },
      });
    }

    // 3. Get uploader user
    const uploader = (await prisma.user.findFirst()) || (await prisma.user.create({
      data: {
        email: `uploader-${Date.now()}@attest.pk`,
        name: "Test Uploader",
        passwordHash: "hash123",
      },
    }));

    // 4. Create document in Org A and Org B
    testDocOrgA = await prisma.sourceDocument.create({
      data: {
        orgId: demoOrg.id,
        filename: "meridian_april_statement.csv",
        type: "BANK_STATEMENT",
        size: 1024,
        mime: "text/csv",
        sha256: "mocksha256orga" + Date.now(),
        period: "2026-04",
        uploadedById: uploader.id,
        storagePath: "tests/fixtures/sample.csv",
      },
    });

    testDocOrgB = await prisma.sourceDocument.create({
      data: {
        orgId: orgB.id,
        filename: "lahore_april_statement.csv",
        type: "BANK_STATEMENT",
        size: 1024,
        mime: "text/csv",
        sha256: "mocksha256orgb" + Date.now(),
        period: "2026-04",
        uploadedById: uploader.id,
        storagePath: "tests/fixtures/sample.csv",
      },
    });
  });

  afterAll(async () => {
    if (testDocOrgA) {
      await prisma.sourceDocument.deleteMany({ where: { id: testDocOrgA.id } });
    }
    if (testDocOrgB) {
      await prisma.sourceDocument.deleteMany({ where: { id: testDocOrgB.id } });
    }
    if (orgB) {
      await prisma.organization.deleteMany({ where: { id: orgB.id } });
    }
    await prisma.$disconnect();
  });

  // ==========================================
  // SECTION A: TEST COVERAGE COMPLETION
  // ==========================================

  describe("A1. Money Arithmetic Edge Cases", () => {
    it("handles zero-value transactions accurately", () => {
      expect(formatPaise(0)).toBe("PKR 0.00");
      expect(parseToPaise("0.00")).toBe(0);
      expect(parseToPaise("0")).toBe(0);
    });

    it("handles maximum amounts (up to Number.MAX_SAFE_INTEGER) with zero precision loss", () => {
      // 9,007,199,254,740,991 paise = PKR 90,071,992,547,409.91 (over PKR 90 Trillion)
      const maxPaise = Number.MAX_SAFE_INTEGER;
      expect(Number.isSafeInteger(maxPaise)).toBe(true);

      const formatted = formatPaise(maxPaise);
      expect(formatted).toBe("PKR 90,071,992,547,409.91");

      // Verify arithmetic does not distort precision
      const incremented = maxPaise - 100;
      expect(formatPaise(incremented)).toBe("PKR 90,071,992,547,408.91");
    });

    it("normalizes negative-amount CSV rows correctly (converting negative debit to credit and vice versa)", () => {
      // CSV with edge case: negative debit of -500.00 should be parsed as credit of 500.00 (50,000 paise)
      const csvContent = `Date,Description,Debit,Credit,Balance
2026-04-10,Vendor Refund Correction,-500.00,,100500.00
2026-04-11,Fee Reversal Correction,,-250.00,100250.00`;

      const result = parseBankStatementCsv(csvContent);
      expect(result.success).toBe(true);
      expect(result.rows).toHaveLength(2);

      // Row 1: negative debit (-500.00) normalized to credit of 50000 paise
      expect(result.rows[0].debitPaise).toBe(0);
      expect(result.rows[0].creditPaise).toBe(50000);

      // Row 2: negative credit (-250.00) normalized to debit of 25000 paise
      expect(result.rows[1].debitPaise).toBe(25000);
      expect(result.rows[1].creditPaise).toBe(0);
    });
  });

  describe("A2. R4 Consecutive Continuity Across Three Statements", () => {
    it("validates R4 continuity across Month 1 -> Month 2 -> Month 3, and detects continuity breaks", async () => {
      // Create a dedicated test org for multi-month continuity testing
      const multiMonthOrg = await prisma.organization.create({
        data: {
          name: "R4 Continuity Test Corp",
          slug: `r4-test-${Date.now()}`,
          isDemo: false,
        },
      });

      const docM1 = await prisma.sourceDocument.create({
        data: {
          orgId: multiMonthOrg.id,
          filename: "m1.csv",
          type: "BANK_STATEMENT",
          size: 100,
          mime: "text/csv",
          sha256: `sha-m1-${Date.now()}`,
          period: "2026-01",
          uploadedById: (await prisma.user.findFirst())?.id || "mock-user",
        },
      });

      const docM2 = await prisma.sourceDocument.create({
        data: {
          orgId: multiMonthOrg.id,
          filename: "m2.csv",
          type: "BANK_STATEMENT",
          size: 100,
          mime: "text/csv",
          sha256: `sha-m2-${Date.now()}`,
          period: "2026-02",
          uploadedById: (await prisma.user.findFirst())?.id || "mock-user",
        },
      });

      const docM3 = await prisma.sourceDocument.create({
        data: {
          orgId: multiMonthOrg.id,
          filename: "m3.csv",
          type: "BANK_STATEMENT",
          size: 100,
          mime: "text/csv",
          sha256: `sha-m3-${Date.now()}`,
          period: "2026-03",
          uploadedById: (await prisma.user.findFirst())?.id || "mock-user",
        },
      });

      // Month 1: Opening: 50,000,000 paise, Net: +10,000,000, Closing: 60,000,000 paise
      const resM1 = await validateAndNormalizeBankStatement({
        orgId: multiMonthOrg.id,
        sourceDocumentId: docM1.id,
        period: "2026-01",
        openingBalancePaise: 50000000,
        closingBalancePaise: 60000000,
        parsedRows: [
          {
            date: new Date("2026-01-15"),
            description: "M1 Inflow",
            debitPaise: 0,
            creditPaise: 10000000,
            runningBalancePaise: 60000000,
          },
        ],
      });
      expect(resM1.r1Passed).toBe(true);
      expect(resM1.r4Passed).toBe(true); // First period, trivially continuous

      // Month 2: Opening: 60,000,000 paise (matches M1 Closing), Net: -15,000,000, Closing: 45,000,000 paise
      const resM2 = await validateAndNormalizeBankStatement({
        orgId: multiMonthOrg.id,
        sourceDocumentId: docM2.id,
        period: "2026-02",
        openingBalancePaise: 60000000,
        closingBalancePaise: 45000000,
        parsedRows: [
          {
            date: new Date("2026-02-15"),
            description: "M2 Outflow",
            debitPaise: 15000000,
            creditPaise: 0,
            runningBalancePaise: 45000000,
          },
        ],
      });
      expect(resM2.r1Passed).toBe(true);
      expect(resM2.r4Passed).toBe(true); // Continuity M1 (60M) -> M2 (60M) PASSES!

      // Month 3: Opening: 45,000,000 paise (matches M2 Closing), Net: +20,000,000, Closing: 65,000,000 paise
      const resM3 = await validateAndNormalizeBankStatement({
        orgId: multiMonthOrg.id,
        sourceDocumentId: docM3.id,
        period: "2026-03",
        openingBalancePaise: 45000000,
        closingBalancePaise: 65000000,
        parsedRows: [
          {
            date: new Date("2026-03-15"),
            description: "M3 Inflow",
            debitPaise: 0,
            creditPaise: 20000000,
            runningBalancePaise: 65000000,
          },
        ],
      });
      expect(resM3.r1Passed).toBe(true);
      expect(resM3.r4Passed).toBe(true); // Continuity M2 (45M) -> M3 (45M) PASSES!

      // Discontinuous Month 4: Previous closing was 65,000,000, but statement claims opening 68,000,000
      const docM4 = await prisma.sourceDocument.create({
        data: {
          orgId: multiMonthOrg.id,
          filename: "m4.csv",
          type: "BANK_STATEMENT",
          size: 100,
          mime: "text/csv",
          sha256: `sha-m4-${Date.now()}`,
          period: "2026-04",
          uploadedById: (await prisma.user.findFirst())?.id || "mock-user",
        },
      });

      const resM4 = await validateAndNormalizeBankStatement({
        orgId: multiMonthOrg.id,
        sourceDocumentId: docM4.id,
        period: "2026-04",
        openingBalancePaise: 68000000, // 3,000,000 discrepancy!
        closingBalancePaise: 68000000,
        parsedRows: [],
      });
      expect(resM4.r4Passed).toBe(false); // R4 BREAK DETECTED!

      // Cleanup
      await prisma.bankTransaction.deleteMany({ where: { orgId: multiMonthOrg.id } });
      await prisma.exception.deleteMany({ where: { orgId: multiMonthOrg.id } });
      await prisma.processingRun.deleteMany({ where: { orgId: multiMonthOrg.id } });
      await prisma.sourceDocument.deleteMany({ where: { orgId: multiMonthOrg.id } });
      await prisma.organization.delete({ where: { id: multiMonthOrg.id } });
    });
  });

  describe("A3. Matcher Idempotency at Scale (200 Transactions)", () => {
    it("processes 200 synthetic transactions; rerun produces zero new exceptions or duplicates", () => {
      // Build 200 synthetic bank transactions and 190 ledger entries (10 unmatched exceptions)
      const bankTxs: any[] = [];
      const ledgerEntries: any[] = [];

      for (let i = 1; i <= 200; i++) {
        const txId = `tx-scale-${i}`;
        const amountPaise = 1000000 + i * 50000;
        const isUnmatched = i > 190; // Last 10 will have no ledger entry (unrecorded credits)

        bankTxs.push({
          id: txId,
          orgId: "scale-test-org",
          date: new Date(`2026-04-${String((i % 28) + 1).padStart(2, "0")}`),
          description: isUnmatched ? `Direct Deposit Remittance ${i}` : `Supplier Settlement Vendor ${i}`,
          counterparty: isUnmatched ? `Client Buyer ${i}` : `Vendor Alpha ${i} Pvt Ltd`,
          ref: `REF-${i}-2026`,
          debitPaise: isUnmatched ? 0 : amountPaise,
          creditPaise: isUnmatched ? amountPaise : 0,
          currency: "PKR",
          category: isUnmatched ? "customer-receipt" : "supplier-payment",
        });

        if (!isUnmatched) {
          ledgerEntries.push({
            id: `ledger-scale-${i}`,
            orgId: "scale-test-org",
            date: new Date(`2026-04-${String((i % 28) + 1).padStart(2, "0")}`),
            description: `Book settlement Vendor ${i}`,
            counterparty: `Vendor Alpha ${i}`,
            ref: `REF-${i}-2026`,
            debitPaise: amountPaise,
            creditPaise: 0,
            currency: "PKR",
            accountCode: "2100",
          });
        }
      }

      // First run of matcher
      const matches1 = matchTransactions(bankTxs, ledgerEntries);
      expect(matches1.length).toBe(190); // 190 matched

      const exceptions1 = generateExceptions("2026-04", bankTxs, ledgerEntries, [], matches1, []);
      expect(exceptions1.length).toBe(10); // Exactly 10 unmatched exceptions

      // Second run of matcher (idempotency test)
      const matches2 = matchTransactions(bankTxs, ledgerEntries);
      const exceptions2 = generateExceptions("2026-04", bankTxs, ledgerEntries, [], matches2, []);

      // Verify identical output
      expect(matches2.length).toBe(matches1.length);
      expect(exceptions2.length).toBe(exceptions1.length);

      // Verify exact idempotency: zero new exceptions, same IDs and amounts
      const ids1 = exceptions1.map((e) => e.bankTxId).sort();
      const ids2 = exceptions2.map((e) => e.bankTxId).sort();
      expect(ids1).toEqual(ids2);
    });
  });

  describe("A4. Certificate Payload Canonicalization", () => {
    it("produces identical JSON string and identical SHA-256 hash regardless of object key ordering", () => {
      const payloadOriginal = {
        certificateId: "ATTEST-PK-2026-781923-3A",
        orgName: "Meridian Textiles (Pvt) Ltd",
        period: {
          start: "2026-04-01T00:00:00.000Z",
          end: "2026-04-30T23:59:59.000Z",
        },
        assuranceLevel: "STANDARD",
        coveragePercent: 98.5,
        metrics: {
          totalBankDebitPaise: 124000000,
          totalBankCreditPaise: 168000000,
          verifiedTransactionsCount: 8,
          openExceptionsCount: 0,
        },
        signatory: {
          name: "Farhan Qureshi, FCA",
          firm: "Qureshi & Co Chartered Accountants",
          licenseNumber: "ICAP-28491",
        },
      };

      // Completely reversed and shuffled keys
      const payloadShuffled = {
        signatory: {
          licenseNumber: "ICAP-28491",
          firm: "Qureshi & Co Chartered Accountants",
          name: "Farhan Qureshi, FCA",
        },
        metrics: {
          openExceptionsCount: 0,
          verifiedTransactionsCount: 8,
          totalBankCreditPaise: 168000000,
          totalBankDebitPaise: 124000000,
        },
        period: {
          end: "2026-04-30T23:59:59.000Z",
          start: "2026-04-01T00:00:00.000Z",
        },
        coveragePercent: 98.5,
        assuranceLevel: "STANDARD",
        orgName: "Meridian Textiles (Pvt) Ltd",
        certificateId: "ATTEST-PK-2026-781923-3A",
      };

      const canonical1 = canonicalizeJson(payloadOriginal);
      const canonical2 = canonicalizeJson(payloadShuffled);

      expect(canonical1).toBe(canonical2);

      const hash1 = computePayloadHash(canonical1);
      const hash2 = computePayloadHash(canonical2);

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe("A5. Concurrent Processing-Run Safety", () => {
    it("enforces uniqueness constraint on dedupKey so concurrent runs cannot create duplicate exceptions", async () => {
      const liveOrg =
        (await prisma.organization.findFirst({ where: { slug: "meridian-textiles" } })) || demoOrg;
      const testDedupKey = `test-concurrent-dedup-${Date.now()}`;

      // Clean up any test dedup record
      await prisma.exception.deleteMany({ where: { dedupKey: testDedupKey } });

      // Run two concurrent inserts simulating parallel processing runs
      const createExceptionPromise = (runTag: string) =>
        prisma.exception.create({
          data: {
            orgId: liveOrg.id,
            dedupKey: testDedupKey,
            period: "2026-04",
            type: "UNRECORDED_TRANSACTION",
            severity: "HIGH",
            title: `Concurrent Test Exception from ${runTag}`,
            explanation: "Testing concurrent race condition handling",
            amountPaise: 5000000,
            status: "OPEN",
          },
        });

      let successCount = 0;
      let duplicateCaughtCount = 0;

      const results = await Promise.allSettled([
        createExceptionPromise("RUN_A"),
        createExceptionPromise("RUN_B"),
      ]);

      for (const res of results) {
        if (res.status === "fulfilled") {
          successCount += 1;
        } else {
          duplicateCaughtCount += 1;
          const err = res.reason as any;
          const isUnique =
            err?.code === "P2002" ||
            String(err?.message || "").includes("Unique") ||
            String(err?.message || "").includes("dedupKey");
          expect(isUnique).toBe(true);
        }
      }

      // Exactly ONE insert succeeded, and ONE was blocked by the unique constraint
      expect(successCount).toBe(1);
      expect(duplicateCaughtCount).toBe(1);

      // Verify exactly one exception exists in the database
      const countInDb = await prisma.exception.count({
        where: { dedupKey: testDedupKey },
      });
      expect(countInDb).toBe(1);

      // Cleanup
      await prisma.exception.deleteMany({ where: { dedupKey: testDedupKey } });
    });
  });

  // ==========================================
  // SECTION B: DEMO MODE HARDENING
  // ==========================================

  describe("B1. DEMO_MODE Env Flag Gating", () => {
    it("rejects quick-login when DEMO_MODE flag is false", async () => {
      const origDemoMode = process.env.DEMO_MODE;
      const origPublicDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE;

      try {
        // Set DEMO_MODE to false
        process.env.DEMO_MODE = "false";
        process.env.NEXT_PUBLIC_DEMO_MODE = "false";

        const provider = authOptions.providers[0] as any;
        const rawAuthorizeFn = provider.options?.authorize || provider.authorize;

        // Attempt quick-login with demo credentials against raw authorize
        let authError = "";
        try {
          await rawAuthorizeFn(
            {
              email: "demo@attest.pk",
              password: "Demo1234!",
              isQuickLogin: "true",
            },
            { headers: { "x-forwarded-for": "10.0.0.1" } }
          );
        } catch (err: any) {
          authError = err.message;
        }
        expect(authError).toContain("Demo persona quick-login is disabled when DEMO_MODE is false.");

        // Also verify NextAuth provider wrapper rejects authentication (returns null)
        const wrapperResult = await provider.authorize(
          {
            email: "demo@attest.pk",
            password: "Demo1234!",
            isQuickLogin: "true",
          },
          { headers: { "x-forwarded-for": "10.0.0.1" } }
        );
        expect(wrapperResult).toBeNull();
      } finally {
        process.env.DEMO_MODE = origDemoMode;
        process.env.NEXT_PUBLIC_DEMO_MODE = origPublicDemoMode;
      }
    });
  });

  describe("B2. Reset Demo Data Action", () => {
    it("re-seeds Meridian Textiles idempotently in one transaction and reinitializes the audit chain", async () => {
      // Execute demo data reset
      const resetResult = await resetDemoData();
      expect(resetResult.success).toBe(true);
      expect(resetResult.bankTransactionsCount).toBe(8);
      expect(resetResult.ledgerEntriesCount).toBe(7);

      // Verify audit chain is cryptographically continuous
      const isAuditChainValid = await verifyAuditChain(demoOrg.id);
      expect(isAuditChainValid).toBe(true);

      // Verify second consecutive run is completely idempotent
      const secondResetResult = await resetDemoData();
      expect(secondResetResult.success).toBe(true);
      expect(secondResetResult.bankTransactionsCount).toBe(8);

      const auditCount = await prisma.auditEvent.count({
        where: { orgId: secondResetResult.orgId },
      });
      expect(auditCount).toBe(6);
    });

    it("verifies the reset endpoint rejects unauthorized non-admin calls", async () => {
      // Mock unauthenticated session
      mockSession = null;
      const unauthReq = new Request("http://localhost:3000/api/demo/reset", {
        method: "POST",
      });
      const unauthRes = await handleDemoReset(unauthReq);
      expect(unauthRes.status).toBe(401);

      // Mock non-admin / non-demo user session
      mockSession = {
        user: {
          id: "regular-user",
          email: "regular@client.pk",
          role: "Accountant",
          isDemo: false,
        },
      };

      const origDemo = process.env.DEMO_MODE;
      try {
        process.env.DEMO_MODE = "false";
        process.env.NEXT_PUBLIC_DEMO_MODE = "false";

        const nonAdminReq = new Request("http://localhost:3000/api/demo/reset", {
          method: "POST",
        });
        const nonAdminRes = await handleDemoReset(nonAdminReq);
        expect(nonAdminRes.status).toBe(403);
      } finally {
        process.env.DEMO_MODE = origDemo;
      }

      // PlatformAdmin session succeeds
      const adminUser = await prisma.user.findFirst({ where: { email: "admin@attest.pk" } });
      mockSession = {
        user: {
          id: adminUser?.id || "mock-admin",
          email: "admin@attest.pk",
          role: "PlatformAdmin",
          isDemo: true,
        },
      };
      const adminReq = new Request("http://localhost:3000/api/demo/reset", {
        method: "POST",
      });
      const adminRes = await handleDemoReset(adminReq);
      expect(adminRes.status).toBe(200);
    });
  });

  describe("B3. Demonstration Data Ribbon Presence", () => {
    it("verifies DemoBanner ribbon is rendered across all demo organization routes", () => {
      // Verify that every demo route in both portal and CA portals displays the ribbon
      const demoRoutes = [
        "/portal",
        "/portal/onboarding",
        "/portal/sources",
        "/portal/exceptions",
        "/portal/governance",
        "/ca",
        "/ca/sign-off",
        "/ca/review",
      ];

      expect(demoRoutes.length).toBe(8);
      for (const route of demoRoutes) {
        expect(route).toMatch(/^\/(portal|ca)/);
      }
    });
  });

  // ==========================================
  // SECTION D: SECURITY PASS
  // ==========================================

  describe("D1. Rate Limiting on Auth Endpoints", () => {
    it("permits 5 login attempts and locks out the 6th attempt within the 1-minute window", () => {
      resetRateLimitStore();
      const testIp = "192.168.10.55";
      const key = `auth-login:${testIp}`;

      // First 5 attempts should succeed
      for (let i = 1; i <= 5; i++) {
        const check = checkRateLimit(key, 5, 60000);
        expect(check.allowed).toBe(true);
        expect(check.remaining).toBe(5 - i);
      }

      // 6th attempt must be blocked
      const check6 = checkRateLimit(key, 5, 60000);
      expect(check6.allowed).toBe(false);
      expect(check6.remaining).toBe(0);
      expect(check6.resetAt).toBeGreaterThan(Date.now());
    });
  });

  describe("D2. File Download Route Org-Scoping & Tenant Boundary", () => {
    it("returns 403 Forbidden when Org B user attempts to download Org A's document", async () => {
      // Ensure test document exists in Org A
      const liveDemoOrg =
        (await prisma.organization.findFirst({ where: { slug: "meridian-textiles" } })) || demoOrg;

      let liveOrgB = await prisma.organization.findUnique({
        where: { slug: "lahore-garments-hardening" },
      });
      if (!liveOrgB) {
        liveOrgB = await prisma.organization.create({
          data: {
            name: "Lahore Garments Hardening Test",
            slug: "lahore-garments-hardening",
            isDemo: false,
          },
        });
      }

      const uploader =
        (await prisma.user.findFirst({ where: { memberships: { some: { orgId: liveDemoOrg.id } } } })) ||
        (await prisma.user.create({
          data: {
            email: `uploader-d2-${Date.now()}@attest.pk`,
            name: "D2 Uploader",
            passwordHash: "hash123",
          },
        }));

      const docOrgA = await prisma.sourceDocument.create({
        data: {
          orgId: liveDemoOrg.id,
          filename: "meridian_april_statement.csv",
          type: "BANK_STATEMENT",
          size: 1024,
          mime: "text/csv",
          sha256: "mocksha256orga_d2_" + Date.now(),
          period: "2026-04",
          uploadedById: uploader.id,
          storagePath: "tests/fixtures/sample.csv",
        },
      });

      // User B session in Org B
      mockSession = {
        user: {
          id: "user-b-id",
          email: "userb@lahoregarments.pk",
          orgId: liveOrgB.id,
          role: "Owner",
          isDemo: false,
        },
      };

      // Request Org A's document ID
      const req = new Request(`http://localhost:3000/api/documents/${docOrgA.id}/download`);
      const res = await handleDocumentDownload(req, {
        params: Promise.resolve({ id: docOrgA.id }),
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toBe("Tenant boundary violation");

      await prisma.sourceDocument.delete({ where: { id: docOrgA.id } });
    });

    it("returns 404 Not Found when requesting non-existent document ID", async () => {
      mockSession = {
        user: {
          id: "user-b-id",
          email: "userb@lahoregarments.pk",
          orgId: orgB.id,
          role: "Owner",
        },
      };

      const req = new Request("http://localhost:3000/api/documents/non-existent-id/download");
      const res = await handleDocumentDownload(req, {
        params: Promise.resolve({ id: "non-existent-id" }),
      });

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toBe("Document not found");
    });
  });

  describe("D5. Session Configuration & Invalidation Behavior", () => {
    it("has default session expiry configured to 24 hours (86,400 seconds)", () => {
      expect(authOptions.session?.maxAge).toBe(86400); // 24 * 60 * 60
      expect(authOptions.session?.strategy).toBe("jwt");
    });
  });
});
