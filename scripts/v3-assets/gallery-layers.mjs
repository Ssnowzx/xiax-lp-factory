/**
 * Gallery layers — subject cutout, local background plate and parallax review (task 6.1, design D6/D7).
 * ============================================================================
 * Usage (from the repo root; masks come from `fg-mask.swift`):
 *
 *   node scripts/v3-assets/gallery-layers.mjs subject <full.png> <mask.pgm> <subject.png> [plate.png]
 *     Cutout of the people from the ORIGINAL, same pixel size, transparent elsewhere. The Vision
 *     mask edge is slightly loose and carries the original background in its soft band, so:
 *     alpha is snapped to real edges with a guided filter, and edge colours are unmixed against the
 *     local background (F = (C − (1 − α)·B) / α; the faintest pixels lean on the nearby subject
 *     colour) — otherwise the old background shows as a halo once the plate moves under it.
 *     Pass the (pixel-aligned) plate to unmix against it exactly: then plate + subject at offset 0
 *     reproduces the original photo. Run `fill` (or align the generated plate) first.
 *
 *   node scripts/v3-assets/gallery-layers.mjs fill <full.png> <mask.pgm> <plate.png> [--grow 1] [--band 48]
 *     Local plate (fallback when no generated "scene without people" plate is available): the
 *     hole = refined subject alpha grown by --grow px; inside a --band px ring along the hole
 *     border the background is continued by mirroring it across a smoothed border (keeps
 *     grain/bokeh texture without sawteeth);
 *     deeper inside a smooth multi-scale diffusion fill. Only the ring is ever seen: with a parallax
 *     shift of d px the plate reveals at most d px of the hole next to the subject.
 *
 *   node scripts/v3-assets/gallery-layers.mjs review <plate.png> <subject.png> <out-dir> [original.png] [--shift 14] [--scale 2]
 *     Simulates the parallax: plate shifted by −shift, 0, +shift vertically and horizontally
 *     (edge-extended, like an oversized layer) under the fixed subject; writes each composite
 *     at --scale and a contact sheet. With the original it also writes diff-zero-x6.png
 *     (|layers at offset 0 − original| × 6): anything bright there is a halo or a hole.
 *
 *   node scripts/v3-assets/gallery-layers.mjs union <mask.pgm> <crop-mask.pgm> <left> <top> <out.pgm>
 *     Max-merges a Vision mask computed on a crop (placed at left/top) into the full mask — e.g.
 *     the barber chair's side panel, which Vision only calls foreground in a tighter frame.
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

import { bleedTransparent, boxBlurClamp, readPgm, readRaw, smoothstep, writePgm } from "./lib.mjs";

function parseFlags(rest, defaults) {
  const opts = { ...defaults };
  for (let i = 0; i < rest.length; i += 2) {
    const key = rest[i].replace(/^--/, "");
    if (!(key in opts)) throw new Error(`unknown option ${rest[i]}`);
    opts[key] = Number(rest[i + 1]);
  }
  return opts;
}

async function loadPair(fullPath, maskPath) {
  const rgb = await readRaw(fullPath);
  const mask = await readPgm(maskPath);
  if (mask.width !== rgb.width || mask.height !== rgb.height) throw new Error("mask and image sizes differ");
  return { rgb, mask };
}

// ---------------------------------------------------------------------------------------------
// shared

/**
 * Snaps the coarse Vision mask to real image edges with a grey guided filter (He et al.):
 * q = mean(a)·I + mean(b), a = cov(I, p) / (var(I) + eps). The Vision mask is upsampled from a low
 * resolution and sits a few px off the true edge; left as is, its soft band carries background
 * into the cutout (light rim around a hand on a dark wall) or cuts into hair.
 */
