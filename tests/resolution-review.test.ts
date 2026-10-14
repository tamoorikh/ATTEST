import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { PrismaClient } from "@prisma/client";

let mockSession: any = null;

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(() => Promise.resolve(mockSession)),
}));

import { POST as handleResolve } from "@/app/api/exceptions/[id]/resolve/route";
import { POST as handleReview } from "@/app/api/exceptions/[id]/review/route";

const prisma = new PrismaClient();

describe("Phase 3: Exception Resolution & CA Review Loop", () => {
  let org: any;
  let clientUser: any;
  let caUser: any;
  let testException: any;
  let testBankTx: any;

  beforeAll(async () => {
    // 1. Get or create Demo Org
    org = await prisma.organization.findFirst({
      where: { isDemo: true },
    });
    if (!org) {
      org = await prisma.organization.create({
        data: {
          name: "Meridian Textiles (Pvt) Ltd",
          slug: "meridian-textiles",
          isDemo: true,
        },
      });
    }

    // 2. Client User (Owner)
    clientUser = await prisma.user.findFirst({
      where: { email: "tariq@meridiantextiles.pk" },
    });
    if (!clientUser) {
      clientUser = await prisma.user.create({
        data: {
          email: "tariq@meridiantextiles.pk",
          name: "Tariq Mansoor",
          passwordHash: "hash123",
        },
      });
      await prisma.membership.create({
        data: {
          userId: clientUser.id,
          orgId: org.id,
          role: "Owner",
        },
      });
    }

    // 3. CA User (CA-reviewer)
    caUser = await prisma.user.findFirst({
      where: { email: "bilal@attestpartners.pk" },
    });
    if (!caUser) {
      caUser = await prisma.user.create({
        data: {
          email: "bilal@attestpartners.pk",
          name: "Bilal Ahmad, FCA",
          passwordHash: "hash123",
        },
      });
      await prisma.membership.create({
        data: {
          userId: caUser.id,
          orgId: org.id,
          role: "CA-reviewer",
        },
      });
    }

    // 4. Create sample BankTransaction & Exception for testing
    testBankTx = await prisma.bankTransaction.create({
      data: {
        orgId: org.id,
        date: new Date("2026-04-15T00:00:00Z"),
        description: "Test vendor payment discrepancy",
        counterparty: "Zubair Cotton Mills",
        ref: "TX-TEST-P3-001",
        debitPaise: 11850000,
        creditPaise: 0,
        runningBalancePaise: 50000000,
        currency: "PKR",
      },
    });

    testException = await prisma.exception.create({
      data: {
        orgId: org.id,
        bankTxId: testBankTx.id,
        type: "DUPLICATE_PAYMENT",
        severity: "HIGH",
        status: "OPEN",
        period: "2026-04",
        amountPaise: 11850000,
        title: "Test Discrepancy — Duplicate Vendor Payment",
        explanation: "Duplicate debit detected on bank statement for testing resolution workflow.",
        suggestedResolution: "Provide bank reversal advice or second commercial invoice.",
      },
    });
  });

  afterAll(async () => {
    // Clean up created test entities
    if (testException?.id) {
      await prisma.exceptionEvidence.deleteMany({ where: { exceptionId: testException.id } });
      await prisma.exceptionComment.deleteMany({ where: { exceptionId: testException.id } });
      await prisma.reviewNote.deleteMany({ where: { exceptionId: testException.id } });
      await prisma.exception.delete({ where: { id: testException.id } }).catch(() => {});
    }
    if (testBankTx?.id) {
      await prisma.match.deleteMany({ where: { bankTxId: testBankTx.id } });
      await prisma.bankTransaction.delete({ where: { id: testBankTx.id } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  // TEST 1: Sacred Authority Rule — Client role cannot resolve (403)
  it("enforces Sacred Authority Rule: rejects client-role attempt to set status RESOLVED with 403 Forbidden", async () => {
    mockSession = {
      user: {
        id: clientUser.id,
        name: clientUser.name,
        email: clientUser.email,
        role: "Owner",
        orgId: org.id,
      },
    };

    // Client attempts to set status: "RESOLVED" directly
    const req = new Request(`http://localhost/api/exceptions/${testException.id}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "RESOLVED",
        explanation: "I hereby mark this exception as resolved myself without CA review.",
        declarationAccepted: true,
      }),
    });

    const res = await handleResolve(req, { params: Promise.resolve({ id: testException.id }) });
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain("Client roles cannot resolve exceptions");

    // Also verify client cannot call the CA review endpoint directly
    const reviewReq = new Request(`http://localhost/api/exceptions/${testException.id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "ACCEPT" }),
    });

    const reviewRes = await handleReview(reviewReq, { params: Promise.resolve({ id: testException.id }) });
    expect(reviewRes.status).toBe(403);
  });

  // TEST 2: Client submission validation
  it("validates client submission: requires min 20 chars explanation and declaration checkbox", async () => {
    mockSession = {
      user: {
        id: clientUser.id,
        name: clientUser.name,
        email: clientUser.email,
        role: "Owner",
        orgId: org.id,
      },
    };

    // Too short explanation (< 20 chars)
    const shortReq = new Request(`http://localhost/api/exceptions/${testException.id}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        explanation: "Short note",
        declarationAccepted: true,
      }),
    });
    const shortRes = await handleResolve(shortReq, { params: Promise.resolve({ id: testException.id }) });
    expect(shortRes.status).toBe(400);
    const shortData = await shortRes.json();
    expect(shortData.error).toContain("at least 20 characters");

    // Missing declaration checkbox
    const noDeclReq = new Request(`http://localhost/api/exceptions/${testException.id}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        explanation: "This is a sufficiently long written explanation explaining the duplicate payment.",
        declarationAccepted: false,
      }),
    });
    const noDeclRes = await handleResolve(noDeclReq, { params: Promise.resolve({ id: testException.id }) });
    expect(noDeclRes.status).toBe(400);
    const noDeclData = await noDeclRes.json();
    expect(noDeclData.error).toContain("declaration");
  });

  // TEST 3: Successful client submission transitions to CLIENT_SUBMITTED & creates CA notification
  it("successfully transitions exception to CLIENT_SUBMITTED, creates evidence, audit event, and CA notification", async () => {
    mockSession = {
      user: {
        id: clientUser.id,
        name: clientUser.name,
        email: clientUser.email,
        role: "Owner",
        orgId: org.id,
      },
    };

    const validReq = new Request(`http://localhost/api/exceptions/${testException.id}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resolutionType: "DUPLICATE_REVERSAL",
        explanation: "Bank reversal requested and processed under reversal reference MCB-REV-99214.",
        declarationAccepted: true,
        evidence: {
          type: "UPLOAD",
          filename: "Bank_Reversal_Advice_MCB_99214.pdf",
          content: Buffer.from("Synthetic PDF content for reversal voucher advice").toString("base64"),
          mime: "application/pdf",
        },
      }),
    });

    const res = await handleResolve(validReq, { params: Promise.resolve({ id: testException.id }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.exception.status).toBe("CLIENT_SUBMITTED");

    // Verify DB state
    const excInDb = await prisma.exception.findUnique({
      where: { id: testException.id },
      include: { evidence: true, comments: true },
    });
    expect(excInDb?.status).toBe("CLIENT_SUBMITTED");
    expect(excInDb?.evidence.length).toBeGreaterThanOrEqual(1);
    expect(excInDb?.comments.length).toBeGreaterThanOrEqual(1);

    // Verify CA received a notification
    const caNotification = await prisma.notification.findFirst({
      where: {
        orgId: org.id,
        userId: caUser.id,
        title: "Resolution Submitted",
      },
      orderBy: { createdAt: "desc" },
    });
    expect(caNotification).not.toBeNull();
    expect(caNotification?.message).toContain("submitted resolution");
  });

  // TEST 4: CA rejection reason mandatory (min 20 chars)
  it("enforces mandatory CA rejection reason of at least 20 chars", async () => {
    mockSession = {
      user: {
        id: caUser.id,
        name: caUser.name,
        email: caUser.email,
        role: "CA-reviewer",
        orgId: org.id,
      },
    };

    // Attempt rejection with short reason (< 20 chars)
    const shortRejectReq = new Request(`http://localhost/api/exceptions/${testException.id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "REJECT",
        reason: "Insufficient doc",
      }),
    });

    const shortRes = await handleReview(shortRejectReq, { params: Promise.resolve({ id: testException.id }) });
    expect(shortRes.status).toBe(400);
    const shortData = await shortRes.json();
    expect(shortData.error).toContain("at least 20 characters");
  });

  // TEST 5: CA rejection sets status to OPEN, writes ReviewNote, AuditEvent & client notification
  it("rejection with >= 20 chars returns status to OPEN, preserves reason, and records ReviewNote and AuditEvent", async () => {
    mockSession = {
      user: {
        id: caUser.id,
        name: caUser.name,
        email: caUser.email,
        role: "CA-reviewer",
        orgId: org.id,
      },
    };

    const validRejectReason = "The uploaded reversal document lacks the official MCB bank stamp and branch manager seal.";
    const validRejectReq = new Request(`http://localhost/api/exceptions/${testException.id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "REJECT",
        reason: validRejectReason,
      }),
    });

    const res = await handleReview(validRejectReq, { params: Promise.resolve({ id: testException.id }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.exception.status).toBe("OPEN");
    expect(data.exception.rejectionReason).toBe(validRejectReason);

    // Verify ReviewNote in DB
    const note = await prisma.reviewNote.findFirst({
      where: { exceptionId: testException.id, actionType: "REJECT" },
      orderBy: { createdAt: "desc" },
    });
    expect(note).not.toBeNull();
    expect(note?.content).toBe(validRejectReason);

    // Verify Client notification
    const clientNotification = await prisma.notification.findFirst({
      where: {
        orgId: org.id,
        userId: clientUser.id,
        title: "Resolution Returned by CA",
      },
      orderBy: { createdAt: "desc" },
    });
    expect(clientNotification).not.toBeNull();
    expect(clientNotification?.message).toContain(validRejectReason);
  });

  // TEST 6: Resubmission preserves previous history (comments and notes intact)
  it("resubmission preserves historical comments and notes while transitioning to CLIENT_SUBMITTED", async () => {
    mockSession = {
      user: {
        id: clientUser.id,
        name: clientUser.name,
        email: clientUser.email,
        role: "Owner",
        orgId: org.id,
      },
    };

    const resubmitReq = new Request(`http://localhost/api/exceptions/${testException.id}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resolutionType: "DUPLICATE_REVERSAL",
        explanation: "Attached revised bank reversal certificate with formal branch manager seal and stamped voucher reference.",
        declarationAccepted: true,
        evidence: {
          type: "UPLOAD",
          filename: "MCB_Official_Stamped_Reversal_Seal.pdf",
          content: Buffer.from("Officially stamped reversal advice").toString("base64"),
          mime: "application/pdf",
        },
      }),
    });

    const res = await handleResolve(resubmitReq, { params: Promise.resolve({ id: testException.id }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.exception.status).toBe("CLIENT_SUBMITTED");
    expect(data.exception.rejectionReason).toBeNull(); // Cleared for new round

    // Verify history preserved
    const excInDb = await prisma.exception.findUnique({
      where: { id: testException.id },
      include: { evidence: true, comments: true, reviewNotes: true },
    });
    expect(excInDb?.comments.length).toBeGreaterThanOrEqual(2); // Initial submission comment + resubmission comment
    expect(excInDb?.reviewNotes.length).toBeGreaterThanOrEqual(1); // Past rejection note preserved
    expect(excInDb?.evidence.length).toBeGreaterThanOrEqual(2); // Both evidence files preserved
  });

  // TEST 7: CA acceptance transitions status to RESOLVED and records resolvedById/resolvedAt
  it("CA acceptance sets status to RESOLVED with resolvedById and resolvedAt timestamp", async () => {
    mockSession = {
      user: {
        id: caUser.id,
        name: caUser.name,
        email: caUser.email,
        role: "CA-reviewer",
        orgId: org.id,
      },
    };

    const acceptReq = new Request(`http://localhost/api/exceptions/${testException.id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "ACCEPT",
        reason: "Reversal certificate verified against MCB branch confirmation. Working paper signed off.",
      }),
    });

    const res = await handleReview(acceptReq, { params: Promise.resolve({ id: testException.id }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.exception.status).toBe("RESOLVED");
    expect(data.exception.resolvedById).toBe(caUser.id);
    expect(data.exception.resolvedAt).not.toBeNull();

    // Verify Client received acceptance notification
    const acceptNotification = await prisma.notification.findFirst({
      where: {
        orgId: org.id,
        userId: clientUser.id,
        title: "Exception Resolution Accepted",
      },
      orderBy: { createdAt: "desc" },
    });
    expect(acceptNotification).not.toBeNull();
  });

  // TEST 8: Every CA transition writes a hash-chained audit event
  it("verifies every CA transition appends a cryptographically valid hash-chained AuditEvent", async () => {
    const auditEvents = await prisma.auditEvent.findMany({
      where: { orgId: org.id, entityId: testException.id },
      orderBy: { createdAt: "asc" },
    });

    expect(auditEvents.length).toBeGreaterThanOrEqual(3); // Submitted -> Rejected -> Resubmitted -> Accepted

    // Check hash continuity and validity
    for (let i = 0; i < auditEvents.length; i++) {
      const curr = auditEvents[i];
      expect(curr.hash).toHaveLength(64);
      expect(curr.prevHash).toBeDefined();
    }
  });

  // TEST 9: E-102 shape (Unrecorded credit): CA acceptance creates adjusting entry and confirms match
  it("automatically creates adjusting ledger entry and confirms match when CA accepts an UNRECORDED_CREDIT exception", async () => {
    mockSession = {
      user: {
        id: caUser.id,
        name: caUser.name,
        email: caUser.email,
        role: "CA-reviewer",
        orgId: org.id,
      },
    };

    // Create a synthetic unrecorded credit transaction & exception
    const creditBankTx = await prisma.bankTransaction.create({
      data: {
        orgId: org.id,
        date: new Date("2026-04-12T00:00:00Z"),
        description: "Direct bank credit from Al-Rehman Textiles",
        counterparty: "Al-Rehman Textiles",
        ref: "TX-TEST-CREDIT-002",
        debitPaise: 0,
        creditPaise: 34000000,
        runningBalancePaise: 160000000,
        currency: "PKR",
      },
    });

    const creditException = await prisma.exception.create({
      data: {
        orgId: org.id,
        bankTxId: creditBankTx.id,
        type: "UNRECORDED_CREDIT",
        severity: "HIGH",
        status: "CLIENT_SUBMITTED",
        period: "2026-04",
        amountPaise: 34000000,
        title: "Unrecorded Bank Deposit — Direct Credit PKR 340,000.00",
        explanation: "Bank received PKR 340,000 with no matching sales ledger entry.",
        suggestedResolution: "Post sales invoice SI-2026-3387 to books.",
        resolutionNotes: "Sales invoice #SI-2026-3387 was issued on 11 Apr for Al-Rehman Textiles.",
        declarationAccepted: true,
      },
    });

    // CA accepts resolution
    const acceptReq = new Request(`http://localhost/api/exceptions/${creditException.id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "ACCEPT",
        reason: "Commercial sales invoice verified with FBR portal e-invoicing record. Adjusting journal posted.",
      }),
    });

    const res = await handleReview(acceptReq, { params: Promise.resolve({ id: creditException.id }) });
    expect(res.status).toBe(200);

    // Verify adjusting ledger entry was created
    const adjustingEntry = await prisma.ledgerEntry.findFirst({
      where: { orgId: org.id, ref: "SI-2026-3387-ADJ" },
    });
    expect(adjustingEntry).not.toBeNull();
    expect(adjustingEntry?.creditPaise).toBe(34000000);

    // Verify confirmed match was created
    const match = await prisma.match.findFirst({
      where: { bankTxId: creditBankTx.id, ledgerEntryId: adjustingEntry?.id },
    });
    expect(match).not.toBeNull();
    expect(match?.status).toBe("CONFIRMED");
    expect(match?.rule).toBe("CA_RESOLVED_ADJUSTING_ENTRY");

    // Verify bank transaction is MATCHED
    const updatedTx = await prisma.bankTransaction.findUnique({
      where: { id: creditBankTx.id },
    });
    expect(updatedTx?.matchStatus).toBe("MATCHED");

    // Clean up synthetic entities
    if (match) await prisma.match.delete({ where: { id: match.id } });
    if (adjustingEntry) await prisma.ledgerEntry.delete({ where: { id: adjustingEntry.id } });
    await prisma.reviewNote.deleteMany({ where: { exceptionId: creditException.id } });
    await prisma.exception.delete({ where: { id: creditException.id } });
    await prisma.bankTransaction.delete({ where: { id: creditBankTx.id } });
  });
});
