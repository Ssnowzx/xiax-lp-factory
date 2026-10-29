/**
 * Real Xchair screens → retina masters (change xiax-lp-v4-xchair · design D2).
 *
 * The owner's design canvas (claude.ai artifact "Xchair — Luxo editorial") holds the app's
 * real screens as `.dc.html` artboards. Serve a local copy of that canvas (artboards under
 * `project/`, the canvas runtime as `project/support.js`, images under `_blob/<id>.jpg`; see ARTBOARDS for the salon overlay)
 * and run:
 *
 *   node scripts/capture-screens.mjs http://127.0.0.1:8822 assets/screens-src
 *
 * Each artboard is shot at the width it was designed for, at device scale factor 2 — never
 * upscaled. `scripts/optimize-screens.mjs` crops the masters into the page's slots.
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

/**
 * Artboards used by the pages. `SalonHome` is the owner's own artboard; the `Salon*` boards live in
 * `assets/screens-src/canvas-salon/` (copies of the barbershop boards with salon example data,
 * change xiax-lp-v5-salon · design D5). Serve those next to the canvas: `/project/<file>` must
 * resolve the salon copies first, then the canvas artboards and `support.js`; `/_blob/<id>` must
 * resolve with or without `.jpg` (photos in `assets/screens-src/blobs/` for the salon home).
 */
const ARTBOARDS = [
  { file: "Main.dc.html", out: "barbershop-home", width: 390, height: 844 },
  { file: "TimeChoice.dc.html", out: "time-choice", width: 390, height: 844 },
  { file: "Confirmed.dc.html", out: "confirmed", width: 390, height: 844 },
  { file: "AdminAgenda.dc.html", out: "day-agenda", width: 1440, height: 1160 },
  { file: "AdminDashboard.dc.html", out: "month-results", width: 1440, height: 1640 },
  { file: "SalonHome.dc.html", out: "salon-home", width: 390, height: 844 },
  { file: "SalonTimeChoice.dc.html", out: "salon-time-choice", width: 390, height: 844 },
  { file: "SalonConfirmed.dc.html", out: "salon-confirmed", width: 390, height: 844 },
  { file: "SalonAdminAgenda.dc.html", out: "salon-day-agenda", width: 1440, height: 1160 },
  { file: "SalonMonthResults.dc.html", out: "salon-month-results", width: 1440, height: 760 },
  // 3x copy for the "Precisa de atenção hoje" crop: at 1440 px the waiting-list section shows that
  // panel at ~382 CSS px, more than the 336 px × 2 a 2x master holds (qa/v5-sharpness.mjs).
  { file: "SalonAdminAgenda.dc.html", out: "salon-day-agenda", width: 1440, height: 1160, scale: 3 },
];

/** Device scale factor of a master unless the board asks for more. */
const SCALE = 2;

async function settle(page) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => [...document.images].every((img) => img.complete && img.naturalWidth > 0));
  // The canvas runtime paints on the next frames after boot; give it two.
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function shoot(browser, base, outDir, board) {
  const page = await browser.newPage({
    viewport: { width: board.width, height: board.height },
    deviceScaleFactor: board.scale ?? SCALE,
  });
  await page.goto(`${base}/project/${board.file}`);
  await settle(page);
  const scale = board.scale ?? SCALE;
  const out = path.join(outDir, `${board.out}@${scale}x.png`);
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width: board.width, height: board.height } });
  await page.close();
  return `${board.file} → ${out}  ${board.width * scale}×${board.height * scale}`;
}

async function main() {
  const [base, outDir, ...only] = process.argv.slice(2);
  if (!base || !outDir) throw new Error("usage: node scripts/capture-screens.mjs <base-url> <out-dir> [out-name…]");
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome" });
  try {
    // `only` names masters as `out` (every scale) or `out@3x` (one scale)
    const picked = (b) => only.length === 0 || only.includes(b.out) || only.includes(`${b.out}@${b.scale ?? SCALE}x`);
    for (const board of ARTBOARDS.filter(picked)) process.stdout.write(`${await shoot(browser, base, outDir, board)}\n`);
  } finally {
    await browser.close();
  }
}

await main();
