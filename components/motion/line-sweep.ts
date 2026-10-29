import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import type { BrushLine } from "@/lib/motion/brush-path";
import type { CutState } from "@/lib/motion/cut-state";
import type { SweepFrame, SweepTool, ToolPose } from "@/lib/motion/sweep-tool";

import { placeStill } from "@/components/motion/tool-still";
import { nextCutState } from "@/lib/motion/cut-state";
import { RAZOR } from "@/lib/motion/motion-tokens";
import { SWEEP_TOOLS, sweepToolOf, toolApproach, toolPose, toolRestPose } from "@/lib/motion/sweep-tool";

/**
 * The line sweep in #como-funciona (change xiax-lp-v5-salon · design D7, from the razor's cut of
 * xiax-lp-v3-razor-3d · design D4/D8): one tool runs the steps' line as it draws — the razor on
 * the barbershop page, the round brush on the salon page, as the section's `data-sweep-tool`
 * says. This side of the stage finds the line, follows its draw, times the tool's exit and
 * places the tool's still for the static branch. Same lines and same states for both tools.
 */

const SECTION = "#como-funciona";
/** The steps' thread is the line when it runs horizontal (≥ lg), the tool kept clear of its
 *  medallions (the same 48 px discs for either tool); below lg, where it runs vertical, the
 *  bare hairline under the heading is. */
const LINES = [
  { selector: "[data-step-thread]", clearPx: RAZOR.threadClearPx },
  { selector: "[data-cut-line]", clearPx: 0 },
];
/** Approach progress that counts as "ready" when the line starts drawing: absorbs the
 *  sub-pixel gap between ScrollTrigger's start and our own measure (a jump of ≤ ~2 px). */
const READY_AT = 0.98;

export interface SweepTarget {
  el: HTMLElement;
  line: BrushLine;
}

/** The tool the page's content picked for the steps' line, or null when it has none. */
export function readSweepTool(): SweepTool | null {
  return sweepToolOf(document.querySelector<HTMLElement>(SECTION)?.dataset.sweepTool);
}

/** Page box of an element from its layout offsets — transforms ignored (the line is scaled). */
function pageBox(el: HTMLElement) {
  let left = 0;
  let top = 0;
  for (let node: HTMLElement | null = el; node; node = node.offsetParent as HTMLElement | null) {
    left += node.offsetLeft;
    top += node.offsetTop;
  }
  return { left, top, width: el.offsetWidth, height: el.offsetHeight };
}

/** Page y of the bottom of the heading row above the line (the brush keeps under it). */
function headingBottom(): number | undefined {
  const row = document.querySelector<HTMLElement>(`${SECTION} h2`)?.parentElement;
  if (!row) return undefined;
  const box = pageBox(row);
  return box.top + box.height;
}

/** The horizontal line on screen in page px, or null when the page has none. */
export function measureSweepLine(): SweepTarget | null {
  for (const { selector, clearPx } of LINES) {
    const el = document.querySelector<HTMLElement>(`${SECTION} ${selector}`);
    if (!el || el.offsetWidth <= 1) continue;
    const box = pageBox(el);
    const y = box.top + box.height / 2;
    return { el, line: { left: box.left, right: box.left + box.width, y, clearPx, headingBottom: headingBottom() } };
  }
  return null;
}

/** How much of the line the choreography has drawn so far (its scaleX), 0..1. */
const drawn = (el: HTMLElement) => Number(gsap.getProperty(el, "scaleX"));

/** The tool's own clock once the line is whole: `out.exit` runs 0 → 1, evenly. */
const leave = (out: { exit: number }, durationS: number, onUpdate: () => void, onComplete: () => void) =>
  gsap.to(out, { exit: 1, duration: durationS, ease: "none", onUpdate, onComplete });

/**
 * The sweep (design D4 of the razor's change): waiting → cutting → exiting → done, or straight
 * to done when the line starts drawing before the tool is ready (late model, page opened below).
 * The line rewound to nothing (the visitor went back above the section) re-arms it for the next
 * way down.
 * @param tool - the tool that runs the line
 * @param onChange - called when the tool moves on its own (exit tween), to request a frame
 */
export function sweepRun(tool: SweepTool, onChange: () => void) {
  let state: CutState = "waiting";
  const out = { exit: 0 };
  let exitTween: gsap.core.Tween | null = null;
  let lastDrawn = Number.NaN;

  const done = () => {
    state = "done";
    onChange();
  };
  const enter = (next: CutState) => {
    state = next;
    exitTween?.kill();
    out.exit = 0;
    exitTween = next === "exiting" ? leave(out, SWEEP_TOOLS[tool].exitS, onChange, done) : null;
  };

  /** Moves the state on from the line's draw; returns the sweep progress, or null once done. */
  const advance = (target: SweepTarget, frame: SweepFrame, ready: boolean): number | null => {
    const sweep = drawn(target.el);
    const inPlace = ready && toolApproach(tool, frame, target.line) >= READY_AT;
    const next = nextCutState(state, sweep, inPlace);
    if (next !== state) enter(next);
    if (state === "done") return null;
    return state === "waiting" ? 0 : Math.min(sweep, 1);
  };

  return {
    /** The tool's pose for this frame (advancing the state), or null when it is off stage. */
    pose(target: SweepTarget | null, frame: SweepFrame, ready: boolean): ToolPose | null {
      if (!target) return null;
      const sweep = advance(target, frame, ready);
      if (sweep === null || !ready) return null;
      return toolPose(tool, frame, target.line, sweep, out.exit);
    },
    /**
     * Whether the line's draw moved since the last frame. The line draws (and rewinds) on its
     * own, without the tool, so the loop asks every frame and redraws only on change.
     */
    lineMoved(target: SweepTarget | null): boolean {
      if (!target || state === "exiting") return false;
      const now = drawn(target.el);
      const moved = now !== lastDrawn;
      lastDrawn = now;
      return moved;
    },
    dispose: () => exitTween?.kill(),
  };
}

/**
 * Static branch (design D8 of the razor's change): the tool's still lies on the right end of
 * the drawn line, inside the section, and is put back on every ScrollTrigger refresh (resize).
 * Only the page's own tool's still is fetched.
 * @returns cleanup that stops following refreshes
 */
export function showToolStill(): () => void {
  const tool = readSweepTool();
  if (!tool) return () => {};
  const spec = SWEEP_TOOLS[tool];
  const img = document.querySelector<HTMLImageElement>(`${SECTION} [${spec.stillAttr}]`);
  const section = document.querySelector<HTMLElement>(SECTION);
  if (!img || !section) return () => {};
  const place = () => {
    const target = measureSweepLine();
    if (!target) return void gsap.set(img, { autoAlpha: 0 });
    const rest = toolRestPose(tool, target.line);
    const origin = pageBox(section);
    placeStill(img, { ...rest, x: rest.x - origin.left, y: rest.y - origin.top }, spec.stillFrame, spec.stillLengthPx);
    gsap.set(img, { autoAlpha: 1 });
  };
  img.src = spec.stillUrl;
  place();
  ScrollTrigger.addEventListener("refresh", place);
  return () => ScrollTrigger.removeEventListener("refresh", place);
}
