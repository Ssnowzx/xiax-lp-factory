/**
 * Leather background tile — seamless + pre-darkened to `--base` (design D8, task 7.1).
 * ============================================================================
 * Usage (from the repo root):
 *   node scripts/v3-assets/leather-tile.mjs <src.png> <out-basename> [options]
 *
 *   node scripts/v3-assets/leather-tile.mjs assets/textures-src/leather-v1.png public/textures/leather-v1 \
 *     --contrast 0.24 --preview /tmp/leather-v1-tile.png --mosaic /tmp/leather-v1-mosaic.png
 *
 * Emits `<out-basename>.avif` and `<out-basename>.webp` (1024×1024, each ≤ --budget KB).
 *
 * Steps:
 *  1. Luminance only — the hue comes from the base color, so the tile always sits on `--base`.
 *  2. Flatten: divide by a wide wrap-around blur to kill lighting falloff/vignette (a low-frequency
 *     gradient is what makes repetition visible at 512px tiling).
 *  3. Seamless: two separable passes (X then Y). Each pass cross-fades the image with a copy
 *     offset by half the size, using the offset copy only in a feathered band at the borders.
 *     The blend is variance-preserving ((w·a + (1−w)·b) / √(w² + (1−w)²)), so the grain keeps
 *     its contrast inside the band instead of turning into a soft stripe.
 *  4. Darken: factor = 1 + contrast·z (z = standardized luminance), soft-compressed into
 *     [--min-factor, --max-factor] and re-centered so the tile average equals `--base`.
 *     RGB = base × factor. With base #14110E and max factor 1.95 the brightest pixel stays
 *     below #2A231C, which keeps text contrast intact (spec page-surface).
 *  5. Encode AVIF + WebP at the highest quality that fits the budget.
 *
 * Options:
 *   --base <hex>          target average color (default #14110E)
 *   --contrast <n>        std-dev of the luminance factor (default 0.24)
 *   --min-factor <n>      darkest factor (default 0.45)
 *   --max-factor <n>      brightest factor (default 1.95)
 *   --flatten <px>        radius of the lighting-flattening blur (default 40)
 *   --band <px>           width of the seam cross-fade band (default 160)
 *   --soften <0..1>       blend with a 3×3 wrap blur to drop pixel-level JPEG noise, which lossy
 *                         codecs smear unevenly (smoother first rows = faint seam) (default 0.5)
 *   --soften-passes <n>   passes of that 3×3 blur (default 1; 2 ≈ Gaussian σ 1.15)
 *   --size <px>           tile size (default 1024)
 *   --budget <KB>         max bytes per encoded file (default 80)
 *   --preview <png>       also write the lossless processed tile
 *   --mosaic <png>        also write a 3×3 mosaic of the encoded WebP plus a contrast-boosted
 *                         copy (`-boost.png`) that makes seams/repetition easy to inspect
 */
import sharp from "sharp";
import { writeFile, stat } from "node:fs/promises";

import { boxBlurClamp, boxBlurWrap, encodeToBudget, hexToRgb, readRaw, smoothstep } from "./lib.mjs";

function parseArgs(argv) {
  const [src, out, ...rest] = argv;
  if (!src || !out) {
    throw new Error("usage: leather-tile.mjs <src.png> <out-basename> [--contrast n] [--preview png] [--mosaic png]");
  }
  const opts = {
    base: "#14110E",
    contrast: 0.24,
    minFactor: 0.45,
    maxFactor: 1.95,
    flatten: 40,
    band: 160,
    soften: 0.5,
    softenPasses: 1,
    size: 1024,
    budget: 80,
    preview: null,
    mosaic: null,
  };
  for (let i = 0; i < rest.length; i += 2) {
    const key = rest[i].replace(/^--/, "").replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    if (!(key in opts)) throw new Error(`unknown option ${rest[i]}`);
    const value = rest[i + 1];
    opts[key] = typeof opts[key] === "number" ? Number(value) : value;
  }
  return { src, out, opts };
}

function luminance({ data, width, height }) {
  const lum = new Float32Array(width * height);
  for (let i = 0; i < lum.length; i++) {
    lum[i] = 0.2126 * data[i * 3] + 0.7152 * data[i * 3 + 1] + 0.0722 * data[i * 3 + 2];
  }
  return lum;
}

