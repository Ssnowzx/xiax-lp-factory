import { describe, expect, it } from "vitest";

import type { BrushInput, BrushLine, BrushPose } from "@/lib/motion/brush-path";

import { brushApproach, brushLength, brushPose, brushRestPose, brushRollingRadius } from "@/lib/motion/brush-path";
import { BRUSH } from "@/lib/motion/motion-tokens";

const VIEWPORT = { width: 1440, height: 900 };
const PHONE = { width: 390, height: 844 };
/** The steps' thread at 1440×900 (page px), with the medallions' clearance and the heading above. */
const THREAD: BrushLine = { left: 144, right: 1320, y: 1800, clearPx: 36, headingBottom: 1650 };
/** The bare hairline under the heading on a 390 px phone. */
const HAIRLINE: BrushLine = { left: 24, right: 359, y: 1800, clearPx: 0, headingBottom: 1760 };
/** Medallion radius on the thread (px). */
const MEDALLION_RADIUS = 24;

/** scrollY at which the approach has run the fraction `a` (0 = start, 1 = landing point). */
function scrollAt(a: number, line: BrushLine = THREAD, viewport = VIEWPORT) {
  const lineScreenY = viewport.height * (BRUSH.approachFromVh - a * (BRUSH.approachFromVh - BRUSH.cutAtVh));
  return line.y - lineScreenY;
}

function input(overrides: Partial<BrushInput> = {}): BrushInput {
  return { scrollY: scrollAt(1), viewport: VIEWPORT, line: THREAD, sweep: 0, exit: 0, ...overrides };
}

function pose(overrides: Partial<BrushInput> = {}): BrushPose {
  const result = brushPose(input(overrides));
  if (!result) throw new Error("expected the brush to be painted");
  return result;
}

const radius = (p: BrushPose) => brushRollingRadius(p.lengthPx);
const topY = (p: BrushPose) => p.y - radius(p);
const bottomY = (p: BrushPose) => p.y + radius(p);
/** Leftmost point (the handle end) and rightmost (the barrel top). */
const leftX = (p: BrushPose) => p.x - BRUSH.handleFrac * p.lengthPx;
const rightX = (p: BrushPose) => p.x + BRUSH.headFrac * p.lengthPx;
const lineScreenY = (scrollY: number, line: BrushLine = THREAD) => line.y - scrollY;
const degOfArc = (distancePx: number, p: BrushPose) => (distancePx / radius(p)) * (180 / Math.PI);

describe("brush sizing", () => {
  it("should take a fixed share of a desktop-wide line", () => {
    // ARRANGE
    const width = 1176;

    // ACT
    const result = brushLength(width);

    // ASSERT
    expect(result).toBeCloseTo(BRUSH.lengthFrac * width);
  });

  it("should stay between the minimum and the maximum length", () => {
    // ARRANGE
    const phoneWide = 335;
    const veryWide = 4000;

    // ACT
    const small = brushLength(phoneWide);
    const big = brushLength(veryWide);

    // ASSERT
    expect(small).toBe(BRUSH.minLengthPx);
    expect(big).toBe(BRUSH.maxLengthPx);
  });

  it("should roll on the bristle tips: radius is the tip share of the length", () => {
    // ARRANGE
    const length = 200;

    // ACT
    const result = brushRollingRadius(length);

    // ASSERT
    expect(result).toBeCloseTo(0.135 * length);
  });
});

describe("brushApproach", () => {
  it("should run from 0 below the start height to 1 at the landing point", () => {
    // ARRANGE
    const at = (a: number) => brushApproach({ scrollY: scrollAt(a), viewport: VIEWPORT, line: THREAD });

    // ACT
    const results = [at(-0.5), at(0.5), at(1.5)];

    // ASSERT
    expect(results[0]).toBe(0);
    expect(results[1]).toBeCloseTo(0.5);
    expect(results[2]).toBe(1);
  });
});

describe("brushPose · before and entry", () => {
  it("should not paint anything before the approach starts", () => {
    // ARRANGE
    const before = input({ scrollY: scrollAt(0) });

    // ACT
    const result = brushPose(before);

    // ASSERT
    expect(result).toBeNull();
  });

  it("should enter from beyond the right edge", () => {
    // ARRANGE
    const first = pose({ scrollY: scrollAt(0.0025) });

    // ACT
    const later = pose({ scrollY: scrollAt(0.5) });

    // ASSERT
    expect(leftX(first)).toBeGreaterThan(VIEWPORT.width);
    expect(leftX(later)).toBeLessThan(first.x);
    expect(later.x).toBeLessThan(first.x);
  });

  it("should hover above the line, rolled in while it travels, never over the heading", () => {
    // ARRANGE
    const scrollYs = [0.1, 0.5, 1].map((a) => scrollAt(a));

    // ACT
    const poses = scrollYs.map((scrollY) => pose({ scrollY }));

    // ASSERT
    poses.forEach((p, i) => {
      expect(bottomY(p)).toBeLessThanOrEqual(lineScreenY(scrollYs[i]) - (THREAD.clearPx ?? 0) + 1e-9);
      expect(topY(p)).toBeGreaterThanOrEqual(THREAD.headingBottom ? THREAD.headingBottom - scrollYs[i] : 0);
    });
  });
});

