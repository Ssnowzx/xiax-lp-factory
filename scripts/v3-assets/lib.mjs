/**
 * Shared helpers for the v3 asset pipeline (leather tiles, plan icons, gallery layers).
 * ============================================================================
 * Build-time only (sharp). Nothing here runs in the request path.
 *
 * Exports:
 *  - readRaw(path, opts)        → { data: Uint8Array, width, height, channels }
 *  - readPgm(path)              → { data, width, height } from an 8-bit P5 PGM (fg-mask.swift output)
 *  - writePgm(path, mask)       → 8-bit P5 PGM
 *  - boxBlurWrap(plane, w, h, r, passes) → Float32Array blurred with wrap-around edges
 *  - boxBlurClamp(plane, w, h, r, passes) → Float32Array blurred with clamped edges
 *  - smoothstep(e0, e1, x)
 *  - encodeToBudget(input, format, maxBytes, opts) → { buffer, quality }
 *  - hexToRgb(hex)
 *  - bleedTransparent(rgba, w, h) → fills RGB under (near-)transparent pixels with nearby colour
 */
import sharp from "sharp";

/** Reads any image into an 8-bit raw buffer. `opts.channels` forces 3 or 4 channels. */
export async function readRaw(path, { channels = 3, resize } = {}) {
  let pipe = sharp(path);
  if (resize) pipe = pipe.resize(resize);
  pipe = channels === 4 ? pipe.ensureAlpha() : pipe.removeAlpha();
  const { data, info } = await pipe.raw().toBuffer({ resolveWithObject: true });
  return { data: new Uint8Array(data), width: info.width, height: info.height, channels: info.channels };
}

/** One horizontal + vertical box-blur pass; `wrap` decides how out-of-range pixels are read. */
function boxPass(src, w, h, r, wrap) {
  const tmp = new Float32Array(w * h);
  const out = new Float32Array(w * h);
  const norm = 1 / (2 * r + 1);
  const idx = (i, n) => (wrap ? ((i % n) + n) % n : Math.min(n - 1, Math.max(0, i)));
  for (let y = 0; y < h; y++) {
    let acc = 0;
    for (let k = -r; k <= r; k++) acc += src[y * w + idx(k, w)];
    for (let x = 0; x < w; x++) {
      tmp[y * w + x] = acc * norm;
      acc += src[y * w + idx(x + r + 1, w)] - src[y * w + idx(x - r, w)];
    }
  }
  for (let x = 0; x < w; x++) {
    let acc = 0;
    for (let k = -r; k <= r; k++) acc += tmp[idx(k, h) * w + x];
    for (let y = 0; y < h; y++) {
      out[y * w + x] = acc * norm;
      acc += tmp[idx(y + r + 1, h) * w + x] - tmp[idx(y - r, h) * w + x];
    }
  }
  return out;
}

/** Approximates a Gaussian blur (3 box passes) on a single float plane, wrapping at edges. */
export function boxBlurWrap(plane, w, h, r, passes = 3) {
  let cur = Float32Array.from(plane);
  for (let i = 0; i < passes; i++) cur = boxPass(cur, w, h, r, true);
  return cur;
}

/** Same as boxBlurWrap but clamps reads to the image border. */
export function boxBlurClamp(plane, w, h, r, passes = 3) {
  let cur = Float32Array.from(plane);
  for (let i = 0; i < passes; i++) cur = boxPass(cur, w, h, r, false);
  return cur;
}

/**
 * Reads an 8-bit binary PGM (P5), the format `fg-mask.swift` writes: raw mask values with no
 * colour profile, so nothing gamma-converts them on the way in.
 */
export async function readPgm(path) {
  const { readFile } = await import("node:fs/promises");
  const buf = await readFile(path);
  const fields = [];
  let i = 0;
  while (fields.length < 4) {
    while (/\s/.test(String.fromCharCode(buf[i]))) i++;
    let token = "";
    while (!/\s/.test(String.fromCharCode(buf[i]))) token += String.fromCharCode(buf[i++]);
    fields.push(token);
  }
  if (fields[0] !== "P5" || fields[3] !== "255") throw new Error(`${path}: expected 8-bit binary PGM`);
  const width = Number(fields[1]);
  const height = Number(fields[2]);
  return { width, height, data: new Uint8Array(buf.subarray(i + 1, i + 1 + width * height)) };
}

/** Writes an 8-bit binary PGM (P5). */
export async function writePgm(path, { data, width, height }) {
  const { writeFile } = await import("node:fs/promises");
  await writeFile(path, Buffer.concat([Buffer.from(`P5\n${width} ${height}\n255\n`), Buffer.from(data)]));
}

export function smoothstep(e0, e1, x) {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

export function hexToRgb(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * Encodes `input` (path or sharp-readable buffer, optionally raw) as AVIF or WebP, lowering
 * quality until the result fits `maxBytes`. Returns the first (highest-quality) fit.
 * `exact` keeps RGB under transparent pixels (pair it with bleedTransparent) so lossy chroma
 * subsampling does not mix the object colour with black at the alpha edge.
 */
export async function encodeToBudget(input, format, maxBytes, { raw, qualities, alpha = false, exact = false } = {}) {
  const steps = qualities ?? [95, 90, 86, 82, 76, 70, 64, 58, 52, 46, 40, 34, 28];
  let last;
  for (const quality of steps) {
    const pipe = sharp(input, raw ? { raw } : undefined);
    const buffer =
      format === "avif"
        ? await pipe.avif({ quality, effort: 9, chromaSubsampling: alpha ? "4:4:4" : "4:2:0" }).toBuffer()
        : await pipe.webp({ quality, effort: 6, alphaQuality: 100, smartSubsample: true, exact }).toBuffer();
    last = { buffer, quality };
    if (buffer.length <= maxBytes) return last;
  }
  throw new Error(`[v3-assets] ${format} does not fit ${maxBytes} bytes even at quality ${last.quality}`);
}

/**
 * Fills the RGB of (near-)transparent pixels with the nearest object colour (alpha-weighted
 * blurs of growing radius). Invisible by itself; it keeps lossy codecs from bleeding black
 * (or random hues) into the anti-aliased edge. Mutates and returns `rgba`.
 */
export function bleedTransparent(rgba, w, h) {
  const n = w * h;
  const alpha = Float32Array.from({ length: n }, (_, i) => rgba[i * 4 + 3] / 255);
  const premult = [0, 1, 2].map((c) => Float32Array.from({ length: n }, (_, i) => rgba[i * 4 + c] * alpha[i]));
  const pending = new Set();
  // α ≤ 8 counts as transparent too: after a premultiplied resize those pixels carry garbage
  // hues (e.g. pure blue at α = 1) that chroma subsampling smears into opaque neighbours.
  for (let i = 0; i < n; i++) if (rgba[i * 4 + 3] <= 8) pending.add(i);
  for (const r of [2, 6, 16, 48]) {
    if (pending.size === 0) break;
    const a = boxBlurClamp(alpha, w, h, r, 2);
    const p = premult.map((plane) => boxBlurClamp(plane, w, h, r, 2));
    for (const i of pending) {
      if (a[i] < 1e-4) continue;
      for (let c = 0; c < 3; c++) rgba[i * 4 + c] = Math.min(255, Math.round(p[c][i] / a[i]));
      pending.delete(i);
    }
  }
  return rgba;
}