function refineAlpha(rgb, mask, radius = 6, eps = 0.0012) {
  const { width: w, height: h } = rgb;
  const n = w * h;
  const I = Float32Array.from({ length: n }, (_, i) => (0.2126 * rgb.data[i * 3] + 0.7152 * rgb.data[i * 3 + 1] + 0.0722 * rgb.data[i * 3 + 2]) / 255);
  const p = Float32Array.from(mask.data, (v) => v / 255);
  const box = (plane) => boxBlurClamp(plane, w, h, radius, 1);
  const meanI = box(I);
  const meanP = box(p);
  const corrII = box(I.map((v) => v * v));
  const corrIP = box(I.map((v, i) => v * p[i]));
  const a = new Float32Array(n);
  const b = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const varI = corrII[i] - meanI[i] * meanI[i];
    const covIP = corrIP[i] - meanI[i] * meanP[i];
    a[i] = covIP / (varI + eps);
    b[i] = meanP[i] - a[i] * meanI[i];
  }
  const meanA = box(a);
  const meanB = box(b);
  return Float32Array.from({ length: n }, (_, i) => smoothstep(0.08, 0.92, meanA[i] * I[i] + meanB[i]));
}

/**
 * Local mean colour of the pixels selected by `weight`, from cascaded normalized convolutions
 * (nearest scale with support wins). Returns three planes plus a `found` flag per pixel.
 */
function localMean(rgb, weight, radii = [2, 5, 12, 30]) {
  const { width: w, height: h } = rgb;
  const n = w * h;
  const planes = [new Float32Array(n), new Float32Array(n), new Float32Array(n)];
  const found = new Uint8Array(n);
  for (const r of radii) {
    const support = boxBlurClamp(weight, w, h, r, 2);
    const sums = [0, 1, 2].map((c) =>
      boxBlurClamp(Float32Array.from({ length: n }, (_, i) => rgb.data[i * 3 + c] * weight[i]), w, h, r, 2),
    );
    for (let i = 0; i < n; i++) {
      if (found[i] || support[i] < 0.02) continue;
      for (let c = 0; c < 3; c++) planes[c][i] = sums[c][i] / support[i];
      found[i] = 1;
    }
  }
  return { planes, found };
}

// ---------------------------------------------------------------------------------------------
// subject

async function subject(fullPath, maskPath, outPath, platePath) {
  const { rgb, mask } = await loadPair(fullPath, maskPath);
  const { width: w, height: h } = rgb;
  const n = w * h;
  const alpha = refineAlpha(rgb, mask);
  const fg = localMean(rgb, Float32Array.from(alpha, (a) => (a >= 0.97 ? 1 : 0)));
  // Background behind the soft edge: the plate itself when given (then plate + subject at offset 0
  // reproduces the original exactly), else the local mean of the pure-background pixels.
  let bg = localMean(rgb, Float32Array.from(alpha, (a) => (a <= 0.01 ? 1 : 0)));
  if (platePath) {
    const plate = await readRaw(platePath);
    if (plate.width !== w || plate.height !== h) throw new Error("plate and image sizes differ");
    bg = {
      planes: [0, 1, 2].map((c) => Float32Array.from({ length: n }, (_, i) => plate.data[i * 3 + c])),
      found: new Uint8Array(n).fill(1),
    };
  }

  const rgba = new Uint8Array(n * 4);
  for (let i = 0; i < n; i++) {
    const a = alpha[i];
    if (a <= 0) continue;
    rgba[i * 4 + 3] = Math.round(a * 255);
    for (let c = 0; c < 3; c++) {
      const observed = rgb.data[i * 3 + c];
      if (a >= 0.97) {
        rgba[i * 4 + c] = observed;
        continue;
      }
      // Unmix the edge against the local background: C = α·F + (1 − α)·B  →  F = (C − (1 − α)·B) / α.
      // Very low α is too noisy to unmix, so it leans on the nearby opaque subject colour.
      const back = bg.found[i] ? bg.planes[c][i] : observed;
      const unmixed = Math.min(255, Math.max(0, (observed - (1 - a) * back) / a));
      const near = fg.found[i] ? fg.planes[c][i] : unmixed;
      // With the real plate the unmix is exact (composite = C + (1 − α)·(P′ − P) when the plate
      // moves), so it is trusted all the way down; without it, low α is too noisy.
      const trust = platePath ? 1 : smoothstep(0.15, 0.5, a);
      rgba[i * 4 + c] = Math.round(unmixed * trust + near * (1 - trust));
    }
  }
  bleedTransparent(rgba, w, h);
  await sharp(Buffer.from(rgba), { raw: { width: w, height: h, channels: 4 } }).png().toFile(outPath);
  console.log(`[gallery] subject → ${outPath} ${w}×${h}`);
}

