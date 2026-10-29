import { describe, expect, it } from "vitest";

import type { ScissorsInput } from "@/lib/motion/scissors-path";

import { scissorsPose } from "@/lib/motion/scissors-path";
import { SCISSORS } from "@/lib/motion/motion-tokens";

const HERO_HEIGHT = 900;
const MAX_SCROLL = 9000;
const RAIL = { x: 1400, top: 64, bottom: 700 };

function input(overrides: Partial<ScissorsInput> = {}): ScissorsInput {
  return {
    scrollY: 0,
    maxScroll: MAX_SCROLL,
    viewport: { width: 1440, height: 900 },
    isDesktop: true,
    heroHeight: HERO_HEIGHT,
    anchor: { x: 1180, y: 160 },
    rail: RAIL,
    bottomInsetPx: 0,
    flipDeg: 0,
    spinDeg: 0,
    pointer: null,
    ...overrides,
  };
}

/** scrollY at which the hero → rail transition reaches the given fraction t of its range. */
function scrollAtTransition(t: number) {
  const start = SCISSORS.transitionStart * HERO_HEIGHT;
  const end = SCISSORS.transitionEnd * HERO_HEIGHT;
  return start + (end - start) * t;
}

describe("scissorsPose · hero", () => {
  it("should sit big on the hero anchor at the top of the page", () => {
    // ARRANGE
    const atTop = input();

    // ACT
    const pose = scissorsPose(atTop);

    // ASSERT
    expect(pose.phase).toBe("hero");
    expect(pose.x).toBe(1180);
    expect(pose.y).toBe(160);
    expect(pose.lengthPx).toBe(SCISSORS.heroLengthPx);
    expect(pose.rotZ).toBe(SCISSORS.heroTiltZDeg);
    expect(pose.railPresence).toBe(0);
  });

  it("should scroll along with the hero before the transition starts", () => {
    // ARRANGE
    const scrolled = input({ scrollY: 5 });

    // ACT
    const pose = scissorsPose(scrolled);

    // ASSERT
    expect(pose.phase).toBe("hero");
    expect(pose.y).toBe(155);
  });

  it("should stay on screen below the header while the hero scrolls away", () => {
    // ARRANGE
    const steps = Array.from({ length: 19 }, (_, i) => input({ scrollY: (HERO_HEIGHT * i) / 18 }));

    // ACT
    const poses = steps.map(scissorsPose);

    // ASSERT
    poses.forEach((pose) => {
      const ringTop = pose.y - SCISSORS.pivotFromTop * pose.lengthPx;
      expect(ringTop).toBeGreaterThanOrEqual(RAIL.top - 1e-9);
    });
  });

  it("should spin around its vertical axis using the shortest angle", () => {
    // ARRANGE
    const pastOneTurn = input({ spinDeg: 370 });
    const pastHalfTurn = input({ spinDeg: 190 });

    // ACT
    const a = scissorsPose(pastOneTurn);
    const b = scissorsPose(pastHalfTurn);

    // ASSERT
    expect(a.rotY).toBeCloseTo(10);
    expect(b.rotY).toBeCloseTo(-170);
  });
});

