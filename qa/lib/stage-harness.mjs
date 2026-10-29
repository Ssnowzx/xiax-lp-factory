// Shared harness for the 3D stage QA (qa/v3-scissors.mjs, qa/v3-razor.mjs): opens the page in
// system Chrome with probes installed, and reads where a WebGL layer paints from pixels — every
// other element is hidden, then the layer is shot visible vs hidden and the two are diffed.
import sharp from "sharp";

export const URL = process.env.QA_URL || "http://localhost:8811";
export const DESKTOP = { width: 1440, height: 900 };
export const PHONE = { width: 390, height: 844 };
const SETTLE_MS = 6000;

/** Counts WebGL draw calls, so "no frames while hidden" is measurable. */
export function countDraws() {
  window.__draws = 0;
  for (const Ctx of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) {
    if (!Ctx) continue;
    for (const fn of ["drawArrays", "drawElements", "drawArraysInstanced", "drawElementsInstanced"]) {
      const original = Ctx.prototype[fn];
      if (!original) continue;
      Ctx.prototype[fn] = function (...args) {
        window.__draws += 1;
        return original.apply(this, args);
      };
    }
  }
}

export function trackLcp() {
  window.__lcp = 0;
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) window.__lcp = entry.startTime;
  }).observe({ type: "largest-contentful-paint", buffered: true });
}

/** `block` aborts matching requests (e.g. the razor model, to measure the scissors alone). */
export async function open(browser, { viewport = DESKTOP, reducedMotion = "no-preference", init = [], phone = false, query = "", block = null } = {}) {
  // A phone is touch-only (no fine pointer): a plain narrow desktop window would hide bugs.
  const device = phone ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { deviceScaleFactor: 1 };
  const context = await browser.newContext({ viewport, reducedMotion, ...device });
  if (block) await context.route(block, (route) => route.abort());
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  page.on("pageerror", (error) => errors.push(error.message));
  for (const script of [countDraws, trackLcp, ...init]) await page.addInitScript(script);
  const requests = [];
  // Every request sent, not only finished ones: "no download" must also catch a 404 or abort.
  page.on("request", (request) => requests.push(request));
  await page.goto(`${URL}${query}`, { waitUntil: "load" });
  await page.waitForTimeout(SETTLE_MS);
  return { context, page, requests, errors };
}

/**
 * Bounding box (viewport px) of what the given layer paints, or null when it paints nothing.
 * `region` ({ minX, maxX } in CSS px) keeps only pixels inside that vertical band.
 */
export async function paintedBox(page, selector, region = null) {
  // Inline styles are saved and put back: the stage drives the layer's visibility inline.
  await page.evaluate((sel) => {
    window.__saved = [document.body.style.visibility, document.querySelector(sel).style.visibility];
    document.body.style.visibility = "hidden";
  }, selector);
  const shoot = (visible) =>
    page
      .evaluate(([sel, show]) => (document.querySelector(sel).style.visibility = show ? "visible" : "hidden"), [selector, visible])
      .then(() => page.screenshot());
  const withLayer = await shoot(true);
  const without = await shoot(false);
  await page.evaluate((sel) => {
    [document.body.style.visibility, document.querySelector(sel).style.visibility] = window.__saved;
  }, selector);
  return diffBox(withLayer, without, page.viewportSize().width, region);
}

/** Box of the pixels that differ, in CSS px (screenshots are in device px). */
async function diffBox(a, b, viewportWidth, region) {
  const [ra, rb] = await Promise.all([a, b].map((png) => sharp(png).raw().toBuffer({ resolveWithObject: true })));
  const { width, height, channels } = ra.info;
  const dpr = width / viewportWidth;
  const minX = region?.minX != null ? Math.ceil(region.minX * dpr) : 0;
  const maxX = region?.maxX != null ? Math.floor(region.maxX * dpr) : width - 1;
  let box = null;
  for (let y = 0; y < height; y += 1) {
    for (let x = Math.max(0, minX); x <= Math.min(width - 1, maxX); x += 1) {
      const i = (y * width + x) * channels;
      const delta = Math.abs(ra.data[i] - rb.data[i]) + Math.abs(ra.data[i + 1] - rb.data[i + 1]) + Math.abs(ra.data[i + 2] - rb.data[i + 2]);
      if (delta < 24) continue;
      box = box
        ? { left: Math.min(box.left, x), top: Math.min(box.top, y), right: Math.max(box.right, x), bottom: Math.max(box.bottom, y) }
        : { left: x, top: y, right: x, bottom: y };
    }
  }
  if (!box) return null;
  const css = Object.fromEntries(Object.entries(box).map(([k, v]) => [k, v / dpr]));
  return { ...css, cx: (css.left + css.right) / 2, cy: (css.top + css.bottom) / 2 };
}

export const rectOf = (page, selector) =>
  page.evaluate((sel) => {
    const r = document.querySelector(sel)?.getBoundingClientRect();
    return r ? { left: r.left, top: r.top, right: r.right, bottom: r.bottom, cx: r.left + r.width / 2, cy: r.top + r.height / 2 } : null;
  }, selector);

export async function scrollToFraction(page, fraction) {
  await page.evaluate((f) => window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * f), fraction);
  await page.waitForTimeout(1500);
}

/** No WebGL at all: every context request fails, as on a blocklisted GPU. */
export function noWebgl() {
  const original = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...args) {
    return String(type).startsWith("webgl") ? null : original.call(this, type, ...args);
  };
}

/** Hides the tab, scrolls, and returns the WebGL draw count before and after. */
export async function drawsWhileHidden(page) {
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  const before = await page.evaluate(() => window.__draws);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1500);
  const after = await page.evaluate(() => window.__draws);
  return { before, after };
}

/** Sums layout shifts (window.__cls) and notes the section of each (window.__shifts). */
export function trackCls() {
  window.__cls = 0;
  window.__shifts = [];
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.hadRecentInput) continue;
      window.__cls += entry.value;
      const node = entry.sources[0]?.node;
      const el = node?.nodeType === 1 ? node : node?.parentElement;
      window.__shifts.push(`${entry.value.toFixed(4)} in #${el?.closest("section")?.id ?? "?"}`);
    }
  }).observe({ type: "layout-shift", buffered: true });
}

export const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

/** PASS/FAIL list: `check` records one line, `finish` prints them all and sets the exit code. */
export function checklist() {
  const results = [];
  return {
    check: (name, ok, detail = "") => results.push({ name, ok: Boolean(ok), detail }),
    finish() {
      for (const r of results) process.stdout.write(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.detail ? `  — ${r.detail}` : ""}\n`);
      process.exit(results.every((r) => r.ok) ? 0 : 1);
    },
  };
}