// ---------------------------------------------------------------------------------------------
// fill

/** Approximate Euclidean feature transform: nearest non-hole pixel for every hole pixel. */
function nearestOutside(hole, w, h) {
  const INF = 1e9;
  const sx = new Int32Array(w * h).fill(-1);
  const sy = new Int32Array(w * h).fill(-1);
  const d2 = new Float64Array(w * h).fill(INF);
  for (let i = 0; i < w * h; i++) {
    if (!hole[i]) {
      sx[i] = i % w;
      sy[i] = (i / w) | 0;
      d2[i] = 0;
    }
  }
  const relax = (x, y, nx, ny) => {
    if (nx < 0 || ny < 0 || nx >= w || ny >= h) return;
    const j = ny * w + nx;
    if (sx[j] < 0) return;
    const i = y * w + x;
    const dd = (x - sx[j]) ** 2 + (y - sy[j]) ** 2;
    if (dd < d2[i]) {
      d2[i] = dd;
      sx[i] = sx[j];
      sy[i] = sy[j];
    }
  };
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        relax(x, y, x - 1, y);
        relax(x, y, x, y - 1);
        relax(x, y, x - 1, y - 1);
        relax(x, y, x + 1, y - 1);
      }
      for (let x = w - 1; x >= 0; x--) relax(x, y, x + 1, y);
    }
    for (let y = h - 1; y >= 0; y--) {
      for (let x = w - 1; x >= 0; x--) {
        relax(x, y, x + 1, y);
        relax(x, y, x, y + 1);
        relax(x, y, x + 1, y + 1);
        relax(x, y, x - 1, y + 1);
      }
      for (let x = 0; x < w; x++) relax(x, y, x - 1, y);
    }
  }
  return { sx, sy, dist: Float64Array.from(d2, Math.sqrt) };
}

/**
 * Smooth fill of the hole by cascaded normalized convolution: at each radius (4…256) the local
 * mean of valid pixels blur(colour·valid) / blur(valid), trusted in proportion to how much valid
 * support it has; the nearest scale with support wins, larger scales only fill what is left.
 * No blocks, no seams (no texture either; the mirror ring provides that where it can be seen).
 */
function diffuseFill(planes, valid, w, h) {
  const n = w * h;
  const out = planes.map(() => new Float32Array(n));
  const remaining = new Float32Array(n).fill(1);
  const radii = [4, 8, 16, 32, 64, 128, 256];
  for (const [k, r] of radii.entries()) {
    const a = boxBlurClamp(valid, w, h, r, 2);
    const p = planes.map((plane) => boxBlurClamp(Float32Array.from(plane, (v, i) => v * valid[i]), w, h, r, 2));
    const last = k === radii.length - 1;
    for (let i = 0; i < n; i++) {
      if (remaining[i] <= 0 || a[i] < 1e-6) continue;
      const trust = last ? 1 : smoothstep(0.02, 0.25, a[i]);
      const take = remaining[i] * trust;
      for (let c = 0; c < 3; c++) out[c][i] += take * (p[c][i] / a[i]);
      remaining[i] -= take;
    }
  }
  return out;
}

