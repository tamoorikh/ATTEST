import { chromium } from "playwright-core";
import path from "path";
import { PrismaClient } from "@prisma/client";

const ARTIFACTS_DIR = "C:\\Users\\tamoo\\.gemini\\antigravity-ide\\brain\\7458f717-aa82-4fb1-905c-a144d2d2102e";
const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const BASE_URL = "http://localhost:3001";

const prisma = new PrismaClient();

async function main() {
  console.log("=== STARTING PHASE 4 E2E CAPTURE & VERIFICATION ===");

  const org = await prisma.organization.findFirst({
    where: { isDemo: true },
  });
  if (!org) throw new Error("Demo org not found");

  const caUser = await prisma.user.findFirst({
    where: { email: "ca@attest.pk" },
  });
  if (!caUser) throw new Error("CA user not found");

  const browser = await chromium.launch({
    executablePath: EDGE_PATH,
    headless: true,
  });

  try {
    // -------------------------------------------------------------------------
    // STEP 1: BLOCKED SIGN-OFF GATE SCREEN
    // -------------------------------------------------------------------------
    console.log("\n[1/7] Setting up open HIGH exception and capturing blocked gates...");
    let openHighEx = await prisma.exception.findFirst({
      where: {
        orgId: org.id,
        period: "2026-04",
        severity: "HIGH",
        status: "OPEN",
      },
    });

    if (!openHighEx) {
      openHighEx = await prisma.exception.create({
        data: {
          orgId: org.id,
          period: "2026-04",
          type: "DUPLICATE_PAYMENT",
          title: "Duplicate Payment to Zubair Traders",
          explanation: "Duplicate bank payment without second tax invoice.",
          severity: "HIGH",
          status: "OPEN",
          amountPaise: 11850000,
        },
      });
    }

    // CA logs in
    const caContext = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const caPage = await caContext.newPage();

    await caPage.goto(`${BASE_URL}/auth/signin`);
    await caPage.waitForLoadState("networkidle");
    await caPage.fill('input[type="email"]', "ca@attest.pk");
    await caPage.fill('input[type="password"]', "Demo1234!");
    await Promise.all([
      caPage.waitForResponse((res) => res.url().includes("/api/auth/callback/credentials")),
      caPage.click("button[type='submit']"),
    ]);
    await caPage.waitForTimeout(1000);

    // Navigate to CA Sign-Off Chamber
    await caPage.goto(`${BASE_URL}/ca/sign-off`);
    await caPage.waitForLoadState("networkidle");
    await caPage.waitForSelector("#gatesList");
    await caPage.waitForTimeout(1500);

    const shot1 = path.join(ARTIFACTS_DIR, "01_p4_blocked_signoff_gates.png");
    await caPage.screenshot({ path: shot1, fullPage: true });
    console.log(`Saved screenshot 1: ${shot1}`);

    // -------------------------------------------------------------------------
    // STEP 2: RESOLVE EXCEPTION & CAPTURE CONFIRMATION MODAL
    // -------------------------------------------------------------------------
    console.log("\n[2/7] Resolving open exceptions and capturing deliberate confirmation modal...");
    await prisma.exception.updateMany({
      where: {
        orgId: org.id,
        period: "2026-04",
        severity: { in: ["HIGH", "CRITICAL"] },
      },
      data: {
        status: "RESOLVED",
        resolutionType: "DUPLICATE_REVERSAL",
        resolutionNotes: "Supplier provided credit note CN-2026-089 confirming full refund.",
        resolvedById: caUser.id,
        resolvedAt: new Date(),
      },
    });

    // Reload sign-off page
    await caPage.reload();
    await caPage.waitForLoadState("networkidle");
    await caPage.waitForSelector("#btnOpenSignModal");
    await caPage.waitForTimeout(1000);

    // Click to open confirmation modal
    await caPage.click("#btnOpenSignModal");
    await caPage.waitForSelector("#btnConfirmIssuance");
    await caPage.waitForTimeout(1000);

    const shot2 = path.join(ARTIFACTS_DIR, "02_p4_confirmation_modal.png");
    await caPage.screenshot({ path: shot2, fullPage: true });
    console.log(`Saved screenshot 2: ${shot2}`);

    // -------------------------------------------------------------------------
    // STEP 3: CONFIRM & SIGN CERTIFICATE, THEN CAPTURE PRINT VIEW IN CLIENT PORTAL
    // -------------------------------------------------------------------------
    console.log("\n[3/7] Signing certificate and capturing print view...");
    await caPage.click("#chkConfirmScope");
    await caPage.waitForTimeout(300);
    await caPage.click("#btnConfirmIssuance");

    // Wait for success message
    await caPage.waitForSelector("text=successfully signed and issued", { timeout: 15000 });
    await caPage.waitForTimeout(1000);

    // Retrieve the newly issued certificate
    const issuedCert = await prisma.certificate.findFirst({
      where: { orgId: org.id, status: "ISSUED" },
      orderBy: { createdAt: "desc" },
    });
    if (!issuedCert) throw new Error("Issued certificate not found in DB");
    console.log(`Issued Certificate ID: ${issuedCert.publicId}`);

    // Client context signs in to view client portal certificate print view
    const clientContext = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const clientPage = await clientContext.newPage();

    await clientPage.goto(`${BASE_URL}/auth/signin`);
    await clientPage.waitForLoadState("networkidle");
    await clientPage.fill('input[type="email"]', "demo@attest.pk");
    await clientPage.fill('input[type="password"]', "Demo1234!");
    await Promise.all([
      clientPage.waitForResponse((res) => res.url().includes("/api/auth/callback/credentials")),
      clientPage.click("button[type='submit']"),
    ]);
    await clientPage.waitForTimeout(1000);

    // Navigate to Print View
    await clientPage.goto(`${BASE_URL}/portal/certificate/print`);
    await clientPage.waitForLoadState("networkidle");
    await clientPage.waitForSelector("#printDocument");
    await clientPage.waitForTimeout(1500);

    const shot3 = path.join(ARTIFACTS_DIR, "03_p4_certificate_print_view.png");
    await clientPage.screenshot({ path: shot3, fullPage: true });
    console.log(`Saved screenshot 3: ${shot3}`);

    // -------------------------------------------------------------------------
    // STEP 4: PUBLIC VERIFY PAGE FOR A VALID CERT
    // -------------------------------------------------------------------------
    console.log("\n[4/7] Capturing public verify page for VALID cert...");
    await caPage.goto(`${BASE_URL}/verify/${issuedCert.publicId}`);
    await caPage.waitForLoadState("networkidle");
    await caPage.waitForSelector("#verificationStatusBadge");
    await caPage.waitForTimeout(1000);

    const shot4 = path.join(ARTIFACTS_DIR, "04_p4_public_verify_valid.png");
    await caPage.screenshot({ path: shot4, fullPage: true });
    console.log(`Saved screenshot 4: ${shot4}`);

    // -------------------------------------------------------------------------
    // STEP 5: REVOKE CERTIFICATE & CAPTURE PUBLIC VERIFY PAGE
    // -------------------------------------------------------------------------
    console.log("\n[5/7] Revoking certificate and capturing public verify page for REVOKED cert...");
    const revocationReason =
      "Revoked under CA professional judgment due to post-closing client documentation revision.";
    await prisma.certificate.update({
      where: { id: issuedCert.id },
      data: {
        status: "REVOKED",
        revokedAt: new Date(),
        revocationReason,
        revokedById: caUser.id,
      },
    });

    await caPage.goto(`${BASE_URL}/verify/${issuedCert.publicId}`);
    await caPage.waitForLoadState("networkidle");
    await caPage.waitForSelector("#verificationStatusBadge");
    await caPage.waitForTimeout(1000);

    const shot5 = path.join(ARTIFACTS_DIR, "05_p4_public_verify_revoked.png");
    await caPage.screenshot({ path: shot5, fullPage: true });
    console.log(`Saved screenshot 5: ${shot5}`);

    // -------------------------------------------------------------------------
    // STEP 6: PUBLIC VERIFY PAGE FOR NOT FOUND CERT
    // -------------------------------------------------------------------------
    console.log("\n[6/7] Capturing public verify page for NOT FOUND cert...");
    await caPage.goto(`${BASE_URL}/verify/ATTEST-PK-2026-999999-00`);
    await caPage.waitForLoadState("networkidle");
    await caPage.waitForSelector("text=Certificate Not Found");
    await caPage.waitForTimeout(1000);

    const shot6 = path.join(ARTIFACTS_DIR, "06_p4_public_verify_not_found.png");
    await caPage.screenshot({ path: shot6, fullPage: true });
    console.log(`Saved screenshot 6: ${shot6}`);

    // -------------------------------------------------------------------------
    // STEP 7: THE STRANGER TEST (FULLY LOGGED-OUT INCOGNITO BROWSER)
    // -------------------------------------------------------------------------
    console.log("\n[7/7] Executing 'Stranger Test' in a fully logged-out fresh incognito context...");
    // Issue a clean active demonstration certificate through real sign-off API using authenticated CA page
    const signOffData = await caPage.evaluate(async () => {
      const res = await fetch("/api/certificates/sign-off", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          period: "2026-04",
          caConclusion:
            "In our professional judgment as licensed Chartered Accountants, all material reconciliation discrepancies have been satisfactorily audited and reconciled.",
          confirmScope: true,
        }),
      });
      return await res.json();
    });

    if (!signOffData.success) {
      throw new Error(`Failed to issue demo cert for stranger test: ${JSON.stringify(signOffData)}`);
    }
    const strangerCertId = signOffData.certificate.publicId;
    console.log(`Active Demo Certificate for Stranger Test: ${strangerCertId}`);

    // Launch a completely new incognito context (zero cookies, zero headers, zero session)
    const strangerContext = await browser.newContext({
      viewport: { width: 1400, height: 900 },
      storageState: undefined,
    });
    const strangerPage = await strangerContext.newPage();

    await strangerPage.goto(`${BASE_URL}/verify/${strangerCertId}`);
    await strangerPage.waitForLoadState("networkidle");
    await strangerPage.waitForSelector("#verificationStatusBadge");
    await strangerPage.waitForTimeout(1500);

    const shot7 = path.join(ARTIFACTS_DIR, "07_p4_stranger_test_incognito.png");
    await strangerPage.screenshot({ path: shot7, fullPage: true });
    console.log(`Saved screenshot 7: ${shot7}`);

    console.log("\n=== ALL 7 PHASE 4 SCREENSHOTS SUCCESSFULLY CAPTURED ===");
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("E2E Execution Error:", e);
  process.exit(1);
});
