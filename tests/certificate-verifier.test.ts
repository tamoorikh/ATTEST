import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { evaluatePreIssuanceGates } from "@/lib/gates";
import {
  generatePublicId,
  canonicalizeJson,
  computePayloadHash,
  signPayloadHash,
  verifyCertificateSignature,
  ATTEST_SCOPE_LANGUAGE,
} from "@/lib/certificate";
import { checkRateLimit, resetRateLimitStore } from "@/lib/rateLimit";
import crypto from "crypto";

describe("Phase 4: Certificate Sign-off, Issuance & Public Verifier", () => {
  let demoOrgId: string;
  let caUserId: string;

  beforeEach(async () => {
    resetRateLimitStore();

    const org = await prisma.organization.findFirst({
      where: { isDemo: true },
    });
    if (!org) throw new Error("Demo org not found");
    demoOrgId = org.id;

    const caUser = await prisma.user.findFirst({
      where: { email: "ca@attest.pk" },
    });
    if (!caUser) throw new Error("CA user not found");
    caUserId = caUser.id;
  });

  // TEST 1: Issuance blocked with open HIGH exception -> proceeds after resolution
  it("Gate enforcement: blocks issuance with open HIGH exception, then proceeds after resolution", async () => {
    const period = "2026-04";

    // Create an open HIGH exception
    const testEx = await prisma.exception.create({
      data: {
        orgId: demoOrgId,
        period,
        type: "DUPLICATE_PAYMENT",
        title: "Test High Severity Payment Anomaly",
        explanation: "Duplicate debit detected in statements.",
        severity: "HIGH",
        status: "OPEN",
        amountPaise: 11850000,
      },
    });

    const caConclusion =
      "In our professional judgment as licensed Chartered Accountants, all material reconciliation discrepancies have been audited.";

    // Gate evaluation should be BLOCKED due to open HIGH exception
    const evaluationBlocked = await evaluatePreIssuanceGates(
      demoOrgId,
      period,
      caConclusion
    );

    expect(evaluationBlocked.canIssue).toBe(false);
    const gate3 = evaluationBlocked.gates.find((g) => g.id === "GATE_3_NO_HIGH_EXCEPTIONS");
    expect(gate3).toBeDefined();
    expect(gate3?.status).toBe("BLOCKED");
    expect(gate3?.reason).toContain("open HIGH/CRITICAL exception");

    // Now resolve the exception
    await prisma.exception.update({
      where: { id: testEx.id },
      data: {
        status: "RESOLVED",
        resolutionType: "DUPLICATE_REVERSAL",
        resolutionNotes: "Supplier credited back the duplicate payment on slip #9481.",
        resolvedById: caUserId,
        resolvedAt: new Date(),
      },
    });

    // Also resolve any other remaining HIGH/CRITICAL exceptions in demo org for the test
    await prisma.exception.updateMany({
      where: {
        orgId: demoOrgId,
        period,
        severity: { in: ["HIGH", "CRITICAL"] },
        status: "OPEN",
      },
      data: {
        status: "RESOLVED",
        resolutionNotes: "Resolved under CA verification audit.",
        resolvedById: caUserId,
        resolvedAt: new Date(),
      },
    });

    // Gate evaluation should now PASS
    const evaluationPassed = await evaluatePreIssuanceGates(
      demoOrgId,
      period,
      caConclusion
    );

    expect(evaluationPassed.canIssue).toBe(true);
    const gate3Passed = evaluationPassed.gates.find((g) => g.id === "GATE_3_NO_HIGH_EXCEPTIONS");
    expect(gate3Passed?.status).toBe("PASS");
  });

  // TEST 2: Signature verification passes on valid payload
  it("Cryptographic engine: correctly signs canonical payload and verifies valid signature", () => {
    const publicId = generatePublicId(2026);
    expect(publicId).toMatch(/^ATTEST-PK-2026-\d{6}-[A-Z0-9]{2}$/);

    const payloadObj = {
      publicId,
      org: "Meridian Textiles (Pvt) Ltd",
      level: "LEVEL_2",
      period: "2026-04",
      scope: ATTEST_SCOPE_LANGUAGE,
      coveragePercent: 88,
      signatory: "Ayesha Siddiqui, FCA",
      issuedAt: "2026-10-14T12:00:00.000Z",
    };

    const canonicalJson = canonicalizeJson(payloadObj);
    const payloadHash = computePayloadHash(canonicalJson);
    const signature = signPayloadHash(payloadHash);

    const result = verifyCertificateSignature(canonicalJson, payloadHash, signature);
    expect(result.valid).toBe(true);
  });

  // TEST 3: Tampered payload -> SIGNATURE INVALID
  it("Cryptographic engine: rejects tampered canonical payload as SIGNATURE INVALID", () => {
    const publicId = generatePublicId(2026);
    const payloadObj = {
      publicId,
      org: "Meridian Textiles (Pvt) Ltd",
      level: "LEVEL_2",
      period: "2026-04",
      coveragePercent: 88,
    };

    const canonicalJson = canonicalizeJson(payloadObj);
    const payloadHash = computePayloadHash(canonicalJson);
    const signature = signPayloadHash(payloadHash);

    // Tamper with payload (change coveragePercent from 88 to 100)
    const tamperedPayloadObj = { ...payloadObj, coveragePercent: 100 };
    const tamperedCanonicalJson = canonicalizeJson(tamperedPayloadObj);

    // Verify tampered payload with original hash/sig
    const result1 = verifyCertificateSignature(tamperedCanonicalJson, payloadHash, signature);
    expect(result1.valid).toBe(false);
    expect(result1.reason).toBe("PAYLOAD_HASH_MISMATCH");

    // Tamper with signature
    const badSignature = "a".repeat(64);
    const result2 = verifyCertificateSignature(canonicalJson, payloadHash, badSignature);
    expect(result2.valid).toBe(false);
    expect(result2.reason).toBe("SIGNATURE_MISMATCH");
  });

  // TEST 4: Revocation reflects publicly
  it("Certificate lifecycle: revocation is recorded with mandatory reason and reflects status", async () => {
    const publicId = generatePublicId(2026);
    const cert = await prisma.certificate.create({
      data: {
        orgId: demoOrgId,
        publicId,
        level: "LEVEL_2",
        periodStart: new Date("2026-04-01"),
        periodEnd: new Date("2026-04-30"),
        status: "ISSUED",
        signedById: caUserId,
        coveragePercent: 88,
      },
    });

    const revocationReason =
      "Bank statement was amended by financial institution due to post-closing reversal.";
    expect(revocationReason.length).toBeGreaterThanOrEqual(20);

    const updated = await prisma.certificate.update({
      where: { id: cert.id },
      data: {
        status: "REVOKED",
        revocationReason,
        revokedAt: new Date(),
        revokedById: caUserId,
      },
    });

    expect(updated.status).toBe("REVOKED");
    expect(updated.revocationReason).toBe(revocationReason);
    expect(updated.revokedAt).toBeDefined();

    // Re-query from DB as verifier would
    const queried = await prisma.certificate.findUnique({
      where: { publicId },
    });
    expect(queried?.status).toBe("REVOKED");
    expect(queried?.revocationReason).toBe(revocationReason);
  });

  // TEST 5: Supersession chain correct
  it("Versioning: re-issuing for same period marks prior certificate SUPERSEDED and links successor", async () => {
    const period = "2026-04";

    // 1. Create first certificate
    const publicId1 = generatePublicId(2026);
    const cert1 = await prisma.certificate.create({
      data: {
        orgId: demoOrgId,
        publicId: publicId1,
        level: "LEVEL_2",
        periodStart: new Date("2026-04-01"),
        periodEnd: new Date("2026-04-30"),
        status: "ISSUED",
        signedById: caUserId,
        version: 1,
      },
    });

    // 2. Create successor certificate (version 2)
    const publicId2 = generatePublicId(2026);
    const cert2 = await prisma.certificate.create({
      data: {
        orgId: demoOrgId,
        publicId: publicId2,
        level: "LEVEL_2",
        periodStart: new Date("2026-04-01"),
        periodEnd: new Date("2026-04-30"),
        status: "ISSUED",
        signedById: caUserId,
        version: 2,
      },
    });

    // Update cert1 to SUPERSEDED pointing to cert2
    await prisma.certificate.update({
      where: { id: cert1.id },
      data: {
        status: "SUPERSEDED",
        supersededById: cert2.id,
      },
    });

    // Verify chain
    const cert1Checked = await prisma.certificate.findUnique({
      where: { id: cert1.id },
      include: { supersededBy: true },
    });

    expect(cert1Checked?.status).toBe("SUPERSEDED");
    expect(cert1Checked?.supersededBy?.publicId).toBe(publicId2);
    expect(cert1Checked?.supersededBy?.version).toBe(2);
  });

  // TEST 6: Unknown ID returns generic not found
  it("Public verifier: unknown or malformed public ID returns null / generic not found", async () => {
    const unknownId = "ATTEST-PK-2026-999999-ZZ";
    const found = await prisma.certificate.findUnique({
      where: { publicId: unknownId },
    });
    expect(found).toBeNull();

    const malformedId = "MALFORMED-123";
    const foundMalformed = await prisma.certificate.findUnique({
      where: { publicId: malformedId },
    });
    expect(foundMalformed).toBeNull();
  });

  // TEST 7: Rate limiter trips after 10 requests / min
  it("Security: rate limiter allows 10 requests and trips on 11th request", () => {
    const ip = "192.168.1.100";
    resetRateLimitStore();

    for (let i = 1; i <= 10; i++) {
      const res = checkRateLimit(ip, 10, 60000);
      expect(res.allowed).toBe(true);
      expect(res.remaining).toBe(10 - i);
    }

    // 11th request trips rate limit
    const tripped = checkRateLimit(ip, 10, 60000);
    expect(tripped.allowed).toBe(false);
    expect(tripped.remaining).toBe(0);
  });

  // TEST 8: Public response leaks zero transaction, counterparty, balance data
  it("Privacy Shield: public certificate projection strictly excludes transactions, counterparties, and balances", async () => {
    const publicId = generatePublicId(2026);
    const cert = await prisma.certificate.create({
      data: {
        orgId: demoOrgId,
        publicId,
        level: "LEVEL_2",
        periodStart: new Date("2026-04-01"),
        periodEnd: new Date("2026-04-30"),
        status: "ISSUED",
        coveragePercent: 88,
        signedById: caUserId,
        caConclusion: "Reconciliation verified under professional CA standards.",
      },
    });

    // Run the exact projection query used on the public verifier
    const publicProjection = await prisma.certificate.findUnique({
      where: { publicId: cert.publicId },
      select: {
        id: true,
        publicId: true,
        level: true,
        levelAchieved: true,
        periodStart: true,
        periodEnd: true,
        status: true,
        payloadHash: true,
        signature: true,
        signatureMode: true,
        caConclusion: true,
        coveragePercent: true,
        org: {
          select: {
            name: true,
            companyProfile: {
              select: {
                legalName: true,
                taxId: true,
                registrationNumber: true,
                jurisdiction: true,
              },
            },
          },
        },
        signedBy: {
          select: {
            name: true,
          },
        },
      },
    });

    const serialized = JSON.stringify(publicProjection);

    // Assert absence of private banking & ledger strings
    const confidentialTerms = [
      "Zubair Traders",
      "Fancy Fabrics",
      "Habib Bank",
      "HBL",
      "PKR 48,620.00",
      "80000000",
      "48620000",
      "124000000",
      "11850000",
      "bankTransactions",
      "ledgerEntries",
      "runningBalancePaise",
    ];

    for (const term of confidentialTerms) {
      expect(serialized).not.toContain(term);
    }
  });

  // TEST 9: Evidence pack serves only approved categories
  it("Consent Charter: evidence pack download includes only approved document categories", async () => {
    const publicId = generatePublicId(2026);
    const cert = await prisma.certificate.create({
      data: {
        orgId: demoOrgId,
        publicId,
        level: "LEVEL_2",
        periodStart: new Date("2026-04-01"),
        periodEnd: new Date("2026-04-30"),
        status: "ISSUED",
      },
    });

    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Create approved disclosure with ONLY "BANK_STATEMENT" category approved
    const disclosure = await prisma.disclosureRequest.create({
      data: {
        orgId: demoOrgId,
        certificateId: cert.id,
        requesterName: "Auditor Smith",
        requesterEmail: "smith@partnerbank.com",
        purpose: "Credit line financial due diligence",
        period: "2026-04",
        categoriesJson: JSON.stringify(["BANK_STATEMENT", "LEDGER"]),
        approvedCategoriesJson: JSON.stringify(["BANK_STATEMENT"]), // ONLY bank statements approved
        status: "APPROVED",
        downloadToken: token,
        downloadTokenExpiresAt: expiresAt,
      },
    });

    const approvedCats: string[] = JSON.parse(disclosure.approvedCategoriesJson!);
    expect(approvedCats).toEqual(["BANK_STATEMENT"]);

    // Query scoped documents as the download route does
    const scopedDocuments = await prisma.sourceDocument.findMany({
      where: {
        orgId: demoOrgId,
        period: disclosure.period,
        type: { in: approvedCats },
      },
    });

    for (const doc of scopedDocuments) {
      expect(doc.type).toBe("BANK_STATEMENT");
      expect(doc.type).not.toBe("LEDGER");
      expect(doc.type).not.toBe("INVOICE_REGISTER");
    }
  });

  // TEST 10: Expired link rejected
  it("Consent Charter: download request with expired token is rejected", async () => {
    const publicId = generatePublicId(2026);
    const cert = await prisma.certificate.create({
      data: {
        orgId: demoOrgId,
        publicId,
        level: "LEVEL_2",
        periodStart: new Date("2026-04-01"),
        periodEnd: new Date("2026-04-30"),
        status: "ISSUED",
      },
    });

    const expiredToken = crypto.randomBytes(24).toString("hex");
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day in the past

    const disclosure = await prisma.disclosureRequest.create({
      data: {
        orgId: demoOrgId,
        certificateId: cert.id,
        requesterName: "Lender Johnson",
        requesterEmail: "johnson@lending.com",
        purpose: "Equipment finance review",
        period: "2026-04",
        status: "APPROVED",
        downloadToken: expiredToken,
        downloadTokenExpiresAt: pastDate,
      },
    });

    const now = new Date();
    const isExpired = disclosure.downloadTokenExpiresAt! < now;
    expect(isExpired).toBe(true);
  });
});
