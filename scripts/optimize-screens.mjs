/**
 * Real Xchair screens → the page's slots (change xiax-lp-v4-xchair · design D2).
 *
 * Reads the retina masters from `scripts/capture-screens.mjs` (`assets/screens-src/*@2x.png`)
 * and crops each slot to `public/screens/<slot>.webp`. Crops are in CSS px of the artboard and
 * are cut from the 2x master, so the output keeps 2 device px per CSS px — nothing is ever
 * upscaled. `next/image` then negotiates AVIF/WebP per `sizes`. Keep `lib/data/screens.ts`
 * (width/height/alt) in step with the sizes printed here.
 *
 * The three step crops are square, so the #como-funciona cards share one stage (owner,
 * 2026-10-28: the first mixed-size cut "não encaixou bem").
 * Crops leave out what the Essencial plan does not do yet (per-barber columns where possible,
 * subscription club, team commission, occupancy report), see design D2.
 *
 * The `salon-*` slots come from the salon masters (`salon-home`, `salon-time-choice`, `salon-confirmed`,
 * `salon-day-agenda`); the salon month chart has its own light board (`salon-month-results`).
 *
 * Run: `node scripts/optimize-screens.mjs`. Idempotent.
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "assets", "screens-src");
const OUT = path.join(ROOT, "public", "screens");
const SCALE = 2;

/** slot → master + crop box in CSS px (null = the whole artboard). */
const SLOTS = [
  { slot: "barbershop-home", master: "barbershop-home", crop: null },
  { slot: "day-agenda", master: "day-agenda", crop: { x: 0, y: 0, w: 1440, h: 900 } },
  { slot: "step-time-choice", master: "time-choice", crop: { x: 0, y: 296, w: 390, h: 390 } },
  { slot: "step-day-agenda", master: "day-agenda", crop: { x: 274, y: 600, w: 421, h: 421 } },
  { slot: "step-confirmed", master: "confirmed", crop: { x: 0, y: 300, w: 390, h: 390 } },
  { slot: "attention-today", master: "day-agenda", crop: { x: 1080, y: 236, w: 336, h: 380 } },
  { slot: "month-results", master: "month-results", crop: { x: 265, y: 372, w: 790, h: 476 } },
  // Salon (change xiax-lp-v5-salon · design D5). Example data: "Salão Aurora".
  { slot: "salon-home", master: "salon-home", crop: null },
  { slot: "salon-day-agenda", master: "salon-day-agenda", crop: { x: 0, y: 0, w: 1440, h: 900 } },
  { slot: "salon-step-time-choice", master: "salon-time-choice", crop: { x: 0, y: 296, w: 390, h: 390 } },
  { slot: "salon-step-day-agenda", master: "salon-day-agenda", crop: { x: 262, y: 530, w: 560, h: 560 } },
  { slot: "salon-step-confirmed", master: "salon-confirmed", crop: { x: 0, y: 300, w: 390, h: 390 } },
  // from the 3x master: shown at ~382 CSS px at 1440, more than a 2x crop holds
  { slot: "salon-attention-today", master: "salon-day-agenda", scale: 3, crop: { x: 1080, y: 236, w: 336, h: 380 } },
  // Month chart of the salon's own light board (no forecast box: the app has no forecast yet, see owner-insights)
  { slot: "salon-month-results", master: "salon-month-results", crop: { x: 255, y: 90, w: 740, h: 424 } },
  // The booking page's home in each look the owner picks in the panel (#modelos). Masters in
  // `themes/`, captured by the app; names and descriptions in `themes/themes.json`.
  ...["navalha", "velha-guarda", "poste", "oficina", "porcelana", "rose", "salvia", "noite-de-gala"].map((id) => ({
    slot: `theme-${id}`,
    master: `themes/${id}`,
    crop: null,
  })),
];

async function cut({ slot, master, scale = SCALE, crop }) {
  const input = sharp(path.join(SRC, `${master}@${scale}x.png`));
  const region = crop
    ? { left: crop.x * scale, top: crop.y * scale, width: crop.w * scale, height: crop.h * scale }
    : null;
  const out = path.join(OUT, `${slot}.webp`);
  const info = await (region ? input.extract(region) : input)
    .webp({ quality: 90, effort: 6, smartSubsample: true })
    .toFile(out);
  return `${path.relative(ROOT, out)}  ${info.width}×${info.height}  ${(info.size / 1024).toFixed(0)} KB`;
}

await mkdir(OUT, { recursive: true });
// optional slot names: re-cut only those (the others' files stay byte for byte)
const only = process.argv.slice(2);
for (const slot of SLOTS.filter((s) => only.length === 0 || only.includes(s.slot))) process.stdout.write(`${await cut(slot)}\n`);