function meanOf(plane) {
  let s = 0;
  for (const v of plane) s += v;
  return s / plane.length;
}

/** Removes low-frequency lighting by dividing by a wide wrap-around blur. */
function flatten(lum, size, radius) {
  const low = boxBlurWrap(lum, size, size, radius);
  const mean = meanOf(lum);
  return lum.map((v, i) => (v * mean) / Math.max(1, low[i]));
}

/** Variance-preserving cross-fade with a half-offset copy along one axis (0 = X, 1 = Y). */
function seamPass(lum, size, band, axis) {
  const out = new Float32Array(lum.length);
  const mean = meanOf(lum);
  // Offset by half + 4 so the new tile border falls mid-block of the source JPEG's 8×8 grid
  // (a border on a block edge inherits the source's blocking and reads as a faint line).
  const half = (size >> 1) + 4;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const pos = axis === 0 ? x : y;
      const w = smoothstep(0, band, Math.min(pos + 0.5, size - pos - 0.5));
      const ox = axis === 0 ? (x + half) % size : x;
      const oy = axis === 1 ? (y + half) % size : y;
      const a = lum[y * size + x] - mean;
      const b = lum[oy * size + ox] - mean;
      out[y * size + x] = mean + (w * a + (1 - w) * b) / Math.sqrt(w * w + (1 - w) * (1 - w));
    }
  }
  return out;
}

/** Maps standardized luminance to a soft-limited brightness factor whose mean is 1. */
function toFactors(lum, { contrast, minFactor, maxFactor }) {
  const mean = meanOf(lum);
  let variance = 0;
  for (const v of lum) variance += (v - mean) ** 2;
  const std = Math.sqrt(variance / lum.length) || 1;
  // Soft knee: values compress smoothly toward the limits instead of clipping flat.
  const soft = (f) => {
    if (f > 1) return 1 + (maxFactor - 1) * Math.tanh((f - 1) / (maxFactor - 1));
    return 1 - (1 - minFactor) * Math.tanh((1 - f) / (1 - minFactor));
  };
  let factors = lum.map((v) => soft(1 + (contrast * (v - mean)) / std));
  for (let i = 0; i < 4; i++) {
    const m = meanOf(factors);
    factors = factors.map((f) => Math.min(maxFactor, Math.max(minFactor, f / m)));
  }
  return factors;
}

function tintToBase(factors, size, baseHex) {
  const base = hexToRgb(baseHex);
  const data = new Uint8Array(size * size * 3);
  for (let i = 0; i < factors.length; i++) {
    for (let c = 0; c < 3; c++) data[i * 3 + c] = Math.round(base[c] * factors[i]);
  }
  return data;
}

