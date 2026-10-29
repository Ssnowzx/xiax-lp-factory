// QA for the 3D razor's cut in "Como funciona" (change xiax-lp-v3-razor-3d · design D10).
// Runs system Chrome against `next start` of a copy of the build (the owner's dev server is
// never stopped) and prints one PASS/FAIL line per check; exits 1 if any check fails.
//
//   QA_URL=http://localhost:8811 node qa/v3-razor.mjs
//
// The razor shares the scissors' canvas. While it holds the stage the scissors are off screen
// (design D9), so what the canvas paints left of the scissors' rail is the razor; once it is
// gone, the scissors are back on the rail (qa/lib/stage-harness.mjs).
import { chromium } from "playwright";

import { DESKTOP, PHONE, checklist, drawsWhileHidden, median, noWebgl, open, paintedBox, rectOf, trackCls } from "./lib/stage-harness.mjs";

const CANVAS = "[data-scissors-canvas]";
const RAIL = "[data-scissors-rail]";
const STILL = "#como-funciona [data-razor-still]";
const THREAD = "#como-funciona [data-step-thread]";
const PHONE_LINE = "#como-funciona [data-cut-line]";
const FIRST_MEDALLION = "#como-funciona ol > li:first-of-type > span";
const RAZOR_ASSETS = /\/models\/razor/;
/** Mirrors lib/motion/motion-tokens.ts: RAZOR.approachFromVh / cutAtVh / cutS / exitS. */
const RAZOR = { approachFromVh: 1.05, cutAtVh: 0.6, cutS: 1.1, exitS: 0.45 };
const LAPTOPS = [DESKTOP, { width: 1366, height: 768 }, { width: 1280, height: 800 }];
const GLB_BUDGET_KB = 120;
const LCP_BUDGET_MS = 100;
const LCP_RUNS = 3;
/** Back-up samples, in order: over the last medallion, over the middle one, at the start. */
const BACK_UP_PATH = [0.4, 0.6, 0.97];
/** Least air between the hovering razor and the heading row above / the medallions below. */
const MIN_AIR_PX = 4;
/** The edge lies on the line while cutting (antialiasing and the 1 px line). */
const ON_LINE_PX = 8;
/** Time for the whole cut and exit to play out after the line's trigger. */
const CUT_DONE_MS = (RAZOR.cutS + RAZOR.exitS) * 1000 + 1200;
/** three.js reports the missing context itself when WebGL is off; that error is expected. */
const EXPECTED_ERROR = /WebGL/;

const { check, finish } = checklist();
const box = (b) => (b ? Object.fromEntries(Object.entries(b).map(([k, v]) => [k, Math.round(v)])) : null);
const rowBottom = (page) => page.evaluate(() => document.querySelector("#como-funciona h2").parentElement.getBoundingClientRect().bottom);

/** Records every canvas that got a WebGL context (window.__glCanvases). */
function countContexts() {
  window.__glCanvases = new Set();
  const original = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...args) {
    const ctx = original.call(this, type, ...args);
    if (ctx && String(type).startsWith("webgl")) window.__glCanvases.add(this);
    return ctx;
  };
}

/** The cut line in page px (layout offsets, transforms ignored) and how much of it is drawn. */
const lineOf = (page, selector) =>
  page.evaluate((sel) => {
    const el = document.querySelector(sel);
    let [left, top] = [0, 0];
    for (let node = el; node; node = node.offsetParent) [left, top] = [left + node.offsetLeft, top + node.offsetTop];
    const transform = getComputedStyle(el).transform;
    return { left, right: left + el.offsetWidth, y: top + el.offsetHeight / 2, drawn: transform === "none" ? 1 : new DOMMatrix(transform).a };
  }, selector);

/** Scrolls so the back-up has run the fraction `a` (0 = start, 1 = cut point, > 1 = past it). */
async function scrollToApproach(page, line, a, settleMs = 900) {
  const { height } = page.viewportSize();
  const top = line.y - height * (RAZOR.approachFromVh - a * (RAZOR.approachFromVh - RAZOR.cutAtVh));
  await page.evaluate((y) => window.scrollTo(0, y), top);
  await page.waitForTimeout(settleMs);
  return top;
}

