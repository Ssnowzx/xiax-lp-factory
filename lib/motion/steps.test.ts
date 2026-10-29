import { describe, expect, it } from "vitest";

import { storyDelays } from "@/lib/motion/steps";

const GAP = 0.9;

describe("storyDelays", () => {
  it("should play cards one after the other when they share a row", () => {
    // ARRANGE
    const tops = [400, 400, 400];

    // ACT
    const delays = storyDelays(tops, GAP);

    // ASSERT
    expect(delays).toEqual([0, GAP, 2 * GAP]);
  });

  it("should start every card at once when they are stacked", () => {
    // ARRANGE
    const tops = [400, 900, 1400];

    // ACT
    const delays = storyDelays(tops, GAP);

    // ASSERT
    expect(delays).toEqual([0, 0, 0]);
  });

  it("should restart the sequence on each new row", () => {
    // ARRANGE
    const tops = [400, 400, 900];

    // ACT
    const delays = storyDelays(tops, GAP);

    // ASSERT
    expect(delays).toEqual([0, GAP, 0]);
  });

  it("should treat sub-pixel differences as the same row", () => {
    // ARRANGE
    const tops = [400, 400.4, 399.7];

    // ACT
    const delays = storyDelays(tops, GAP);

    // ASSERT
    expect(delays).toEqual([0, GAP, 2 * GAP]);
  });

  it("should return no delays when there are no cards", () => {
    // ARRANGE
    const tops: number[] = [];

    // ACT
    const delays = storyDelays(tops, GAP);

    // ASSERT
    expect(delays).toEqual([]);
  });
});
