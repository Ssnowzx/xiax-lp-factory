/**
 * Plan icon cutout — brass object on pure black → trimmed square WebP with alpha (task 4.1).
 * ============================================================================
 * Usage (from the repo root):
 *   swift scripts/v3-assets/fg-mask.swift assets/icons-src/corte.png /tmp/corte-mask.pgm
 *   node scripts/v3-assets/icon-cutout.mjs assets/icons-src/corte.png /tmp/corte-mask.pgm \
 *     public/icons/plans/corte.webp --review /tmp/review
 *
 * Why two mattes: polished brass mirrors the black studio, so whole areas of the object are as
 * dark as the background. A luminance key alone would make those areas see-through; the Vision
 * foreground mask alone is soft and slightly loose (dark fringe on light surfaces). So:
 *  - core   = Vision mask eroded by --core px, feathered → opaque body, dark reflections included;
 *  - edge   = luminance key (max RGB above the measured background noise) → anti-aliased edge;
 *  - alpha  = max(core, edge), limited to the Vision mask dilated by --allow px (kills stray noise).
 * Colour is un-premultiplied against black (F = C / α; the faintest edge pixels, α < 0.4, lean on the
 * local average object colour so JPEG noise is not amplified into odd hues). Because the source background is black,
 * compositing F with α over any surface gives C + (1 − α)·surface: no light or dark halo on the
 * dark plan cards (#1C1815 / #241F1A).
 *
 * Then: trim to the alpha bbox, pad to a square (--pad of the long side), resize (sharp
 * premultiplies alpha when resizing), bleed the object colour under the transparent pixels and
 * encode WebP (exact mode) with alpha at the highest quality ≤ --budget.
 *
 * Options:
 *   --size <px>      output square size (default 320)
 *   --pad <0..1>     padding around the trimmed object, fraction of its long side (default 0.06)
 *   --core <px>      erosion of the Vision mask before it becomes opaque body (default 3)
 *   --allow <px>     dilation of the Vision mask that bounds the luminance key (default 4)
 *   --budget <KB>    max file size (default 25)
 *   --review <dir>   write review composites on #1C1815 / #241F1A (+ a 4× edge crop and a
 *                    diagnostic grey #7A7A7A that exaggerates any matte error)
 */
import sharp from "sharp";
import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { bleedTransparent, boxBlurClamp, encodeToBudget, readPgm, readRaw, smoothstep } from "./lib.mjs";

const SURFACES = { surface: "#1C1815", raised: "#241F1A", diagnostic: "#7A7A7A" };

function parseArgs(argv) {
  const [src, mask, out, ...rest] = argv;
  if (!src || !mask || !out) throw new Error("usage: icon-cutout.mjs <src.png> <mask.pgm> <out.webp> [options]");
  const opts = { size: 320, pad: 0.06, core: 3, allow: 4, budget: 25, review: null };
  for (let i = 0; i < rest.length; i += 2) {
    const key = rest[i].replace(/^--/, "");
    if (!(key in opts)) throw new Error(`unknown option ${rest[i]}`);
    opts[key] = typeof opts[key] === "number" ? Number(rest[i + 1]) : rest[i + 1];
  }
  return { src, mask, out, opts };
}

function percentile(values, p) {
  const sorted = Float32Array.from(values).sort();
  return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
}

/** Builds the RGBA cutout at source resolution. */
function buildCutout(rgb, mask, { core, allow }) {
  const { width: w, height: h } = rgb;
  const n = w * h;
  const maxc = new Float32Array(n);
  const hard = new Float32Array(n);
  const soft = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    maxc[i] = Math.max(rgb.data[i * 3], rgb.data[i * 3 + 1], rgb.data[i * 3 + 2]);
    hard[i] = mask.data[i] >= 128 ? 1 : 0;
    soft[i] = mask.data[i] >= 13 ? 1 : 0;
  }
  const coreBlur = boxBlurClamp(hard, w, h, core, 1);
  const allowBlur = boxBlurClamp(soft, w, h, allow, 1);

  const background = [];
  for (let i = 0; i < n; i++) if (allowBlur[i] === 0) background.push(maxc[i]);
  const lo = percentile(background, 0.995) + 2;
  const hi = lo + 36;

  const alpha = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    if (allowBlur[i] > 0) alpha[i] = Math.max(smoothstep(0.75, 1, coreBlur[i]), smoothstep(lo, hi, maxc[i]));
  }
  // Local average object colour (premultiplied blur / alpha blur). At very low alpha C / α
  // amplifies JPEG noise into odd hues, so the faintest edge pixels lean on this instead.
  const alphaBlur = boxBlurClamp(alpha, w, h, 3, 2);
  const bleed = [0, 1, 2].map((c) => boxBlurClamp(Float32Array.from({ length: n }, (_, i) => rgb.data[i * 3 + c]), w, h, 3, 2));

  const rgba = new Uint8Array(n * 4);
  for (let i = 0; i < n; i++) {
    const a = alpha[i];
    if (a <= 0) continue;
    const trust = smoothstep(0.08, 0.4, a);
    for (let c = 0; c < 3; c++) {
      const unpremultiplied = rgb.data[i * 3 + c] / a;
      const local = alphaBlur[i] > 0 ? bleed[c][i] / alphaBlur[i] : unpremultiplied;
      rgba[i * 4 + c] = Math.min(255, Math.round(unpremultiplied * trust + local * (1 - trust)));
    }
    rgba[i * 4 + 3] = Math.round(a * 255);
  }
  return { rgba, lo, hi };
}