/** What the canvas paints left of the rail (the razor) and on it (the scissors). */
async function stage(page) {
  const rail = await rectOf(page, RAIL);
  return { razor: await paintedBox(page, CANVAS, { maxX: rail.left - 1 }), scissors: await paintedBox(page, CANVAS, { minX: rail.left }) };
}

/** Back-up samples: the razor hovers between the heading and the medallions, scissors away. */
async function backUp(page, tag, line) {
  for (const a of BACK_UP_PATH) {
    await scrollToApproach(page, line, a);
    const { razor, scissors } = await stage(page);
    const [row, medallion] = [await rowBottom(page), await rectOf(page, FIRST_MEDALLION)];
    const clear = razor && razor.top >= row + MIN_AIR_PX && razor.bottom <= medallion.top - MIN_AIR_PX;
    check(`${tag} back-up a=${a}: razor below the heading and above the medallions`, clear, JSON.stringify({ razor: box(razor), row: Math.round(row), medallionTop: Math.round(medallion.top) }));
    check(`${tag} back-up a=${a}: no scissors on the rail`, !scissors, JSON.stringify(box(scissors)));
  }
  const { razor } = await stage(page);
  const under = razor && (await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.tagName, [razor.cx, razor.cy]));
  check(`${tag}: clicks pass through the razor`, under && under !== "CANVAS" && under !== "IMG", `element under: ${under}`);
  const nearStart = razor && razor.left < line.left && razor.right > line.left && razor.right - razor.left > 0.2 * (line.right - line.left);
  check(`${tag}: ready open (wide) at the start of the line`, nearStart, JSON.stringify({ razor: box(razor), lineLeft: line.left }));
}

/**
 * Scrolling back up before the cut undoes it: the stage paints exactly what the page without a
 * razor paints after the same scrolls (there the scissors may still be on their way from the
 * hero to the rail, and how they got there shows).
 */
async function retreat(browser, page, tag, line) {
  await scrollToApproach(page, line, -0.3, 1500);
  const withRazor = await paintedBox(page, CANVAS);
  const bare = await open(browser, { block: RAZOR_ASSETS });
  for (const a of BACK_UP_PATH) await scrollToApproach(bare.page, line, a);
  await scrollToApproach(bare.page, line, -0.3, 1500);
  const without = await paintedBox(bare.page, CANVAS);
  await bare.context.close();
  const same = withRazor && without && ["left", "top", "right", "bottom"].every((k) => Math.abs(withRazor[k] - without[k]) <= 6);
  check(`${tag}: scrolled back before the cut → only the scissors, as without the razor`, same, JSON.stringify({ withRazor: box(withRazor), without: box(without) }));
}

/** The cut: the edge rides the line, then the line is whole, the razor gone, scissors back. */
async function cut(page, tag, line) {
  await scrollToApproach(page, line, 0.97);
  const top = await scrollToApproach(page, line, 1.05, 650);
  const { razor } = await stage(page);
  const lineY = line.y - top;
  const onLine = razor && Math.abs(razor.bottom - lineY) <= ON_LINE_PX && razor.left > line.left;
  check(`${tag}: mid-cut the edge lies on the line, past its start`, onLine, JSON.stringify({ razor: box(razor), lineY: Math.round(lineY) }));
  await page.waitForTimeout(CUT_DONE_MS);
  const after = await stage(page);
  const drawn = (await lineOf(page, THREAD)).drawn;
  check(`${tag}: after the cut → line whole, no razor, scissors back`, drawn === 1 && !after.razor && after.scissors, JSON.stringify({ drawn, razor: box(after.razor), scissors: box(after.scissors) }));
  return after;
}

/** Whether every step screen is back at its first frame (its rising parts hidden). */
const screensAtStart = (page) =>
  page.evaluate(() => [...document.querySelectorAll("#como-funciona [data-step-in]")].every((el) => getComputedStyle(el).opacity === "0"));

/** Up past the section, out of sight: the line and the step screens are back at the start. */
async function rewoundBelow(page, tag, line, selector) {
  await scrollToApproach(page, line, -0.5, 1200);
  const { drawn } = await lineOf(page, selector);
  const screens = await screensAtStart(page);
  check(`${tag}: up past the section → line and step screens back at the start`, drawn === 0 && screens, JSON.stringify({ drawn, screens }));
}

