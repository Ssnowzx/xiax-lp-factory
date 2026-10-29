# Leather background — prompts and pipeline (task 7.1, design D8)

Status (2026-10-28): **2 of 3 variations delivered**. The image model hit its quota
(`429 RESOURCE_EXHAUSTED`, gemini-3.1-flash-image, ~5 h reset) after the first batch, so only one
AI source exists; v2 is a procedural fallback. The two prompts that failed are kept below to
generate v3 later.

| Variation | Source | Look | Files |
|---|---|---|---|
| v1 | AGY / Gemini (`leather_v3` prompt below) | smooth oxblood aniline, faint mottling and streaks | `assets/textures-src/leather-v1.png` → `public/textures/leather-v1.{avif,webp}` |
| v2 | procedural (`scripts/v3-assets/leather-procedural.mjs --cells 56 --seed 7`) | pebble grain, uniform, zero repetition | `assets/textures-src/leather-v2.png` → `public/textures/leather-v2.{avif,webp}` |
| v3 | pending — AGY, pebble or nappa prompt below | — | — |

## Command

```bash
# 1:1 → AGY returns a 1024×1024 JPEG, saved as PNG
scripts/v3-assets/agy-image.sh leather_v3 1:1 assets/textures-src/leather-v1.png /tmp/leather-aniline.txt
```

`agy-image.sh` runs `agy -p "<instruction>" --print-timeout 300s --mode accept-edits --add-dir <tmp>`;
the instruction tells the main agent to have its `image-generator` subagent call
`generate_image(ImageName, AspectRatio, Prompt)` once with the prompt verbatim. See the script header.

## Prompts (verbatim)

### Aniline (used → v1)

```text
Seamless tileable texture, flat top-down orthographic macro photograph of dark oxblood-brown aniline leather from premium barber chair upholstery, smooth surface with very fine pores and faint natural mottling, tiny subtle grain, very low contrast, soft perfectly even diffuse lighting, matte, no highlights, no shine, no vignette, no stitching, no seams, no folds, no creases, no buttons, no edges, no logos, no text, uniform color and brightness across the entire frame, the pattern wraps seamlessly on all four edges.
```

### Pebble grain (failed: quota — use for v3)

```text
Seamless tileable texture, flat top-down orthographic macro photograph of dark espresso-brown full-grain leather from vintage barber chair upholstery, fine natural pebble grain with tiny pores, evenly distributed small-scale detail, very low contrast, soft perfectly even diffuse lighting, matte finish, no highlights, no shine, no vignette, no stitching, no seams, no folds, no creases, no buttons, no edges, no logos, no text, uniform color and brightness across the entire frame, the pattern wraps seamlessly on all four edges.
```

### Nappa (failed: quota — alternative v3)

```text
Seamless tileable texture, flat top-down orthographic macro photograph of near-black dark brown aged nappa leather from a classic barber chair seat, fine crinkled grain with tiny irregular wrinkles, small-scale uniform detail, very low contrast, soft perfectly even diffuse lighting, matte, no highlights, no shine, no vignette, no stitching, no seams, no folds, no buttons, no edges, no logos, no text, uniform color and brightness across the entire frame, the pattern wraps seamlessly on all four edges.
```

## Post-processing

```bash
node scripts/v3-assets/leather-tile.mjs assets/textures-src/leather-v1.png public/textures/leather-v1 \
  --mosaic /tmp/leather-v1-mosaic.png      # defaults: --base #14110E --contrast 0.24 --band 160
```

1. Luminance only; flatten lighting (divide by a 40 px wrap blur).
2. Seamless: two separable passes, each a variance-preserving cross-fade with a copy offset by
   half + 4 px (border lands mid-block of the source JPEG grid), feathered over 160 px.
3. Light 3×3 soften (drops JPEG pixel noise that codecs smear unevenly at the border).
4. Darken: `RGB = base × (1 + 0.24·z)`, soft-limited to [0.45, 1.95] and re-centred → mean exactly
   `#14110E`, brightest pixel ≈ `#251F1A` (spec: keep under `#2A231C`).
5. AVIF + WebP at the highest quality ≤ 80 KB; 3×3 mosaic (+ ×6 contrast-boosted copy and a 1:1
   ×8 crop of a four-tile corner) for inspection; seam z-score printed (border line vs every
   other line; |z| < ~3 = indistinguishable).

Results (1024×1024):

| File | Quality | Size | Mean | Brightest | Seam z |
|---|---|---|---|---|---|
| leather-v1.avif | q64 | 59.3 KB | #15110E | #25211E | 2.8 |
| leather-v1.webp | q82 | 48.8 KB | #14110E | #272320 | 3.6 |
| leather-v2.avif | q86 | 69.7 KB | #14110E | #221F1A | 1.7 |
| leather-v2.webp | q90 | 54.3 KB | #14110E | #25211E | 2.1 |

Notes: the raw v1 source is not seamless (z 5.3); after processing no seam is visible even in
the ×8 corner crop. v1 shows some tile-period repetition of its diagonal streaks in the
contrast-boosted mosaic (barely perceptible at real luminance); v2 shows none. The WebP's blue
channel overshoots `#2A231C` by a few levels from chroma compression, luminance stays below it.