describe("brushPose · landing", () => {
  it("should land with its barrel centre on the line start when the gutter holds the handle", () => {
    // ARRANGE
    const roomy: BrushLine = { ...THREAD, left: 400 };

    // ACT
    const result = pose({ line: roomy, scrollY: scrollAt(1, roomy) });

    // ASSERT
    expect(result.x).toBeCloseTo(roomy.left);
  });

  it("should keep the whole handle on screen at the start", () => {
    // ARRANGE
    const tight: BrushLine = { ...THREAD, left: 24 };

    // ACT
    const result = pose({ line: tight, scrollY: scrollAt(1, tight) });

    // ASSERT
    expect(leftX(result)).toBeCloseTo(BRUSH.marginPx);
  });

  it("should drop onto the line as the sweep begins", () => {
    // ARRANGE — a bare line: nothing on it, so the hover is a real lift
    const bare: BrushLine = { ...THREAD, clearPx: 0 };
    const scrollY = scrollAt(1, bare);
    const hovering = pose({ line: bare, scrollY });
    const halfway = pose({ line: bare, scrollY, sweep: BRUSH.dropBy / 2 });

    // ACT
    const landed = pose({ line: bare, scrollY, sweep: BRUSH.dropBy });

    // ASSERT
    expect(halfway.y).toBeGreaterThan(hovering.y);
    expect(halfway.y).toBeLessThan(landed.y);
    expect(bottomY(landed)).toBeCloseTo(lineScreenY(scrollY, bare));
  });

  it("should lie with its handle trailing to the left", () => {
    // ARRANGE
    const sweeping = pose({ sweep: 0.5 });

    // ACT
    const handleSide = sweeping.x - leftX(sweeping);

    // ASSERT
    expect(sweeping.rotZ).toBe(90);
    expect(handleSide).toBeGreaterThan(rightX(sweeping) - sweeping.x);
  });
});

describe("brushPose · sweep", () => {
  it("should keep its barrel centre on the drawing front of the line", () => {
    // ARRANGE
    const sweep = 0.5;

    // ACT
    const result = pose({ sweep });

    // ASSERT
    expect(result.x).toBeCloseTo(THREAD.left + sweep * (THREAD.right - THREAD.left));
  });

  it("should spin by the distance travelled divided by the rolling radius", () => {
    // ARRANGE
    const a = pose({ sweep: 0.3 });

    // ACT
    const b = pose({ sweep: 0.6 });

    // ASSERT
    expect(b.spinDeg - a.spinDeg).toBeCloseTo(degOfArc(b.x - a.x, b));
  });

  it("should start the spin at zero where it lands", () => {
    // ARRANGE
    const landing = pose({});

    // ACT
    const spin = landing.spinDeg;

    // ASSERT
    expect(spin).toBeCloseTo(0);
  });

  it("should roll the same way it travels: spin grows to the right and shrinks backing up", () => {
    // ARRANGE
    const entering = pose({ scrollY: scrollAt(0.5) });
    const sweeping = pose({ sweep: 0.8 });

    // ACT
    const spins = [entering.spinDeg, sweeping.spinDeg];

    // ASSERT
    expect(spins[0]).toBeGreaterThan(0);
    expect(spins[1]).toBeGreaterThan(0);
    expect(entering.x).toBeGreaterThan(pose({}).x);
  });

  it("should stay on stage and on the line, wherever the page scrolls during the sweep", () => {
    // ARRANGE
    const scrollY = scrollAt(1) + 120;

    // ACT
    const result = pose({ scrollY, sweep: 0.5 });

    // ASSERT
    expect(result.presence).toBe(1);
    expect(bottomY(result)).toBeCloseTo(lineScreenY(scrollY) - (THREAD.clearPx ?? 0));
  });

  it("should leave the heading and the step numbers uncovered all the way along", () => {
    // ARRANGE
    const sweeps = Array.from({ length: 21 }, (_, i) => i / 20);

    // ACT
    const poses = sweeps.map((sweep) => pose({ sweep }));

    // ASSERT
    poses.forEach((p) => {
      expect(bottomY(p)).toBeLessThanOrEqual(lineScreenY(scrollAt(1)) - MEDALLION_RADIUS);
      expect(topY(p)).toBeGreaterThanOrEqual((THREAD.headingBottom ?? 0) - scrollAt(1));
    });
  });

  it("should duck under a heading that sits close above the line", () => {
    // ARRANGE
    const close: BrushLine = { ...THREAD, clearPx: 0, headingBottom: THREAD.y - 80 };
    const scrollY = scrollAt(0.5, close);

    // ACT
    const result = pose({ line: close, scrollY });

    // ASSERT
    expect(topY(result)).toBeGreaterThanOrEqual(close.headingBottom! - scrollY - 1e-9);
    expect(bottomY(result)).toBeLessThanOrEqual(lineScreenY(scrollY, close));
  });

  it("should still hover clear of the numbers when the heading leaves no room", () => {
    // ARRANGE
    const squeezed: BrushLine = { ...THREAD, headingBottom: THREAD.y - 40 };
    const scrollY = scrollAt(0.5, squeezed);

    // ACT
    const result = pose({ line: squeezed, scrollY });

    // ASSERT
    expect(bottomY(result)).toBeLessThanOrEqual(lineScreenY(scrollY, squeezed) - MEDALLION_RADIUS);
  });
});