describe("scissorsPose · transition", () => {
  it("should be halfway between hero and rail in size and position at the middle", () => {
    // ARRANGE
    const middle = input({ scrollY: scrollAtTransition(0.5) });

    // ACT
    const pose = scissorsPose(middle);

    // ASSERT
    expect(pose.phase).toBe("transition");
    expect(pose.lengthPx).toBeCloseTo((SCISSORS.heroLengthPx + SCISSORS.railLengthPx) / 2);
    expect(pose.x).toBeCloseTo((1180 + RAIL.x) / 2);
    expect(pose.railPresence).toBeCloseTo(0.5);
  });

  it("should change smoothly, without jumps, across the transition", () => {
    // ARRANGE
    const steps = Array.from({ length: 41 }, (_, i) => input({ scrollY: scrollAtTransition(i / 40) }));

    // ACT
    const lengths = steps.map((s) => scissorsPose(s).lengthPx);

    // ASSERT
    const maxStep = Math.max(...lengths.slice(1).map((l, i) => Math.abs(l - lengths[i])));
    expect(maxStep).toBeLessThan((SCISSORS.heroLengthPx - SCISSORS.railLengthPx) / 10);
  });

  it("should return to the exact hero pose when scrolled back to the top", () => {
    // ARRANGE
    const down = input({ scrollY: scrollAtTransition(0.7) });
    const backAtTop = input({ scrollY: 0 });

    // ACT
    scissorsPose(down);
    const pose = scissorsPose(backAtTop);

    // ASSERT
    expect(pose).toEqual(scissorsPose(input()));
  });
});

describe("scissorsPose · rail", () => {
  it("should reach the rail with rail size, face-on and fully present at the end of the hero", () => {
    // ARRANGE
    const heroEnd = input({ scrollY: HERO_HEIGHT, spinDeg: 123 });

    // ACT
    const pose = scissorsPose(heroEnd);

    // ASSERT
    expect(pose.phase).toBe("rail");
    expect(pose.x).toBe(RAIL.x);
    expect(pose.lengthPx).toBe(SCISSORS.railLengthPx);
    expect(pose.rotY).toBeCloseTo(0);
    expect(pose.railPresence).toBe(1);
  });

  it("should rest its blade tips on the top of the footer at the end of the page", () => {
    // ARRANGE
    const pageEnd = input({ scrollY: MAX_SCROLL });

    // ACT
    const pose = scissorsPose(pageEnd);

    // ASSERT
    const tipY = pose.y + (1 - SCISSORS.pivotFromTop) * pose.lengthPx;
    expect(tipY).toBeCloseTo(RAIL.bottom);
  });

  it("should move down the rail as the page scrolls", () => {
    // ARRANGE
    const quarter = input({ scrollY: MAX_SCROLL * 0.25 });
    const threeQuarters = input({ scrollY: MAX_SCROLL * 0.75 });

    // ACT
    const a = scissorsPose(quarter);
    const b = scissorsPose(threeQuarters);

    // ASSERT
    expect(b.y).toBeGreaterThan(a.y);
  });

  it("should point its blades up when the scroll is reversed", () => {
    // ARRANGE
    const flipped = input({ scrollY: MAX_SCROLL / 2, flipDeg: SCISSORS.flipDeg });

    // ACT
    const pose = scissorsPose(flipped);

    // ASSERT
    expect(pose.rotZ).toBe(SCISSORS.flipDeg);
  });
});

describe("scissorsPose · snip", () => {
  it("should keep the blades closed at the top of the page", () => {
    // ARRANGE
    const atTop = input();

    // ACT
    const pose = scissorsPose(atTop);

    // ASSERT
    expect(pose.snipDeg).toBe(0);
  });

  it("should open the blades fully at the middle of a snip cycle", () => {
    // ARRANGE
    const midSnip = input({ scrollY: MAX_SCROLL * (0.5 / SCISSORS.snips) });

    // ACT
    const pose = scissorsPose(midSnip);

    // ASSERT
    expect(pose.snipDeg).toBeCloseTo(SCISSORS.snipDeg);
  });
});

describe("scissorsPose · pointer", () => {
  it("should lean toward a pointer on its right without exceeding the max lean", () => {
    // ARRANGE
    const pointerRight = input({ pointer: { x: 1180 + 200, y: 160 } });

    // ACT
    const pose = scissorsPose(pointerRight);

    // ASSERT
    expect(pose.rotY).toBeGreaterThan(0);
    expect(pose.rotY).toBeLessThanOrEqual(SCISSORS.pointerTiltDeg);
    expect(pose.rotX).toBeCloseTo(0);
  });

  it("should not lean when there is no pointer", () => {
    // ARRANGE
    const noPointer = input();

    // ACT
    const pose = scissorsPose(noPointer);

    // ASSERT
    expect(pose.rotX).toBe(0);
    expect(pose.rotY).toBe(0);
  });
});

