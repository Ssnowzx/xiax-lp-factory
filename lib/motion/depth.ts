/**
 * Pure math for 2.5D depth cards (change xiax-lp-v3-cards-25d · design D3).
 * Angles are CSS degrees applied to the card's inner stage:
 *  - `ry > 0` turns the card toward its right edge (CSS rotateY, normal points right);
 *  - `rx > 0` turns the card toward its top edge (CSS rotateX, normal points up).
 * No DOM access here — the depth controller feeds measured values in.
 */

/** Stage rotation in degrees. */
export interface Tilt {
  rx: number;
  ry: number;
}

/** Pointer position in viewport pixels. */
export interface Point {
  x: number;
  y: number;
}

/** Card box in viewport pixels (subset of DOMRect). */
export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Sheen layer placement, in percent of the card, plus its opacity. */
export interface Sheen {
  xPercent: number;
  yPercent: number;
  opacity: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Tilt that turns the card to face the pointer. The offset from the card center is
 * normalized to [-1, 1] per axis and then capped to unit length, so a corner never
 * exceeds `maxDeg` in combined rotation.
 * @param point - pointer position (viewport px)
 * @param rect - card box (viewport px)
 * @param maxDeg - max combined tilt in degrees
 * @returns stage rotation; zero for a card with no size
 */
export function pointerTilt(point: Point, rect: Box, maxDeg: number): Tilt {
  if (rect.width <= 0 || rect.height <= 0) return { rx: 0, ry: 0 };

  const nx = clamp((point.x - (rect.left + rect.width / 2)) / (rect.width / 2), -1, 1);
  const ny = clamp((point.y - (rect.top + rect.height / 2)) / (rect.height / 2), -1, 1);
  const length = Math.hypot(nx, ny);
  const scale = length > 1 ? 1 / length : 1;

  // Screen y grows downward, so a pointer above the center (ny < 0) turns the top toward it.
  return { rx: -ny * scale * maxDeg, ry: nx * scale * maxDeg };
}

/**
 * Tilt for touch devices, driven by the card's pass through the viewport:
 * entering at the bottom (0) → turned back, middle (0.5) → flat, leaving at the top (1)
 * → turned forward. Progress outside 0..1 is clamped.
 * @param progress - 0 when the card enters the viewport, 1 when it leaves
 * @param maxDeg - max tilt in degrees
 */
export function scrollTilt(progress: number, maxDeg: number): Tilt {
  const p = clamp(progress, 0, 1);
  return { rx: (1 - 2 * p) * maxDeg, ry: 0 };
}

/**
 * How far layers rise, 0..1, proportional to the combined tilt. Layers stay flat while the
 * card is flat: under perspective a raised layer is enlarged and pushed away from the
 * center, which would misalign sibling rows on a card at rest.
 * @param tilt - current stage rotation
 * @param maxDeg - the max tilt the rotation was computed with
 */
export function layerLift(tilt: Tilt, maxDeg: number): number {
  if (maxDeg <= 0) return 0;
  return clamp(Math.hypot(tilt.rx, tilt.ry) / maxDeg, 0, 1);
}

/**
 * Sheen follows the edge the card turns toward and fades in with the tilt strength.
 * @param tilt - current stage rotation
 * @param maxDeg - the max tilt the rotation was computed with
 * @param peakOpacity - opacity at full tilt
 */
export function sheenTransform(tilt: Tilt, maxDeg: number, peakOpacity: number): Sheen {
  if (maxDeg <= 0) return { xPercent: 0, yPercent: 0, opacity: 0 };

  return {
    xPercent: (tilt.ry / maxDeg) * 50,
    yPercent: (-tilt.rx / maxDeg) * 50,
    opacity: layerLift(tilt, maxDeg) * peakOpacity,
  };
}

/** Which image of a gallery slot is moving: layered pair, or the whole-photo fallback. */
export type GalleryLayerKind = "plate" | "subject" | "full";

/** Scroll parallax of one gallery image inside its clipped 16:9 frame. */
export interface LayerMotion {
  /** zoom that gives the layer spare image beyond every frame edge. */
  scale: number;
  /** GSAP yPercent when the frame enters at the bottom of the viewport… */
  fromYPercent: number;
  /** …and when it leaves at the top. */
  toYPercent: number;
}

/** Extra spare image (% of the frame height) kept beyond the largest shift. */
const EDGE_SPARE_PCT = 1;

const zoomFor = (maxShiftPct: number) => 1 + (2 * (maxShiftPct + EDGE_SPARE_PCT)) / 100;

/**
 * Gallery depth by parallax (design D6). The frame is a window: everything inside it lags
 * the page. The plate (and a whole photo) drifts down inside the frame by `shiftPct`; the
 * subject drifts the same way by `subjectFactor` of that, so it lags less and reads nearer.
 * Keeping the slip between them small is what keeps the cut-out edges invisible. Shifts are
 * % of the layer height, and the zoom always covers the largest one, so no frame edge shows.
 * @param kind - plate / subject of a layered slot, or the whole photo of a fallback slot
 * @param shiftPct - plate (and fallback) amplitude, % of the frame height
 * @param subjectFactor - subject amplitude as a fraction of the plate's (0..1)
 */
export function galleryLayerMotion(kind: GalleryLayerKind, shiftPct: number, subjectFactor: number): LayerMotion {
  if (shiftPct <= 0) return { scale: 1, fromYPercent: 0, toYPercent: 0 };

  const shift = kind === "subject" ? shiftPct * subjectFactor : shiftPct;
  const scale = zoomFor(Math.max(shiftPct, shiftPct * subjectFactor));
  return { scale, fromYPercent: -shift, toYPercent: shift };
}
