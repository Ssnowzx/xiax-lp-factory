import { describe, expect, it } from "vitest";

import { ctaClick } from "@/lib/analytics/events";

describe("ctaClick", () => {
  it("should tag a CTA click with the page it happened on", () => {
    // ARRANGE
    const page = "salon";

    // ACT
    const event = ctaClick(page, "final");

    // ASSERT
    expect(event).toEqual({ name: "cta_click", page: "salon", placement: "final" });
  });
});
