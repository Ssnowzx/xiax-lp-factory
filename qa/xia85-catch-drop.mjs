// XIA-85 — captura o FRAME EXATO do drop (sub visível→autoAlpha:0) via waitForFunction.
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
await page.goto(URL, { waitUntil: "commit" });
// 1) espera o sub PINTAR visível (>=0.9) sem gsap-live
await page.waitForFunction(() => { const s = document.querySelector("#hero p"); return s && Number(getComputedStyle(s).opacity) >= 0.9 && !document.documentElement.classList.contains("gsap-live"); }, { timeout: 5000 });
await page.locator("#hero").screenshot({ path: `${OUT}/DROP-a-visible-prelive.png` });
console.log("captured: sub VISÍVEL pré-gsap-live");
// 2) espera o instante em que gsap-live ligou E o sub caiu <0.1 (immediateRender autoAlpha:0)
try {
  await page.waitForFunction(() => { const s = document.querySelector("#hero p"); return document.documentElement.classList.contains("gsap-live") && s && Number(getComputedStyle(s).opacity) < 0.1; }, { timeout: 5000, polling: "raf" });
  await page.locator("#hero").screenshot({ path: `${OUT}/DROP-b-hidden-atlive.png` });
  const t = await page.evaluate(() => Number(getComputedStyle(document.querySelector("#hero p")).opacity));
  console.log(`captured: sub OCULTO no gsap-live (opacity=${t}) → FLASH`);
} catch (e) { console.log("drop<0.1 não capturado no polling raf (reveal muito rápido); numérico já provado no per-frame probe"); }
// 3) estado final revelado
await page.waitForTimeout(1500);
await page.locator("#hero").screenshot({ path: `${OUT}/DROP-c-revealed-final.png` });
console.log("captured: estado final revelado");
await context.close();
await browser.close();