async function fill(fullPath, maskPath, outPath, rest) {
  const opts = parseFlags(rest, { grow: 1, band: 48 });
  const { rgb, mask } = await loadPair(fullPath, maskPath);
  const { width: w, height: h } = rgb;
  const n = w * h;
  // Same refined alpha as the subject, so the hole hugs exactly what the cutout covers.
  const seed = Float32Array.from(refineAlpha(rgb, mask), (a) => (a > 0.02 ? 1 : 0));
  const grown = boxBlurClamp(seed, w, h, opts.grow, 1);
  const hole = Uint8Array.from(grown, (v) => (v > 1e-4 ? 1 : 0));

  const planes = [0, 1, 2].map((c) => Float32Array.from({ length: n }, (_, i) => rgb.data[i * 3 + c]));
  const valid = Float32Array.from(hole, (v) => 1 - v);
  const diffused = diffuseFill(planes, valid, w, h);
  const { sx, sy, dist } = nearestOutside(hole, w, h);

  // Mirror across a SMOOTHED border: the reflection direction is the gradient of a blurred
  // distance field, so a jagged silhouette does not turn bright shapes (lamps) into sawteeth.
  const smoothDist = boxBlurClamp(Float32Array.from(dist), w, h, 6, 2);
  const sample = (x, y, c) => {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = x - x0;
    const fy = y - y0;
    const at = (xx, yy) => rgb.data[(yy * w + xx) * 3 + c];
    return (
      at(x0, y0) * (1 - fx) * (1 - fy) + at(x0 + 1, y0) * fx * (1 - fy) + at(x0, y0 + 1) * (1 - fx) * fy + at(x0 + 1, y0 + 1) * fx * fy
    );
  };
  const outside = (x, y) => {
    const xi = Math.round(x);
    const yi = Math.round(y);
    return xi >= 1 && yi >= 1 && xi < w - 2 && yi < h - 2 && !hole[yi * w + xi];
  };

  const out = new Uint8Array(n * 3);
  for (let i = 0; i < n; i++) {
    if (!hole[i]) {
      for (let c = 0; c < 3; c++) out[i * 3 + c] = rgb.data[i * 3 + c];
      continue;
    }
    const x = i % w;
    const y = (i / w) | 0;
    let qx = -1;
    let qy = -1;
    const gx = smoothDist[i + (x < w - 1 ? 1 : 0)] - smoothDist[i - (x > 0 ? 1 : 0)];
    const gy = smoothDist[i + (y < h - 1 ? w : 0)] - smoothDist[i - (y > 0 ? w : 0)];
    const len = Math.hypot(gx, gy);
    if (len > 1e-3) {
      qx = x - (2 * dist[i] * gx) / len;
      qy = y - (2 * dist[i] * gy) / len;
    }
    if (!outside(qx, qy)) {
      qx = 2 * sx[i] - x;
      qy = 2 * sy[i] - y;
    }
    const mirrored = outside(qx, qy);
    const wm = mirrored ? 1 - smoothstep(opts.band * 0.6, opts.band, dist[i]) : 0;
    for (let c = 0; c < 3; c++) {
      const m = mirrored ? sample(qx, qy, c) : 0;
      out[i * 3 + c] = Math.round(m * wm + diffused[c][i] * (1 - wm));
    }
  }
  // Soften the mirror/diffusion patchwork inside the hole only (outside stays pixel-identical).
  const soft = [0, 1, 2].map((c) => boxBlurClamp(Float32Array.from({ length: n }, (_, i) => out[i * 3 + c]), w, h, 1, 1));
  for (let i = 0; i < n; i++) {
    if (hole[i] && dist[i] > 2) for (let c = 0; c < 3; c++) out[i * 3 + c] = Math.round(soft[c][i]);
  }
  await sharp(Buffer.from(out), { raw: { width: w, height: h, channels: 3 } }).png().toFile(outPath);
  console.log(`[gallery] local plate → ${outPath} ${w}×${h} (hole grown ${opts.grow}px, mirror band ${opts.band}px)`);
}

// ---------------------------------------------------------------------------------------------
// review

