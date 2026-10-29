/**
 * Pure choreography of the 3D razor's cut in #como-funciona (change xiax-lp-v3-razor-3d ·
 * design D1/D3). The razor lies flat on the cut line — tip to the left, edge down — and:
 *  1. backs up from beyond the right edge, hovering just above the line, opening and turning
 *     to face the light as the line rises from `approachFromVh` to `cutAtVh` (scroll);
 *  2. drops onto the line and cuts left → right with its heel on the line's drawing front
 *     (`cut`, the thread's own draw, read by the stage);
 *  3. leaves to the right (`exit`, timed by the stage).
 * `presence` (0..1) is how much the razor holds the stage; the scissors give way by as much.
 * Angles are degrees in the poses' convention (rotZ = 0: tip down).
 */
import { pointerTilt } from "@/lib/motion/depth";
import { clamp01, lerp, smoothstep } from "@/lib/motion/math";
import { RAZOR, SCISSORS } from "@/lib/motion/motion-tokens";

/** The line the razor cuts, in page px (left/right are also viewport x: no sideways scroll). */
export interface CutLine {
  left: number;
  right: number;
  y: number;
  /** height above the line the hovering edge must keep clear of (px) — e.g. the steps'
   *  medallions sitting on it; the hover is never lower than this. */
  clearPx?: number;
}

export interface RazorInput {
  scrollY: number;
  viewport: { width: number; height: number };
  line: CutLine;
  /** 0..1 — how much of the line is drawn. */
  cut: number;
  /** 0..1 — how far the razor has left after the cut. */
  exit: number;
  pointer: { x: number; y: number } | null;
}

export interface RazorPose {
  /** pin position in viewport px (page px for `razorRestPose`). */
  x: number;
  y: number;
  /** on-screen model length in px (handle butt → blade tip, blade open). */
  lengthPx: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  /** how far the blade is folded from fully open (deg). */
  foldDeg: number;
  /** 0..1 — how much the razor holds the stage (the scissors give way by as much). */
  presence: number;
}

/**
 * Lying flat: rotZ 90 turns the tip-down model so the tip points left and the edge (+X) faces
 * down — toward the line, away from the heading. Moving right it cuts handle-first, a pull
 * stroke: the blade trails along the line and the drawn line comes out from under it.
 */
const LYING = { rotY: 0, rotZ: 90 } as const;
/** Pin to blade tip, as a fraction of the length (the tip is the razor's leftmost point). */
const TIP_FROM_PIN = 1 - RAZOR.pinFromButt;

/** On-screen length for a line this wide (px). */
export const razorLength = (lineWidth: number) =>
  Math.min(RAZOR.maxLengthPx, Math.max(RAZOR.minLengthPx, RAZOR.lengthFrac * lineWidth));

/**
 * How far the back-up has run (0..1): 0 while the line is below `approachFromVh` of the
 * viewport, 1 from the cut point (`cutAtVh`) on.
 */
export function approachProgress({ scrollY, viewport, line }: Pick<RazorInput, "scrollY" | "viewport" | "line">) {
  const lineScreenY = line.y - scrollY;
  const span = (RAZOR.approachFromVh - RAZOR.cutAtVh) * viewport.height;
  return clamp01((RAZOR.approachFromVh * viewport.height - lineScreenY) / span);
}

interface Track {
  len: number;
  /** pin y (viewport) that puts the edge on the line. */
  y: number;
  /** hover height above the line while backing up (px). */
  lift: number;
  /** pin x where the cut starts: heel on the line start, blade kept on screen. */
  readyX: number;
  /** pin x with the whole razor beyond the right edge. */
  offX: number;
}

function track(input: Pick<RazorInput, "scrollY" | "viewport" | "line">): Track {
  const len = razorLength(input.line.right - input.line.left);
  const tip = TIP_FROM_PIN * len;
  return {
    len,
    y: input.line.y - input.scrollY - RAZOR.edgeFromPin * len,
    lift: Math.max(RAZOR.liftFrac * len, input.line.clearPx ?? 0),
    readyX: Math.max(input.line.left + RAZOR.heelFromPin * len, tip + RAZOR.marginPx),
    offX: input.viewport.width + tip + RAZOR.marginPx,
  };
}

const lying = (t: Track, x: number, rest: Partial<RazorPose> = {}): RazorPose => ({
  x,
  y: t.y,
  lengthPx: t.len,
  rotX: 0,
  rotY: LYING.rotY,
  rotZ: LYING.rotZ,
  foldDeg: 0,
  presence: 1,
  ...rest,
});

function backUp(input: RazorInput, t: Track, a: number): RazorPose {
  const x = lerp(t.offX, t.readyX, smoothstep(a));
  const r = SCISSORS.pointerRadiusPx;
  const lean = input.pointer
    ? pointerTilt(input.pointer, { left: x - r, top: t.y - r, width: 2 * r, height: 2 * r }, RAZOR.pointerTiltDeg)
    : { rx: 0, ry: 0 };
  return lying(t, x, {
    y: t.y - t.lift,
    rotX: lean.rx,
    rotY: LYING.rotY + RAZOR.turnDeg * (1 - smoothstep(clamp01(a / RAZOR.faceBy))) + lean.ry,
    foldDeg: RAZOR.closedFoldDeg * (1 - smoothstep(clamp01(a / RAZOR.openBy))),
    presence: smoothstep(clamp01(a / RAZOR.giveWayBy)),
  });
}

function leave(input: RazorInput, t: Track): RazorPose {
  const endX = Math.max(input.line.right + RAZOR.heelFromPin * t.len, t.readyX);
  return lying(t, lerp(endX, t.offX, input.exit ** 2), {
    // counter-clockwise on screen: the leading handle lifts
    rotZ: LYING.rotZ - RAZOR.exitLiftDeg * input.exit,
    presence: 1 - smoothstep(input.exit),
  });
}

/**
 * Pose of the razor for one frame.
 * @param input - scroll, viewport, cut line, cut and exit progress, pointer
 * @returns the pose, or null before the back-up starts and once the exit ends
 */
export function razorPose(input: RazorInput): RazorPose | null {
  const t = track(input);
  if (input.exit >= 1) return null;
  if (input.exit > 0) return leave(input, t);
  if (input.cut > 0) {
    const front = input.line.left + input.cut * (input.line.right - input.line.left);
    const drop = smoothstep(clamp01(input.cut / RAZOR.dropBy));
    return lying(t, Math.max(front + RAZOR.heelFromPin * t.len, t.readyX), { y: t.y - t.lift * (1 - drop) });
  }
  const a = approachProgress(input);
  return a <= 0 ? null : backUp(input, t, a);
}

/**
 * Where the razor rests when it cannot move (reduced motion, no WebGL): open, lying on the
 * right end of the drawn line, its handle ending where the line ends — as if it had just
 * made the cut.
 * @param line - the cut line in page px
 * @returns the resting pose, in page px
 */
export function razorRestPose(line: CutLine): RazorPose {
  const t = track({ scrollY: 0, viewport: { width: 0, height: 0 }, line });
  return lying(t, line.right - RAZOR.pinFromButt * t.len);
}
