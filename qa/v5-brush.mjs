// QA for the 3D round brush's pass in "Como funciona" on the salon page (change xiax-lp-v5-salon ·
// design D7/D12 · task 9.3), in the pattern of qa/v3-razor.mjs. Runs system Chrome against
// `next start` of a copy of the build (the owner's dev server is never stopped) and prints one
// PASS/FAIL line per check; exits 1 if any check fails. With QA_OUT, it also saves the steps
// section mid-sweep and at rest (reduced motion) at 1440 and 390 px.
//
//   QA_URL=http://localhost:8812 [QA_OUT=/tmp/v5-brush] node qa/v5-brush.mjs
//
// The brush shares the scissors' canvas. While it holds the stage the scissors are off screen,
// so what the canvas paints left of the scissors' rail is the brush; once it is gone, the
// scissors are back on the rail (qa/lib/stage-harness.mjs).
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

import { DESKTOP, PHONE, checklist, drawsWhileHidden, median, noWebgl, open, paintedBox, rectOf, trackCls } from "./lib/stage-harness.mjs";

const SALON = "/salao";
const CANVAS = "[data-scissors-canvas]";
const RAIL = "[data-scissors-rail]";
const STILL = "#como-funciona [data-brush-still]";
const THREAD = "#como-funciona [data-step-thread]";
const PHONE_LINE = "#como-funciona [data-cut-line]";
const FIRST_MEDALLION = "#como-funciona ol > li:first-of-type > span";
const BRUSH_ASSETS = /\/models\/brush/;
const RAZOR_ASSETS = /\/models\/razor/;
/** Mirrors lib/motion/motion-tokens.ts: BRUSH.approachFromVh / cutAtVh / sweepS / exitS, and the
 *  thread's clearance over the medallions (RAZOR.threadClearPx, the same for both tools). */
const BRUSH = { approachFromVh: 1.05, cutAtVh: 0.6, sweepS: 1.6, exitS: 0.45 };
const THREAD_CLEAR_PX = 36;
const LAPTOPS = [DESKTOP, { width: 1366, height: 768 }, { width: 1280, height: 800 }];
const GLB_BUDGET_KB = 120;
const LCP_BUDGET_MS = 100;
const LCP_RUNS = 3;
/** Approach samples, in order: over the last medallion, over the middle one, at the start. */
const APPROACH_PATH = [0.4, 0.6, 0.97];
/** Least air between the brush and the heading row above / the medallions below. */
const MIN_AIR_PX = 4;
/** The bristle tips ride their line (antialiasing and the 1 px line). */
const ON_LINE_PX = 8;
/** First look during the sweep (ms after the line's trigger); the second follows right after it
 *  (one look takes ~0.3 s of screenshots), and the brush must have rolled right in between. */
const FIRST_LOOK_MS = 400;
/** Approach at which the brush has rolled in past the right edge, just in from it. */
const ENTERING_AT = 0.25;
/** Time for the whole sweep and exit to play out after the line's trigger. */
const SWEEP_DONE_MS = (BRUSH.sweepS + BRUSH.exitS) * 1000 + 1200;
/** Ways down in a row that must each replay the sweep (owner: every way down, not once). */
const REPLAYS = 2;
/** Mirrors lib/motion/still-frame.ts BRUSH_STILL_FRAME: the render's height (px), its margin
 *  above the barrel top, and its margin beside the bristle tips (half width − 0.1368 · 640). */
const STILL_FRAME = { heightPx: 705, topMarginPx: 32, sideMarginPx: 32.4 };
/** three.js reports the missing context itself when WebGL is off; that error is expected. */
const EXPECTED_ERROR = /WebGL/;
const OUT = process.env.QA_OUT;

const { check, finish } = checklist();
const box = (b) => (b ? Object.fromEntries(Object.entries(b).map(([k, v]) => [k, Math.round(v)])) : null);
const rowBottom = (page) => page.evaluate(() => document.querySelector("#como-funciona h2").parentElement.getBoundingClientRect().bottom);
const salon = (opts = {}) => ({ ...opts, query: `${SALON}${opts.query ?? ""}` });

