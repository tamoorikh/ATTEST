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

  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  // Sign in
  await page.goto(`${BASE_URL}/auth/signin`);
  await page.waitForLoadState("networkidle");
  await page.fill('input[type="email"]', "demo@attest.pk");
  await page.fill('input[type="password"]', "Demo1234!");
  await Promise.all([
    page.waitForResponse((res) => res.url().includes("/api/auth/callback/credentials")),
    page.click("button[type='submit']"),
  ]);
  await page.waitForTimeout(1000);

  // Exceptions page
  await page.goto(`${BASE_URL}/portal/exceptions`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "debug_exceptions_page.png") });

  const buttons = await page.locator("button").allInnerTexts();
  console.log("Buttons on page:", buttons);

  await browser.close();
}

main().catch(console.error);