describe("brushPose · exit", () => {
  it("should leave the screen to the right", () => {
    // ARRANGE
    const almostGone = { sweep: 1, exit: 0.999 };

    // ACT
    const result = pose(almostGone);

    // ASSERT
    expect(leftX(result)).toBeGreaterThan(VIEWPORT.width);
  });

  it("should keep rolling in the direction it leaves", () => {
    // ARRANGE
    const end = pose({ sweep: 1 });

    // ACT
    const leaving = pose({ sweep: 1, exit: 0.5 });

    // ASSERT
    expect(leaving.spinDeg - end.spinDeg).toBeCloseTo(degOfArc(leaving.x - end.x, leaving));
    expect(leaving.spinDeg).toBeGreaterThan(end.spinDeg);
  });

  it("should be gone once the exit ends", () => {
    // ARRANGE
    const done = input({ sweep: 1, exit: 1 });

    // ACT
    const result = brushPose(done);

    // ASSERT
    expect(result).toBeNull();
  });
});

describe("brushPose · presence for the scissors", () => {
  it("should have sent the scissors out by the time it has landed", () => {
    // ARRANGE
    const early = pose({ scrollY: scrollAt(BRUSH.giveWayBy / 2) });

    // ACT
    const handedOver = pose({ scrollY: scrollAt(BRUSH.giveWayBy) });

    // ASSERT
    expect(early.presence).toBeGreaterThan(0);
    expect(early.presence).toBeLessThan(1);
    expect(handedOver.presence).toBe(1);
  });

  it("should give the screen back to the scissors as it leaves", () => {
    // ARRANGE
    const leaving = { sweep: 1, exit: 0.5 };

    // ACT
    const result = pose(leaving);

    // ASSERT
    expect(result.presence).toBeGreaterThan(0);
    expect(result.presence).toBeLessThan(1);
  });
});

describe("brushRestPose", () => {
  it("should rest at the end of the line with its barrel top where the line ends", () => {
    // ARRANGE
    const line = THREAD;

    // ACT
    const result = brushRestPose(line);

    // ASSERT
    expect(rightX(result)).toBeCloseTo(line.right);
    expect(bottomY(result)).toBeCloseTo(line.y - (line.clearPx ?? 0));
    expect(result.rotZ).toBe(90);
    expect(result.presence).toBe(1);
  });

  it("should rest on a bare line with no clearance given", () => {
    // ARRANGE
    const bare: BrushLine = { left: 24, right: 359, y: 500 };

    // ACT
    const result = brushRestPose(bare);

    // ASSERT
    expect(bottomY(result)).toBeCloseTo(bare.y);
  });
});

describe("brushPose · phone", () => {
  const phoneInput = (overrides: Partial<BrushInput> = {}): BrushInput => ({
    scrollY: scrollAt(1, HAIRLINE, PHONE),
    viewport: PHONE,
    line: HAIRLINE,
    sweep: 0,
    exit: 0,
    ...overrides,
  });
  const phonePose = (overrides: Partial<BrushInput> = {}): BrushPose => {
    const result = brushPose(phoneInput(overrides));
    if (!result) throw new Error("expected the brush to be painted");
    return result;
  };

  it("should roll on the thin line under the heading, whole on screen, covering no text", () => {
    // ARRANGE
    const sweeps = [0, 0.25, 0.5, 0.75, 1];

    // ACT
    const poses = sweeps.map((sweep) => phonePose({ sweep }));

    // ASSERT
    const scrollY = scrollAt(1, HAIRLINE, PHONE);
    poses.slice(1).forEach((p) => {
      expect(p.lengthPx).toBe(BRUSH.minLengthPx);
      expect(leftX(p)).toBeGreaterThanOrEqual(BRUSH.marginPx - 1e-9);
      expect(rightX(p)).toBeLessThanOrEqual(HAIRLINE.right + 1e-9);
      expect(bottomY(p)).toBeCloseTo(lineScreenY(scrollY, HAIRLINE));
      expect(topY(p)).toBeGreaterThanOrEqual(HAIRLINE.headingBottom! - scrollY - 1e-9);
    });
  });
});
