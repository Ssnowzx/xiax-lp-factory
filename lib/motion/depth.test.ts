import { describe, expect, it } from "vitest";

import { galleryLayerMotion, layerLift, pointerTilt, scrollTilt, sheenTransform } from "@/lib/motion/depth";
import { DEPTH } from "@/lib/motion/motion-tokens";

const RECT = { left: 100, top: 200, width: 400, height: 200 };
const MAX = 8;

describe("pointerTilt", () => {
  it("should return zero tilt when the pointer is at the card center", () => {
    // ARRANGE
    const center = { x: 300, y: 300 };

    // ACT
    const tilt = pointerTilt(center, RECT, MAX);

    // ASSERT
    expect(tilt.rx).toBeCloseTo(0);
    expect(tilt.ry).toBeCloseTo(0);
  });

  it("should turn the card toward the right edge when the pointer is at the right middle", () => {
    // ARRANGE
    const rightMiddle = { x: 500, y: 300 };

    // ACT
    const tilt = pointerTilt(rightMiddle, RECT, MAX);

    // ASSERT
    expect(tilt.ry).toBeCloseTo(MAX);
    expect(tilt.rx).toBeCloseTo(0);
  });

  it("should turn the card toward the top edge when the pointer is at the top middle", () => {
    // ARRANGE
    const topMiddle = { x: 300, y: 200 };

    // ACT
    const tilt = pointerTilt(topMiddle, RECT, MAX);

    // ASSERT
    expect(tilt.rx).toBeCloseTo(MAX);
    expect(tilt.ry).toBeCloseTo(0);
  });

  it("should keep the combined tilt within the max angle at a corner", () => {
    // ARRANGE
    const topRight = { x: 500, y: 200 };

    // ACT
    const tilt = pointerTilt(topRight, RECT, MAX);

    // ASSERT
    expect(Math.hypot(tilt.rx, tilt.ry)).toBeLessThanOrEqual(MAX + 1e-9);
    expect(tilt.rx).toBeGreaterThan(0);
    expect(tilt.ry).toBeGreaterThan(0);
  });

  it("should clamp the tilt when the pointer is outside the card", () => {
    // ARRANGE
    const farLeft = { x: -900, y: 300 };

    // ACT
    const tilt = pointerTilt(farLeft, RECT, MAX);

    // ASSERT
    expect(tilt.ry).toBeCloseTo(-MAX);
  });

  it("should return zero tilt for a card with no size", () => {
    // ARRANGE
    const emptyRect = { left: 0, top: 0, width: 0, height: 0 };

    // ACT
    const tilt = pointerTilt({ x: 10, y: 10 }, emptyRect, MAX);

    // ASSERT
    expect(tilt).toEqual({ rx: 0, ry: 0 });
  });
});

describe("scrollTilt", () => {
  it("should tilt fully back when the card enters at the bottom of the viewport", () => {
    // ARRANGE
    const progress = 0;

    // ACT
    const tilt = scrollTilt(progress, MAX);

    // ASSERT
    expect(tilt.rx).toBeCloseTo(MAX);
    expect(tilt.ry).toBe(0);
  });

  it("should be flat when the card is at the middle of its pass", () => {
    // ARRANGE
    const progress = 0.5;

    // ACT
    const tilt = scrollTilt(progress, MAX);

    // ASSERT
    expect(tilt.rx).toBeCloseTo(0);
  });

  it("should tilt fully forward when the card leaves at the top", () => {
    // ARRANGE
    const progress = 1;

    // ACT
    const tilt = scrollTilt(progress, MAX);

    // ASSERT
    expect(tilt.rx).toBeCloseTo(-MAX);
  });

  it("should clamp progress outside the 0..1 range", () => {
    // ARRANGE
    const before = -0.5;
    const after = 1.7;

    // ACT
    const early = scrollTilt(before, MAX);
    const late = scrollTilt(after, MAX);

    // ASSERT
    expect(early.rx).toBeCloseTo(MAX);
    expect(late.rx).toBeCloseTo(-MAX);
  });
});

describe("sheenTransform", () => {
  it("should hide the sheen when the card is flat", () => {
    // ARRANGE
    const flat = { rx: 0, ry: 0 };

    // ACT
    const sheen = sheenTransform(flat, MAX, 0.22);

    // ASSERT
    expect(sheen.opacity).toBe(0);
    expect(sheen.xPercent).toBeCloseTo(0);
    expect(sheen.yPercent).toBeCloseTo(0);
  });

  it("should reach peak opacity and slide toward the turned edge at max tilt", () => {
    // ARRANGE
    const turnedRight = { rx: 0, ry: MAX };

    // ACT
    const sheen = sheenTransform(turnedRight, MAX, 0.22);

    // ASSERT
    expect(sheen.opacity).toBeCloseTo(0.22);
    expect(sheen.xPercent).toBeCloseTo(50);
    expect(sheen.yPercent).toBeCloseTo(0);
  });

  it("should slide up when the card turns toward its top edge", () => {
    // ARRANGE
    const turnedUp = { rx: MAX / 2, ry: 0 };

    // ACT
    const sheen = sheenTransform(turnedUp, MAX, 0.22);

    // ASSERT
    expect(sheen.yPercent).toBeCloseTo(-25);
    expect(sheen.opacity).toBeCloseTo(0.11);
  });

  it("should stay hidden when the max angle is zero", () => {
    // ARRANGE
    const anyTilt = { rx: 3, ry: 3 };

    // ACT
    const sheen = sheenTransform(anyTilt, 0, 0.22);

    // ASSERT
    expect(sheen).toEqual({ xPercent: 0, yPercent: 0, opacity: 0 });
  });
});