describe("scissorsPose · mobile", () => {
  it("should sit small in the bottom-right corner above the CTA bar", () => {
    // ARRANGE
    const phone = input({
      isDesktop: false,
      viewport: { width: 390, height: 844 },
      bottomInsetPx: 72,
      pointer: { x: 10, y: 10 },
    });

    // ACT
    const pose = scissorsPose(phone);

    // ASSERT
    const tipY = pose.y + (1 - SCISSORS.pivotFromTop) * pose.lengthPx;
    expect(pose.phase).toBe("mobile");
    expect(pose.lengthPx).toBe(SCISSORS.mobileLengthPx);
    expect(tipY).toBeLessThanOrEqual(844 - 72 - SCISSORS.mobileMarginPx);
    expect(pose.x).toBeGreaterThan(390 - 60);
    expect(pose.rotX).toBe(0);
    expect(pose.railPresence).toBe(0);
  });

  it.each([360, 375, 390, 430])("should keep a %i px phone's scissors inside the page's right margin", (width) => {
    // ARRANGE
    const gutterPx = 0.07 * width; // styles/tokens.css --space-gutter: 7vw
    const phone = input({ isDesktop: false, viewport: { width, height: 800 }, bottomInsetPx: 72 });

    // ACT
    const pose = scissorsPose(phone);

    // ASSERT
    const halfWidth = SCISSORS.mobileHalfWidthFrac * pose.lengthPx;
    expect(pose.x - halfWidth).toBeGreaterThanOrEqual(width - gutterPx);
    expect(pose.x + halfWidth).toBeLessThanOrEqual(width - SCISSORS.mobileMarginPx);
  });
});

describe("scissorsPose · guards", () => {
  it("should not produce NaN when the hero or the page has no scroll range", () => {
    // ARRANGE
    const degenerate = input({ heroHeight: 0, maxScroll: 0 });

    // ACT
    const pose = scissorsPose(degenerate);

    // ASSERT
    expect(Object.values(pose).filter((v) => typeof v === "number").every(Number.isFinite)).toBe(true);
    expect(pose.phase).toBe("rail");
  });
});

describe("scissorsPose · giving way to the razor", () => {
  const MID_PAGE = MAX_SCROLL / 2;

  it("should not move at all when it does not give way", () => {
    // ARRANGE
    const plain = scissorsPose(input({ scrollY: MID_PAGE }));

    // ACT
    const result = scissorsPose(input({ scrollY: MID_PAGE, giveWay: 0 }));

    // ASSERT
    expect(result).toEqual(plain);
  });

  it("should be off the right edge of the screen when it gives way fully", () => {
    // ARRANGE
    const out = input({ scrollY: MID_PAGE, giveWay: 1 });

    // ACT
    const result = scissorsPose(out);

    // ASSERT
    expect(result.x - result.lengthPx / 2).toBeGreaterThanOrEqual(out.viewport.width);
  });

  it("should fade its trail line as it gives way", () => {
    // ARRANGE
    const half = input({ scrollY: MID_PAGE, giveWay: 0.5 });

    // ACT
    const result = scissorsPose(half);

    // ASSERT
    expect(result.railPresence).toBeCloseTo(0.5);
  });

  it("should leave its phone corner too", () => {
    // ARRANGE
    const phone = input({ scrollY: MID_PAGE, isDesktop: false, viewport: { width: 390, height: 844 }, giveWay: 1 });

    // ACT
    const result = scissorsPose(phone);

    // ASSERT
    expect(result.x - result.lengthPx / 2).toBeGreaterThanOrEqual(phone.viewport.width);
  });
});
