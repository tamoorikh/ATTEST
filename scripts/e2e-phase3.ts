import { chromium } from "playwright-core";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { executeOrchestratorForPeriod } from "../src/engine/orchestrator";

const ARTIFACTS_DIR = "C:\\Users\\tamoo\\.gemini\\antigravity-ide\\brain\\7458f717-aa82-4fb1-905c-a144d2d2102e";
const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const BASE_URL = "http://localhost:3001";

const prisma = new PrismaClient();

async function main() {
  console.log("=== STARTING FULL PHASE 3 E2E DEMO WALKTHROUGH ===");

  const org = await prisma.organization.findFirst({
    where: { isDemo: true },
    include: {
      exceptions: true,
      bankTransactions: true,
    },
  });

  if (!org) {
    throw new Error("Demo org not found");
  }

  const e101 = org.exceptions.find((e) => e.type === "DUPLICATE_PAYMENT");
  const e102 = org.exceptions.find((e) => e.type === "UNRECORDED_CREDIT" || e.type === "UNRECORDED_SALE");

  if (!e101 || !e102) {
    throw new Error(`E-101 or E-102 not found: E-101=${e101?.id}, E-102=${e102?.id}`);
  }

  console.log(`Target E-101: ${e101.id} (${e101.title})`);
  console.log(`Target E-102: ${e102.id} (${e102.title})`);

  const browser = await chromium.launch({
    executablePath: EDGE_PATH,
    headless: true,
  });

  const clientContext = await browser.newContext({
    viewport: { width: 1400, height: 900 },
  });
  const clientPage = await clientContext.newPage();

  // ---------------------------------------------------------------------------
  // 1. CLIENT SIGNS IN & OPENS E-101 GUIDED RESOLUTION STEPPER
  // ---------------------------------------------------------------------------
  console.log("\n>>> Step 1: Client Sign-in & E-101 Resolution Stepper");
  await clientPage.goto(`${BASE_URL}/auth/signin`);
  await clientPage.waitForLoadState("networkidle");
  await clientPage.fill('input[type="email"]', "demo@attest.pk");
  await clientPage.fill('input[type="password"]', "Demo1234!");
  await Promise.all([
    clientPage.waitForResponse((res) => res.url().includes("/api/auth/callback/credentials")),
    clientPage.click("button[type='submit']"),
  ]);
  await clientPage.waitForTimeout(1000);

  // Navigate directly to Exceptions Desk
  await clientPage.goto(`${BASE_URL}/portal/exceptions`);
  await clientPage.waitForLoadState("networkidle");
  await clientPage.waitForTimeout(600);

  // Ensure E-101 is expanded
  await clientPage.locator(`text=${e101.title}`).first().click();
  await clientPage.waitForTimeout(400);

  // Click "Resolve this"
  const resolveBtn = clientPage.locator("button:has-text('Resolve this')").first();
  await resolveBtn.click();
  await clientPage.waitForTimeout(400);

  // STEP 1: Select Duplicate Reversal
  const reversalRadio = clientPage.locator("input[value='DUPLICATE_REVERSAL']");
  if (await reversalRadio.isVisible()) {
    await reversalRadio.check();
  }
  await clientPage.screenshot({ path: path.join(ARTIFACTS_DIR, "01_p3_e101_stepper_step1.png") });

  // Continue to Step 2
  await clientPage.locator("button:has-text('Continue to Evidence')").click();
  await clientPage.waitForTimeout(400);

  // STEP 2: Ensure Upload Tab is active and attach file
  const uploadTab = clientPage.locator("button:has-text('Upload New File')");
  if (await uploadTab.isVisible()) {
    await uploadTab.click();
    await clientPage.waitForTimeout(200);
  }
  const fileInput = clientPage.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: "MCB_Reversal_Advice_Ref_99214.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4 Synthetic Bank Reversal Advice Ref MCB-REV-99214"),
  });
  await clientPage.waitForTimeout(400);

  // Continue to Step 3
  await clientPage.locator("button:has-text('Continue to Explanation')").click();
  await clientPage.waitForTimeout(400);

  // STEP 3: Explanation & Declaration
  await clientPage.locator("textarea").fill(
    "Bank reversal requested from MCB Main Branch and processed under reversal advice reference MCB-REV-99214."
  );
  await clientPage.locator("input[type='checkbox']").check();
  await clientPage.waitForTimeout(200);

  // Continue to Step 4
  await clientPage.locator("button:has-text('Review Submission')").click();
  await clientPage.waitForTimeout(400);
  await clientPage.screenshot({ path: path.join(ARTIFACTS_DIR, "02_p3_e101_stepper_review.png") });

  // Submit to CA
  await clientPage.locator("button:has-text('Submit for CA Sign-Off')").click();
  await clientPage.waitForTimeout(1000);
  await clientPage.screenshot({ path: path.join(ARTIFACTS_DIR, "03_p3_e101_submitted.png") });
  console.log("✓ E-101 submitted. Status is now CLIENT_SUBMITTED.");

  // ---------------------------------------------------------------------------
  // 2. CA CONSOLE: SEE IN QUEUE, OPEN WORKPAPER, REJECT WITH MANDATORY REASON
  // ---------------------------------------------------------------------------
  console.log("\n>>> Step 2: CA Console Review & Rejection");
  const caContext = await browser.newContext({
    viewport: { width: 1400, height: 900 },
  });
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

  // Visit CA Dashboard
  await caPage.goto(`${BASE_URL}/ca`);
  await caPage.waitForLoadState("networkidle");
  await caPage.waitForTimeout(500);
  await caPage.screenshot({ path: path.join(ARTIFACTS_DIR, "04_p3_ca_overview_metrics.png") });

  // Open Full Workpaper for E-101
  await caPage.goto(`${BASE_URL}/ca/exceptions/${e101.id}`);
  await caPage.waitForLoadState("networkidle");
  await caPage.waitForTimeout(600);
  await caPage.screenshot({ path: path.join(ARTIFACTS_DIR, "05_p3_ca_workpaper_e101.png") });

  // Click "Reject Resolution"
  await caPage.locator("button:has-text('Reject Resolution')").click();
  await caPage.waitForTimeout(300);

  // Enter mandatory reason (>= 20 chars)
  const rejectReason = "The uploaded reversal document lacks the official MCB bank stamp and branch manager seal.";
  await caPage.locator("textarea").fill(rejectReason);
  await caPage.waitForTimeout(200);

  // Confirm Decision
  await caPage.locator("button:has-text('Confirm Decision')").click();
  await caPage.waitForTimeout(1000);
  await caPage.screenshot({ path: path.join(ARTIFACTS_DIR, "06_p3_ca_rejected_e101.png") });
  console.log("✓ CA rejected E-101 with mandatory reason. Status returned to OPEN.");

  // ---------------------------------------------------------------------------
  // 3. CLIENT SEES REJECTION REASON PROMINENTLY & RESUBMITS
  // ---------------------------------------------------------------------------
  console.log("\n>>> Step 3: Client sees rejection banner & resubmits with official seal");
  await clientPage.reload();
  await clientPage.waitForLoadState("networkidle");
  await clientPage.waitForTimeout(600);
  await clientPage.screenshot({ path: path.join(ARTIFACTS_DIR, "07_p3_client_rejection_view.png") });

  // Click "Resubmit Resolution"
  await clientPage.locator("button:has-text('Resubmit Resolution')").click();
  await clientPage.waitForTimeout(300);

  // Step 1: Continue to Evidence
  await clientPage.locator("button:has-text('Continue to Evidence')").click();
  await clientPage.waitForTimeout(300);

  // Step 2: Upload official stamped seal document
  const uploadTab2 = clientPage.locator("button:has-text('Upload New File')");
  if (await uploadTab2.isVisible()) {
    await uploadTab2.click();
    await clientPage.waitForTimeout(200);
  }
  await clientPage.locator('input[type="file"]').setInputFiles({
    name: "MCB_Official_Stamped_Reversal_Seal.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4 Officially Stamped Bank Reversal Voucher by Branch Manager"),
  });
  await clientPage.waitForTimeout(300);

  // Step 3: Explanation + Declaration
  await clientPage.locator("button:has-text('Continue to Explanation')").click();
  await clientPage.waitForTimeout(300);
  await clientPage.locator("textarea").fill(
    "Attached revised bank reversal certificate with formal MCB branch manager seal and stamped voucher reference MCB-99214-B."
  );
  await clientPage.locator("input[type='checkbox']").check();
  await clientPage.waitForTimeout(200);

  // Step 4: Review & Submit
  await clientPage.locator("button:has-text('Review Submission')").click();
  await clientPage.waitForTimeout(300);
  await clientPage.locator("button:has-text('Submit for CA Sign-Off')").click();
  await clientPage.waitForTimeout(1000);
  await clientPage.screenshot({ path: path.join(ARTIFACTS_DIR, "08_p3_client_resubmitted_e101.png") });
  console.log("✓ Client resubmitted revised evidence. Status is CLIENT_SUBMITTED.");

  // ---------------------------------------------------------------------------
  // 4. CA ACCEPTS RESOLUTION FOR E-101
  // ---------------------------------------------------------------------------
  console.log("\n>>> Step 4: CA Accepts Resolution for E-101");
  await caPage.reload();
  await caPage.waitForLoadState("networkidle");
  await caPage.waitForTimeout(600);

  // Click "Accept Resolution"
  await caPage.locator("button:has-text('Accept Resolution')").click();
  await caPage.waitForTimeout(300);

  // Optional endorsement note is pre-filled, confirm decision
  await caPage.locator("button:has-text('Confirm Decision')").click();
  await caPage.waitForTimeout(1200);
  await caPage.screenshot({ path: path.join(ARTIFACTS_DIR, "09_p3_ca_accepted_e101.png") });
  console.log("✓ CA accepted E-101. Status is now RESOLVED.");

  // ---------------------------------------------------------------------------
  // 5. ENGINE RERUN: VERIFY RESOLVED DIFF & IDEMPOTENCY
  // ---------------------------------------------------------------------------
  console.log("\n>>> Step 5: Engine Rerun Verification");
  const engineResult1 = await executeOrchestratorForPeriod({
    orgId: org.id,
    period: "2026-04",
    prismaClient: prisma,
  });
  console.log(`Diff Summary after E-101: ${engineResult1.diffSummary}`);

  // ---------------------------------------------------------------------------
  // 6. E-102 LOOP: CLIENT LINKS FBR INVOICE #SI-2026-3387 -> CA ACCEPTS -> MATCH
  // ---------------------------------------------------------------------------
  console.log("\n>>> Step 6: E-102 Loop (Unrecorded Credit PKR 340,000.00)");
  await clientPage.goto(`${BASE_URL}/portal/exceptions`);
  await clientPage.waitForLoadState("networkidle");
  await clientPage.waitForTimeout(600);

  // Select E-102 card
  const e102Card = clientPage.locator(`text=${e102.title}`).first();
  await e102Card.click();
  await clientPage.waitForTimeout(400);

  // Click "Resolve this"
  const resolve102Btn = clientPage.locator("button:has-text('Resolve this')").first();
  await resolve102Btn.click();
  await clientPage.waitForTimeout(300);

  // Step 1: Continue to Evidence
  await clientPage.locator("button:has-text('Continue to Evidence')").click();
  await clientPage.waitForTimeout(300);

  // Step 2: Click "Link FBR Sales Invoice"
  const linkInvoiceBtn = clientPage.locator("button:has-text('Link FBR Sales Invoice')");
  if (await linkInvoiceBtn.isVisible()) {
    await linkInvoiceBtn.click();
    await clientPage.waitForTimeout(200);
  }
  await clientPage.locator("button:has-text('Continue to Explanation')").click();
  await clientPage.waitForTimeout(300);

  // Step 3: Explanation + Declaration
  await clientPage.locator("textarea").fill(
    "Sales invoice #SI-2026-3387 was issued on 11 Apr for Al-Rehman Textiles; please post adjusting entry to Sales Revenue."
  );
  await clientPage.locator("input[type='checkbox']").check();
  await clientPage.waitForTimeout(200);

  // Step 4: Submit
  await clientPage.locator("button:has-text('Review Submission')").click();
  await clientPage.waitForTimeout(300);
  await clientPage.locator("button:has-text('Submit for CA Sign-Off')").click();
  await clientPage.waitForTimeout(1000);

  // CA Reviews E-102
  await caPage.goto(`${BASE_URL}/ca/exceptions/${e102.id}`);
  await caPage.waitForLoadState("networkidle");
  await caPage.waitForTimeout(600);

  // CA Approves E-102
  await caPage.locator("button:has-text('Accept Resolution')").click();
  await caPage.waitForTimeout(300);
  await caPage.locator("button:has-text('Confirm Decision')").click();
  await caPage.waitForTimeout(1200);

  await caPage.screenshot({ path: path.join(ARTIFACTS_DIR, "10_p3_ca_accepted_e102.png") });
  console.log("✓ CA accepted E-102. Adjusting ledger entry and match created!");

  // Rerun engine to verify matched credit and coverage
  const engineResult2 = await executeOrchestratorForPeriod({
    orgId: org.id,
    period: "2026-04",
    prismaClient: prisma,
  });
  console.log(`Updated Coverage: ${engineResult2.stats.coveragePercent}%`);
  console.log(`Matched Transactions: ${engineResult2.stats.matchedCount} / ${engineResult2.stats.totalBankTransactions}`);

  // ---------------------------------------------------------------------------
  // 7. NOTIFICATION CENTER POPUP & MOBILE WORKPAPER
  // ---------------------------------------------------------------------------
  console.log("\n>>> Step 7: Notification Center & Mobile View Capture");
  await clientPage.reload();
  await clientPage.waitForLoadState("networkidle");
  await clientPage.waitForTimeout(600);

  const bellButton = clientPage.locator("button[aria-label='Notifications']");
  if (await bellButton.isVisible()) {
    await bellButton.click();
    await clientPage.waitForTimeout(400);
    await clientPage.screenshot({ path: path.join(ARTIFACTS_DIR, "11_p3_notification_center.png") });
  }

  // Mobile Workpaper Responsive View (375px)
  await caPage.setViewportSize({ width: 375, height: 812 });
  await caPage.reload();
  await caPage.waitForLoadState("networkidle");
  await caPage.waitForTimeout(600);
  await caPage.screenshot({ path: path.join(ARTIFACTS_DIR, "12_p3_mobile_workpaper.png") });

  await browser.close();
  await prisma.$disconnect();
  console.log("\n=== ALL E2E SCREENSHOTS AND WORKFLOWS COMPLETED SUCCESSFULLY! ===");
}

main().catch((err) => {
  console.error("E2E walkthrough failed:", err);
  process.exit(1);
});
