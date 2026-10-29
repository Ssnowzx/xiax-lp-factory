/**
 * Pure choreography of the 3D scissors (change xiax-lp-v3-scissors-3d · design D4).
 * Given the scroll position and the layout measured by the stage, returns where the
 * rivet (the model's pivot) sits on screen, how long the model is, and its rotations.
 * Phases on desktop: hero (pinned to an anchor on the agenda panel, never above the
 * header) → transition →
 * rail (the right gutter, as in v2). On mobile it rests in the bottom-right corner.
 * Angles are degrees; rotZ = 0 means blade tips pointing down.
 */
import { pointerTilt } from "@/lib/motion/depth";
import { clamp01, lerp, smoothstep } from "@/lib/motion/math";
import { SCISSORS } from "@/lib/motion/motion-tokens";

export type ScissorsPhase = "hero" | "transition" | "rail" | "mobile";

export interface ScissorsInput {
  /** current page scroll (px). */
  scrollY: number;
  /** document height − viewport height (px). */
  maxScroll: number;
  viewport: { width: number; height: number };
  /** ≥ md breakpoint. */
  isDesktop: boolean;
  /** hero section height (px); the transition runs inside it. */
  heroHeight: number;
  /** hero anchor center in document coordinates (px). */
  anchor: { x: number; y: number };
  /** rail in viewport coordinates: center x, top (below header), bottom (footer top). */
  rail: { x: number; top: number; bottom: number };
  /** height of fixed UI at the bottom on mobile (CTA bar), 0 when hidden. */
  bottomInsetPx: number;
  /** current, already eased, direction flip (0 → down, flipDeg → up). */
  flipDeg: number;
  /** accumulated ambient spin (deg), driven by time in the hero. */
  spinDeg: number;
  /** pointer in viewport coordinates, or null (touch / outside the window). */
  pointer: { x: number; y: number } | null;
  /** 0..1 — how far the scissors step out to the right while the razor holds the stage
   *  (change xiax-lp-v3-razor-3d · design D9). 0 or absent: no effect. */
  giveWay?: number;
}

export interface ScissorsPose {
  phase: ScissorsPhase;
  /** rivet position in viewport px. */
  x: number;
  y: number;
  /** on-screen model length in px. */
  lengthPx: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  /** each blade's opening angle. */
  snipDeg: number;
  /** 0..1 — how much the rail (and its trail line) should be shown. */
  railPresence: number;
}


/** Wraps an angle to (-180, 180] so an unwinding spin takes the short way. */
function shortestAngle(deg: number) {
  const wrapped = ((deg % 360) + 360) % 360;
  return wrapped > 180 ? wrapped - 360 : wrapped;
}

/** How far down the page the reader is (0..1); a page that cannot scroll is at 0. */
export function pageProgress(scrollY: number, maxScroll: number) {
  return maxScroll > 0 ? clamp01(scrollY / maxScroll) : 0;
}

/**
 * The cutting rhythm: sin² gives `SCISSORS.snips` smooth cycles over the page, 0 = closed,
 * 1 = wide open. Shared with the razor, which folds on the same beat (design D1 of
 * xiax-lp-v3-razor-3d).
 */
export function snipWave(progress: number) {
  return Math.sin(progress * SCISSORS.snips * Math.PI) ** 2;
}

function snipAt(progress: number) {
  return snipWave(progress) * SCISSORS.snipDeg;
}

/** Hero → rail blend factor (0..1). A hero with no height is already "on the rail". */
function transitionAmount(scrollY: number, heroHeight: number) {
  if (heroHeight <= 0) return 1;
  const h = scrollY / heroHeight;
  const span = SCISSORS.transitionEnd - SCISSORS.transitionStart;
  return smoothstep(clamp01((h - SCISSORS.transitionStart) / span));
}

/** Rivet y on the rail so the model spans exactly [rail.top, rail.bottom] at the ends. */
function railY(input: ScissorsInput, progress: number) {
  const len = SCISSORS.railLengthPx;
  const top = input.rail.top + SCISSORS.pivotFromTop * len;
  const bottom = input.rail.bottom - (1 - SCISSORS.pivotFromTop) * len;
  return lerp(top, bottom, progress);
}

/**
 * Rivet y in the hero: it rides the agenda panel up, but stops just below the header, so
 * the hero → rail slide happens on screen instead of starting above the viewport.
 */
function heroY(input: ScissorsInput) {
  const highest = input.rail.top + SCISSORS.pivotFromTop * SCISSORS.heroLengthPx;
  return Math.max(input.anchor.y - input.scrollY, highest);
}

function lean(input: ScissorsInput, x: number, y: number) {
  if (!input.pointer) return { rx: 0, ry: 0 };
  const r = SCISSORS.pointerRadiusPx;
  return pointerTilt(input.pointer, { left: x - r, top: y - r, width: 2 * r, height: 2 * r }, SCISSORS.pointerTiltDeg);
}

function mobilePose(input: ScissorsInput, progress: number): ScissorsPose {
  const len = SCISSORS.mobileLengthPx;
  const m = SCISSORS.mobileMarginPx;
  return {
    phase: "mobile",
    x: input.viewport.width - m - SCISSORS.mobileHalfWidthFrac * len,
    y: input.viewport.height - input.bottomInsetPx - m - (1 - SCISSORS.pivotFromTop) * len,
    lengthPx: len,
    rotX: 0,
    rotY: 0,
    rotZ: input.flipDeg,
    snipDeg: snipAt(progress),
    railPresence: 0,
  };
}

/**
 * Pose of the scissors for one frame.
 * @param input - scroll, measured layout and live inputs (flip, spin, pointer)
 * @returns rivet position, size, rotations, blade opening and rail presence
 */
/**
 * Steps the pose out past the right edge by `giveWay` and fades the trail line with it.
 * At 1 the whole model (rivet ± half its length) is beyond the viewport.
 */
function stepAside(pose: ScissorsPose, input: ScissorsInput): ScissorsPose {
  const g = input.giveWay ?? 0;
  if (g <= 0) return pose;
  return {
    ...pose,
    x: pose.x + g * (input.viewport.width - pose.x + pose.lengthPx),
    railPresence: pose.railPresence * (1 - g),
  };
}

export function scissorsPose(input: ScissorsInput): ScissorsPose {
  return stepAside(placedPose(input), input);
}

function placedPose(input: ScissorsInput): ScissorsPose {
  const progress = pageProgress(input.scrollY, input.maxScroll);
  if (!input.isDesktop) return mobilePose(input, progress);

  const t = transitionAmount(input.scrollY, input.heroHeight);
  const x = lerp(input.anchor.x, input.rail.x, t);
  const y = lerp(heroY(input), railY(input, progress), t);
  const tilt = lean(input, x, y);

  return {
    phase: t <= 0 ? "hero" : t >= 1 ? "rail" : "transition",
    x,
    y,
    lengthPx: lerp(SCISSORS.heroLengthPx, SCISSORS.railLengthPx, t),
    rotX: tilt.rx,
    rotY: shortestAngle(input.spinDeg) * (1 - t) + tilt.ry,
    rotZ: lerp(SCISSORS.heroTiltZDeg, input.flipDeg, t),
    snipDeg: snipAt(progress),
    railPresence: t,
  };
}