async function save(page, name) {
  if (!OUT) return;
  await mkdir(OUT, { recursive: true });
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
}

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

/** The line in page px (layout offsets, transforms ignored) and how much of it is drawn. */
const lineOf = (page, selector) =>
  page.evaluate((sel) => {
    const el = document.querySelector(sel);
    let [left, top] = [0, 0];
    for (let node = el; node; node = node.offsetParent) [left, top] = [left + node.offsetLeft, top + node.offsetTop];
    const transform = getComputedStyle(el).transform;
    return { left, right: left + el.offsetWidth, y: top + el.offsetHeight / 2, drawn: transform === "none" ? 1 : new DOMMatrix(transform).a };
  }, selector);

/** Scrolls so the approach has run the fraction `a` (0 = start, 1 = landing point, > 1 = past it). */
async function scrollToApproach(page, line, a, settleMs = 900) {
  const { height } = page.viewportSize();
  const top = line.y - height * (BRUSH.approachFromVh - a * (BRUSH.approachFromVh - BRUSH.cutAtVh));
  await page.evaluate((y) => window.scrollTo(0, y), top);
  await page.waitForTimeout(settleMs);
  return top;
}

/** What the canvas paints left of the rail (the brush) and on it (the scissors). */
async function stage(page) {
  const rail = await rectOf(page, RAIL);
  return { brush: await paintedBox(page, CANVAS, { maxX: rail.left - 1 }), scissors: await paintedBox(page, CANVAS, { minX: rail.left }) };
}

/** Between the heading row and the medallions, with air on both sides. */
async function uncovered(page, brush) {
  const [row, medallion] = [await rowBottom(page), await rectOf(page, FIRST_MEDALLION)];
  const ok = brush && brush.top >= row + MIN_AIR_PX && brush.bottom <= medallion.top - MIN_AIR_PX;
  return { ok, detail: JSON.stringify({ brush: box(brush), row: Math.round(row), medallionTop: Math.round(medallion.top) }) };
}

/** Entry: in from the right edge, then hovering between the heading and the medallions. */
async function approach(page, tag, line) {
  await scrollToApproach(page, line, ENTERING_AT);
  const rail = await rectOf(page, RAIL);
  const entering = (await stage(page)).brush;
  check(`${tag} entry: the brush comes in from the right edge`, entering && entering.right >= rail.left - 3 && entering.left > line.right * 0.6, JSON.stringify({ brush: box(entering), railLeft: Math.round(rail.left) }));
  for (const a of APPROACH_PATH) {
    await scrollToApproach(page, line, a);
    const { brush, scissors } = await stage(page);
    const { ok, detail } = await uncovered(page, brush);
    check(`${tag} approach a=${a}: brush below the heading and above the medallions`, ok, detail);
    check(`${tag} approach a=${a}: no scissors on the rail`, !scissors, JSON.stringify(box(scissors)));
  }
  const { brush } = await stage(page);
  const under = brush && (await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.tagName, [brush.cx, brush.cy]));
  check(`${tag}: clicks pass through the brush`, under && under !== "CANVAS" && under !== "IMG", `element under: ${under}`);
  const atStart = brush && brush.left >= 0 && brush.left < line.left + 8 && brush.right > line.left;
  check(`${tag}: waits at the start of the line, handle on screen`, atStart, JSON.stringify({ brush: box(brush), lineLeft: line.left }));
}

/** Scrolling back up before the sweep undoes it: only the scissors, as on a page without it. */
async function retreat(browser, page, tag, line) {
  await scrollToApproach(page, line, -0.3, 1500);
  const withBrush = await paintedBox(page, CANVAS);
  const bare = await open(browser, salon({ block: BRUSH_ASSETS }));
  for (const a of APPROACH_PATH) await scrollToApproach(bare.page, line, a);
  await scrollToApproach(bare.page, line, -0.3, 1500);
  const without = await paintedBox(bare.page, CANVAS);
  await bare.context.close();
  const same = withBrush && without && ["left", "top", "right", "bottom"].every((k) => Math.abs(withBrush[k] - without[k]) <= 6);
  check(`${tag}: scrolled back before the sweep → only the scissors, as without the brush`, same, JSON.stringify({ withBrush: box(withBrush), without: box(without) }));
}

