// XIA-85 — stills do flash do hero (env sem ffmpeg → burst de screenshots do #hero).
// CPU 4x alonga a janela (~1.3s) → screenshots ~a cada 200ms pegam visível→sumiu→reveal.
import { chromium } from "playwright";
import fs from "node:fs";
const URL = process.env.QA_URL || "http://localhost:3185";
const OUT = "qa/artifacts/xia85/flash-frames";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference" });
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
await page.addInitScript(() => {
  window.__log = [];
  const t0 = performance.now();
  const tick = () => {
    const sub = document.querySelector("#hero p");
    if (sub) window.__log.push({ t: Math.round(performance.now() - t0), sub: Number(getComputedStyle(sub).opacity), live: document.documentElement.classList.contains("gsap-live") });
    if (performance.now() - t0 < 3000) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});
await page.goto(URL, { waitUntil: "commit" });
const marks = [80, 300, 600, 900, 1300, 1700, 2200, 2900];
let prev = 0;
for (const m of marks) {
  await page.waitForTimeout(m - prev); prev = m;
  const sub = await page.evaluate(() => { const s = document.querySelector("#hero p"); return s ? Number(getComputedStyle(s).opacity) : null; });
  const live = await page.evaluate(() => document.documentElement.classList.contains("gsap-live"));
  await page.locator("#hero").screenshot({ path: `${OUT}/t${String(m).padStart(4, "0")}-sub${sub != null ? sub.toFixed(2) : "na"}-live${live ? 1 : 0}.png` });
  console.log(`t=${m}ms sub-opacity=${sub} gsapLive=${live}`);
}
await context.close();
await browser.close();
console.log("STILLS DONE");
