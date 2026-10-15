import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

async function smokeAuth() {
  console.log("================================================================================");
  console.log("               ATTEST — AUTHENTICATION & DATABASE SMOKE TEST                    ");
  console.log("================================================================================\n");

  const prisma = new PrismaClient();
  const testId = Date.now();
  const testEmail = `smoke_test_${testId}@attest.pk`;
  const testPassword = "SmokeTestPassword2026!";
  const testName = `Smoke Test User ${testId}`;
  const testOrgName = `Smoke Test Org ${testId}`;
  const testOrgSlug = `smoke-test-org-${testId}`;

  try {
    // 1. Check database connectivity
    console.log("[1/5] Checking database connection...");
    const initialUsersCount = await prisma.user.count();
    console.log(`      ✓ Connected to database. Current total users: ${initialUsersCount}`);

    // 2. Hash password and create User
    console.log(`[2/5] Creating test user "${testEmail}"...`);
    const passwordHash = await bcrypt.hash(testPassword, 10);
    const createdUser = await prisma.user.create({
      data: {
        email: testEmail,
        name: testName,
        passwordHash,
      },
    });
    console.log(`      ✓ User created successfully with ID: ${createdUser.id}`);
    console.log(`      ✓ Password hashed with bcrypt (length: ${passwordHash.length})`);

    // 3. Confirm row exists in database via Prisma
    console.log("[3/5] Confirming database row persistence via Prisma findUnique...");
    const verifiedUser = await prisma.user.findUnique({
      where: { email: testEmail },
    });

    if (!verifiedUser) {
      throw new Error(`FATAL: User ${testEmail} was not found in the database after insert!`);
    }
    console.log(`      ✓ User row confirmed in DB!`);
    console.log(`        - ID:        ${verifiedUser.id}`);
    console.log(`        - Email:     ${verifiedUser.email}`);
    console.log(`        - Name:      ${verifiedUser.name}`);
    console.log(`        - CreatedAt: ${verifiedUser.createdAt.toISOString()}`);

    // 4. Test Organization & Membership onboarding persistence
    console.log(`[4/5] Testing Organization & Membership creation (Client Onboarding flow)...`);
    const createdOrg = await prisma.organization.create({
      data: {
        name: testOrgName,
        slug: testOrgSlug,
        isDemo: false,
      },
    });
    console.log(`      ✓ Organization row created: "${createdOrg.name}" (ID: ${createdOrg.id})`);

    const createdMembership = await prisma.membership.create({
      data: {
        userId: createdUser.id,
        orgId: createdOrg.id,
        role: "Owner",
      },
    });
    console.log(`      ✓ Membership linked: User ${createdUser.id} -> Org ${createdOrg.id} as role "${createdMembership.role}"`);

    // 5. Clean teardown
    console.log("[5/5] Cleaning up test records (teardown)...");
    await prisma.membership.delete({ where: { id: createdMembership.id } });
    await prisma.organization.delete({ where: { id: createdOrg.id } });
    await prisma.user.delete({ where: { id: createdUser.id } });

    const postDeleteCheck = await prisma.user.findUnique({
      where: { email: testEmail },
    });

    if (postDeleteCheck) {
      throw new Error(`Teardown failed: User ${testEmail} still exists in the database.`);
    }
    console.log("      ✓ Teardown verified: Test user, organization, and membership cleanly purged.");

    console.log("\n================================================================================");
    console.log("✅ SMOKE TEST PASSED: Registration, DB persistence, and cleanup 100% verified.");
    console.log("================================================================================");
    process.exit(0);
  } catch (err: any) {
    console.error("\n❌ SMOKE TEST FAILED:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

smokeAuth();
