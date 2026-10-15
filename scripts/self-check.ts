import { PrismaClient } from "@prisma/client";
import { storage } from "../src/lib/storage";

interface CheckItem {
  name: string;
  category: "ENV" | "DATABASE" | "STORAGE" | "HYGIENE";
  status: "PASS" | "WARN" | "FAIL";
  details: string;
}

async function runSelfCheck() {
  console.log("================================================================================");
  console.log("             ATTEST PLATFORM — PRE-LAUNCH DEPLOYMENT SELF-CHECK                 ");
  console.log("================================================================================\n");

  const results: CheckItem[] = [];
  const prisma = new PrismaClient();

  // 1. Environment Variables Validation
  const dbUrl = process.env.DATABASE_URL || "";
  if (!dbUrl) {
    results.push({
      name: "DATABASE_URL",
      category: "ENV",
      status: "FAIL",
      details: "DATABASE_URL environment variable is missing.",
    });
  } else if (dbUrl.startsWith("file:")) {
    results.push({
      name: "DATABASE_URL",
      category: "ENV",
      status: process.env.DEMO_MODE === "true" ? "PASS" : "WARN",
      details: `SQLite URL detected (${dbUrl}). Suitable for local dev/demo; production requires Supabase PostgreSQL.`,
    });
  } else if (dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://")) {
    const isPooled = dbUrl.includes(":6543");
    results.push({
      name: "DATABASE_URL",
      category: "ENV",
      status: "PASS",
      details: `PostgreSQL connection configured (${isPooled ? "Transaction Pooled :6543" : "Direct :5432"}).`,
    });
  } else {
    results.push({
      name: "DATABASE_URL",
      category: "ENV",
      status: "PASS",
      details: "Custom database URL configured.",
    });
  }

  const authSecret = process.env.NEXTAUTH_SECRET || "";
  if (!authSecret) {
    results.push({
      name: "NEXTAUTH_SECRET",
      category: "ENV",
      status: "FAIL",
      details: "NEXTAUTH_SECRET is missing. Authentication tokens cannot be signed.",
    });
  } else if (authSecret.length < 32) {
    results.push({
      name: "NEXTAUTH_SECRET",
      category: "ENV",
      status: "WARN",
      details: `NEXTAUTH_SECRET is ${authSecret.length} chars. Minimum 32 characters recommended for production.`,
    });
  } else {
    results.push({
      name: "NEXTAUTH_SECRET",
      category: "ENV",
      status: "PASS",
      details: `Secure secret configured (${authSecret.length} chars).`,
    });
  }

  const authUrl = process.env.NEXTAUTH_URL || "";
  if (!authUrl) {
    results.push({
      name: "NEXTAUTH_URL",
      category: "ENV",
      status: "WARN",
      details: "NEXTAUTH_URL is unset; NextAuth will attempt auto-detection from Host header.",
    });
  } else {
    results.push({
      name: "NEXTAUTH_URL",
      category: "ENV",
      status: "PASS",
      details: `Canonical auth URL: ${authUrl}`,
    });
  }

  const demoMode = process.env.DEMO_MODE;
  if (demoMode === undefined) {
    results.push({
      name: "DEMO_MODE",
      category: "ENV",
      status: "WARN",
      details: "DEMO_MODE is not set. Defaults to disabled in production.",
    });
  } else {
    results.push({
      name: "DEMO_MODE",
      category: "ENV",
      status: "PASS",
      details: `Explicitly set to "${demoMode}".`,
    });
  }

  const seedGuard = process.env.SEED_DEMO_DATA;
  if (demoMode === "false" && seedGuard === "true") {
    results.push({
      name: "SEED_DEMO_DATA Guard",
      category: "ENV",
      status: "FAIL",
      details: "CRITICAL: SEED_DEMO_DATA=true while DEMO_MODE=false. Production must NEVER seed demo data!",
    });
  } else {
    results.push({
      name: "SEED_DEMO_DATA Guard",
      category: "ENV",
      status: "PASS",
      details: `Configured as "${seedGuard ?? "false"}" (Accidental production seeding prevented).`,
    });
  }

  // 2. Database Connectivity
  const startDb = Date.now();
  try {
    const userCount = await prisma.user.count();
    const orgCount = await prisma.organization.count();
    const demoOrgCount = await prisma.organization.count({ where: { isDemo: true } });
    const elapsed = Date.now() - startDb;

    results.push({
      name: "Database Connectivity",
      category: "DATABASE",
      status: "PASS",
      details: `Connected successfully (${elapsed}ms). Total Users: ${userCount}, Total Organizations: ${orgCount}.`,
    });

    if (process.env.DEMO_MODE === "false" && demoOrgCount > 0) {
      results.push({
        name: "Production Cleanliness",
        category: "HYGIENE",
        status: "WARN",
        details: `Found ${demoOrgCount} demo organization(s) in a DEMO_MODE=false environment. Wipe before go-live.`,
      });
    } else if (demoOrgCount === 0) {
      results.push({
        name: "Production Cleanliness",
        category: "HYGIENE",
        status: "PASS",
        details: "Clean database confirmed: 0 demo organizations present.",
      });
    } else {
      results.push({
        name: "Demo Data Presence",
        category: "HYGIENE",
        status: "PASS",
        details: `Staging/Demo data present (${demoOrgCount} demo organization(s)).`,
      });
    }
  } catch (dbErr: any) {
    results.push({
      name: "Database Connectivity",
      category: "DATABASE",
      status: "FAIL",
      details: `Failed to reach database: ${dbErr.message}`,
    });
  } finally {
    await prisma.$disconnect();
  }

  // 3. Storage Health
  try {
    const storageHealth = await storage.checkHealth();
    results.push({
      name: `Storage (${storageHealth.provider})`,
      category: "STORAGE",
      status: storageHealth.status === "ok" ? "PASS" : "FAIL",
      details: storageHealth.message,
    });
  } catch (storageErr: any) {
    results.push({
      name: "Storage Service",
      category: "STORAGE",
      status: "FAIL",
      details: `Storage check failed: ${storageErr.message}`,
    });
  }

  // Print Formatted Report
  let hasFailures = false;
  let hasWarnings = false;

  for (const item of results) {
    const icon = item.status === "PASS" ? "✅" : item.status === "WARN" ? "⚠️ " : "❌";
    console.log(`${icon} [${item.category}] ${item.name.padEnd(25)} : ${item.details}`);
    if (item.status === "FAIL") hasFailures = true;
    if (item.status === "WARN") hasWarnings = true;
  }

  console.log("\n================================================================================");
  if (hasFailures) {
    console.log("❌ VERDICT: PRE-LAUNCH CHECK FAILED. Resolve blocking items before deployment.");
    console.log("================================================================================");
    process.exit(1);
  } else if (hasWarnings) {
    console.log("⚠️  VERDICT: PRE-LAUNCH CHECK PASSED WITH ADVISORIES. Review warnings above.");
    console.log("================================================================================");
    process.exit(0);
  } else {
    console.log("✅ VERDICT: PRE-LAUNCH CHECK 100% GREEN. System is ready for deployment.");
    console.log("================================================================================");
    process.exit(0);
  }
}

runSelfCheck().catch((err) => {
  console.error("Self-check execution error:", err);
  process.exit(1);
});