async function shiftedPlate(platePath, w, h, dx, dy) {
  const m = Math.max(Math.abs(dx), Math.abs(dy)) + 1;
  // Edge-extend like an oversized layer would, then crop the window that a (dx, dy) move shows.
  const extended = await sharp(platePath).extend({ top: m, bottom: m, left: m, right: m, extendWith: "copy" }).png().toBuffer();
  return sharp(extended)
    .extract({ left: m - dx, top: m - dy, width: w, height: h })
    .png()
    .toBuffer();
}

async function review(platePath, subjectPath, outDir, rest) {
  const original = rest[0] && !rest[0].startsWith("--") ? rest.shift() : null;
  const opts = parseFlags(rest, { shift: 14, scale: 2 });
  await mkdir(outDir, { recursive: true });
  const { width: w, height: h } = await sharp(subjectPath).metadata();
  const s = opts.shift;
  const offsets = [
    ["up", 0, -s],
    ["zero", 0, 0],
    ["down", 0, s],
    ["left", -s, 0],
    ["right", s, 0],
  ];
  const sheet = [];
  for (const [label, dx, dy] of offsets) {
    const plate = await shiftedPlate(platePath, w, h, dx, dy);
    const composite = await sharp(plate).composite([{ input: subjectPath }]).png().toBuffer();
    const file = path.join(outDir, `parallax-${label}-${s}px@${opts.scale}x.png`);
    await sharp(composite).resize(w * opts.scale, h * opts.scale, { kernel: "lanczos3" }).png().toFile(file);
    sheet.push({ label, composite });
    if (original && label === "zero") {
      // At offset 0 the layered photo must equal the original; any residue is halo or hole.
      const diff = await sharp(composite)
        .removeAlpha()
        .composite([{ input: await sharp(original).removeAlpha().png().toBuffer(), blend: "difference" }])
        .linear(6, 0)
        .png()
        .toFile(path.join(outDir, "diff-zero-x6.png"));
      void diff;
    }
  }
  const tw = Math.round(w / 2);
  const th = Math.round(h / 2);
  const tiles = await Promise.all(sheet.map(({ composite }) => sharp(composite).resize(tw, th).png().toBuffer()));
  await sharp({ create: { width: tw * 3, height: th * 2, channels: 3, background: "#000" } })
    .composite(tiles.map((input, i) => ({ input, left: (i % 3) * tw, top: Math.floor(i / 3) * th })))
    .png()
    .toFile(path.join(outDir, `parallax-sheet-${s}px.png`));
  console.log(`[gallery] review → ${outDir} (shift ±${s}px, ${offsets.length} composites @${opts.scale}x)`);
}

// ---------------------------------------------------------------------------------------------
// union

/** Max-merges a mask computed on a crop (Vision sees more foreground in a tighter frame). */
async function union(maskPath, cropMaskPath, left, top, outPath) {
  const base = await readPgm(maskPath);
  const crop = await readPgm(cropMaskPath);
  const data = Uint8Array.from(base.data);
  for (let y = 0; y < crop.height; y++) {
    for (let x = 0; x < crop.width; x++) {
      const i = (y + top) * base.width + (x + left);
      data[i] = Math.max(data[i], crop.data[y * crop.width + x]);
    }
  }
  await writePgm(outPath, { data, width: base.width, height: base.height });
  console.log(`[gallery] mask union → ${outPath}`);
}

const [mode, ...args] = process.argv.slice(2);
const modes = {
  subject: () => subject(args[0], args[1], args[2], args[3]),
  fill: () => fill(args[0], args[1], args[2], args.slice(3)),
  review: () => review(args[0], args[1], args[2], args.slice(3)),
  union: () => union(args[0], args[1], Number(args[2]), Number(args[3]), args[4]),
};
if (!modes[mode]) {
  console.error("usage: gallery-layers.mjs subject|fill|review|union …  (see header)");
  process.exit(1);
}
modes[mode]().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
