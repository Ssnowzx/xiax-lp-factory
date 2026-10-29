# Gallery v3 — prompts and layer pipeline (task 6.1 gate, design D6/D7)

Gate photo: slot 04, the feature shot (barber cutting a client's hair). Only this photo is
generated until the gate is approved.

| File | What | Size |
|---|---|---|
| `assets/gallery-src/v3/gallery-04-full.png` | AGY / Gemini original (1376×768 JPEG → centre-cropped to 16:9 1365×768 → Lanczos ×1.17) | 1600×900 RGB |
| `assets/gallery-src/v3/gallery-04-plate.png` | **local fill** (not Gemini — see status) | 1600×900 RGB |
| `assets/gallery-src/v3/gallery-04-subject.png` | people + attached chair side, cut from the original, unmixed against the plate | 1600×900 RGBA |

Status (2026-10-28): the Gemini edit for the plate could not run — `429 RESOURCE_EXHAUSTED` on
gemini-3.1-flash-image (~5 h reset). The plate is a local fill (mirror ring + diffusion, see
below). When the quota is back, run the edit below and rebuild the subject against that plate.

## Commands

```bash
# 1. original (16:9 → 1376×768)
scripts/v3-assets/agy-image.sh gallery_full_a 16:9 /tmp/g04-raw.png /tmp/gallery-04-full.txt
node -e "require('sharp')('/tmp/g04-raw.png').extract({left:5,top:0,width:1365,height:768}).resize(1600,900,{kernel:'lanczos3'}).toFile('assets/gallery-src/v3/gallery-04-full.png')"

# 2. people mask (Vision) — union with a second pass on a crop around the chair, whose side
#    panel Vision only returns as foreground in the crop (900,420 400×480)
swiftc -O scripts/v3-assets/fg-mask.swift -o /tmp/fg-mask
/tmp/fg-mask assets/gallery-src/v3/gallery-04-full.png /tmp/g04-people.pgm
node -e "require('sharp')('assets/gallery-src/v3/gallery-04-full.png').extract({left:900,top:420,width:400,height:480}).toFile('/tmp/g04-chair.png')"
/tmp/fg-mask /tmp/g04-chair.png /tmp/g04-chair.pgm
node scripts/v3-assets/gallery-layers.mjs union /tmp/g04-people.pgm /tmp/g04-chair.pgm 900 420 /tmp/g04-mask.pgm

# 3. plate (local fill now; Gemini edit later), then subject unmixed against that plate
node scripts/v3-assets/gallery-layers.mjs fill assets/gallery-src/v3/gallery-04-full.png /tmp/g04-mask.pgm assets/gallery-src/v3/gallery-04-plate.png
node scripts/v3-assets/gallery-layers.mjs subject assets/gallery-src/v3/gallery-04-full.png /tmp/g04-mask.pgm assets/gallery-src/v3/gallery-04-subject.png assets/gallery-src/v3/gallery-04-plate.png

# 4. parallax review (plate −14/0/+14 px vertical and horizontal under the fixed subject, @2×)
node scripts/v3-assets/gallery-layers.mjs review assets/gallery-src/v3/gallery-04-plate.png assets/gallery-src/v3/gallery-04-subject.png /tmp/g04-review assets/gallery-src/v3/gallery-04-full.png --shift 14
```

## Prompts (verbatim)

### Original — used (`gallery_full_a`)

```text
Realistic editorial photograph inside a warm, dark, premium Brazilian barbershop in the evening. A barber in a black t-shirt and a dark leather apron carefully trims the hair of a seated client using scissors and a comb; the client wears a black barber cape that covers the chair. Both men are in the midground slightly left of center, framed from the waist up, in sharp focus, and clearly separated from a deep background that is far behind them and softly out of focus with warm round bokeh from brass wall lamps, dark wood shelves with bottles and a large mirror. Low-key lighting, warm tungsten key light from the side, brass accents, espresso near-black shadows, shallow depth of field like an 85mm lens at f/1.8, natural skin texture, generic everyday people, no text, no logos, no signage, cinematic 16:9 composition.
```

Weakness: the "large mirror" put blurred reflections of people in the background (right mirror,
and the left one). They stay in the plate. Prefer variant B for the final set.

### Original — variant B (failed: quota; recommended for the next run)

```text
Realistic editorial photograph inside a warm, dark, premium Brazilian barbershop in the evening. A barber in a black t-shirt and a dark leather apron carefully trims the hair of a seated client using scissors and a comb; the client wears a black barber cape. The two men are in the foreground slightly left of center, framed from the chest up, tack sharp, and clearly separated from a deep background that is far behind them and strongly out of focus: dark wood paneling, shelves with amber bottles and warm round bokeh from brass wall lamps. No mirrors facing the camera, no reflections of people, nobody else in the scene. Low-key lighting, warm tungsten key light from the side with a soft rim light separating the hair and shoulders from the background, brass accents, espresso near-black shadows, shallow depth of field like an 85mm lens at f/1.4, natural skin texture, generic everyday people, no text, no logos, no signage, cinematic 16:9 composition.
```

### Plate — Gemini edit (pending; pass the ORIGINAL 1376×768 as reference)

```bash
scripts/v3-assets/agy-image.sh gallery_plate_a 16:9 /tmp/g04-plate-raw.png /tmp/gallery-04-plate.txt /abs/path/to/g04-raw.png
```

```text
Edit this photo: remove both men (the barber and the seated client), the black cape and the barber chair they are using, and fill the space with what would be behind them: the same dark wood shelves, wall, brass lamps and warm bokeh, continuing the existing perspective, lighting, film grain and depth of field. Keep everything else exactly as it is: same framing, same camera position, same colors, same blur. No people, no reflections of people, no text.
```

Then crop/resize exactly like the original, check alignment against the original outside the
people (Gemini edits can shift or re-render; if they do, register before use), save as the plate
and re-run step 3's `subject` against it — the subject's edge colours are unmixed against the
plate, so it must be rebuilt whenever the plate changes.

## Layer method (`scripts/v3-assets/gallery-layers.mjs`)

- **Alpha**: Vision mask snapped to real edges with a grey guided filter (r 6, eps 0.0012) — the raw
  mask is upsampled from low resolution and leaves a light rim around hands on the dark wall.
- **Subject colour**: unmixed against the plate, `F = (C − (1 − α)·P) / α`, so plate + subject at
  offset 0 reproduces the original (residual = clamped pixels only; see `diff-zero-x6.png`), and at
  a shift the composite is `C + (1 − α)·(P′ − P)`: no amplified edge noise, no halo.
- **Local plate**: hole = refined alpha > 0.02 grown 1 px; within 48 px of the hole border the
  background is mirrored across a smoothed border (blurred distance-field gradient, so lamps do not
  turn into sawteeth), deeper inside a cascaded normalized-convolution fill. Only that ring is ever
  revealed (a d px shift shows ≤ d px of hole). The hole interior is a flat average colour —
  invisible behind the subject but visible if someone opens the plate file alone.
- **Chair**: Vision returns the client's chair side panel only when run on a crop; it was unioned
  into the mask so the chrome moves with the client (without it the mirror fill duplicated the
  chrome at ±14 px). The headrest stays in the plate (it is behind the client's back).

## Gate result — provisional PASS at ±14 px (local plate)

See the agent report for the composite paths. Summary: no halo on hair, skin, shirt or cape at
−14/0/+14 px (both axes) at 2× and in a 300 % crop of the hair edge; no ghost or duplicate of the
people in the plate. Caveats: (1) at the "left" offset a small pale notch of mirrored lamp touches
the barber's crown (visible only zoomed); (2) at a ±28 px stress test the mirrored lamp above the
barber's head smears visibly → keep the subject/plate differential ≤ 14 px or use a Gemini plate;
(3) the plate is a local fill, not the Gemini edit D7 asks for; (4) the original is upscaled ×1.17
and its background mirrors contain blurred reflections of people.
