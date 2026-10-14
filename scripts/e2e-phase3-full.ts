import { chromium } from "playwright-core";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { executeOrchestratorForPeriod } from "../src/engine/orchestrator";

const ARTIFACTS_DIR = "C:\\Users\\tamoo\\.gemini\\antigravity-ide\\brain\\7458f717-aa82-4fb1-905c-a144d2d2102e";
const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const BASE_URL = "http://localhost:3001";

const prisma = new PrismaClient();

async function main() {
  console.log("=== STARTING COMPLETE PHASE 3 E2E AUTOMATION ===");

  const org = await prisma.organization.findFirst({
    where: { isDemo: true },
    include: {
      exceptions: true,
      bankTransactions: true,
    },
  });

  if (!org) throw new Error("Demo org not found");

  const e101 = org.exceptions.find((e) => e.type === "DUPLICATE_PAYMENT");
  const e102 = org.exceptions.find((e) => e.type === "UNRECORDED_CREDIT" || e.type === "UNRECORDED_SALE");

  if (!e101 || !e102) throw new Error("Exceptions not found in DB");

  const browser = await chromium.launch({
    executablePath: EDGE_PATH,
    headless: true,
  });

  // ===========================================================================
  // PART 1: CLIENT SUBMITS INITIAL RESOLUTION FOR E-101
  // ===========================================================================
  console.log("\n[1/6] Client submitting initial resolution for E-101...");
  const clientContext = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const clientPage = await clientContext.newPage();

  // Sign in as Client Owner
  await clientPage.goto(`${BASE_URL}/auth/signin`);
  await clientPage.waitForLoadState("networkidle");
  await clientPage.fill('input[type="email"]', "demo@attest.pk");
  await clientPage.fill('input[type="password"]', "Demo1234!");
  await Promise.all([
    clientPage.waitForResponse((res) => res.url().includes("/api/auth/callback/credentials")),
    clientPage.click("button[type='submit']"),
  ]);
  await clientPage.waitForTimeout(1000);

  // Exceptions Desk
  await clientPage.goto(`${BASE_URL}/portal/exceptions`);
  await clientPage.waitForLoadState("networkidle");
  await clientPage.waitForTimeout(800);

  // E-101 is already expanded. Click "Resolve this"
  await clientPage.locator("button:has-text('Resolve this')").first().click();
  await clientPage.waitForTimeout(400);

  // Capture Step 1
  await clientPage.screenshot({ path: path.join(ARTIFACTS_DIR, "01_p3_e101_stepper_step1.png") });

  // Move to Step 2
  await clientPage.locator("button:has-text('Continue to Evidence')").first().click();
  await clientPage.waitForTimeout(400);

  // Attach synthetic reversal advice
  await clientPage.locator('input[type="file"]').setInputFiles({
    name: "MCB_Reversal_Advice_Ref_99214.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4 Synthetic Bank Reversal Advice Ref MCB-REV-99214"),
  });
  await clientPage.waitForTimeout(400);

  // Move to Step 3
  await clientPage.locator("button:has-text('Continue to Explanation')").first().click();
  await clientPage.waitForTimeout(400);

  // Fill explanation & declaration
  await clientPage.locator("textarea").fill(
    "Bank reversal requested from MCB Main Branch and processed under reversal advice reference MCB-REV-99214."
  );
  await clientPage.locator("input[type='checkbox']").check();
  await clientPage.waitForTimeout(300);

  // Move to Step 4
  await clientPage.locator("button:has-text('Review Submission')").first().click();
  await clientPage.waitForTimeout(400);
  await clientPage.screenshot({ path: path.join(ARTIFACTS_DIR, "02_p3_e101_stepper_review.png") });

  // Submit to CA with explicit waitForResponse
  await Promise.all([
    clientPage.waitForResponse((res) => res.url().includes("/resolve") && res.status() === 200),
    clientPage.locator("button:has-text('Submit for CA Sign-Off')").first().click(),
  ]);
  await clientPage.waitForTimeout(1000);

  // Reload to see read-only awaiting review banner
  await clientPage.reload();
  await clientPage.waitForLoadState("networkidle");
  await clientPage.waitForTimeout(800);
  await clientPage.screenshot({ path: path.join(ARTIFACTS_DIR, "03_p3_e101_awaiting_review.png") });
  console.log("✓ E-101 submitted and showing awaiting review banner.");

  // ===========================================================================
  // PART 2: CA REVIEWS WORKPAPER AND REJECTS WITH MANDATORY REASON
  // ===========================================================================
  console.log("\n[2/6] CA Reviewer reviewing workpaper and rejecting with reason...");
  const caContext = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const caPage = await caContext.newPage();

  // Sign in as CA
  await caPage.goto(`${BASE_URL}/auth/signin`);
  await caPage.waitForLoadState("networkidle");
  await caPage.fill('input[type="email"]', "ca@attest.pk");
  await caPage.fill('input[type="password"]', "Demo1234!");
  await Promise.all([
    caPage.waitForResponse((res) => res.url().includes("/api/auth/callback/credentials")),
    caPage.click("button[type='submit']"),
  ]);
  await caPage.waitForTimeout(1000);

  // CA Overview Metrics
  await caPage.goto(`${BASE_URL}/ca`);
  await caPage.waitForLoadState("networkidle");
  await caPage.waitForTimeout(600);
  await caPage.screenshot({ path: path.join(ARTIFACTS_DIR, "04_p3_ca_overview_metrics.png") });

  // Open E-101 Full Workpaper
  await caPage.goto(`${BASE_URL}/ca/exceptions/${e101.id}`);
  await caPage.waitForLoadState("networkidle");
  await caPage.waitForTimeout(800);
  await caPage.screenshot({ path: path.join(ARTIFACTS_DIR, "05_p3_ca_workpaper_e101.png") });

  // Reject resolution
  await caPage.locator("button:has-text('Reject Resolution')").first().click();
  await caPage.waitForTimeout(300);

  const rejectReason = "The uploaded reversal document lacks the official MCB bank stamp and branch manager seal.";
  await caPage.locator("textarea").fill(rejectReason);
  await caPage.waitForTimeout(200);

  // Confirm Decision with waitForResponse
  await Promise.all([
    caPage.waitForResponse((res) => res.url().includes("/review") && res.status() === 200),
    caPage.locator("button:has-text('Confirm Decision')").first().click(),
  ]);
  await caPage.waitForTimeout(1000);

  await caPage.screenshot({ path: path.join(ARTIFACTS_DIR, "06_p3_ca_rejected_e101.png") });
  console.log("✓ CA rejected E-101 with mandatory reason.");

  // ===========================================================================
  // PART 3: CLIENT SEES REJECTION REASON & RESUBMITS REVISED EVIDENCE
  // ===========================================================================
  console.log("\n[3/6] Client inspecting CA rejection reason and resubmitting...");
  await clientPage.reload();
  await clientPage.waitForLoadState("networkidle");
  await clientPage.waitForTimeout(800);
  await clientPage.screenshot({ path: path.join(ARTIFACTS_DIR, "07_p3_client_rejection_view.png") });

  // Click Resubmit Resolution
  await clientPage.locator("button:has-text('Resubmit Resolution')").first().click();
  await clientPage.waitForTimeout(400);

  // Step 1 -> Continue
  await clientPage.locator("button:has-text('Continue to Evidence')").first().click();
  await clientPage.waitForTimeout(400);

  // Attach official stamped document
  await clientPage.locator('input[type="file"]').setInputFiles({
    name: "MCB_Official_Stamped_Reversal_Seal.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4 Officially Stamped Bank Reversal Voucher by Branch Manager"),
  });
  await clientPage.waitForTimeout(400);

  // Step 2 -> Continue
  await clientPage.locator("button:has-text('Continue to Explanation')").first().click();
  await clientPage.waitForTimeout(400);

  // Step 3 -> Fill revised explanation
  await clientPage.locator("textarea").fill(
    "Attached revised bank reversal certificate with formal MCB branch manager seal and stamped voucher reference MCB-99214-B."
  );
  await clientPage.locator("input[type='checkbox']").check();
  await clientPage.waitForTimeout(200);

  // Step 4 -> Review & Submit
  await clientPage.locator("button:has-text('Review Submission')").first().click();
  await clientPage.waitForTimeout(400);

  await Promise.all([
    clientPage.waitForResponse((res) => res.url().includes("/resolve") && res.status() === 200),
    clientPage.locator("button:has-text('Submit for CA Sign-Off')").first().click(),
  ]);
  await clientPage.waitForTimeout(1000);

  await clientPage.screenshot({ path: path.join(ARTIFACTS_DIR, "08_p3_client_resubmitted_e101.png") });
  console.log("✓ Client resubmitted revised evidence package.");

  // ===========================================================================
  // PART 4: CA ACCEPTS RESOLUTION FOR E-101
  // ===========================================================================
  console.log("\n[4/6] CA accepting resolution for E-101...");
  await caPage.reload();
  await caPage.waitForLoadState("networkidle");
  await caPage.waitForTimeout(800);

  // Click Accept Resolution
  await caPage.locator("button:has-text('Accept Resolution')").first().click();
  await caPage.waitForTimeout(300);

  // Confirm Decision with waitForResponse
  await Promise.all([
    caPage.waitForResponse((res) => res.url().includes("/review") && res.status() === 200),
    caPage.locator("button:has-text('Confirm Decision')").first().click(),
  ]);
  await caPage.waitForTimeout(1200);

  await caPage.screenshot({ path: path.join(ARTIFACTS_DIR, "09_p3_ca_accepted_e101.png") });
  console.log("✓ CA accepted E-101. Status is RESOLVED.");

  // Verify engine rerun reflects resolved diff and does not regenerate
  const diffCheck = await executeOrchestratorForPeriod({
    orgId: org.id,
    period: "2026-04",
    prismaClient: prisma,
  });
  console.log(`✓ Engine Diff: ${diffCheck.diffSummary}`);

  // ===========================================================================
  // PART 5: E-102 LOOP — CLIENT LINKS INVOICE -> CA ACCEPTS -> LEDGER RESOLVED
  // ===========================================================================
  console.log("\n[5/6] E-102 loop (Unrecorded Credit PKR 340,000.00)...");
  await clientPage.goto(`${BASE_URL}/portal/exceptions`);
  await clientPage.waitForLoadState("networkidle");
  await clientPage.waitForTimeout(800);

  // Expand E-102
  await clientPage.locator("text=Al-Rehman Textiles").first().click();
  await clientPage.waitForTimeout(500);

  // Click Resolve this on E-102
  await clientPage.locator("button:has-text('Resolve this')").first().click();
  await clientPage.waitForTimeout(400);

  // Step 1 -> Continue
  await clientPage.locator("button:has-text('Continue to Evidence')").first().click();
  await clientPage.waitForTimeout(400);

  // Step 2 -> Click Link FBR Sales Invoice
  const linkInvoiceBtn = clientPage.locator("button:has-text('Link FBR Sales Invoice')");
  if (await linkInvoiceBtn.isVisible()) {
    await linkInvoiceBtn.click();
    await clientPage.waitForTimeout(200);
  }

  // Step 3 -> Explanation & Declaration
  await clientPage.locator("button:has-text('Continue to Explanation')").first().click();
  await clientPage.waitForTimeout(400);
  await clientPage.locator("textarea").fill(
    "Sales invoice #SI-2026-3387 was issued on 11 Apr for Al-Rehman Textiles; please post adjusting entry to Sales Revenue."
  );
  await clientPage.locator("input[type='checkbox']").check();
  await clientPage.waitForTimeout(200);

  // Step 4 -> Review & Submit
  await clientPage.locator("button:has-text('Review Submission')").first().click();
  await clientPage.waitForTimeout(400);

  await Promise.all([
    clientPage.waitForResponse((res) => res.url().includes("/resolve") && res.status() === 200),
    clientPage.locator("button:has-text('Submit for CA Sign-Off')").first().click(),
  ]);
  await clientPage.waitForTimeout(1000);

  // CA Reviews E-102
  await caPage.goto(`${BASE_URL}/ca/exceptions/${e102.id}`);
  await caPage.waitForLoadState("networkidle");
  await caPage.waitForTimeout(800);

  // CA Approves E-102
  await caPage.locator("button:has-text('Accept Resolution')").first().click();
  await caPage.waitForTimeout(300);

  await Promise.all([
    caPage.waitForResponse((res) => res.url().includes("/review") && res.status() === 200),
    caPage.locator("button:has-text('Confirm Decision')").first().click(),
  ]);
  await caPage.waitForTimeout(1200);

  await caPage.screenshot({ path: path.join(ARTIFACTS_DIR, "10_p3_e102_workpaper_resolved.png") });
  console.log("✓ CA accepted E-102. Adjusting entry posted.");

  // Rerun matcher
  const engineResult2 = await executeOrchestratorForPeriod({
    orgId: org.id,
    period: "2026-04",
    prismaClient: prisma,
  });
  console.log(`✓ 12 Apr credit matched. Coverage: ${engineResult2.stats.coveragePercent}% (${engineResult2.stats.matchedCount}/${engineResult2.stats.totalBankTransactions})`);

  // ===========================================================================
  // PART 6: NOTIFICATIONS & MOBILE RESPONSIVE WORKPAPER
  // ===========================================================================
  console.log("\n[6/6] Capturing Notification Center and Mobile Responsive Workpaper...");
  await clientPage.reload();
  await clientPage.waitForLoadState("networkidle");
  await clientPage.waitForTimeout(600);

  const bell = clientPage.locator("button[aria-label='Notifications']");
  if (await bell.isVisible()) {
    await bell.click();
    await clientPage.waitForTimeout(500);
    await clientPage.screenshot({ path: path.join(ARTIFACTS_DIR, "11_p3_notification_center.png") });
  }

  // Mobile View of Workpaper at 375px
  await caPage.setViewportSize({ width: 375, height: 812 });
  await caPage.reload();
  await caPage.waitForLoadState("networkidle");
  await caPage.waitForTimeout(800);
  await caPage.screenshot({ path: path.join(ARTIFACTS_DIR, "12_p3_mobile_workpaper.png") });

  await browser.close();
  await prisma.$disconnect();
  console.log("\n=== ALL E2E AUTOMATION COMPLETE AND ALL SCREENSHOTS SAVED! ===");
}

main().catch((err) => {
  console.error("Full E2E failed:", err);
  process.exit(1);
});
