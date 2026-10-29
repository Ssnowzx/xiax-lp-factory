import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { contrastRatio, parseRgbTriplet, themeColors } from "@/lib/ui/contrast";

const TOKENS = readFileSync(new URL("../../styles/tokens.css", import.meta.url), "utf8");
const BLACK = { r: 0, g: 0, b: 0 };
const WHITE = { r: 255, g: 255, b: 255 };

describe("contrastRatio", () => {
  it("should give 21:1 for black on white", () => {
    // ARRANGE
    const [text, background] = [BLACK, WHITE];

    // ACT
    const ratio = contrastRatio(text, background);

    // ASSERT
    expect(ratio).toBeCloseTo(21, 5);
  });

  it("should give 1:1 for a colour on itself", () => {
    // ARRANGE
    const colour = { r: 123, g: 74, b: 60 };

    // ACT
    const ratio = contrastRatio(colour, colour);

    // ASSERT
    expect(ratio).toBe(1);
  });

  it("should not depend on which colour is the text", () => {
    // ARRANGE
    const [a, b] = [{ r: 28, g: 23, b: 20 }, { r: 246, g: 241, b: 234 }];

    // ACT
    const [ab, ba] = [contrastRatio(a, b), contrastRatio(b, a)];

    // ASSERT
    expect(ab).toBe(ba);
  });
});

describe("parseRgbTriplet", () => {
  it("should read an r g b triplet", () => {
    // ARRANGE
    const value = " 246 241 234 ";

    // ACT
    const colour = parseRgbTriplet(value);

    // ASSERT
    expect(colour).toEqual({ r: 246, g: 241, b: 234 });
  });

  it("should reject a value that is not a colour triplet", () => {
    // ARRANGE
    const values = ["var(--bone-100)", "9999px", "0 2px 6px rgb(0 0 0 / 0.4)", "256 0 0"];

    // ACT
    const colours = values.map(parseRgbTriplet);

    // ASSERT
    expect(colours).toEqual([null, null, null, null]);
  });
});

describe("themeColors", () => {
  it("should read a theme's colour tokens and skip the other values", () => {
    // ARRANGE
    const css = '[data-theme="demo"] {\n  color-scheme: light;\n  --base: 1 2 3; /* note */\n  --radius-control: 9999px;\n}\n';

    // ACT
    const colours = themeColors(css, "demo");

    // ASSERT
    expect(colours).toEqual({ base: { r: 1, g: 2, b: 3 } });
  });

  it("should return no colours when the theme block is missing", () => {
    // ARRANGE
    const css = ':root { --base: 1 2 3; }';

    // ACT
    const colours = themeColors(css, "demo");

    // ASSERT
    expect(colours).toEqual({});
  });
});

describe("Porcelana tokens (styles/tokens.css)", () => {
  const porcelain = themeColors(TOKENS, "porcelain");
  const ratioOf = (text: string, background: string) => {
    const [fg, bg] = [porcelain[text], porcelain[background]];
    if (!fg || !bg) throw new Error(`missing porcelain token: ${fg ? background : text}`);
    return contrastRatio(fg, bg);
  };
  // `band`: the sand of every other salon section (owner, 2026-10-28: "separar mais os setores")
  const SURFACES = ["base", "surface", "surface-raised", "band"];

  it("should use the app's palette for background, text and accent, with darker body copy", () => {
    // ARRANGE
    const expected = {
      base: { r: 246, g: 241, b: 234 },
      ink: { r: 28, g: 23, b: 20 },
      // one step darker than the app's #6E625A (owner, 2026-10-28: "textos apagados")
      "ink-muted": { r: 84, g: 74, b: 67 },
      accent: { r: 123, g: 74, b: 60 },
      "accent-ink": { r: 251, g: 247, b: 241 },
    };

    // ACT
    const actual = Object.fromEntries(Object.keys(expected).map((name) => [name, porcelain[name]]));

    // ASSERT
    expect(actual).toEqual(expected);
  });

  it("should keep every text colour at 4.5:1 or more on every surface", () => {
    // ARRANGE
    const pairs = ["ink", "ink-muted", "ink-subtle", "accent"].flatMap((text) => SURFACES.map((bg) => [text, bg]));

    // ACT
    const failing = pairs.filter(([text, bg]) => ratioOf(text, bg) < 4.5);

    // ASSERT
    expect(failing).toEqual([]);
  });

  it("should keep the button text at 4.5:1 or more on the accent", () => {
    // ARRANGE
    const [text, background] = ["accent-ink", "accent"];

    // ACT
    const ratio = ratioOf(text, background);

    // ASSERT
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  // Darkest pixel of public/textures/linen-v1.webp, the salon's background (its mean is --base).
  const LINEN_DARKEST = { r: 230, g: 224, b: 217 };

  it("should keep every text colour at 4.5:1 or more on the linen's darkest weave", () => {
    // ARRANGE
    const texts = ["ink", "ink-muted", "ink-subtle", "accent"];

    // ACT
    const failing = texts.filter((text) => contrastRatio(porcelain[text], LINEN_DARKEST) < 4.5);

    // ASSERT
    expect(failing).toEqual([]);
  });

  it("should keep text at 4.5:1 or more on a band's darkest weave, with the band's own label colour", () => {
    // ARRANGE — a band is the linen multiplied by --band-tint; inside it --ink-subtle is --band-ink-subtle
    const tint = porcelain["band-tint"];
    const shade = { r: (LINEN_DARKEST.r * tint.r) / 255, g: (LINEN_DARKEST.g * tint.g) / 255, b: (LINEN_DARKEST.b * tint.b) / 255 };
    const texts = ["ink", "ink-muted", "band-ink-subtle", "accent"];

    // ACT
    const failing = texts.filter((text) => contrastRatio(porcelain[text], shade) < 4.5);

    // ASSERT
    expect(failing).toEqual([]);
  });

  it("should keep control outlines at 3:1 or more on every surface", () => {
    // ARRANGE
    const backgrounds = SURFACES;

    // ACT
    const failing = backgrounds.filter((bg) => ratioOf("line-strong", bg) < 3);

    // ASSERT
    expect(failing).toEqual([]);
  });
});
