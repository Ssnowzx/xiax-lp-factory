import { describe, expect, it } from "vitest";

import type { CutState } from "./cut-state";

import { nextCutState } from "./cut-state";

describe("nextCutState", () => {
  it("should keep waiting while the line is undrawn", () => {
    // ARRANGE
    const drawn = 0;

    // ACT
    const next = nextCutState("waiting", drawn, true);

    // ASSERT
    expect(next).toBe("waiting");
  });

  it("should start cutting when the line starts with the razor in place", () => {
    // ARRANGE
    const drawn = 0.01;

    // ACT
    const next = nextCutState("waiting", drawn, true);

    // ASSERT
    expect(next).toBe("cutting");
  });

  it("should skip to done when the line starts before the razor is in place", () => {
    // ARRANGE
    const drawn = 0.01;

    // ACT
    const next = nextCutState("waiting", drawn, false);

    // ASSERT
    expect(next).toBe("done");
  });

  it("should keep cutting while the line is partly drawn", () => {
    // ARRANGE
    const drawn = 0.5;

    // ACT
    const next = nextCutState("cutting", drawn, false);

    // ASSERT
    expect(next).toBe("cutting");
  });

  it("should exit once the line is whole", () => {
    // ARRANGE
    const drawn = 1;

    // ACT
    const next = nextCutState("cutting", drawn, false);

    // ASSERT
    expect(next).toBe("exiting");
  });

  it("should go straight to exiting when the line is already whole as the cut starts", () => {
    // ARRANGE
    const drawn = 1;

    // ACT
    const next = nextCutState("waiting", drawn, true);

    // ASSERT
    expect(next).toBe("exiting");
  });

  it("should leave the end of the exit to the exit's own clock", () => {
    // ARRANGE
    const drawn = 1;

    // ACT
    const next = nextCutState("exiting", drawn, true);

    // ASSERT
    expect(next).toBe("exiting");
  });

  it("should stay done while the line stays drawn", () => {
    // ARRANGE
    const drawn = 1;

    // ACT
    const next = nextCutState("done", drawn, true);

    // ASSERT
    expect(next).toBe("done");
  });

  it.each<CutState>(["cutting", "exiting", "done"])(
    "should re-arm from %s when the line is rewound to nothing",
    (state) => {
      // ARRANGE
      const drawn = 0;

      // ACT
      const next = nextCutState(state, drawn, false);

      // ASSERT
      expect(next).toBe("waiting");
    },
  );
});
