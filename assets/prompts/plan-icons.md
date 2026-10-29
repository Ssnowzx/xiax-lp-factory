# Plan icons — prompts and pipeline (task 4.1)

## Current mapping (change xiax-lp-v4-xchair)

The plans became Essencial / Completo / Signature. No new images were generated: three of the
four brass objects were renamed to the new plans, and the comb left the page.

| Plan (now) | Object | Served file | Was |
|---|---|---|---|
| `essencial` | scissors | `public/icons/plans/essencial.webp` | `corte.webp` |
| `completo` | straight razor | `public/icons/plans/completo.webp` | `corte-barba.webp` |
| `signature` | crown | `public/icons/plans/signature.webp` | `vip.webp` |
| — (retired) | comb | moved out of `public/` (session scratchpad) | `premium.webp` |

The sources in `assets/icons-src/` keep their old names (`corte.png`, `corte-barba.png`,
`vip.png`, `premium.png`); the table below is the original generation record under those names.
The icons are decorative (`alt=""`): the plan's `<h3>` carries the name.

## Original generation (four old plans)

Four brass objects, one shared style template (same light, angle, background), generated with
AGY / Gemini on **pure black** (design D7.4: black background → clean alpha, no light halo on the
dark plan cards).

| Plan | Object | AGY ImageName | Source | Output |
|---|---|---|---|---|
| `corte` | scissors | `icon_scissors` | `assets/icons-src/corte.png` | `public/icons/plans/corte.webp` |
| `corte-barba` | straight razor | `icon_razor` | `assets/icons-src/corte-barba.png` | `public/icons/plans/corte-barba.webp` |
| `premium` | comb | `icon_comb` | `assets/icons-src/premium.png` | `public/icons/plans/premium.webp` |
| `vip` | crown | `icon_crown` | `assets/icons-src/vip.png` | `public/icons/plans/vip.webp` |

## Command

```bash
scripts/v3-assets/agy-image.sh icon_scissors 1:1 assets/icons-src/corte.png /tmp/icon-corte.txt
```

(AGY → `image-generator` subagent → `generate_image`; 1024×1024 JPEG re-saved as PNG.)

## Prompt template (verbatim; `OBJECT` replaced per icon)

```text
Studio product photograph of a single OBJECT, made entirely of polished brass with a warm golden brass color, shown at a three-quarter angle viewed from slightly above, oriented diagonally from lower left to upper right, centered and fully visible with a generous empty margin on all sides, isolated on a pure solid black background, one soft key light from the upper left plus a gentle warm rim light, crisp clean silhouette, no shadow, no reflection, no floor, no props, no text, no engraving, no logo, photorealistic, sharp focus, high detail.
```

| Icon | OBJECT |
|---|---|
| corte | `pair of classic barber scissors, slightly open, with ring finger holes and a finger rest` |
| corte-barba | `classic folding straight razor, blade half open from its handle (both blade and handle in brass)` |
| premium | `barber comb with a row of fine evenly spaced teeth and a row of wider teeth` |
| vip | `small royal crown with five points each topped by a small sphere, plain metal band, no gemstones` |

## Post-processing

```bash
swiftc -O scripts/v3-assets/fg-mask.swift -o /tmp/fg-mask          # macOS 14+ Vision
/tmp/fg-mask assets/icons-src/corte.png /tmp/corte-mask.pgm
node scripts/v3-assets/icon-cutout.mjs assets/icons-src/corte.png /tmp/corte-mask.pgm \
  public/icons/plans/corte.webp --review /tmp/icon-review
```

- Alpha = max(Vision mask eroded 3 px and feathered → opaque body, luminance key above the measured
  background noise → anti-aliased edge), bounded by the Vision mask dilated 4 px. Needed because
  polished brass mirrors the black studio: a luminance key alone makes dark reflections see-through.
- Colour un-premultiplied against black (F = C/α; faintest edge pixels use the local object colour),
  so on any dark card the composite equals C + (1 − α)·card — no rim.
- Trim to the alpha box, 6 % padding, square, 320×320 (sharp premultiplied resize), colour bled under
  transparent pixels and WebP `exact` encode (otherwise 4:2:0 chroma smears blue/green specks into
  the edge).

Results: 320×320 WebP with alpha — corte 22.7 KB (q90), corte-barba 22.6 KB (q86), premium 22.3 KB
(q90), vip 22.9 KB (q86). Checked on `#1C1815`, `#241F1A` (and a diagnostic `#7A7A7A`) at 1× and 4×:
no halo on the real surfaces; zero off-hue edge pixels with α > 16.

Known style drift: the comb came out brushed/satin while the others are polished; the scissors are
closer to top-down than 3/4. Regenerate that icon if the owner wants them tighter.

## Salon Completo icon — round brush (change xiax-lp-v5-salon, task 6.4 / Part B)

The salon page must not show the straight razor on the Completo card. One new brass object,
generated once (2026-10-28), same template and post-processing as above.

| Icon | OBJECT | AGY ImageName | Source | Output |
|---|---|---|---|---|
| salon-completo | `round hair styling brush with a cylindrical vented barrel ringed by short bristles and a slim handle` | `icon_round_brush` | `assets/icons-src/salon-completo.png` | `public/icons/plans/salon-completo.webp` |

```bash
scripts/v3-assets/agy-image.sh icon_round_brush 1:1 assets/icons-src/salon-completo.png /tmp/icon-brush.txt
swiftc -O scripts/v3-assets/fg-mask.swift -o /tmp/fg-mask
/tmp/fg-mask assets/icons-src/salon-completo.png /tmp/sc-mask.pgm
node scripts/v3-assets/icon-cutout.mjs assets/icons-src/salon-completo.png /tmp/sc-mask.pgm \
  public/icons/plans/salon-completo.webp --review /tmp/icon-review
```

Prompt: the template above with OBJECT replaced (verbatim). Result: 320×320 WebP with alpha,
23.4 KB (q90). Checked composited on `#F6F1EA` and `#EFE8DE` (4× crop) and on the dark surfaces:
no halo. Not wired into the page yet.
