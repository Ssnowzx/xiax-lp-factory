import { describe, expect, it } from "vitest";

import type { CutLine, RazorInput, RazorPose } from "@/lib/motion/razor-path";

import { approachProgress, razorLength, razorPose, razorRestPose } from "@/lib/motion/razor-path";
import { RAZOR } from "@/lib/motion/motion-tokens";

const VIEWPORT = { width: 1440, height: 900 };
/** The steps' thread at 1440×900 (page px), measured in the browser. */
const LINE: CutLine = { left: 144, right: 1320, y: 1800 };
/** Lying flat: tip to the left, edge down — it cuts handle-first (design D1). */
const LYING = { rotY: 0, rotZ: 90 };

/** scrollY at which the back-up has run the fraction `a` (0 = start, 1 = cut point). */
function scrollAt(a: number, line: CutLine = LINE) {
  const lineScreenY = VIEWPORT.height * (RAZOR.approachFromVh - a * (RAZOR.approachFromVh - RAZOR.cutAtVh));
  return line.y - lineScreenY;
}

function input(overrides: Partial<RazorInput> = {}): RazorInput {
  return { scrollY: scrollAt(1), viewport: VIEWPORT, line: LINE, cut: 0, exit: 0, pointer: null, ...overrides };
}

function pose(overrides: Partial<RazorInput>): RazorPose {
  const result = razorPose(input(overrides));
  if (!result) throw new Error("expected the razor to be painted");
  return result;
}

const heelX = (p: RazorPose) => p.x - RAZOR.heelFromPin * p.lengthPx;
const edgeY = (p: RazorPose) => p.y + RAZOR.edgeFromPin * p.lengthPx;
/** Leftmost point of the open razor (the blade tip) and rightmost (the handle butt). */
const tipX = (p: RazorPose) => p.x - (1 - RAZOR.pinFromButt) * p.lengthPx;
const buttX = (p: RazorPose) => p.x + RAZOR.pinFromButt * p.lengthPx;
const lineScreenY = (scrollY: number) => LINE.y - scrollY;

describe("razorLength", () => {
  it("should take a fixed share of a desktop-wide line", () => {
    // ARRANGE
    const width = 1176;

    // ACT
    const result = razorLength(width);

    // ASSERT
    expect(result).toBeCloseTo(RAZOR.lengthFrac * width);
  });

  it("should not shrink below the minimum on a phone-wide line", () => {
    // ARRANGE
    const width = 335;

    // ACT
    const result = razorLength(width);

    // ASSERT
    expect(result).toBe(RAZOR.minLengthPx);
  });

  it("should not grow past the maximum on a very wide line", () => {
    // ARRANGE
    const width = 4000;

    // ACT
    const result = razorLength(width);

    // ASSERT
    expect(result).toBe(RAZOR.maxLengthPx);
  });
});

describe("approachProgress", () => {
  it("should be 0 while the line is still below the start height", () => {
    // ARRANGE
    const below = { scrollY: scrollAt(-0.5), viewport: VIEWPORT, line: LINE };

    // ACT
    const result = approachProgress(below);

    // ASSERT
    expect(result).toBe(0);
  });

  it("should be halfway when the line is halfway to the cut point", () => {
    // ARRANGE
    const halfway = { scrollY: scrollAt(0.5), viewport: VIEWPORT, line: LINE };

    // ACT
    const result = approachProgress(halfway);

    // ASSERT
    expect(result).toBeCloseTo(0.5);
  });

  it("should be 1 from the cut point on", () => {
    // ARRANGE
    const past = { scrollY: scrollAt(1.5), viewport: VIEWPORT, line: LINE };

    // ACT
    const result = approachProgress(past);

    // ASSERT
    expect(result).toBe(1);
  });
});

