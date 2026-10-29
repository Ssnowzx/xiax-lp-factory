// Sharpness check for the app screens (change xiax-lp-v5-salon · design D5): at 390 and 1440 px
// with deviceScaleFactor 2, every <img> whose src contains "/screens/" must be shown at no more
// than its natural size, i.e. rendered CSS width × 2 ≤ pixel width of the variant the browser
// chose (`next/image` serves resized files, so currentSrc is what counts). Images that are not
// laid out (display: none, width 0) are reported as SKIP. Prints PASS/FAIL per image; exits 1 on
// any FAIL.
//
//   QA_URL=http://localhost:8811 node qa/v5-sharpness.mjs [/path]
import { chromium } from "playwright";

import { URL, WIDTHS, imagesLoaded, walkDown } from "./lib/page-walk.mjs";

const SCALE = 2;
const pagePath = process.argv.slice(2).find((arg) => arg.startsWith("/")) ?? "/";

async function measure(browser, width) {
  const phone = width < 768;
  const context = await browser.newContext({
    viewport: { width, height: width === 390 ? 844 : 900 },
    deviceScaleFactor: SCALE,
    reducedMotion: "reduce",
    ...(phone ? { isMobile: true, hasTouch: true } : {}),
  });
  const page = await context.newPage();
  await page.goto(`${URL}${pagePath}`, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await walkDown(page);
  await imagesLoaded(page);
  // `naturalWidth` is divided by the srcset density the browser picked, so the real pixel width of
  // the chosen file is read by decoding it.
  const rows = await page.evaluate(async () => {
    const imgs = [...document.images].filter((img) =>
      decodeURIComponent(`${img.src} ${img.currentSrc}`).includes("/screens/"),
    );
    return Promise.all(
      imgs.map(async (img) => {
        const blob = await (await fetch(img.currentSrc || img.src)).blob();
        const bitmap = await createImageBitmap(blob);
        return {
          src: decodeURIComponent(img.currentSrc || img.src),
          shown: img.getBoundingClientRect().width,
          natural: bitmap.width,
        };
      }),
    );
  });
  await context.close();
  return rows;
}

const browser = await chromium.launch({ channel: "chrome" });
let failures = 0;
try {
  for (const width of WIDTHS) {
    const rows = await measure(browser, width);
    process.stdout.write(`\n${pagePath} @ ${width}px (dpr ${SCALE}) — ${rows.length} screen image(s)\n`);
    for (const row of rows) {
      const needed = Math.ceil(row.shown * SCALE);
      const name = row.src.replace(/^https?:\/\/[^/]+/, "").slice(0, 70);
      if (row.shown < 1) {
        process.stdout.write(`SKIP  ${name}  (not laid out)\n`);
        continue;
      }
      const ok = needed <= row.natural;
      if (!ok) failures += 1;
      process.stdout.write(`${ok ? "PASS" : "FAIL"}  ${name}  needs ${needed}px, has ${row.natural}px\n`);
    }
  }
} finally {
  await browser.close();
}
process.stdout.write(failures ? `\n${failures} image(s) too soft\n` : "\nAll screen images are sharp\n");
process.exit(failures ? 1 : 0);
