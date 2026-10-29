/**
 * The tool that runs the steps' line in #como-funciona (change xiax-lp-v5-salon · design D7):
 * the razor on the barbershop page, the round brush on the salon page. The page content picks
 * it (`StepsContent.sweepTool`), the section stamps it on the DOM (`data-sweep-tool`) and the
 * client stage reads it back. Pure data and pure poses, so the server section can size the
 * still and the stage can fetch only the chosen tool's files.
 */
import type { StepsContent } from "@/lib/content/types";
import type { BrushLine, BrushPose } from "@/lib/motion/brush-path";
import type { RazorPose } from "@/lib/motion/razor-path";
import type { StillFrame } from "@/lib/motion/still-frame";

import { brushApproach, brushPose, brushRestPose } from "@/lib/motion/brush-path";
import { BRUSH, RAZOR } from "@/lib/motion/motion-tokens";
import { approachProgress, razorPose, razorRestPose } from "@/lib/motion/razor-path";
import { BRUSH_STILL_FRAME, RAZOR_STILL_FRAME } from "@/lib/motion/still-frame";

export type SweepTool = StepsContent["sweepTool"];

export interface SweepToolSpec {
  modelUrl: string;
  stillUrl: string;
  stillFrame: StillFrame;
  /** model length the still's CSS height is set for (the tool's largest); others scale. */
  stillLengthPx: number;
  /** attribute that marks the tool's still in the section (the razor's predates this file). */
  stillAttr: "data-razor-still" | "data-brush-still";
  /** the line's draw, which the tool rides: duration (s) and GSAP ease. */
  drawS: number;
  drawEase: string;
  /** how long the tool takes to leave once the line is whole (s). */
  exitS: number;
}

export const SWEEP_TOOLS: Record<SweepTool, SweepToolSpec> = {
  razor: {
    modelUrl: "/models/razor.glb",
    stillUrl: "/models/razor-still.webp",
    stillFrame: RAZOR_STILL_FRAME,
    stillLengthPx: RAZOR.maxLengthPx,
    stillAttr: "data-razor-still",
    drawS: RAZOR.cutS,
    drawEase: RAZOR.cutEase,
    exitS: RAZOR.exitS,
  },
  brush: {
    modelUrl: "/models/brush.glb",
    stillUrl: "/models/brush-still.webp",
    stillFrame: BRUSH_STILL_FRAME,
    stillLengthPx: BRUSH.maxLengthPx,
    stillAttr: "data-brush-still",
    drawS: BRUSH.sweepS,
    drawEase: BRUSH.sweepEase,
    exitS: BRUSH.exitS,
  },
};

/**
 * The tool named by the section's `data-sweep-tool`, or null when there is none to run.
 * @param value - the attribute's value, if any
 */
export function sweepToolOf(value: string | undefined): SweepTool | null {
  return value === "razor" || value === "brush" ? value : null;
}

/** One frame of the tool, tagged so the scene knows which model to pose. */
export type ToolPose = { tool: "razor"; pose: RazorPose } | { tool: "brush"; pose: BrushPose };

export interface SweepFrame {
  scrollY: number;
  viewport: { width: number; height: number };
  /** the razor leans toward it before the cut; the brush ignores it. */
  pointer: { x: number; y: number } | null;
}

/** How far the tool's approach has run (0..1): 1 once it waits at the start of the line. */
export function toolApproach(tool: SweepTool, frame: SweepFrame, line: BrushLine): number {
  return tool === "brush" ? brushApproach({ ...frame, line }) : approachProgress({ ...frame, line });
}

/**
 * The tool's pose for one frame.
 * @param sweep - how much of the line is drawn, 0..1
 * @param exit - how far the tool has left after the line, 0..1
 * @returns the tagged pose, or null while the tool is off stage
 */
export function toolPose(tool: SweepTool, frame: SweepFrame, line: BrushLine, sweep: number, exit: number): ToolPose | null {
  if (tool === "brush") {
    const pose = brushPose({ scrollY: frame.scrollY, viewport: frame.viewport, line, sweep, exit });
    return pose && { tool, pose };
  }
  const pose = razorPose({ ...frame, line, cut: sweep, exit });
  return pose && { tool, pose };
}

/** Where the tool's still rests, in page px: on the right end of the fully drawn line. */
export function toolRestPose(tool: SweepTool, line: BrushLine): RazorPose | BrushPose {
  return tool === "brush" ? brushRestPose(line) : razorRestPose(line);
}
