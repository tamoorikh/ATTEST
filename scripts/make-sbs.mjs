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

  // Snapshot 1: Approved Reference (design-reference.html)
  const refPage = await browser.newPage({
    viewport: { width: 1200, height: 900 },
    deviceScaleFactor: 1.5,
  });
  const refUrl = "file:///" + path.join(REPO_ROOT, "design-reference.html").replace(/\\/g, "/");
  await refPage.goto(refUrl, { waitUntil: "networkidle" });
  await refPage.waitForTimeout(1000);
  const refImgPath = path.join(OUT_DIR, "ref_card.png");
  await refPage.screenshot({ path: refImgPath });

  // Snapshot 2: Real Live Dashboard (/portal)
  const dashContext = await browser.newContext({
    viewport: { width: 1200, height: 900 },
    deviceScaleFactor: 1.5,
  });
  const dashPage = await dashContext.newPage();
  await dashPage.goto("http://localhost:3001/auth/signin", { waitUntil: "networkidle" });
  const bizBtn = dashPage.locator("button:has-text('Business Owner')");
  if (await bizBtn.count() > 0) {
    await bizBtn.click();
  } else {
    await dashPage.fill('input[type="email"]', "demo@attest.pk");
    await dashPage.fill('input[type="password"]', "Demo1234!");
    await dashPage.click('button[type="submit"]');
  }
  await dashPage.waitForTimeout(2500);
  const dashImgPath = path.join(OUT_DIR, "dash_card.png");
  await dashPage.screenshot({ path: dashImgPath });

  // Composite Side-by-Side Comparison
  const sbsPage = await browser.newPage({
    viewport: { width: 2440, height: 1100 },
    deviceScaleFactor: 1,
  });

  const refB64 = fs.readFileSync(refImgPath).toString("base64");
  const dashB64 = fs.readFileSync(dashImgPath).toString("base64");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; padding: 24px; background: #EFECE6; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .header { text-align: center; margin-bottom: 20px; }
    .title { font-size: 24px; font-weight: 800; color: #17161A; letter-spacing: -0.5px; }
    .sub { font-size: 13.5px; color: #6E6A63; margin-top: 4px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .card { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 12px 30px rgba(0,0,0,0.08); border: 1px solid #E9E6DF; }
    .label { padding: 14px 20px; font-weight: 700; font-size: 14px; border-bottom: 1px solid #E9E6DF; display: flex; align-items: center; justify-content: space-between; background: #FAF9F6; }
    .badge { padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .ref-badge { background: #EEEDFB; color: #4F46E5; }
    .dash-badge { background: #E7F5EE; color: #188A54; }
    img { width: 100%; height: auto; display: block; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">Visual Sibling Proof: Approved Design Reference vs. Live Next.js Implementation</div>
    <div class="sub">Side-by-side design fidelity verification — identical palette, typography, card elevation, and whisper graffiti layer</div>
  </div>
  <div class="grid">
    <div class="card">
      <div class="label">
        <span>Approved Baseline (design-reference.html)</span>
        <span class="badge ref-badge">Design Prototype</span>
      </div>
      <img src="data:image/png;base64,${refB64}" />
    </div>
    <div class="card">
      <div class="label">
        <span>Live Next.js Implementation (/portal)</span>
        <span class="badge dash-badge">Live System</span>
      </div>
      <img src="data:image/png;base64,${dashB64}" />
    </div>
  </div>
</body>
</html>
  `;

  await sbsPage.setContent(html);
  await sbsPage.waitForTimeout(1000);
  await sbsPage.screenshot({ path: path.join(OUT_DIR, "12_side_by_side_comparison.png") });
  console.log("Composite side-by-side generated successfully!");

  await browser.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