async function rgbStats(input, raw) {
  const { data, info } = await sharp(input, raw ? { raw } : undefined)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const sum = [0, 0, 0];
  let brightest = [0, 0, 0];
  let brightestLum = -1;
  for (let i = 0; i < data.length; i += 3) {
    for (let c = 0; c < 3; c++) sum[c] += data[i + c];
    const l = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    if (l > brightestLum) {
      brightestLum = l;
      brightest = [data[i], data[i + 1], data[i + 2]];
    }
  }
  const n = info.width * info.height;
  const hex = (rgb) => `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
  return { mean: hex(sum.map((s) => s / n)), brightest: hex(brightest) };
}

async function writeMosaic(tileBuffer, size, path) {
  const tiles = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) tiles.push({ input: tileBuffer, left: c * size, top: r * size });
  const mosaic = await sharp({ create: { width: size * 3, height: size * 3, channels: 3, background: "#000" } })
    .composite(tiles)
    .png()
    .toBuffer();
  await sharp(mosaic).resize(1536, 1536).png().toFile(path);
  // Contrast-boosted copies: stretch the ~20-level range so seams and repeats become obvious.
  await sharp(mosaic).resize(1536, 1536).linear(6, -90).png().toFile(path.replace(/\.png$/, "-boost.png"));
  // 1:1 crop centered on a four-tile corner (where both seams meet).
  const half = 256;
  await sharp(mosaic)
    .extract({ left: size - half, top: size - half, width: half * 2, height: half * 2 })
    .linear(8, -130)
    .png()
    .toFile(path.replace(/\.png$/, "-seam.png"));
}

/**
 * Seam z-score, measured the way an eye sees it: tile 2×2, low-pass (≈ Gaussian σ 1.4, in float so
 * 8-bit quantization does not drown the signal) across the tile borders, take the mean |gradient|
 * of every line, and report how many standard deviations the border line sits above the other
 * lines (worse axis). Single lines naturally vary ±20 %, so a raw ratio is noisy; |z| < 2.5 means
 * the border is statistically indistinguishable from any interior line, z > 3 is a likely seam.
 */
async function seamScore(input, size) {
  const { data, info } = await sharp(input).removeAlpha().greyscale().raw().toBuffer({ resolveWithObject: true });
  const n = size * 2;
  const mosaic = new Float32Array(n * n);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) mosaic[y * n + x] = data[((y % size) * size + (x % size)) * info.channels];
  }
  const blurred = boxBlurClamp(mosaic, n, n, 1, 2);
  const at = (x, y) => blurred[y * n + x];
  const ratio = (axis) => {
    const grad = new Float64Array(n - 1);
    for (let k = 0; k < n - 1; k++) {
      let acc = 0;
      for (let j = 8; j < n - 8; j++) {
        acc += axis === 0 ? Math.abs(at(k + 1, j) - at(k, j)) : Math.abs(at(j, k + 1) - at(j, k));
      }
      grad[k] = acc;
    }
    const others = [];
    for (let k = 8; k < n - 9; k++) if (Math.abs(k - (size - 1)) > 4) others.push(grad[k]);
    const mean = others.reduce((a, b) => a + b, 0) / others.length;
    const std = Math.sqrt(others.reduce((a, b) => a + (b - mean) ** 2, 0) / others.length);
    return (grad[size - 1] - mean) / std;
  };
  return Math.max(ratio(0), ratio(1));
}

async function run() {
  const { src, out, opts } = parseArgs(process.argv.slice(2));
  const size = opts.size;
  const raw = await readRaw(src, { resize: { width: size, height: size, fit: "cover" } });
  let lum = luminance(raw);
  lum = flatten(lum, size, opts.flatten);
  lum = seamPass(lum, size, opts.band, 0);
  lum = seamPass(lum, size, opts.band, 1);
  if (opts.soften > 0) {
    const soft = boxBlurWrap(lum, size, size, 1, opts.softenPasses);
    lum = lum.map((v, i) => v * (1 - opts.soften) + soft[i] * opts.soften);
  }
  const factors = toFactors(lum, opts);
  const data = tintToBase(factors, size, opts.base);
  const rawInfo = { width: size, height: size, channels: 3 };

  if (opts.preview) await sharp(Buffer.from(data), { raw: rawInfo }).png().toFile(opts.preview);

  const budget = opts.budget * 1024;
  const results = [];
  for (const format of ["avif", "webp"]) {
    const { buffer, quality } = await encodeToBudget(Buffer.from(data), format, budget, { raw: rawInfo });
    const file = `${out}.${format}`;
    await writeFile(file, buffer);
    const { size: bytes } = await stat(file);
    const seam = (await seamScore(buffer, size)).toFixed(2);
    results.push({ file, quality, kb: (bytes / 1024).toFixed(1), seam, ...(await rgbStats(buffer)) });
    if (format === "webp" && opts.mosaic) await writeMosaic(buffer, size, opts.mosaic);
  }
  const lossless = await rgbStats(Buffer.from(data), rawInfo);
  const losslessPng = await sharp(Buffer.from(data), { raw: rawInfo }).png().toBuffer();
  lossless.seam = (await seamScore(losslessPng, size)).toFixed(2);
  const sourceSeam = (await seamScore(await sharp(src).resize(size, size, { fit: "cover" }).png().toBuffer(), size)).toFixed(2);
  console.log(`[leather] ${src} → source seam ${sourceSeam} · lossless seam ${lossless.seam} mean ${lossless.mean} brightest ${lossless.brightest}`);
  for (const r of results) {
    console.log(`  ${r.file}  q${r.quality}  ${r.kb} KB  seam ${r.seam}  mean ${r.mean}  brightest ${r.brightest}`);
  }
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