function alphaBox(rgba, w, h) {
  let x0 = w;
  let y0 = h;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (rgba[(y * w + x) * 4 + 3] > 2) {
        x0 = Math.min(x0, x);
        y0 = Math.min(y0, y);
        x1 = Math.max(x1, x);
        y1 = Math.max(y1, y);
      }
    }
  }
  return { left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
}

async function toSquare(rgba, w, h, { size, pad }) {
  const box = alphaBox(rgba, w, h);
  const side = Math.ceil(Math.max(box.width, box.height) * (1 + 2 * pad));
  const padX = side - box.width;
  const padY = side - box.height;
  // Two pipelines on purpose: sharp always runs resize before extend inside one pipeline.
  const padded = await sharp(Buffer.from(rgba), { raw: { width: w, height: h, channels: 4 } })
    .extract(box)
    .extend({
      left: Math.floor(padX / 2),
      right: Math.ceil(padX / 2),
      top: Math.floor(padY / 2),
      bottom: Math.ceil(padY / 2),
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  const { data, info } = await sharp(padded)
    .resize(size, size, { kernel: "lanczos3" })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const filled = bleedTransparent(new Uint8Array(data), info.width, info.height);
  return { buffer: Buffer.from(filled), raw: { width: info.width, height: info.height, channels: 4 } };
}

async function writeReview(webp, out, dir) {
  await mkdir(dir, { recursive: true });
  const name = path.basename(out, path.extname(out));
  const { width, height } = await sharp(webp).metadata();
  const panels = await Promise.all(
    Object.values(SURFACES).map((bg) =>
      sharp({ create: { width, height, channels: 3, background: bg } }).composite([{ input: webp }]).png().toBuffer(),
    ),
  );
  await sharp({ create: { width: width * 3, height, channels: 3, background: "#000" } })
    .composite(panels.map((input, i) => ({ input, left: i * width, top: 0 })))
    .png()
    .toFile(path.join(dir, `${name}-on-surfaces.png`));
  // 4× nearest-neighbour crop of the centre on the real card surface: shows edge pixels as they are.
  const crop = Math.round(width / 3);
  for (const [label, bg] of Object.entries(SURFACES)) {
    const panel = await sharp({ create: { width, height, channels: 3, background: bg } })
      .composite([{ input: webp }])
      .png()
      .toBuffer();
    await sharp(panel)
      .extract({ left: crop, top: crop, width: crop, height: crop })
      .resize(crop * 4, crop * 4, { kernel: "nearest" })
      .png()
      .toFile(path.join(dir, `${name}-edge4x-${label}.png`));
  }
}

async function run() {
  const { src, mask: maskPath, out, opts } = parseArgs(process.argv.slice(2));
  const rgb = await readRaw(src);
  const mask = await readPgm(maskPath);
  if (mask.width !== rgb.width || mask.height !== rgb.height) throw new Error("mask and source sizes differ");

  const { rgba, lo, hi } = buildCutout(rgb, mask, opts);
  const square = await toSquare(rgba, rgb.width, rgb.height, opts);
  const { buffer, quality } = await encodeToBudget(square.buffer, "webp", opts.budget * 1024, {
    raw: square.raw,
    alpha: true,
    exact: true,
  });
  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(out, buffer);
  const { size } = await stat(out);
  const meta = await sharp(out).metadata();
  console.log(
    `[icon] ${src} → ${out}  ${meta.width}×${meta.height} alpha=${meta.hasAlpha}  q${quality}  ${(size / 1024).toFixed(1)} KB  (luma key ${lo.toFixed(0)}–${hi.toFixed(0)})`,
  );
  if (opts.review) await writeReview(buffer, out, opts.review);
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
