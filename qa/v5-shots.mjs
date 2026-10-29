// Photo baseline for the v5 refactor (change xiax-lp-v5-salon · design D12 · task 1.2): full-page
// shots at 390 and 1440 px with reduced motion, so nothing depends on where an animation is.
// `--record` saves them to qa/baselines/; without it, the page is shot again and compared pixel
// by pixel. A shot whose size changed, or with more than MAX_CHANGED of its pixels changed,
// fails; the changed pixels are painted red over a faded copy in QA_OUT. Exits 1 on any failure.
//
//   QA_URL=http://localhost:8811 node qa/v5-shots.mjs --record [/path]
//   QA_URL=http://localhost:8811 QA_OUT=/tmp/xiax-v5 node qa/v5-shots.mjs [/path]
import { chromium } from "playwright";
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { WIDTHS, imagesLoaded, openAt, slugOf, walkDown } from "./lib/page-walk.mjs";

const args = process.argv.slice(2);
const record = args.includes("--record");
const pagePath = args.find((arg) => arg.startsWith("/")) ?? "/";
const BASELINES = path.join(path.dirname(new URL(import.meta.url).pathname), "baselines");
const OUT = process.env.QA_OUT || path.join(os.tmpdir(), "xiax-v5");
/** Per-channel step a pixel must move to count as changed (JPEG-free PNGs; this absorbs AA noise). */
const PIXEL_DELTA = 24;
/** Share of a shot's pixels allowed to change: text antialiasing only, not a moved block. */
const MAX_CHANGED = 0.001;

const shotName = (width) => `shot-${slugOf(pagePath)}-${width}.png`;

async function shoot(browser, width) {
  const { context, page } = await openAt(browser, pagePath, width, { reducedMotion: "reduce" });
  await walkDown(page);
  await imagesLoaded(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1000);
  const png = await page.screenshot({ fullPage: true });
  await context.close();
  return png;
}

/** Changed-pixel count of two same-size PNGs, plus a picture of where they changed. */
async function diff(before, after) {
  const [a, b] = await Promise.all([before, after].map((png) => sharp(png).raw().toBuffer({ resolveWithObject: true })));
  if (a.info.width !== b.info.width || a.info.height !== b.info.height) return { sizeChanged: `${a.info.width}×${a.info.height} → ${b.info.width}×${b.info.height}` };
  const { width, height, channels } = a.info;
  const marked = Buffer.from(b.data);
  let changed = 0;
  for (let i = 0; i < a.data.length; i += channels) {
    const delta = Math.max(Math.abs(a.data[i] - b.data[i]), Math.abs(a.data[i + 1] - b.data[i + 1]), Math.abs(a.data[i + 2] - b.data[i + 2]));
    if (delta >= PIXEL_DELTA) {
      changed += 1;
      [marked[i], marked[i + 1], marked[i + 2]] = [255, 0, 0];
    } else for (let c = 0; c < 3; c += 1) marked[i + c] = 255 - (255 - marked[i + c]) * 0.25;
  }
  const picture = await sharp(marked, { raw: { width, height, channels } }).png().toBuffer();
  return { changed, share: changed / (width * height), picture };
}

const browser = await chromium.launch({ channel: "chrome" });
let failures = 0;
await mkdir(record ? BASELINES : OUT, { recursive: true });
for (const width of WIDTHS) {
  const png = await shoot(browser, width);
  const baseline = path.join(BASELINES, shotName(width));
  if (record) {
    await sharp(png).toFile(baseline);
    const { height } = await sharp(png).metadata();
    process.stdout.write(`gravado ${path.relative(process.cwd(), baseline)} (${width}×${height})\n`);
    continue;
  }
  await sharp(png).toFile(path.join(OUT, shotName(width)));
  const result = await diff(await sharp(baseline).png().toBuffer(), png);
  if (result.sizeChanged) {
    failures += 1;
    process.stdout.write(`FAIL ${width}px · tamanho mudou: ${result.sizeChanged}\n`);
    continue;
  }
  const marked = path.join(OUT, shotName(width).replace(".png", ".diff.png"));
  await sharp(result.picture).toFile(marked);
  const ok = result.share <= MAX_CHANGED;
  if (!ok) failures += 1;
  process.stdout.write(`${ok ? "PASS" : "FAIL"} ${width}px · ${result.changed} pixels mudaram (${(result.share * 100).toFixed(3)}%) · ${marked}\n`);
}
await browser.close();
process.exit(failures ? 1 : 0);
