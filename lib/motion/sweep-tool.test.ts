import { describe, expect, it } from "vitest";

import type { BrushLine } from "@/lib/motion/brush-path";
import type { SweepFrame } from "@/lib/motion/sweep-tool";

import { brushApproach, brushPose, brushRestPose } from "@/lib/motion/brush-path";
import { BRUSH, RAZOR } from "@/lib/motion/motion-tokens";
import { approachProgress, razorPose, razorRestPose } from "@/lib/motion/razor-path";
import { SWEEP_TOOLS, sweepToolOf, toolApproach, toolPose, toolRestPose } from "@/lib/motion/sweep-tool";

const LINE: BrushLine = { left: 144, right: 1320, y: 1800, clearPx: 36, headingBottom: 1650 };
const VIEWPORT = { width: 1440, height: 900 };
/** The line at the landing point: the approach has fully run. */
const LANDED: SweepFrame = { scrollY: LINE.y - 0.6 * VIEWPORT.height, viewport: VIEWPORT, pointer: null };

describe("sweepToolOf", () => {
  it("should read the two tools the content can name", () => {
    // ARRANGE
    const values = ["razor", "brush"];

    // ACT
    const results = values.map(sweepToolOf);

    // ASSERT
    expect(results).toEqual(["razor", "brush"]);
  });

  it("should return null for a page without a tool or with an unknown one", () => {
    // ARRANGE
    const values = [undefined, "", "comb"];

    // ACT
    const results = values.map(sweepToolOf);

    // ASSERT
    expect(results).toEqual([null, null, null]);
  });
});

describe("SWEEP_TOOLS", () => {
  it("should keep the razor's files and timing as before", () => {
    // ARRANGE
    const razor = SWEEP_TOOLS.razor;

    // ACT
    const timing = [razor.drawS, razor.drawEase, razor.exitS];

    // ASSERT
    expect(razor.modelUrl).toBe("/models/razor.glb");
    expect(razor.stillUrl).toBe("/models/razor-still.webp");
    expect(razor.stillAttr).toBe("data-razor-still");
    expect(timing).toEqual([RAZOR.cutS, RAZOR.cutEase, RAZOR.exitS]);
  });

  it("should give the brush its own files and its slower sweep", () => {
    // ARRANGE
    const brush = SWEEP_TOOLS.brush;

    // ACT
    const files = [brush.modelUrl, brush.stillUrl];

    // ASSERT
    expect(files).toEqual(["/models/brush.glb", "/models/brush-still.webp"]);
    expect(brush.drawS).toBe(BRUSH.sweepS);
    expect(brush.drawS).toBeGreaterThan(SWEEP_TOOLS.razor.drawS);
  });
});

describe("toolApproach", () => {
  it("should follow each tool's own approach", () => {
    // ARRANGE
    const frame = { ...LANDED, scrollY: LANDED.scrollY - 150 };

    // ACT
    const results = [toolApproach("razor", frame, LINE), toolApproach("brush", frame, LINE)];

    // ASSERT
    expect(results[0]).toBe(approachProgress({ ...frame, line: LINE }));
    expect(results[1]).toBe(brushApproach({ ...frame, line: LINE }));
  });
});

describe("toolPose", () => {
  it("should tag the razor's pose with the razor", () => {
    // ARRANGE
    const sweep = 0.5;

    // ACT
    const result = toolPose("razor", LANDED, LINE, sweep, 0);

    // ASSERT
    expect(result).toEqual({ tool: "razor", pose: razorPose({ ...LANDED, line: LINE, cut: sweep, exit: 0 }) });
  });

  it("should tag the brush's pose with the brush", () => {
    // ARRANGE
    const sweep = 0.5;

    // ACT
    const result = toolPose("brush", LANDED, LINE, sweep, 0);

    // ASSERT
    expect(result).toEqual({ tool: "brush", pose: brushPose({ ...LANDED, line: LINE, sweep, exit: 0 }) });
  });

  it("should return null once either tool has left", () => {
    // ARRANGE
    const tools = ["razor", "brush"] as const;

    // ACT
    const results = tools.map((tool) => toolPose(tool, LANDED, LINE, 1, 1));

    // ASSERT
    expect(results).toEqual([null, null]);
  });
});

describe("toolRestPose", () => {
  it("should rest each tool where its own path rests it", () => {
    // ARRANGE
    const line = LINE;

    // ACT
    const results = [toolRestPose("razor", line), toolRestPose("brush", line)];

    // ASSERT
    expect(results[0]).toEqual(razorRestPose(line));
    expect(results[1]).toEqual(brushRestPose(line));
  });
});
