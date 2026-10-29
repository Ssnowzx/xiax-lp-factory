/**
 * v3 image pipeline (changes xiax-lp-v3-cards-25d · D7 and xiax-lp-v3-scissors-3d) — sharp
 * at BUILD time only, same pattern as `optimize-gallery.mjs`.
 *
 * 1. Gallery: reads the generated masters in `assets/gallery-src/v3/` and writes web
 *    masters to `public/gallery/v3/`. `next/image` still negotiates AVIF/WebP at the edge;
 *    this only keeps the committed master light and in the right shape.
 * 2. 3D stills (Blender renders, see build-scissors.py / build-razor.py and, for the salon's
 *    round brush, scripts/v3-assets/brush-still.py):
 *    `assets/3d/<tool>/<tool>-still.png` → `public/models/<tool>-still.webp`, alpha kept,
 *    same pixels, for the scissors, the razor and the brush.
 *
 * Gallery source names: `gallery-0N-<kind>.png`, kind =
 *  - `full`    → whole photo (fallback slot, no layers)      → `gallery-0N.webp`
 *  - `plate`   → clean background, nobody in it              → `gallery-0N-plate.webp`
 *  - `subject` → the person cut out, transparent elsewhere   → `gallery-0N-subject.webp` (alpha)
 * Every output is cropped to the same 16:9 box, so plate and subject stay registered.
 *
 * Icons and the leather texture have their own generators in `scripts/v3-assets/`.
 *
 * Run: `npm run assets:v3`. Idempotent; skips whatever source is missing.
 */
import sharp from "sharp";
import { access, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "assets", "gallery-src", "v3");
const OUT = path.join(ROOT, "public", "gallery", "v3");

/** Width cap per slot; the feature is the only big one (lib/data/gallery.ts). */
const FEATURE_ID = "gallery-04";
const MAX_W = { feature: 1600, satellite: 1024 };
const SOURCE_NAME = /^(gallery-0\d)-(full|plate|subject)\.png$/;
const STILL_TOOLS = ["scissors", "razor", "brush"];

function outputName(id, kind) {
  return kind === "full" ? `${id}.webp` : `${id}-${kind}.webp`;
}

/** 16:9 cover crop at the slot's width cap; `subject` keeps its alpha losslessly. */
async function optimize(file, id, kind) {
  const width = id === FEATURE_ID ? MAX_W.feature : MAX_W.satellite;
  const height = Math.round((width * 9) / 16);
  const webp = kind === "subject" ? { quality: 86, alphaQuality: 100, effort: 6 } : { quality: 80, effort: 6 };
  const out = path.join(OUT, outputName(id, kind));
  const info = await sharp(path.join(SRC, file))
    .resize(width, height, { fit: "cover", position: "centre" })
    .webp(webp)
    .toFile(out);
  return describe(out, info);
}

const describe = (out, info) => `${path.relative(ROOT, out)}  ${info.width}×${info.height}  ${(info.size / 1024).toFixed(0)} KB`;

async function galleryJobs() {
  const files = await readdir(SRC).catch(() => []);
  const jobs = files.flatMap((file) => {
    const match = SOURCE_NAME.exec(file);
    return match ? [{ file, id: match[1], kind: match[2] }] : [];
  });
  if (jobs.length > 0) await mkdir(OUT, { recursive: true });
  return jobs.map((job) => () => optimize(job.file, job.id, job.kind));
}

/** Same size as the render: the stage places each still from the render's own framing. */
async function stillJobs() {
  const jobs = await Promise.all(
    STILL_TOOLS.map(async (tool) => {
      const src = path.join(ROOT, "assets", "3d", tool, `${tool}-still.png`);
      const out = path.join(ROOT, "public", "models", `${tool}-still.webp`);
      const exists = await access(src).then(() => true, () => false);
      if (!exists) return [];
      return [async () => describe(out, await sharp(src).webp({ quality: 90, alphaQuality: 100, effort: 6 }).toFile(out))];
    }),
  );
  return jobs.flat();
}

async function run() {
  const jobs = [...(await galleryJobs()), ...(await stillJobs())];
  if (jobs.length === 0) {
    process.stdout.write("assets:v3 — no sources found, nothing to do\n");
    return;
  }
  const lines = await Promise.all(jobs.map((job) => job()));
  process.stdout.write(`${lines.join("\n")}\n`);
}

run().catch((error) => {
  process.stderr.write(`${error.message ?? error}\n`);
  process.exit(1);
});