/** Up past the section and down again: the razor backs up and cuts again (owner, 2026-10-28). */
async function replays(page, tag, line) {
  await rewoundBelow(page, tag, line, THREAD);
  for (const a of BACK_UP_PATH) await scrollToApproach(page, line, a);
  const { razor, scissors } = await stage(page);
  check(`${tag}: down again → the razor is back over the line, scissors away`, razor && !scissors, JSON.stringify({ razor: box(razor), scissors: box(scissors) }));
  await cut(page, `${tag} again`, line);
}

/** Back into the section from below: the line stays cut and no razor comes. */
async function noReplayFromBelow(page, tag, line) {
  await scrollToApproach(page, line, 4, 1200);
  await scrollToApproach(page, line, 0.97);
  const back = await stage(page);
  await scrollToApproach(page, line, 0.4);
  const later = await stage(page);
  const { drawn } = await lineOf(page, THREAD);
  check(`${tag}: back up from below → line stays cut, no razor`, drawn === 1 && !back.razor && !later.razor, JSON.stringify({ drawn, back: box(back.razor), later: box(later.razor) }));
}

async function desktop(browser, viewport) {
  const tag = `${viewport.width}×${viewport.height}`;
  const { context, page, errors } = await open(browser, { viewport, init: [countContexts, trackCls] });
  const line = await lineOf(page, THREAD);
  await backUp(page, tag, line);
  if (viewport === DESKTOP) await retreat(browser, page, tag, line);
  await cut(page, tag, line);
  if (viewport === DESKTOP) await replays(page, tag, line);
  if (viewport === DESKTOP) await noReplayFromBelow(page, tag, line);
  if (viewport === DESKTOP) await costs(page, errors);
  await context.close();
}

async function costs(page, errors) {
  const contexts = await page.evaluate(() => window.__glCanvases.size);
  check("one WebGL context for both tools", contexts === 1, `contexts: ${contexts}`);
  const cls = await page.evaluate(() => ({ cls: window.__cls, shifts: window.__shifts }));
  check("CLS 0 through the cut", cls.cls < 0.001, JSON.stringify(cls));
  check("no console errors", errors.length === 0, errors.slice(0, 3).join(" | "));
  const { before, after } = await drawsWhileHidden(page);
  check("hidden tab: no frames drawn", after === before, `draws ${before} → ${after}`);
}

/** Reloaded with the page already below the section: the line is drawn, no razor ever. */
async function reloadBelow(browser) {
  const { context, page } = await open(browser);
  const line = await lineOf(page, THREAD);
  await scrollToApproach(page, line, 3, 300);
  await page.reload({ waitUntil: "load" });
  await page.waitForTimeout(6000);
  const restored = await page.evaluate(() => window.scrollY);
  await scrollToApproach(page, line, 0.97);
  const { razor } = await stage(page);
  const { drawn } = await lineOf(page, THREAD);
  check("reloaded below the section → line drawn, no razor", restored > 0 && drawn === 1 && !razor, JSON.stringify({ restored, drawn, razor: box(razor) }));
  await scrollToApproach(page, line, -0.5, 1200);
  for (const a of BACK_UP_PATH) await scrollToApproach(page, line, a);
  const later = await stage(page);
  check("reloaded below, then up past and down again → the razor cuts", Boolean(later.razor), JSON.stringify({ razor: box(later.razor) }));
  await context.close();
}