describe("layerLift", () => {
  it("should keep layers flat when the card is flat", () => {
    // ARRANGE
    const flat = { rx: 0, ry: 0 };

    // ACT
    const lift = layerLift(flat, MAX);

    // ASSERT
    expect(lift).toBe(0);
  });

  it("should raise layers fully at max tilt", () => {
    // ARRANGE
    const corner = { rx: MAX / Math.SQRT2, ry: MAX / Math.SQRT2 };

    // ACT
    const lift = layerLift(corner, MAX);

    // ASSERT
    expect(lift).toBeCloseTo(1);
  });

  it("should raise layers halfway at half tilt", () => {
    // ARRANGE
    const half = { rx: 0, ry: -MAX / 2 };

    // ACT
    const lift = layerLift(half, MAX);

    // ASSERT
    expect(lift).toBeCloseTo(0.5);
  });

  it("should keep layers flat when the max angle is zero", () => {
    // ARRANGE
    const anyTilt = { rx: 2, ry: 2 };

    // ACT
    const lift = layerLift(anyTilt, 0);

    // ASSERT
    expect(lift).toBe(0);
  });
});

describe("galleryLayerMotion", () => {
  const SHIFT = 2.5;
  const FACTOR = 0.45;
  const spareEdgePct = (scale: number) => ((scale - 1) / 2) * 100;

  it("should drift the plate down inside the frame so the background lags the page", () => {
    // ARRANGE
    const kind = "plate";

    // ACT
    const motion = galleryLayerMotion(kind, SHIFT, FACTOR);

    // ASSERT
    expect(motion.fromYPercent).toBe(-SHIFT);
    expect(motion.toYPercent).toBe(SHIFT);
  });

  it("should drift the subject the same way but less than the plate, so it reads nearer", () => {
    // ARRANGE
    const kind = "subject";

    // ACT
    const motion = galleryLayerMotion(kind, SHIFT, FACTOR);

    // ASSERT
    expect(motion.fromYPercent).toBeCloseTo(-SHIFT * FACTOR);
    expect(motion.toYPercent).toBeCloseTo(SHIFT * FACTOR);
  });

  it("should keep the person's slip over the background within the 14 px the layer gate approved", () => {
    // ARRANGE
    const MASTER_HEIGHT_PX = 900;
    const GATE_SLIP_PX = 14;
    const kinds = ["plate", "subject"] as const;

    // ACT
    const [plate, subject] = kinds.map((k) => galleryLayerMotion(k, DEPTH.galleryShiftPct, DEPTH.gallerySubjectFactor));

    // ASSERT
    const slipPx = (Math.abs(plate.fromYPercent - subject.fromYPercent) / 100) * MASTER_HEIGHT_PX;
    expect(slipPx).toBeGreaterThan(0);
    expect(slipPx).toBeLessThanOrEqual(GATE_SLIP_PX);
  });

  it("should give plate and subject the same zoom so they line up at rest", () => {
    // ARRANGE
    const kinds = ["plate", "subject"] as const;

    // ACT
    const [plate, subject] = kinds.map((k) => galleryLayerMotion(k, SHIFT, FACTOR));

    // ASSERT
    expect(plate.scale).toBe(subject.scale);
  });

  it("should never shift a layer past its zoomed edge", () => {
    // ARRANGE
    const kinds = ["plate", "subject", "full"] as const;

    // ACT
    const motions = kinds.map((k) => galleryLayerMotion(k, SHIFT, FACTOR));

    // ASSERT
    motions.forEach((m) => {
      expect(Math.abs(m.fromYPercent)).toBeLessThan(spareEdgePct(m.scale));
      expect(Math.abs(m.toYPercent)).toBeLessThan(spareEdgePct(m.scale));
    });
  });

  it("should drift a whole photo exactly like a plate", () => {
    // ARRANGE
    const kinds = ["full", "plate"] as const;

    // ACT
    const [full, plate] = kinds.map((k) => galleryLayerMotion(k, SHIFT, FACTOR));

    // ASSERT
    expect(full).toEqual(plate);
  });

  it("should neither move nor zoom when the shift is zero", () => {
    // ARRANGE
    const noShift = 0;

    // ACT
    const motion = galleryLayerMotion("subject", noShift, FACTOR);

    // ASSERT
    expect(motion).toEqual({ scale: 1, fromYPercent: 0, toYPercent: 0 });
  });
});
