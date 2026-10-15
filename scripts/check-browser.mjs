import { chromium } from "playwright";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

async function run() {
  const browser = await chromium.launch({
    executablePath: EDGE_PATH,
    headless: true,
  });

  const page = await browser.newPage();
  
  const consoleMessages = [];
  const pageErrors = [];

  page.on("console", (msg) => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });

  page.on("pageerror", (err) => {
    pageErrors.push(err.message + "\n" + err.stack);
  });

  console.log("Navigating to http://localhost:3001/ ...");
  const response = await page.goto("http://localhost:3001/", { waitUntil: "networkidle" });
  console.log("Current URL:", page.url());
  console.log("Status:", response?.status());

  const title = await page.title();
  const bodyText = await page.innerText("body");
  const html = await page.content();

  console.log("Title:", title);
  console.log("Body length:", bodyText.length);
  console.log("Console messages:", consoleMessages);
  console.log("Page errors:", pageErrors);

  await browser.close();
}

run().catch(console.error);
