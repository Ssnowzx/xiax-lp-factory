import { describe, expect, it } from "vitest";

import { resolveSiteUrl } from "@/lib/site";

describe("resolveSiteUrl", () => {
  it("should use the configured site address when there is one", () => {
    // ARRANGE
    const env = { NEXT_PUBLIC_SITE_URL: "https://xchair.com.br", VERCEL_PROJECT_PRODUCTION_URL: "xiax-lp-factory.vercel.app" };

    // ACT
    const url = resolveSiteUrl(env);

    // ASSERT
    expect(url).toBe("https://xchair.com.br");
  });

  it("should use Vercel's production address when no site address is configured", () => {
    // ARRANGE
    const env = { VERCEL_PROJECT_PRODUCTION_URL: "xiax-lp-factory.vercel.app" };

    // ACT
    const url = resolveSiteUrl(env);

    // ASSERT
    expect(url).toBe("https://xiax-lp-factory.vercel.app");
  });

  it("should fall back to the local server outside Vercel", () => {
    // ARRANGE
    const env = {};

    // ACT
    const url = resolveSiteUrl(env);

    // ASSERT
    expect(url).toBe("http://localhost:3000");
  });
});
