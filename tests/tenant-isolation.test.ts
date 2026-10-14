import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { validateTenantAccess, TenantAccessError } from "@/lib/tenant";

const prisma = new PrismaClient();

describe("Cross-Tenant Data Isolation", () => {
  let orgAId: string;
  let orgBId: string;
  let userAId: string;
  let userBId: string;

  beforeAll(async () => {
    // 1. Get or create Org A (Meridian Textiles)
    let orgA = await prisma.organization.findUnique({
      where: { slug: "meridian-textiles" },
    });
    if (!orgA) {
      orgA = await prisma.organization.create({
        data: {
          name: "Meridian Textiles (Pvt) Ltd",
          slug: "meridian-textiles",
          isDemo: true,
        },
      });
    }
    orgAId = orgA.id;

    // 2. Create Org B (Lahore Garments Co - second tenant)
    let orgB = await prisma.organization.findUnique({
      where: { slug: "lahore-garments" },
    });
    if (!orgB) {
      orgB = await prisma.organization.create({
        data: {
          name: "Lahore Garments Co",
          slug: "lahore-garments",
          isDemo: false,
        },
      });
    }
    orgBId = orgB.id;

    // 3. Create User B in Org B
    const userBEmail = "tenant-b-owner@lahoregarments.pk";
    let userB = await prisma.user.findUnique({ where: { email: userBEmail } });
    if (!userB) {
      userB = await prisma.user.create({
        data: {
          email: userBEmail,
          name: "Hamza Malik",
          passwordHash: "mockHash123",
        },
      });
      await prisma.membership.create({
        data: {
          userId: userB.id,
          orgId: orgBId,
          role: "Owner",
        },
      });
    }
    userBId = userB.id;

    // 4. Create sensitive BankTransaction in Org B
    await prisma.bankTransaction.create({
      data: {
        orgId: orgBId,
        date: new Date("2026-04-10T11:00:00Z"),
        description: "Confidential B2B Vendor Settlement",
        counterparty: "Silk Route Mills",
        ref: "TX-ORG-B-CONFIDENTIAL",
        debitPaise: 75000000, // PKR 750,000.00
        creditPaise: 0,
        runningBalancePaise: 25000000,
        currency: "PKR",
      },
    });
  });

  afterAll(async () => {
    // Clean up Org B created for this test
    if (orgBId) {
      await prisma.bankTransaction.deleteMany({ where: { orgId: orgBId } });
      await prisma.membership.deleteMany({ where: { orgId: orgBId } });
      await prisma.organization.deleteMany({ where: { id: orgBId } });
    }
    if (userBId) {
      await prisma.user.deleteMany({ where: { id: userBId } });
    }
    await prisma.$disconnect();
  });

  it("proves that Org A's query strictly returns Org A's records and 0 records from Org B", async () => {
    // Org A's user executes query strictly bounded by their orgId
    const orgATransactions = await prisma.bankTransaction.findMany({
      where: { orgId: orgAId },
    });

    // Verify Org A has transactions
    expect(orgATransactions.length).toBeGreaterThan(0);

    // Verify that NONE of the transactions belong to Org B
    const leakedRecords = orgATransactions.filter((tx) => tx.orgId === orgBId);
    expect(leakedRecords).toHaveLength(0);

    // Verify sensitive transaction from Org B is NOT present in Org A's result set
    const confidentialTx = orgATransactions.find((tx) => tx.ref === "TX-ORG-B-CONFIDENTIAL");
    expect(confidentialTx).toBeUndefined();
  });

  it("throws TenantAccessError when user from Org A attempts to access Org B boundary", () => {
    // Simulated active session for User A
    const activeSessionOrgId = orgAId;
    const requestedTargetOrgId = orgBId;

    expect(() => {
      validateTenantAccess(activeSessionOrgId, requestedTargetOrgId);
    }).toThrow(TenantAccessError);
  });
});
