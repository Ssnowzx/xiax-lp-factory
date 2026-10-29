/**
 * Pure choreography of the 3D round brush's pass in #como-funciona on the salon page (change
 * xiax-lp-v5-salon · design D7), the same shape as the razor's (razor-path.ts). The brush
 * lies on the steps' line, handle trailing to the left, and:
 *  1. rolls in from beyond the right edge, hovering just above the line, as the line rises
 *     from `approachFromVh` to `cutAtVh` (scroll);
 *  2. drops onto the line and rolls left → right with its barrel centre on the line's drawing
 *     front (`sweep`, the line's own draw, read by the stage);
 *  3. leaves to the right (`exit`, timed by the stage).
 * It spins about its own axis, always by distance / rolling radius: it never slips.
 * `presence` (0..1) is how much the brush holds the stage; the scissors give way by as much.
 * Angles are degrees; `spinDeg` is the roll about the barrel axis, positive for rightward travel.
 */
import { clamp01, lerp, smoothstep } from "@/lib/motion/math";
import { BRUSH } from "@/lib/motion/motion-tokens";
import type { CutLine } from "@/lib/motion/razor-path";

/** The line the brush rolls along, in page px (see `CutLine`). */
export interface BrushLine extends CutLine {
  /** page y of the bottom of the section heading above the line, when it must stay uncovered;
   *  the hover is lowered to keep the bristles under it (never below `clearPx`). */
  headingBottom?: number;
}

export interface BrushInput {
  scrollY: number;
  viewport: { width: number; height: number };
  line: BrushLine;
  /** 0..1 — how much of the line is drawn (how far the brush has rolled). */
  sweep: number;
  /** 0..1 — how far the brush has left after the sweep. */
  exit: number;
}

export interface BrushPose {
  /** barrel centre (the model origin) in viewport px (page px for `brushRestPose`). */
  x: number;
  y: number;
  /** on-screen model length in px (handle end → barrel top). */
  lengthPx: number;
  /** in-plane angle (CSS convention, clockwise): 90 lays the model's axis along the line with
   *  the handle (-Y, down at 0) to the left — as the razor's tip (razor-path.ts). */
  rotZ: number;
  /** roll about the barrel's own axis (deg) — Barrel and Bristles only, not the handle. */
  spinDeg: number;
  /** 0..1 — how much the brush holds the stage (the scissors give way by as much). */
  presence: number;
}

const LYING_ROT_Z = 90;
const DEG_PER_RAD = 180 / Math.PI;

/** On-screen length for a line this wide (px). */
export const brushLength = (lineWidth: number) =>
  Math.min(BRUSH.maxLengthPx, Math.max(BRUSH.minLengthPx, BRUSH.lengthFrac * lineWidth));

/** Rolling radius (px): the bristle tips, which are what touches the line. */
export const brushRollingRadius = (lengthPx: number) => BRUSH.tipRadiusFrac * lengthPx;

/**
 * How far the approach has run (0..1): 0 while the line is below `approachFromVh` of the
 * viewport, 1 from the landing point (`cutAtVh`) on.
 */
export function brushApproach({ scrollY, viewport, line }: Pick<BrushInput, "scrollY" | "viewport" | "line">) {
  const lineScreenY = line.y - scrollY;
  const span = (BRUSH.approachFromVh - BRUSH.cutAtVh) * viewport.height;
  return clamp01((BRUSH.approachFromVh * viewport.height - lineScreenY) / span);
}

interface Track {
  len: number;
  r: number;
  /** barrel-centre y (viewport) with the bristle tips `gap` px above the line. */
  yAt: (gap: number) => number;
  /** gap (px) the tips keep above the line while sweeping: what sits on it, else none. */
  rideGap: number;
  /** gap (px) while approaching: a small hover, lowered under the heading, over `rideGap`. */
  hoverGap: number;
  /** barrel-centre x where the sweep starts: on the line start, handle kept on screen. */
  readyX: number;
  /** barrel-centre x where the sweep ends: barrel top at the line end. */
  endX: number;
  /** barrel-centre x with the whole brush beyond the right edge. */
  offX: number;
}

function track(input: Pick<BrushInput, "scrollY" | "viewport" | "line">): Track {
  const { line, scrollY, viewport } = input;
  const len = brushLength(line.right - line.left);
  const r = brushRollingRadius(len);
  const rideGap = line.clearPx ?? 0;
  const room = line.headingBottom === undefined ? Infinity : line.y - line.headingBottom - 2 * r;
  const handle = BRUSH.handleFrac * len;
  const readyX = Math.max(line.left, handle + BRUSH.marginPx);
  return {
    len,
    r,
    yAt: (gap) => line.y - scrollY - gap - r,
    rideGap,
    hoverGap: Math.max(rideGap, Math.min(BRUSH.liftFrac * len, room)),
    readyX,
    endX: Math.max(line.right - BRUSH.headFrac * len, readyX),
    offX: viewport.width + handle + BRUSH.marginPx,
  };
}

/** Rolling without slipping: the roll is the distance from the landing point over the radius. */
const spinAt = (t: Track, x: number) => ((x - t.readyX) / t.r) * DEG_PER_RAD;

const lying = (t: Track, x: number, gap: number, presence: number): BrushPose => ({
  x,
  y: t.yAt(gap),
  lengthPx: t.len,
  rotZ: LYING_ROT_Z,
  spinDeg: spinAt(t, x),
  presence,
});

/**
 * Pose of the brush for one frame.
 * @param input - scroll, viewport, line, sweep and exit progress
 * @returns the pose, or null before the approach starts and once the exit ends
 */
export function brushPose(input: BrushInput): BrushPose | null {
  const t = track(input);
  if (input.exit >= 1) return null;
  if (input.exit > 0) return lying(t, lerp(t.endX, t.offX, input.exit ** 2), t.rideGap, 1 - smoothstep(input.exit));
  if (input.sweep > 0) {
    const front = input.line.left + input.sweep * (input.line.right - input.line.left);
    const drop = smoothstep(clamp01(input.sweep / BRUSH.dropBy));
    return lying(t, Math.min(Math.max(front, t.readyX), t.endX), lerp(t.hoverGap, t.rideGap, drop), 1);
  }
  const a = brushApproach(input);
  if (a <= 0) return null;
  return lying(t, lerp(t.offX, t.readyX, smoothstep(a)), t.hoverGap, smoothstep(clamp01(a / BRUSH.giveWayBy)));
}

/**
 * Where the brush rests when it cannot move (reduced motion, no WebGL): on the right end of
 * the drawn line, its barrel top ending where the line ends — as if it had just rolled along.
 * @param line - the line in page px
 * @returns the resting pose, in page px
 */
export function brushRestPose(line: BrushLine): BrushPose {
  const t = track({ scrollY: 0, viewport: { width: 0, height: 0 }, line });
  return lying(t, t.endX, t.rideGap, 1);
}
