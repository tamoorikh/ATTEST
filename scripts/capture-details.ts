import { chromium } from "playwright-core";
import path from "path";

const ARTIFACTS_DIR = "C:\\Users\\tamoo\\.gemini\\antigravity-ide\\brain\\7458f717-aa82-4fb1-905c-a144d2d2102e";
const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const BASE_URL = "http://localhost:3001";

async function main() {
  const browser = await chromium.launch({
    executablePath: EDGE_PATH,
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  // Login as Client Owner
  await page.goto(`${BASE_URL}/auth/signin`);
  await page.waitForLoadState("networkidle");
  await page.fill('input[type="email"]', "demo@attest.pk");
  await page.fill('input[type="password"]', "Demo1234!");
  await Promise.all([
    page.waitForResponse((res) => res.url().includes("/api/auth/callback/credentials") && res.status() === 200),
    page.click("button[type='submit']"),
  ]);
  await page.waitForTimeout(1500);

  // Go to Exceptions and click on E-101 (Duplicate payment)
  await page.goto(`${BASE_URL}/portal/exceptions`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(800);

  // Click on the row with Zubair / Duplicate payment
  const e101Row = page.locator("text=Potential duplicate payment of PKR 118,500.00").first();
  if (await e101Row.isVisible()) {
    await e101Row.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "06_exception_e101_detail.png") });
  }

  // Click on the second row (E-102 unrecorded credit / sale)
  const e102Row = page.locator("text=Receipt not recorded in books").first();
  if (await e102Row.isVisible()) {
    await e102Row.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "07_exception_e102_detail.png") });
  }

  // Mobile view of client portal dashboard at 375px
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`${BASE_URL}/portal`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "13_mobile_portal_dashboard.png") });

  await browser.close();
  console.log("Detail captures complete!");
}

main().catch((err) => {
  console.error("Error in capture details:", err);
  process.exit(1);
});
