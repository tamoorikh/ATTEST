import { chromium } from "playwright-core";
import path from "path";
import { PrismaClient } from "@prisma/client";

const ARTIFACTS_DIR = "C:\\Users\\tamoo\\.gemini\\antigravity-ide\\brain\\7458f717-aa82-4fb1-905c-a144d2d2102e";
const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const BASE_URL = "http://localhost:3001";

const prisma = new PrismaClient();

async function main() {
  const browser = await chromium.launch({
    executablePath: EDGE_PATH,
    headless: true,
  });

  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  // Sign in as client
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
  await page.waitForTimeout(600);

  console.log("On exceptions desk. Checking 'Resolve this' button...");
  const resolveBtn = page.locator("button:has-text('Resolve this')").first();
  await resolveBtn.click();
  await page.waitForTimeout(500);

  console.log("Stepper opened. Taking screenshot of Step 1...");
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "01_p3_e101_stepper_step1.png") });

  console.log("Clicking 'Continue to Evidence'...");
  await page.locator("button:has-text('Continue to Evidence')").first().click();
  await page.waitForTimeout(500);

  console.log("On Step 2. Looking for file input...");
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: "MCB_Reversal_Advice_Ref_99214.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4 Synthetic Bank Reversal Advice Ref MCB-REV-99214"),
  });
  await page.waitForTimeout(500);

  console.log("File attached! Clicking 'Continue to Explanation'...");
  await page.locator("button:has-text('Continue to Explanation')").first().click();
  await page.waitForTimeout(500);

  console.log("Filling explanation...");
  await page.locator("textarea").fill(
    "Bank reversal requested from MCB Main Branch and processed under reversal advice reference MCB-REV-99214."
  );
  await page.locator("input[type='checkbox']").check();
  await page.waitForTimeout(300);

  console.log("Clicking 'Review Submission'...");
  await page.locator("button:has-text('Review Submission')").first().click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "02_p3_e101_stepper_review.png") });

  console.log("Submitting resolution package...");
  await page.locator("button:has-text('Submit for CA Sign-Off')").first().click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "03_p3_e101_submitted.png") });

  console.log("Client submission successful!");
  await browser.close();
  await prisma.$disconnect();
}

main().catch(console.error);