async function phone(browser) {
  const { context, page } = await open(browser, { viewport: PHONE, phone: true });
  const line = await lineOf(page, PHONE_LINE);
  await scrollToApproach(page, line, 0.97);
  const ready = await paintedBox(page, CANVAS);
  const row = await rowBottom(page);
  const fits = ready && ready.left >= 0 && ready.right <= PHONE.width && ready.top >= row + MIN_AIR_PX;
  check("phone: razor over the hairline, below the heading, inside the screen", fits, JSON.stringify({ ready: box(ready), row: Math.round(row) }));
  await scrollToApproach(page, line, 1.05, CUT_DONE_MS);
  const after = await paintedBox(page, CANVAS);
  const { drawn } = await lineOf(page, PHONE_LINE);
  const cornerOnly = after && after.left > PHONE.width / 2 && after.top > PHONE.height / 2;
  check("phone: after the cut → hairline whole, only the scissors in the corner", drawn === 1 && cornerOnly, JSON.stringify({ drawn, after: box(after) }));
  await rewoundBelow(page, "phone", line, PHONE_LINE);
  await scrollToApproach(page, line, 0.97);
  const again = await paintedBox(page, CANVAS);
  const fitsAgain = again && again.left >= 0 && again.right <= PHONE.width && again.top >= (await rowBottom(page)) + MIN_AIR_PX;
  check("phone: down again → the razor is back over the hairline", fitsAgain, JSON.stringify({ again: box(again) }));
  await context.close();
}

const STATIC_CASES = [
  { label: "reduced motion", opts: { reducedMotion: "reduce" }, line: THREAD },
  { label: "?reduced=1", opts: { query: "?reduced=1" }, line: THREAD },
  { label: "no WebGL", opts: { init: [noWebgl] }, line: THREAD },
  { label: "reduced motion on a phone", opts: { reducedMotion: "reduce", viewport: PHONE, phone: true }, line: PHONE_LINE },
];

/** The still lies on the right end of the drawn line and moves with the page. */
async function still(browser, { label, opts, line: selector }) {
  const { context, page, requests, errors } = await open(browser, opts);
  // Without WebGL the motion still runs: the line draws at its trigger, so read it after.
  const top = await scrollToApproach(page, await lineOf(page, selector), 1.05, CUT_DONE_MS);
  const line = await lineOf(page, selector);
  const shot = () => page.$eval(STILL, (img) => ({ ...img.getBoundingClientRect().toJSON(), shown: getComputedStyle(img).opacity === "1" && img.complete && img.naturalWidth > 0 }));
  const at = await shot();
  const lineY = line.y - top;
  const onEnd = at.shown && Math.abs(at.right - line.right) <= 16 && at.top < lineY && at.bottom > lineY;
  check(`${label}: still on the right end of the drawn line`, onEnd && line.drawn === 1, JSON.stringify({ still: box(at), lineRight: line.right, lineY: Math.round(lineY), drawn: line.drawn }));
  await page.evaluate(() => window.scrollBy(0, 120));
  await page.waitForTimeout(400);
  const moved = await shot();
  check(`${label}: still moves with the page`, Math.abs(at.top - moved.top - 120) <= 2, `top ${Math.round(at.top)} → ${Math.round(moved.top)}`);
  const glb = requests.some((r) => r.url().includes("razor.glb"));
  const unexpected = errors.filter((e) => !EXPECTED_ERROR.test(e));
  check(`${label}: no razor.glb, no console errors`, !glb && unexpected.length === 0, `glb: ${glb}; ${unexpected.slice(0, 2).join(" | ")}`);
  await context.close();
}

async function weight(browser) {
  const { context, requests } = await open(browser);
  const glb = requests.find((r) => r.url().endsWith("/models/razor.glb"));
  const size = glb && (await glb.sizes()).responseBodySize;
  check(`weight: razor.glb ≤ ${GLB_BUDGET_KB} KB`, size > 0 && size / 1024 <= GLB_BUDGET_KB, `${((size ?? 0) / 1024).toFixed(1)} KB`);
  await context.close();
}

async function lcpOnce(browser, withoutRazor) {
  const { context, page } = await open(browser, withoutRazor ? { block: RAZOR_ASSETS } : {});
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
  check(`LCP: at most +${LCP_BUDGET_MS} ms with the razor`, delta <= LCP_BUDGET_MS, `median ${median(runs.with).toFixed(0)} vs ${median(runs.without).toFixed(0)} ms (Δ ${delta.toFixed(0)})`);
}

const browser = await chromium.launch({ channel: "chrome" });
try {
  for (const viewport of LAPTOPS) await desktop(browser, viewport);
  await reloadBelow(browser);
  await phone(browser);
  for (const branch of STATIC_CASES) await still(browser, branch);
  await weight(browser);
  await lcpCompare(browser);
} finally {
  await browser.close();
}
finish();
