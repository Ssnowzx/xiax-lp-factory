/**
 * Porcelana paper/linen background tile — seamless + pre-tinted to the ivory base.
 * ============================================================================
 * Usage (from the repo root):
 *   node scripts/v3-assets/paper-tile.mjs <src.png> <out-basename> [options]
 *   node scripts/v3-assets/paper-tile.mjs --procedural <out-basename> [options]
 *
 *   node scripts/v3-assets/paper-tile.mjs assets/textures-src/linen-v1.png public/textures/linen-v1 \
 *     --preview /tmp/linen-tile.png
 *
 * Emits `<out-basename>.avif` and `<out-basename>.webp` (--size px square, each ≤ --budget KB).
 *
 * Steps (same family as leather-tile.mjs, tuned for a LIGHT base):
 *  1. Luminance only; flatten lighting (divide by a wide wrap blur).
 *  2. Seamless (AI sources): two variance-preserving half-offset cross-fades (X then Y), then a
 *     wrap-aware resize to --size (3×3 mosaic → resize → centre crop, so the border stays periodic).
 *     `--procedural` builds a periodic source (wrapped fibres + grain + cloud) — seamless already.
 *  3. Tint: RGB = base × factor, factor = 1 + k·z, soft-limited. A light base has almost no
 *     headroom (246 → 255 is only +3.6 %), so the upper limit is tiny and the texture is
 *     carried mostly by darker fibres/threads; k is bisected so the L* std hits --lstd.
 *  4. Encode AVIF + WebP; DECODED mean is measured and the data shifted until it is within
 *     ±0.4 of the base on every channel (lossy codecs drift the mean by 1–2 levels).
 *  5. Report mean, L* std and WCAG contrast of the darkest pixel / darkest 1 % against the text colours.
 *
 * Options: --base #F6F1EA --lstd 2.2 --size 768 --budget 118 --flatten 48 --band 200
 *          --minf 0.92 --seed 3 --fibers 9000 --preview png --mosaic png
 */
import sharp from "sharp";
import { writeFile, stat } from "node:fs/promises";

import { boxBlurWrap, encodeToBudget, hexToRgb, readRaw, smoothstep } from "./lib.mjs";

function parseArgs(argv) {
  const procedural = argv[0] === "--procedural";
  const [src, out, ...rest] = procedural ? [null, ...argv.slice(1)] : argv;
  if (!out) throw new Error("usage: paper-tile.mjs <src.png|--procedural> <out-basename> [options]");
  const opts = { base: "#F6F1EA", lstd: 2.2, size: 768, budget: 118, flatten: 48, band: 200, seed: 3, fibers: 9000, minf: 0.935, preview: null, mosaic: null };
  for (let i = 0; i < rest.length; i += 2) {
    const key = rest[i].replace(/^--/, "");
    if (!(key in opts)) throw new Error(`unknown option ${rest[i]}`);
    opts[key] = typeof opts[key] === "number" ? Number(rest[i + 1]) : rest[i + 1];
  }
  return { procedural, src, out, opts };
}

const meanOf = (p) => { let s = 0; for (const v of p) s += v; return s / p.length; };
const stdOf = (p) => { const m = meanOf(p); let s = 0; for (const v of p) s += (v - m) ** 2; return Math.sqrt(s / p.length); };

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Periodic cotton-paper height: fine grain + soft cloud + curved wrapped fibres (light and dark). */
function proceduralPaper(size, seed, fibers) {
  const rnd = mulberry32(seed);
  const noise = () => Float32Array.from({ length: size * size }, () => rnd() * 2 - 1);
  const grain = boxBlurWrap(noise(), size, size, 1, 2);
  const cloud = boxBlurWrap(noise(), size, size, 22, 3);
  const mid = boxBlurWrap(noise(), size, size, 4, 3);
  const g = stdOf(grain), c = stdOf(cloud), m = stdOf(mid);
  const h = new Float32Array(size * size);
  for (let i = 0; i < h.length; i++) h[i] = grain[i] / g + 0.55 * (cloud[i] / c) + 0.5 * (mid[i] / m);
  const fib = new Float32Array(size * size);
  for (let f = 0; f < fibers; f++) {
    let x = rnd() * size, y = rnd() * size;
    let ang = rnd() * Math.PI * 2;
    const len = 10 + rnd() * 40;
    const amp = (rnd() < 0.55 ? -1 : 1) * (0.5 + rnd() * 1.1);
    const curve = (rnd() - 0.5) * 0.12;
    for (let s = 0; s < len; s++) {
      const fall = Math.sin((Math.PI * s) / len);
      for (const [dx, dy, wgt] of [[0, 0, 1], [1, 0, 0.35], [-1, 0, 0.35], [0, 1, 0.35], [0, -1, 0.35]]) {
        const px = (((Math.round(x) + dx) % size) + size) % size;
        const py = (((Math.round(y) + dy) % size) + size) % size;
        fib[py * size + px] += amp * fall * wgt;
      }
      ang += curve;
      x += Math.cos(ang);
      y += Math.sin(ang);
    }
  }
  const fibSoft = boxBlurWrap(fib, size, size, 1, 1);
  const fs = stdOf(fibSoft);
  for (let i = 0; i < h.length; i++) h[i] += 1.1 * (fibSoft[i] / fs);
  return h;
}

