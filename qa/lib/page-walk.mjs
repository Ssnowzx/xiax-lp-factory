// Shared helpers for the v5 page baselines (qa/v5-text-baseline.mjs, qa/v5-shots.mjs): opens a
// page as a phone or a laptop and walks it top to bottom so every reveal, count-up and lazy
// image has played before anything is read.
export const URL = process.env.QA_URL || "http://localhost:8811";
export const WIDTHS = [390, 1440];

const HEIGHT = { 390: 844, 1440: 900 };
const STEP_PAUSE_MS = 250;
const SETTLE_MS = 2500;

/** A phone is touch-only (no fine pointer), as in qa/lib/stage-harness.mjs. */
export async function openAt(browser, path, width, { reducedMotion = "no-preference" } = {}) {
  const phone = width < 768;
  const context = await browser.newContext({
    viewport: { width, height: HEIGHT[width] ?? 900 },
    reducedMotion,
    deviceScaleFactor: 1,
    ...(phone ? { isMobile: true, hasTouch: true } : {}),
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  await page.goto(`${URL}${path}`, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  return { context, page, errors };
}

/** Scrolls down one screen at a time to the bottom, so each section's entrance plays. */
export async function walkDown(page) {
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  const step = page.viewportSize().height * 0.6;
  for (let y = 0; y <= total; y += step) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(STEP_PAUSE_MS);
  }
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(SETTLE_MS);
}

/** Waits until every <img> on the page has finished loading (or failed). */
export async function imagesLoaded(page) {
  await page.waitForFunction(() => [...document.images].every((img) => img.complete), null, { timeout: 30000 });
}

export const slugOf = (path) => (path === "/" ? "home" : path.replace(/^\/|\/$/g, "").replace(/\//g, "-"));

/**
 * Opens the FAQ answers one at a time (the accordion keeps one open and only mounts the open
 * answer) and calls `read` with each open, so a check sees every answer's text.
 */
export async function eachFaqAnswer(page, read) {
  const triggers = page.locator("#faq button[aria-expanded]");
  const count = await triggers.count();
  for (let i = 0; i < count; i += 1) {
    const trigger = triggers.nth(i);
    if ((await trigger.getAttribute("aria-expanded")) !== "true") await trigger.click();
    await page.waitForTimeout(350);
    await read(i);
  }
}