/** The sweep: the bristles ride the line's clearance and roll right, nothing covered; then the
 *  line is whole, the brush gone and the scissors back. */
async function sweep(page, tag, line, shot = null) {
  await scrollToApproach(page, line, 0.97);
  const top = await scrollToApproach(page, line, 1.05, FIRST_LOOK_MS);
  const first = (await stage(page)).brush;
  if (shot) await save(page, shot);
  const { brush: second, scissors } = await stage(page);
  const rideY = line.y - top - THREAD_CLEAR_PX;
  const riding = [first, second].every((b) => b && Math.abs(b.bottom - rideY) <= ON_LINE_PX);
  check(`${tag}: mid-sweep the bristles ride the line, clear of the medallions`, riding, JSON.stringify({ first: box(first), second: box(second), rideY: Math.round(rideY) }));
  check(`${tag}: mid-sweep it rolls to the right, scissors away`, first && second && second.cx > first.cx + 20 && !scissors, JSON.stringify({ from: first && Math.round(first.cx), to: second && Math.round(second.cx), scissors: box(scissors) }));
  const { ok, detail } = await uncovered(page, second);
  check(`${tag}: mid-sweep the title and the numbers stay uncovered`, ok, detail);
  await page.waitForTimeout(SWEEP_DONE_MS);
  const after = await stage(page);
  const { drawn } = await lineOf(page, THREAD);
  check(`${tag}: after the sweep → line whole, no brush, scissors back`, drawn === 1 && !after.brush && after.scissors, JSON.stringify({ drawn, brush: box(after.brush), scissors: box(after.scissors) }));
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

/** Every way down plays it again (owner, 2026-10-28): up past the section, down, sweep — twice. */
async function replays(page, tag, line) {
  for (let i = 1; i <= REPLAYS; i += 1) {
    await rewoundBelow(page, `${tag} replay ${i}`, line, THREAD);
    for (const a of APPROACH_PATH) await scrollToApproach(page, line, a);
    const { brush, scissors } = await stage(page);
    check(`${tag} replay ${i}: down again → the brush is back over the line, scissors away`, brush && !scissors, JSON.stringify({ brush: box(brush), scissors: box(scissors) }));
    await sweep(page, `${tag} replay ${i}`, line);
  }
}

/** Back into the section from below: the line stays drawn and no brush comes. */
async function noReplayFromBelow(page, tag, line) {
  await scrollToApproach(page, line, 4, 1200);
  await scrollToApproach(page, line, 0.97);
  const back = await stage(page);
  await scrollToApproach(page, line, 0.4);
  const later = await stage(page);
  const { drawn } = await lineOf(page, THREAD);
  check(`${tag}: back up from below → line stays drawn, no brush`, drawn === 1 && !back.brush && !later.brush, JSON.stringify({ drawn, back: box(back.brush), later: box(later.brush) }));
}

async function costs(page, errors, requests) {
  const contexts = await page.evaluate(() => window.__glCanvases.size);
  check("one WebGL context for the scissors and the brush", contexts === 1, `contexts: ${contexts}`);
  const cls = await page.evaluate(() => ({ cls: window.__cls, shifts: window.__shifts }));
  check("CLS 0 through the sweep", cls.cls === 0, JSON.stringify(cls));
  check("no console errors", errors.length === 0, errors.slice(0, 3).join(" | "));
  const razor = requests.filter((r) => RAZOR_ASSETS.test(r.url())).map((r) => r.url());
  check("salon page: no razor file fetched", razor.length === 0, razor.join(", "));
  const { before, after } = await drawsWhileHidden(page);
  check("hidden tab: no frames drawn", after === before, `draws ${before} → ${after}`);
}

async function desktop(browser, viewport) {
  const tag = `${viewport.width}×${viewport.height}`;
  const { context, page, errors, requests } = await open(browser, salon({ viewport, init: [countContexts, trackCls] }));
  const line = await lineOf(page, THREAD);
  await approach(page, tag, line);
  if (viewport === DESKTOP) await retreat(browser, page, tag, line);
  await sweep(page, tag, line, viewport === DESKTOP ? `brush-mid-${viewport.width}` : null);
  if (viewport === DESKTOP) await replays(page, tag, line);
  if (viewport === DESKTOP) await noReplayFromBelow(page, tag, line);
  if (viewport === DESKTOP) await costs(page, errors, requests);
  await context.close();
}

/** The phone: the brush rolls on the thin line under the heading, on screen, scissors away. */
async function phoneLook(page, tag, line, shot = null) {
  await scrollToApproach(page, line, 0.97);
  const ready = await paintedBox(page, CANVAS);
  const row = await rowBottom(page);
  const fits = ready && ready.left >= 0 && ready.right <= PHONE.width && ready.top >= row + MIN_AIR_PX;
  check(`${tag}: brush over the thin line, below the heading, inside the screen`, fits, JSON.stringify({ ready: box(ready), row: Math.round(row) }));
  const top = await scrollToApproach(page, line, 1.05, FIRST_LOOK_MS);
  const mid = await paintedBox(page, CANVAS);
  if (shot) await save(page, shot);
  const lineY = line.y - top;
  const onLine = mid && Math.abs(mid.bottom - lineY) <= ON_LINE_PX && mid.top >= (await rowBottom(page)) + MIN_AIR_PX && mid.right <= PHONE.width;
  check(`${tag}: mid-sweep the bristles roll on the thin line, nothing else painted (scissors away)`, onLine, JSON.stringify({ mid: box(mid), lineY: Math.round(lineY) }));
  await page.waitForTimeout(SWEEP_DONE_MS);
  const after = await paintedBox(page, CANVAS);
  const { drawn } = await lineOf(page, PHONE_LINE);
  const cornerOnly = after && after.left > PHONE.width / 2 && after.top > PHONE.height / 2;
  check(`${tag}: after the sweep → thin line whole, only the scissors in the corner`, drawn === 1 && cornerOnly, JSON.stringify({ drawn, after: box(after) }));
}

async function phone(browser) {
  const { context, page } = await open(browser, salon({ viewport: PHONE, phone: true }));
  const line = await lineOf(page, PHONE_LINE);
  await phoneLook(page, "phone", line, `brush-mid-${PHONE.width}`);
  for (let i = 1; i <= REPLAYS; i += 1) {
    await rewoundBelow(page, `phone replay ${i}`, line, PHONE_LINE);
    await phoneLook(page, `phone replay ${i}`, line);
  }
  await context.close();
}

const STATIC_CASES = [
  { label: "reduced motion", opts: { reducedMotion: "reduce" }, line: THREAD, clearPx: THREAD_CLEAR_PX, shot: `brush-rest-${DESKTOP.width}` },
  { label: "?reduced=1", opts: { query: "?reduced=1" }, line: THREAD, clearPx: THREAD_CLEAR_PX },
  { label: "no WebGL", opts: { init: [noWebgl] }, line: THREAD, clearPx: THREAD_CLEAR_PX },
  { label: "reduced motion on a phone", opts: { reducedMotion: "reduce", viewport: PHONE, phone: true }, line: PHONE_LINE, clearPx: 0, shot: `brush-rest-${PHONE.width}` },
];

/**
 * Where the still paints, from its box and the render's margins. Laid on the line it is turned a
 * quarter turn clockwise: the render's top margin is on the right, its side margins above and
 * below. (Not read from pixels: under real reduced motion the hidden-page shots of the harness
 * do not settle, so a diff of them is noise.)
 */
const stillPainted = (page) =>
  page.$eval(
    STILL,
    (img, frame) => {
      const r = img.getBoundingClientRect();
      const s = r.width / frame.heightPx;
      const shown = getComputedStyle(img).opacity === "1" && img.complete && img.naturalWidth > 0;
      return shown ? { left: r.left, top: r.top + frame.sideMarginPx * s, right: r.right - frame.topMarginPx * s, bottom: r.bottom - frame.sideMarginPx * s } : null;
    },
    STILL_FRAME,
  );

/** The still rests on the right end of the fully drawn line, and moves with the page. */
async function still(browser, { label, opts, line: selector, clearPx, shot }) {
  const { context, page, requests, errors } = await open(browser, salon(opts));
  // Without WebGL the motion still runs: the line draws at its trigger, so read it after.
  const top = await scrollToApproach(page, await lineOf(page, selector), 1.05, SWEEP_DONE_MS);
  const line = await lineOf(page, selector);
  const at = await stillPainted(page);
  if (shot) await save(page, shot);
  const restY = line.y - top - clearPx;
  const onEnd = at && Math.abs(at.right - line.right) <= ON_LINE_PX && Math.abs(at.bottom - restY) <= ON_LINE_PX && at.top >= (await rowBottom(page)) + MIN_AIR_PX;
  check(`${label}: still at rest on the right end of the whole line`, onEnd && line.drawn === 1, JSON.stringify({ still: box(at), lineRight: line.right, restY: Math.round(restY), drawn: line.drawn }));
  const rect = () => page.$eval(STILL, (img) => img.getBoundingClientRect().top);
  const before = await rect();
  await page.evaluate(() => window.scrollBy(0, 120));
  await page.waitForTimeout(400);
  const after = await rect();
  check(`${label}: still moves with the page`, Math.abs(before - after - 120) <= 2, `top ${Math.round(before)} → ${Math.round(after)}`);
  const fetched = requests.map((r) => r.url()).filter((u) => /\/models\/(brush|razor)\.glb|razor-still/.test(u));
  const unexpected = errors.filter((e) => !EXPECTED_ERROR.test(e));
  check(`${label}: no 3D tool model, no razor still, no console errors`, fetched.length === 0 && unexpected.length === 0, `${fetched.join(", ")}; ${unexpected.slice(0, 2).join(" | ")}`);
  await context.close();
}

/** The barbershop page keeps its razor and never fetches the brush. */
async function barbershopUntouched(browser) {
  const { context, requests } = await open(browser);
  const urls = requests.map((r) => r.url());
  const brush = urls.filter((u) => BRUSH_ASSETS.test(u));
  check("barbershop page: razor.glb fetched, no brush file", urls.some((u) => u.endsWith("/models/razor.glb")) && brush.length === 0, brush.join(", "));
  await context.close();
}

async function weight(browser) {
  const { context, requests } = await open(browser, salon());
  const glb = requests.find((r) => r.url().endsWith("/models/brush.glb"));
  const size = glb && (await glb.sizes()).responseBodySize;
  check(`weight: brush.glb ≤ ${GLB_BUDGET_KB} KB`, size > 0 && size / 1024 <= GLB_BUDGET_KB, `${((size ?? 0) / 1024).toFixed(1)} KB`);
  await context.close();
}

async function lcpOnce(browser, withoutBrush) {
  const { context, page } = await open(browser, salon(withoutBrush ? { block: BRUSH_ASSETS } : {}));
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
  check(`LCP: at most +${LCP_BUDGET_MS} ms with the brush`, delta <= LCP_BUDGET_MS, `median ${median(runs.with).toFixed(0)} vs ${median(runs.without).toFixed(0)} ms (Δ ${delta.toFixed(0)})`);
}

const browser = await chromium.launch({ channel: "chrome" });
try {
  for (const viewport of LAPTOPS) await desktop(browser, viewport);
  await phone(browser);
  for (const branch of STATIC_CASES) await still(browser, branch);
  await barbershopUntouched(browser);
  await weight(browser);
  await lcpCompare(browser);
} finally {
  await browser.close();
}
finish();