function seamPass(lum, size, band, axis) {
  const out = new Float32Array(lum.length);
  const mean = meanOf(lum);
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

/** Resize a periodic plane keeping it periodic: 3×3 mosaic → resize → centre crop. */
async function wrapResize(plane, from, to) {
  const m = meanOf(plane), s = stdOf(plane) || 1;
  const grey = Buffer.alloc(plane.length * 3);
  plane.forEach((v, i) => grey.fill(Math.min(255, Math.max(0, Math.round(128 + (40 * (v - m)) / s))), i * 3, i * 3 + 3));
  const tiles = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) tiles.push({ input: grey, raw: { width: from, height: from, channels: 3 }, left: c * from, top: r * from });
  const big = await sharp({ create: { width: from * 3, height: from * 3, channels: 3, background: "#000" } }).composite(tiles).raw().toBuffer();
  const rs = await sharp(big, { raw: { width: from * 3, height: from * 3, channels: 3 } }).resize(to * 3, to * 3, { kernel: "lanczos3" }).extract({ left: to, top: to, width: to, height: to }).greyscale().raw().toBuffer();
  return Float32Array.from(rs);
}

const lstar = (r, g, b) => {
  const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const y = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return y > 216 / 24389 ? 116 * Math.cbrt(y) - 16 : (24389 / 27) * y;
};
const relLum = (r, g, b) => { const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); };
const wcag = (a, b) => { const [hi, lo] = [relLum(...a), relLum(...b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };

/** Factors with soft limits (tiny headroom above, generous below); mean re-centred to 1. */
function makeFactors(z, k, maxF, minF) {
  const soft = (f) => (f > 1 ? 1 + (maxF - 1) * Math.tanh((f - 1) / (maxF - 1)) : 1 - (1 - minF) * Math.tanh((1 - f) / (1 - minF)));
  let f = z.map((v) => soft(1 + k * v));
  for (let i = 0; i < 6; i++) { const m = meanOf(f); f = f.map((v) => Math.min(maxF, Math.max(minF, v / m))); }
  return f;
}

function tint(factors, base) {
  const data = new Float32Array(factors.length * 3);
  for (let i = 0; i < factors.length; i++) for (let c = 0; c < 3; c++) data[i * 3 + c] = base[c] * factors[i];
  return data;
}

const toU8 = (f, shift = [0, 0, 0]) => Uint8Array.from(f, (v, i) => Math.min(255, Math.max(0, Math.round(v + shift[i % 3]))));

function lStd(u8) {
  const l = new Float32Array(u8.length / 3);
  for (let i = 0; i < l.length; i++) l[i] = lstar(u8[i * 3], u8[i * 3 + 1], u8[i * 3 + 2]);
  return { mean: meanOf(l), std: stdOf(l) };
}

function channelMean(u8) {
  const s = [0, 0, 0];
  for (let i = 0; i < u8.length; i += 3) for (let c = 0; c < 3; c++) s[c] += u8[i + c];
  return s.map((v) => (v * 3) / u8.length);
}

/** WCAG contrast of the darkest pixel and of the darkest-1 % mean against both text colours. */
function contrastReport(u8) {
  const n = u8.length / 3;
  const idx = Array.from({ length: n }, (_, i) => i).sort((a, b) => relLum(u8[a * 3], u8[a * 3 + 1], u8[a * 3 + 2]) - relLum(u8[b * 3], u8[b * 3 + 1], u8[b * 3 + 2]));
  const darkest = idx[0];
  const px = (i) => [u8[i * 3], u8[i * 3 + 1], u8[i * 3 + 2]];
  const k = Math.ceil(n * 0.01);
  const avg = [0, 0, 0];
  for (let j = 0; j < k; j++) px(idx[j]).forEach((v, c) => (avg[c] += v / k));
  const muted = [110, 98, 90], ink = [28, 23, 20];
  return { darkest: px(darkest), darkest1pctMean: avg.map(Math.round), mutedMin: wcag(px(darkest), muted), inkMin: wcag(px(darkest), ink), muted1: wcag(avg, muted), ink1: wcag(avg, ink) };
}

async function decode(buffer) {
  const { data } = await sharp(buffer).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return Uint8Array.from(data);
}

async function run() {
  const { procedural, src, out, opts } = parseArgs(process.argv.slice(2));
  const size = opts.size;
  let lum;
  if (procedural) {
    lum = proceduralPaper(size, opts.seed, opts.fibers);
  } else {
    const srcSize = 1024;
    const raw = await readRaw(src, { resize: { width: srcSize, height: srcSize, fit: "cover" } });
    lum = new Float32Array(srcSize * srcSize);
    for (let i = 0; i < lum.length; i++) lum[i] = 0.2126 * raw.data[i * 3] + 0.7152 * raw.data[i * 3 + 1] + 0.0722 * raw.data[i * 3 + 2];
    const low = boxBlurWrap(lum, srcSize, srcSize, opts.flatten);
    const mean = meanOf(lum);
    lum = lum.map((v, i) => (v * mean) / Math.max(1, low[i]));
    lum = seamPass(lum, srcSize, opts.band, 0);
    lum = seamPass(lum, srcSize, opts.band, 1);
    lum = await wrapResize(lum, srcSize, size);
  }
  const m = meanOf(lum), s = stdOf(lum) || 1;
  const z = lum.map((v) => (v - m) / s);
  const base = hexToRgb(opts.base);

  // Bisect k so the quantised L* std hits the target.
  let lo = 0.005, hi = 0.2, k = 0.05;
  for (let i = 0; i < 22; i++) {
    k = (lo + hi) / 2;
    const got = lStd(toU8(tint(makeFactors(z, k, 1.034, opts.minf), base))).std;
    if (got < opts.lstd) lo = k; else hi = k;
  }
  const factors = makeFactors(z, k, 1.034, opts.minf);
  const pre = tint(factors, base);
  const rawInfo = { width: size, height: size, channels: 3 };
  const lossless = toU8(pre);
  if (opts.preview) await sharp(Buffer.from(lossless), { raw: rawInfo }).png().toFile(opts.preview);

  const results = [];
  for (const format of ["avif", "webp"]) {
    let shift = [0, 0, 0], res, best = null;
    for (let iter = 0; iter < 10; iter++) {
      const data = toU8(pre, shift);
      const { buffer, quality } = await encodeToBudget(Buffer.from(data), format, opts.budget * 1024, { raw: rawInfo });
      const dec = await decode(buffer);
      const cm = channelMean(dec);
      res = { buffer, quality, dec, cm };
      if (process.env.PAPER_DEBUG) console.log(format, iter, cm.map((v) => v.toFixed(2)).join(','), shift.map((v) => v.toFixed(2)).join(','));
      const err = cm.map((v, c) => base[c] - v);
      const worst = Math.max(...err.map(Math.abs));
      if (!best || worst < best.worst) best = { ...res, worst };
      if (worst <= 0.35) break;
      shift = shift.map((v, c) => v + 0.7 * err[c]);
    }
    res = best;
    const file = `${out}.${format}`;
    await writeFile(file, res.buffer);
    const { size: bytes } = await stat(file);
    const ls = lStd(res.dec);
    results.push({ file, q: res.quality, kb: (bytes / 1024).toFixed(1), mean: res.cm.map((v) => v.toFixed(2)).join(","), lmean: ls.mean.toFixed(2), lstd: ls.std.toFixed(2), contrast: contrastReport(res.dec) });
    if (format === "webp" && opts.mosaic) {
      const tiles = [];
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) tiles.push({ input: res.buffer, left: c * size, top: r * size });
      await sharp({ create: { width: size * 3, height: size * 3, channels: 3, background: "#000" } }).composite(tiles).png().toFile(opts.mosaic);
    }
  }
  console.log(`[paper] k=${k.toFixed(4)} lossless mean=${channelMean(lossless).map((v) => v.toFixed(2))} Lstd=${lStd(lossless).std.toFixed(2)}`);
  for (const r of results) console.log(JSON.stringify(r));
}

run().catch((e) => { console.error(e.message || e); process.exit(1); });