describe("razorPose · back-up", () => {
  it("should not paint before the back-up starts", () => {
    // ARRANGE
    const before = input({ scrollY: scrollAt(0) });

    // ACT
    const result = razorPose(before);

    // ASSERT
    expect(result).toBeNull();
  });

  it("should enter from beyond the right edge nearly closed", () => {
    // ARRANGE
    const samples = Array.from({ length: 100 }, (_, i) => pose({ scrollY: scrollAt((i + 1) / 400) }));

    // ACT
    const entering = samples.find((p) => tipX(p) < VIEWPORT.width);

    // ASSERT
    if (!entering) throw new Error("expected the razor to reach the screen");
    expect(tipX(samples[0])).toBeGreaterThan(VIEWPORT.width);
    expect(entering.foldDeg).toBeGreaterThan(RAZOR.closedFoldDeg - 10);
  });

  it("should open and turn to face the front as it backs up", () => {
    // ARRANGE
    const samples = Array.from({ length: 10 }, (_, i) => scrollAt(0.1 * (i + 1)));

    // ACT
    const poses = samples.map((scrollY) => pose({ scrollY }));

    // ASSERT
    poses.slice(1).forEach((p, i) => {
      expect(p.foldDeg).toBeLessThanOrEqual(poses[i].foldDeg);
      expect(p.rotY).toBeLessThanOrEqual(poses[i].rotY);
      expect(p.x).toBeLessThanOrEqual(poses[i].x);
    });
  });

  it("should be open, facing front and lying tip-left at the cut point", () => {
    // ARRANGE
    const ready = { scrollY: scrollAt(1) };

    // ACT
    const result = pose(ready);

    // ASSERT
    expect(result.foldDeg).toBe(0);
    expect(result.rotY).toBe(LYING.rotY);
    expect(result.rotZ).toBe(LYING.rotZ);
  });

  it("should put its heel on the line start when the gutter holds the blade", () => {
    // ARRANGE
    const roomy: CutLine = { left: 400, right: 1320, y: LINE.y };

    // ACT
    const result = pose({ line: roomy, scrollY: scrollAt(1, roomy) });

    // ASSERT
    expect(heelX(result)).toBeCloseTo(roomy.left);
  });

  it("should keep the whole blade on screen at the cut point", () => {
    // ARRANGE
    const tight: CutLine = { left: 24, right: 366, y: LINE.y };

    // ACT
    const result = pose({ line: tight, scrollY: scrollAt(1, tight) });

    // ASSERT
    expect(tipX(result)).toBeCloseTo(RAZOR.marginPx);
  });

  it("should hover just above the line while it backs up, clear of the medallions", () => {
    // ARRANGE
    const samples = [0.1, 0.5, 1].map((a) => scrollAt(a));

    // ACT
    const gaps = samples.map((scrollY) => {
      const p = pose({ scrollY });
      return lineScreenY(scrollY) - edgeY(p) - RAZOR.liftFrac * p.lengthPx;
    });

    // ASSERT
    gaps.forEach((gap) => expect(gap).toBeCloseTo(0));
  });

  it("should hover high enough to clear what sits on the line when the line asks for it", () => {
    // ARRANGE — the steps' thread carries 48 px medallions
    const threaded: CutLine = { ...LINE, clearPx: 60 };
    const scrollY = scrollAt(0.5, threaded);

    // ACT
    const result = pose({ line: threaded, scrollY });

    // ASSERT
    expect(lineScreenY(scrollY) - edgeY(result)).toBeCloseTo(threaded.clearPx ?? 0);
  });

  it("should be open before its blade reaches the last step's medallion", () => {
    // ARRANGE — 48 px medallions open each of the 3 columns (24 px gaps); the thread starts
    // on the first one's center and ends at the last column's right edge
    const threaded: CutLine = { ...LINE, clearPx: RAZOR.threadClearPx };
    const lastMedallionRight = LINE.left + (2 * (LINE.right - LINE.left + 24)) / 3 + 24;
    const samples = Array.from({ length: 199 }, (_, i) => pose({ line: threaded, scrollY: scrollAt((i + 1) / 200, threaded) }));

    // ACT
    const over = samples.find((p) => tipX(p) <= lastMedallionRight);

    // ASSERT — a folded blade dips below the hover by about tip · sin(fold)
    if (!over) throw new Error("expected the tip to reach the last medallion");
    const dip = (1 - RAZOR.pinFromButt) * over.lengthPx * Math.sin((over.foldDeg * Math.PI) / 180);
    expect(dip).toBeLessThan(RAZOR.threadClearPx - 24);
  });

  it("should have sent the scissors out by the time it is in view", () => {
    // ARRANGE
    const early = pose({ scrollY: scrollAt(RAZOR.giveWayBy / 2) });

    // ACT
    const handedOver = pose({ scrollY: scrollAt(RAZOR.giveWayBy) });

    // ASSERT
    expect(early.presence).toBeGreaterThan(0);
    expect(early.presence).toBeLessThan(1);
    expect(handedOver.presence).toBe(1);
  });
});

