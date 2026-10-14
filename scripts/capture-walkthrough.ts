import { chromium } from "playwright-core";
import path from "path";

const ARTIFACTS_DIR = "C:\\Users\\tamoo\\.gemini\\antigravity-ide\\brain\\7458f717-aa82-4fb1-905c-a144d2d2102e";
const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const BASE_URL = "http://localhost:3001";

async function main() {
  console.log("Launching Edge via playwright-core...");
  const browser = await chromium.launch({
    executablePath: EDGE_PATH,
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  // 1. Sign-in page
  console.log("1. Capturing Sign-in page...");
  await page.goto(`${BASE_URL}/auth/signin`);
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "01_signin.png") });

  // 2. Perform quick-login as Client Owner
  console.log("2. Logging in as Client Owner...");
  await page.fill('input[type="email"]', "demo@attest.pk");
  await page.fill('input[type="password"]', "Demo1234!");
  
  const [response] = await Promise.all([
    page.waitForResponse((res) => res.url().includes("/api/auth/callback/credentials") && res.status() === 200),
    page.click("button[type='submit']"),
  ]);
  console.log("Auth response status:", response.status());

  await page.waitForTimeout(1500);

  // 3. Portal Dashboard
  console.log("3. Capturing Portal Dashboard...");
  await page.goto(`${BASE_URL}/portal`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "02_portal_dashboard.png") });

  // 4. Run Reconciliation Engine
  console.log("4. Triggering Verification Engine...");
  const runBtn = page.locator("button:has-text('Run Verification & Reconciliation Engine')");
  if (await runBtn.isVisible()) {
    await runBtn.click();
    await page.waitForTimeout(700); // Catch animated progress bar
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "03_engine_running.png") });
    await page.waitForTimeout(3000); // Wait for execution to finish
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "04_engine_completed.png") });
  }

  // 5. Exceptions list
  console.log("5. Capturing Exceptions Workspace...");
  await page.goto(`${BASE_URL}/portal/exceptions`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "05_exceptions_list.png") });

  // 6. E-101 detail
  console.log("6. Capturing E-101 detail...");
  const e101Item = page.locator("text=Possible duplicate supplier payment").first();
  if (await e101Item.isVisible()) {
    await e101Item.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "06_exception_e101_detail.png") });
  }

  // 7. E-102 detail
  console.log("7. Capturing E-102 detail...");
  const e102Item = page.locator("text=Customer deposit not found in general ledger").first();
  if (await e102Item.isVisible()) {
    await e102Item.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "07_exception_e102_detail.png") });
  }

  // 8. Sign out / re-login as CA Reviewer
  console.log("8. Logging in as Chartered Accountant...");
  await page.goto(`${BASE_URL}/auth/signin`);
  await page.waitForLoadState("networkidle");
  await page.fill('input[type="email"]', "ca@attest.pk");
  await page.fill('input[type="password"]', "Demo1234!");
  await Promise.all([
    page.waitForResponse((res) => res.url().includes("/api/auth/callback/credentials") && res.status() === 200),
    page.click("button[type='submit']"),
  ]);
  await page.waitForTimeout(1500);

  // 9. CA Console
  console.log("9. Capturing CA Console...");
  await page.goto(`${BASE_URL}/ca`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "08_ca_console.png") });

  // 10. CA Audit Trail & Drawer
  console.log("10. Capturing CA Audit Timeline...");
  await page.goto(`${BASE_URL}/ca/audit-trail`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "09_ca_audit_timeline.png") });

  console.log("11. Opening Full Hash Chain Drawer...");
  const drawerBtn = page.locator("button:has-text('Inspect Full Hash Chain')");
  if (await drawerBtn.isVisible()) {
    await drawerBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "10_audit_drawer.png") });
  }

  // 11. Public Verifier Certificate
  console.log("12. Capturing Public Verifier Certificate...");
  await page.goto(`${BASE_URL}/verify/CERT-2026-04-MTL-001`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "11_verify_certificate.png") });

  // 12. Mobile Responsive Check at 375px width
  console.log("13. Capturing Mobile Responsive view at 375px...");
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`${BASE_URL}/portal`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "12_mobile_responsive.png") });

  await browser.close();
  console.log("All walkthrough screenshots captured successfully!");
}

main().catch((err) => {
  console.error("Error capturing walkthrough:", err);
  process.exit(1);
});
