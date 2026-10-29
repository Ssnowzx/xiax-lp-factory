import { describe, expect, it } from "vitest";

import { LIGHTING_PRESETS, lightingPreset } from "@/lib/three/lighting";

/** Red over blue of a 0xRRGGBB colour: above 1 is warm. */
const warmth = (color: number) => ((color >> 16) & 0xff) / (color & 0xff);

describe("lightingPreset", () => {
  it("should light the dark page exactly as the scene always was", () => {
    // ARRANGE
    const theme = "dark";

    // ACT
    const result = lightingPreset(theme);

    // ASSERT
    expect(result).toEqual({ exposure: 1, environmentIntensity: 1, key: { color: 0xffe2b0, intensity: 1.6 } });
  });

  it("should light a page without a theme as the dark page", () => {
    // ARRANGE
    const theme = undefined;

    // ACT
    const result = lightingPreset(theme);

    // ASSERT
    expect(result).toBe(LIGHTING_PRESETS.dark);
  });

  it("should use the porcelain preset on the porcelain page", () => {
    // ARRANGE
    const theme = "porcelain";

    // ACT
    const result = lightingPreset(theme);

    // ASSERT
    expect(result).toBe(LIGHTING_PRESETS.porcelain);
  });

  it("should lower the exposure and the room light and warm the key on porcelain", () => {
    // ARRANGE
    const { dark, porcelain } = LIGHTING_PRESETS;

    // ACT
    const [darkWarmth, porcelainWarmth] = [warmth(dark.key.color), warmth(porcelain.key.color)];

    // ASSERT
    expect(porcelain.exposure).toBeLessThan(dark.exposure);
    expect(porcelain.environmentIntensity).toBeLessThan(dark.environmentIntensity);
    expect(porcelainWarmth).toBeGreaterThan(darkWarmth);
  });
});
