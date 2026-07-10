// XIA-85 — teardown SPA-safe: flip de prefers-reduced-motion N ciclos exercita
// stop()/start() (Lenis) + mm.revert() (coreografia). Assert: sem crescimento de
// pin-spacers/markers, scroll funcional após ciclos, sem reveal preso. Expõe
// ScrollTrigger.getAll().length se o app publicar em window (senão usa invariantes DOM).
import { chromium } from "playwright";
const URL = process.env.QA_URL || "http://localhost:3185";
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference" });
const page = await context.newPage();
await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForTimeout(800);

const snap = async () => page.evaluate(() => ({
  pinSpacers: document.querySelectorAll(".pin-spacer").length,
  markers: document.querySelectorAll('[class*="gsap-marker"]').length,
  gsapLive: document.documentElement.classList.contains("gsap-live"),
  stColon: (window.ScrollTrigger && window.ScrollTrigger.getAll) ? window.ScrollTrigger.getAll().length : "n/a",
}));

const cycles = [];
cycles.push({ phase: "init", ...(await snap()) });
for (let i = 0; i < 5; i++) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForTimeout(400);
  cycles.push({ phase: `reduce#${i}`, ...(await snap()) });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.waitForTimeout(400);
  cycles.push({ phase: `motion#${i}`, ...(await snap()) });
}
// scroll funcional após os ciclos?
const scrollOK = await page.evaluate(async () => {
  window.scrollTo(0, 0);
  window.dispatchEvent(new WheelEvent("wheel", { deltaY: 2000, bubbles: true }));
  await new Promise((r) => setTimeout(r, 600));
  const y1 = window.scrollY;
  window.scrollTo(0, document.documentElement.scrollHeight);
  await new Promise((r) => setTimeout(r, 800));
  const stuck = Array.from(document.querySelectorAll(".reveal, .reveal-item, #depoimentos li"))
    .filter((el) => getComputedStyle(el).opacity === "0" && el.getBoundingClientRect().top < window.innerHeight).length;
  return { scrolled: window.scrollY > 100, stuckAtBottom: stuck };
});

const spacerCounts = [...new Set(cycles.map((c) => c.pinSpacers))];
const markerCounts = [...new Set(cycles.map((c) => c.markers))];
const stCounts = cycles.map((c) => c.stColon ?? c.stColon);
const leakVerdict = spacerCounts.every((n) => n === 0) && markerCounts.every((n) => n === 0) && scrollOK.scrolled && scrollOK.stuckAtBottom === 0 ? "PASS" : "FAIL";
console.log(JSON.stringify({ cycles, scrollOK, spacerCounts, markerCounts, leakVerdict }, null, 2));
await context.close();
await browser.close();
