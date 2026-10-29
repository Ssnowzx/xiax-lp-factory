# Porcelana paper / linen background — prompts and pipeline

Status (2026-10-28): **linen-v1 = AGY / Gemini. paper-v1 = procedural fallback** (AGY paper
attempts returned "no image generated" twice, then `429 RESOURCE_EXHAUSTED`, ~4.5 h reset).

| Variation | Source | Files |
|---|---|---|
| linen-v1 | AGY / Gemini (prompt below) | `assets/textures-src/linen-v1.png` -> `public/textures/linen-v1.{avif,webp}` |
| paper-v1 | procedural (`paper-tile.mjs --procedural`), AGY prompt kept for later | `public/textures/paper-v1.{avif,webp}` (no PNG source: generated in-memory) |

## Prompts (verbatim)

### linen-v1 (used)

```text
Seamless tileable texture, flat top-down orthographic macro photograph of warm ivory fine natural linen fabric with a tight plain weave and subtle slub threads, extremely low contrast, soft perfectly even diffuse lighting, matte, no shadows, no vignette, no folds, no stains, no seams, no hems, no text, uniform color and brightness, wraps seamlessly on all four edges.
```

### paper-v1 (failed: no image / quota — rerun later to replace the procedural one)

```text
Seamless tileable texture, flat top-down orthographic macro photograph of warm ivory cotton watercolor paper with very fine natural fibers and subtle tooth, extremely low contrast, soft perfectly even diffuse lighting, matte, no shadows, no vignette, no folds, no stains, no text, uniform color and brightness, wraps seamlessly on all four edges.
```

## Commands

```bash
scripts/v3-assets/agy-image.sh linen_v1 1:1 assets/textures-src/linen-v1.png <prompt.txt>   # 1024x1024
node scripts/v3-assets/paper-tile.mjs assets/textures-src/linen-v1.png public/textures/linen-v1 --lstd 1.7
node scripts/v3-assets/paper-tile.mjs --procedural public/textures/paper-v1 --lstd 1.7
```

`paper-tile.mjs`: luminance only, flatten, seamless cross-fade (AI source), wrap-aware resize
1024 -> 768, tint `RGB = #F6F1EA x factor` (upper limit 1.034, lower 0.935, so the darkest pixel
stays light), bisect the factor strength to the target L* std, encode, then re-measure the
DECODED file and nudge until its mean is within ~0.5 of the base.

## Results (768x768, decoded files)

| File | Size | Mean RGB (base 246,241,234) | L* std | Darkest px | Muted 110,98,90 | Ink 28,23,20 |
|---|---|---|---|---|---|---|
| linen-v1.avif | 80.4 KB | 245.5, 240.5, 234.5 | 1.73 | 230,225,219 | 4.54 | 13.7 |
| linen-v1.webp | 81.4 KB | 246.3, 241.0, 233.7 | 1.72 | 230,224,217 | 4.51 | 13.6 |
| paper-v1.avif | 100.6 KB | 245.5, 240.5, 234.5 | 1.70 | 230,225,219 | 4.54 | 13.7 |
| paper-v1.webp | 73.7 KB | 246.4, 241.0, 233.7 | 1.70 | 230,224,217 | 4.51 | 13.6 |

Darkest 1 % mean: contrast 4.69 (muted) / 14.1 (ink) for all four.
Notes: with a light base only +3.6 % headroom exists, so texture is carried by darker fibres/threads;
L* std 2.2 failed 4.5:1 for the muted text at the darkest pixel, hence 1.7. The procedural paper
shows a faint cloud repetition at 3x3 (blotchy); linen shows none.
