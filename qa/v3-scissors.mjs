// QA for the 3D scissors (change xiax-lp-v3-scissors-3d · design D9).
// Runs system Chrome (`channel: "chrome"`) against a production server and prints one
// PASS/FAIL line per check; exits 1 if any check fails.
//
//   NODE_ENV=production npm run build && npx next start -p 8811
//   QA_URL=http://localhost:8811 node qa/v3-scissors.mjs
//
// Where the scissors is on screen is read from pixels, not from the code (qa/lib/stage-harness.mjs).
import { chromium } from "playwright";

import { PHONE, checklist, drawsWhileHidden, median, noWebgl, open as openStage, paintedBox, rectOf, scrollToFraction } from "./lib/stage-harness.mjs";

/** The razor shares the canvas (xiax-lp-v3-razor-3d); it is kept out so pixels mean scissors. */
const RAZOR_ASSETS = /\/models\/razor/;
const open = (browser, opts = {}) => openStage(browser, { ...opts, block: RAZOR_ASSETS });
const WEIGHT_BUDGET_KB = 300;
/** Strings that survive minification in three.js and its glTF loader (lazy chunks only). */
const THREE_MARKERS = ["WebGLRenderer", "EXT_meshopt_compression"];
const LCP_BUDGET_MS = 100;
const LCP_RUNS = 3;

const { check, finish } = checklist();

async function desktopPhases(browser) {
  const { context, page, requests } = await open(browser);
  const canvasShown = await page.$eval("[data-scissors-canvas]", (c) => getComputedStyle(c).opacity === "1");
  check("desktop: canvas shown after idle", canvasShown);

  const anchor = await rectOf(page, "[data-scissors-anchor]");
  const atTop = await paintedBox(page, "[data-scissors-canvas]");
  const nearAnchor = atTop && anchor && Math.hypot(atTop.cx - anchor.cx, atTop.cy - anchor.cy) < 220;
  check("desktop: scissors painted around the hero anchor", nearAnchor, JSON.stringify(atTop));

  const under = atTop && (await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.tagName, [atTop.cx, atTop.cy]));
  check("desktop: clicks pass through the scissors", under && under !== "CANVAS" && under !== "IMG", `element under: ${under}`);

  await scrollToFraction(page, 0.5);
  const rail = await rectOf(page, "[data-scissors-rail]");
  const mid = await paintedBox(page, "[data-scissors-canvas]");
  check("desktop: scissors on the rail at 50% scroll", mid && rail && mid.cx >= rail.left && mid.cx <= rail.right, JSON.stringify({ mid, rail }));

  await scrollToFraction(page, 1);
  const footer = await rectOf(page, "footer");
  const end = await paintedBox(page, "[data-scissors-canvas]");
  check("desktop: scissors stops above the footer", end && footer && end.bottom <= footer.top + 2, JSON.stringify({ end, footerTop: footer?.top }));

  await scrollToFraction(page, 0);
  const back = await paintedBox(page, "[data-scissors-canvas]");
  const home = back && anchor && Math.hypot(back.cx - anchor.cx, back.cy - anchor.cy) < 220;
  check("desktop: scissors returns to the hero anchor when scrolled back up", home, JSON.stringify(back));

  await hiddenTab(page);
  await weight(requests);
  await context.close();
}

async function hiddenTab(page) {
  const { before, after } = await drawsWhileHidden(page);
  check("hidden tab: no frames drawn", after === before, `draws ${before} → ${after}`);
}

async function weight(requests) {
  let bytes = 0;
  const parts = [];
  for (const request of requests) {
    const url = request.url();
    const response = await request.response();
    if (!response) continue;
    const isModel = url.includes("/models/scissors");
    const text = url.endsWith(".js") ? await response.text() : "";
    const isThreeChunk = url.endsWith(".js") && THREE_MARKERS.some((m) => text.includes(m));
    if (!isModel && !isThreeChunk) continue;
    const size = (await request.sizes()).responseBodySize;
    bytes += size;
    parts.push(`${url.split("/").pop()} ${(size / 1024).toFixed(0)} KB`);
  }
  check(`weight: scissors requests ≤ ${WEIGHT_BUDGET_KB} KB`, bytes > 0 && bytes / 1024 <= WEIGHT_BUDGET_KB, `${(bytes / 1024).toFixed(0)} KB — ${parts.join(", ")}`);
}

