# Salon gallery — prompts and pipeline (change xiax-lp-v5-salon, task 6.4)

Five 16:9 photos for `SALON_GALLERY_SLOTS`, generated with AGY / Gemini (1376×768 JPEG → PNG),
all generated on the first try (2026-10-28), no regeneration.

| Slot | AGY ImageName | Source | Output | Size |
|---|---|---|---|---|
| salon-01 | `salon_g01` | `assets/gallery-src/salon/salon-01.png` | `public/gallery/salon/salon-01.webp` | 1600×900 |
| salon-02 | `salon_g02` | `assets/gallery-src/salon/salon-02.png` | `public/gallery/salon/salon-02.webp` | 1200×675 |
| salon-03 | `salon_g03` | `assets/gallery-src/salon/salon-03.png` | `public/gallery/salon/salon-03.webp` | 1024×576 |
| salon-04 | `salon_g04` | `assets/gallery-src/salon/salon-04.png` | `public/gallery/salon/salon-04.webp` | 1024×576 |
| salon-05 | `salon_g05` | `assets/gallery-src/salon/salon-05.png` | `public/gallery/salon/salon-05.webp` | 1024×576 |

## Commands

```bash
scripts/v3-assets/agy-image.sh salon_g01 16:9 assets/gallery-src/salon/salon-01.png /tmp/salon-p1.txt   # ... g02..g05 alike
node scripts/optimize-gallery.mjs --salon-only   # centre-crop 16:9, Lanczos to slot size, WebP q82
```

## Prompts (verbatim)

### salon-01

```text
Realistic editorial photograph of a hairdresser doing a blow-dry with a round brush and a hair dryer on a seated client who is seen from behind, long wavy hair being lifted and shaped, the hairdresser shown from the chest down or turned away so that no face is visible, ivory cape on the client. Warm natural window light, ivory walls and light oak wood, terracotta accents, calm premium Brazilian beauty salon, photorealistic editorial photograph, shallow depth of field, natural textures, no recognisable face, no brand, no logo, no text, no signage, no watermark, cinematic 16:9 composition.
```

### salon-02

```text
Realistic editorial close-up photograph of a woman's hand holding a smartphone and booking an appointment, the hand and phone resting on a light oak wood reception counter, the phone screen blank soft glowing white with no readable interface, only the hand and forearm in frame, a small terracotta ceramic vase blurred in the background. Warm natural window light, ivory walls and light oak wood, terracotta accents, calm premium Brazilian beauty salon, photorealistic editorial photograph, shallow depth of field, natural textures, no recognisable face, no brand, no logo, no text, no signage, no watermark, cinematic 16:9 composition.
```

### salon-03

```text
Realistic editorial close-up photograph of a woman's hand with freshly done short nails in glossy terracotta polish, resting relaxed on an ivory manicure table with a folded linen towel, only the hand in frame, five natural fingers, no face. Warm natural window light, ivory walls and light oak wood, terracotta accents, calm premium Brazilian beauty salon, photorealistic editorial photograph, shallow depth of field, natural textures, no recognisable face, no brand, no logo, no text, no signage, no watermark, cinematic 16:9 composition.
```

### salon-04

```text
Realistic editorial photograph of an empty beauty salon interior with tall arched mirrors on ivory walls, ivory upholstered styling chairs, light oak wood floor and counter, warm sunlight, a terracotta pot with a plant, no people at all, no reflections of people. Warm natural window light, ivory walls and light oak wood, terracotta accents, calm premium Brazilian beauty salon, photorealistic editorial photograph, shallow depth of field, natural textures, no recognisable face, no brand, no logo, no text, no signage, no watermark, cinematic 16:9 composition.
```

### salon-05

```text
Realistic editorial photograph of a hair-colour mixing bowl in terracotta ceramic with a tint brush resting across it, on a light oak wood counter beside neatly folded ivory towels, soft warm window light, no people. Warm natural window light, ivory walls and light oak wood, terracotta accents, calm premium Brazilian beauty salon, photorealistic editorial photograph, shallow depth of field, natural textures, no recognisable face, no brand, no logo, no text, no signage, no watermark, cinematic 16:9 composition.
```

## Notes

- salon-02 has a very small, heavily blurred person far in the background (no recognisable face).
- salon-01: the professional's face is out of frame (cropped at the neck).
- No `alt` was changed; all five match the slot descriptions.
