/**
 * Procedural pebble-grain leather source (no AI) — seamless by construction.
 * ============================================================================
 * Usage (from the repo root):
 *   node scripts/v3-assets/leather-procedural.mjs assets/textures-src/leather-v2.png [--cells 56] [--seed 7]
 *   node scripts/v3-assets/leather-tile.mjs assets/textures-src/leather-v2.png public/textures/leather-v2
 *
 * Fallback variation for task 7.1 when the image model is unavailable, and a control sample:
 * a periodic jittered-grid Voronoi (wraps at the tile border, so it tiles with no seam at all)
 * gives the pebbles (domain-warped so their outlines are organic, not polygons); F2 − F1 gives the
 * creases between them; a rounded cap per pebble plus fine pore noise gives the height. The height is lit from the upper left (emboss shading) so it reads
 * like grain under a soft light, not like a cell diagram. Output is a mid-grey 8-bit PNG;
 * `leather-tile.mjs` does the darkening to `--base` exactly as for the generated sources.
 *
 * Options:
 *   --size <px>     tile size (default 1024)
 *   --cells <n>     pebbles per side (default 56 → ~18 px pebbles, ~9 CSS px at 512 px tiling)
 *   --seed <n>      PRNG seed (default 7)
 */
import sharp from "sharp";

import { boxBlurWrap, smoothstep } from "./lib.mjs";

function parseArgs(argv) {
  const [out, ...rest] = argv;
  if (!out) throw new Error("usage: leather-procedural.mjs <out.png> [--cells n] [--seed n] [--size px]");
  const opts = { size: 1024, cells: 56, seed: 7 };
  for (let i = 0; i < rest.length; i += 2) {
    const key = rest[i].replace(/^--/, "");
    if (!(key in opts)) throw new Error(`unknown option ${rest[i]}`);
    opts[key] = Number(rest[i + 1]);
  }
  return { out, opts };
}

/** Small deterministic PRNG (mulberry32). */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Smooth periodic noise field in [-1, 1] (blurred white noise, wrapped). */
function smoothNoise(size, radius, random) {
  const raw = Float32Array.from({ length: size * size }, () => random() - 0.5);
  const blurred = boxBlurWrap(raw, size, size, radius, 3);
  let max = 0;
  for (const v of blurred) max = Math.max(max, Math.abs(v));
  return blurred.map((v) => v / max);
}

function voronoiHeight(size, cells, random) {
  const cell = size / cells;
  const points = Array.from({ length: cells * cells }, (_, k) => ({
    x: ((k % cells) + 0.1 + 0.8 * random()) * cell,
    y: (Math.floor(k / cells) + 0.1 + 0.8 * random()) * cell,
    lift: 0.6 + 0.8 * random(),
  }));
  // Domain warp: bends the straight Voronoi edges into organic, rounded pebble outlines.
  const warpX = smoothNoise(size, Math.round(cell * 0.8), random);
  const warpY = smoothNoise(size, Math.round(cell * 0.8), random);
  const depth = smoothNoise(size, Math.round(cell * 2), random);
  const height = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const sx = (((x + 0.45 * cell * warpX[i]) % size) + size) % size;
      const sy = (((y + 0.45 * cell * warpY[i]) % size) + size) % size;
      const cx = Math.floor(sx / cell);
      const cy = Math.floor(sy / cell);
      let f1 = Infinity;
      let f2 = Infinity;
      let lift = 1;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const gx = (cx + dx + cells) % cells;
          const gy = (cy + dy + cells) % cells;
          const p = points[gy * cells + gx];
          // Unwrap the neighbour across the tile border so distances wrap seamlessly.
          const px = p.x + (cx + dx - gx) * cell;
          const py = p.y + (cy + dy - gy) * cell;
          const d = Math.hypot(sx - px, sy - py);
          if (d < f1) {
            f2 = f1;
            f1 = d;
            lift = p.lift;
          } else if (d < f2) {
            f2 = d;
          }
        }
      }
      // Rounded pebble (spherical cap) cut by a narrow crease whose depth drifts across the hide.
      const dome = Math.sqrt(Math.max(0, 1 - (f1 / (0.85 * cell)) ** 2));
      const crease = 1 - smoothstep(0, 0.14 * cell, f2 - f1);
      height[i] = 0.8 * lift * dome - (0.45 + 0.3 * depth[i]) * crease;
    }
  }
  return height;
}

async function run() {
  const { out, opts } = parseArgs(process.argv.slice(2));
  const { size } = opts;
  const random = rng(opts.seed);
  let height = voronoiHeight(size, opts.cells, random);
  // Fine pores on top of the pebbles.
  const pores = boxBlurWrap(Float32Array.from({ length: size * size }, () => random() - 0.5), size, size, 1, 1);
  height = height.map((v, i) => v + 0.25 * pores[i]);
  height = boxBlurWrap(height, size, size, 1, 1);

  // Emboss shading from the upper left, plus the height itself for the crease darkness.
  const data = new Uint8Array(size * size);
  const at = (x, y) => height[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const gx = at(x + 1, y) - at(x - 1, y);
      const gy = at(x, y + 1) - at(x, y - 1);
      const shade = -(gx + gy) * 0.7071;
      const v = 128 + 120 * shade + 40 * at(x, y);
      data[y * size + x] = Math.max(0, Math.min(255, Math.round(v)));
    }
  }
  await sharp(Buffer.from(data), { raw: { width: size, height: size, channels: 1 } }).png().toFile(out);
  console.log(`[leather] procedural pebble grain → ${out} ${size}×${size} (${opts.cells} cells, seed ${opts.seed})`);
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