const STATIC_CASES = [
  { label: "reduced motion", opts: { reducedMotion: "reduce" } },
  { label: "?reduced=1", opts: { query: "?reduced=1" } },
  { label: "no WebGL", opts: { init: [noWebgl] } },
];

async function staticDesktop(browser, { label, opts }) {
  const { context, page } = await open(browser, opts);
  const canvasHidden = await page.$eval("[data-scissors-canvas]", (c) => getComputedStyle(c).visibility === "hidden");
  check(`${label}: no live canvas`, canvasHidden);
  const still = await page.$eval("[data-scissors-still]", (img) => ({
    shown: getComputedStyle(img).opacity === "1" && img.complete && img.naturalWidth > 0,
    top: img.getBoundingClientRect().top,
  }));
  const rail = await rectOf(page, "[data-scissors-rail]");
  check(`${label}: still image at the top of the rail`, still.shown && rail && Math.abs(still.top - rail.top) <= 40, JSON.stringify({ still, railTop: rail?.top }));
  const lineOpacity = await page.$eval("[data-scissors-rail] > div", (line) => getComputedStyle(line).opacity);
  check(`${label}: full trail line on the rail`, Number(lineOpacity) > 0, `line opacity ${lineOpacity}`);
  await context.close();
}

async function staticPhone(browser) {
  const { context, page, requests } = await open(browser, { viewport: PHONE, phone: true, reducedMotion: "reduce" });
  const shown = await page.evaluate(() =>
    ["[data-scissors-canvas]", "[data-scissors-still]"].some((sel) => getComputedStyle(document.querySelector(sel)).visibility !== "hidden"),
  );
  const loadedModel = requests.some((r) => r.url().includes("scissors.glb"));
  check("reduced motion on a phone: no scissors and no model download", !shown && !loadedModel, `visible: ${shown}, glb: ${loadedModel}`);
  await context.close();
}

async function staticBranches(browser) {
  for (const branch of STATIC_CASES) await staticDesktop(browser, branch);
  await staticPhone(browser);
}

async function phoneBranch(browser) {
  const { context, page } = await open(browser, { viewport: PHONE, phone: true });
  await scrollToFraction(page, 0.3);
  const box = await paintedBox(page, "[data-scissors-canvas]");
  const bar = await rectOf(page, "[data-sticky-cta]");
  const barTop = bar && bar.top < PHONE.height ? bar.top : PHONE.height;
  const inCorner = box && box.left > PHONE.width / 2 && box.top > PHONE.height / 2 && box.bottom <= barTop;
  check("phone: scissors in the bottom-right corner above the CTA bar", inCorner, JSON.stringify({ box, barTop }));
  await context.close();
}

async function lcpOnce(browser, withoutScissors) {
  // No idle callback → the stage never imports three.js: the page "without the scissors".
  const init = withoutScissors ? [() => (window.requestIdleCallback = () => 0)] : [];
  const { context, page } = await open(browser, { init });
  const lcp = await page.evaluate(() => window.__lcp);
  await context.close();
  return lcp;
}

async function lcpCompare(browser) {
  const runs = { with: [], without: [] };
  for (let i = 0; i < LCP_RUNS; i += 1) {
    runs.with.push(await lcpOnce(browser, false));
    runs.without.push(await lcpOnce(browser, true));
  }
  const delta = median(runs.with) - median(runs.without);
  check(`LCP: at most +${LCP_BUDGET_MS} ms with the scissors`, delta <= LCP_BUDGET_MS, `median ${median(runs.with).toFixed(0)} vs ${median(runs.without).toFixed(0)} ms (Δ ${delta.toFixed(0)})`);
}

const browser = await chromium.launch({ channel: "chrome" });
try {
  await desktopPhases(browser);
  await staticBranches(browser);
  await phoneBranch(browser);
  await lcpCompare(browser);
} finally {
  await browser.close();
}
finish();