describe("razorPose · cut", () => {
  it("should drop onto the line as the cut begins", () => {
    // ARRANGE
    const halfway = pose({ cut: RAZOR.dropBy / 2 });

    // ACT
    const landed = pose({ cut: RAZOR.dropBy });

    // ASSERT
    expect(edgeY(halfway)).toBeLessThan(lineScreenY(scrollAt(1)));
    expect(edgeY(halfway)).toBeGreaterThan(edgeY(pose({})));
    expect(edgeY(landed)).toBeCloseTo(lineScreenY(scrollAt(1)));
  });

  it("should wait at the start while the drawing front is still under the blade", () => {
    // ARRANGE — a phone-wide line: the screen margin, not the line start, holds the blade
    const tight: CutLine = { left: 24, right: 366, y: LINE.y };
    const scrollY = scrollAt(1, tight);
    const ready = pose({ line: tight, scrollY });

    // ACT
    const result = pose({ line: tight, scrollY, cut: 0.05 });

    // ASSERT
    expect(heelX(ready)).toBeGreaterThan(tight.left + 0.05 * (tight.right - tight.left));
    expect(result.x).toBeCloseTo(ready.x);
  });

  it("should keep its heel on the drawing front of the thread", () => {
    // ARRANGE
    const cut = 0.5;

    // ACT
    const result = pose({ cut });

    // ASSERT
    expect(heelX(result)).toBeCloseTo(LINE.left + cut * (LINE.right - LINE.left));
  });

  it("should keep its edge on the line while the page scrolls during the cut", () => {
    // ARRANGE
    const scrollY = scrollAt(1) + 120;

    // ACT
    const result = pose({ scrollY, cut: 0.4 });

    // ASSERT
    expect(edgeY(result)).toBeCloseTo(lineScreenY(scrollY));
  });

  it("should hold steady against a nearby pointer while cutting", () => {
    // ARRANGE
    const ready = pose({});
    const pointer = { x: ready.x + 150, y: ready.y - 150 };

    // ACT
    const result = pose({ cut: 0.5, pointer });

    // ASSERT
    expect(result.rotX).toBe(0);
    expect(result.rotY).toBe(LYING.rotY);
  });

  it("should stay fully open and on stage while cutting", () => {
    // ARRANGE
    const cut = 0.7;

    // ACT
    const result = pose({ cut });

    // ASSERT
    expect(result.foldDeg).toBe(0);
    expect(result.presence).toBe(1);
  });
});

describe("razorPose · exit", () => {
  it("should leave the screen to the right", () => {
    // ARRANGE
    const almostGone = { cut: 1, exit: 0.999 };

    // ACT
    const result = pose(almostGone);

    // ASSERT
    expect(tipX(result)).toBeGreaterThan(VIEWPORT.width);
  });

  it("should lift its leading handle on the way out", () => {
    // ARRANGE
    const leaving = { cut: 1, exit: 0.5 };

    // ACT
    const result = pose(leaving);

    // ASSERT
    expect(result.rotZ).toBeLessThan(LYING.rotZ);
    expect(result.rotZ).toBeGreaterThanOrEqual(LYING.rotZ - RAZOR.exitLiftDeg);
  });

  it("should give the screen back to the scissors as it leaves", () => {
    // ARRANGE
    const leaving = { cut: 1, exit: 0.5 };

    // ACT
    const result = pose(leaving);

    // ASSERT
    expect(result.presence).toBeGreaterThan(0);
    expect(result.presence).toBeLessThan(1);
  });

  it("should be gone once the exit ends", () => {
    // ARRANGE
    const done = input({ cut: 1, exit: 1 });

    // ACT
    const result = razorPose(done);

    // ASSERT
    expect(result).toBeNull();
  });
});

describe("razorPose · pointer", () => {
  it("should lean toward a nearby pointer before the cut, within its limit", () => {
    // ARRANGE
    const ready = pose({});
    const pointer = { x: ready.x + 200, y: ready.y - 200 };

    // ACT
    const result = pose({ pointer });

    // ASSERT
    expect(result.rotY).not.toBe(LYING.rotY);
    expect(Math.abs(result.rotY - LYING.rotY)).toBeLessThanOrEqual(RAZOR.pointerTiltDeg);
    expect(Math.abs(result.rotX)).toBeLessThanOrEqual(RAZOR.pointerTiltDeg);
  });
});

describe("razorRestPose", () => {
  it("should lie open on the right end of the line, handle ending where the line ends", () => {
    // ARRANGE
    const line = LINE;

    // ACT
    const result = razorRestPose(line);

    // ASSERT
    expect(buttX(result)).toBeCloseTo(line.right);
    expect(edgeY(result)).toBeCloseTo(line.y);
    expect(result.foldDeg).toBe(0);
    expect(result.rotY).toBe(LYING.rotY);
    expect(result.rotZ).toBe(LYING.rotZ);
  });
});
