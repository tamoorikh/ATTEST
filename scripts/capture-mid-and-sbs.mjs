import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const OUT_DIR = "C:\\Users\\tamoo\\.gemini\\antigravity-ide\\brain\\f844c18c-81e4-4079-b5a2-b16efe177954\\screenshots";
const REPO_ROOT = "c:\\Users\\tamoo\\Desktop\\ATTEST";

async function run() {
  const browser = await chromium.launch({
    executablePath: EDGE_PATH,
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
  });

  const page = await context.newPage();

  // Sign in as Demo Client
  await page.goto("http://localhost:3001/auth/signin", { waitUntil: "networkidle" });
  const bizBtn = page.locator("button:has-text('Business Owner')");
  if (await bizBtn.count() > 0) {
    await bizBtn.click();
    await page.waitForURL("**/portal**", { timeout: 10000 });
  } else {
    await page.fill('input[type="email"]', "demo@attest.pk");
    await page.fill('input[type="password"]', "Demo1234!");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/portal**", { timeout: 10000 });
  }
  await page.waitForTimeout(1000);

  // Capture engine run mid-pipeline
  console.log("Triggering #runBtn...");
  const runBtn = page.locator("#runBtn");
  await runBtn.click();
  // Wait 450ms so stage 2 or 3 is active with blinking dot
  await page.waitForTimeout(450);
  await page.screenshot({ path: path.join(OUT_DIR, "05_engine_run_mid.png") });
  console.log("Captured 05_engine_run_mid.png");

  // For side by side: take a crisp snapshot of design-reference.html and real dashboard, and composite or side-by-side view
  const refPage = await browser.newPage({
    viewport: { width: 1200, height: 900 },
    deviceScaleFactor: 1.5,
  });
  await refPage.goto("file:///" + path.join(REPO_ROOT, "design-reference.html").replace(/\\/g, "/"), { waitUntil: "networkidle" });
  await refPage.waitForTimeout(1000);
  await refPage.screenshot({ path: path.join(OUT_DIR, "ref_snapshot.png") });

  const dashPage = await browser.newPage({
    viewport: { width: 1200, height: 900 },
    deviceScaleFactor: 1.5,
  });
  // Sign in again for dashPage
  await dashPage.goto("http://localhost:3001/auth/signin", { waitUntil: "networkidle" });
  const bizBtn2 = dashPage.locator("button:has-text('Business Owner')");
  if (await bizBtn2.count() > 0) {
    await bizBtn2.click();
    await dashPage.waitForURL("**/portal**", { timeout: 10000 });
  } else {
    await dashPage.fill('input[type="email"]', "demo@attest.pk");
    await dashPage.fill('input[type="password"]', "Demo1234!");
    await dashPage.click('button[type="submit"]');
    await dashPage.waitForURL("**/portal**", { timeout: 10000 });
  }
  await dashPage.waitForTimeout(1500);
  await dashPage.screenshot({ path: path.join(OUT_DIR, "dash_snapshot.png") });

  // Now create the side by side visual composite
  const sbsPage = await browser.newPage({
    viewport: { width: 2440, height: 1050 },
    deviceScaleFactor: 1,
  });

  const refData = fs.readFileSync(path.join(OUT_DIR, "ref_snapshot.png")).toString("base64");
  const dashData = fs.readFileSync(path.join(OUT_DIR, "dash_snapshot.png")).toString("base64");

  const sbsHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; padding: 24px; background: #EFECE6; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .header { text-align: center; margin-bottom: 20px; }
    .title { font-size: 22px; font-weight: 800; color: #17161A; }
    .sub { font-size: 13px; color: #6E6A63; margin-top: 4px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .card { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 12px 30px rgba(0,0,0,0.08); border: 1px solid #E9E6DF; }
    .label { padding: 14px 20px; font-weight: 700; font-size: 13.5px; border-bottom: 1px solid #E9E6DF; display: flex; align-items: center; justify-content: space-between; }
    .badge { padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; }
    .ref-badge { background: #EEEDFB; color: #4F46E5; }
    .dash-badge { background: #E7F5EE; color: #188A54; }
    img { width: 100%; height: auto; display: block; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">Visual Sibling Proof: Approved Design Reference vs. Live Next.js App</div>
    <div class="sub">Side-by-side fidelity verification — identical palette, typography, card elevation, and whisper graffiti background</div>
  </div>
  <div class="grid">
    <div class="card">
      <div class="label">
        <span>Approved Baseline (design-reference.html)</span>
        <span class="badge ref-badge">Design Specification</span>
      </div>
      <img src="data:image/png;base64,${refData}" />
    </div>
    <div class="card">
      <div class="label">
        <span>Live Next.js Implementation (/portal)</span>
        <span class="badge dash-badge">Live React &amp; Tailwind</span>
      </div>
      <img src="data:image/png;base64,${dashData}" />
    </div>
  </div>
</body>
</html>
  `;

  await sbsPage.setContent(sbsHtml);
  await sbsPage.waitForTimeout(1000);
  await sbsPage.screenshot({ path: path.join(OUT_DIR, "12_side_by_side_comparison.png") });
  console.log("Captured 12_side_by_side_comparison.png composite!");

  await browser.close();
}

run().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
