/**
 * WCAG 2.2 contrast, computed from the theme tokens (change xiax-lp-v5-salon · D3). Pure: the
 * test reads `styles/tokens.css` and proves every text/background pair of a theme.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** sRGB channel (0–255) to linear light, per WCAG relative luminance. */
function linear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance({ r, g, b }: Rgb): number {
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/**
 * Contrast ratio between two colours, from 1 (same) to 21 (black on white); order does not matter.
 * @param a - one colour
 * @param b - the other colour
 * @returns the WCAG ratio
 */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

/**
 * Reads a token value written as an "r g b" triplet (the form `rgb(var(--token))` consumes).
 * @param value - the raw custom-property value
 * @returns the colour, or null when the value is not a triplet of 0–255 integers
 */
export function parseRgbTriplet(value: string): Rgb | null {
  const match = /^\s*(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})\s*$/.exec(value);
  if (!match) return null;
  const [r, g, b] = match.slice(1).map(Number);
  return [r, g, b].every((channel) => channel <= 255) ? { r, g, b } : null;
}

/**
 * The colour tokens of one theme block (`[data-theme="<theme>"] { … }`) of a stylesheet.
 * @param css - the stylesheet text
 * @param theme - the `data-theme` value
 * @returns token name (without `--`) to colour; values that are not triplets are skipped
 */
export function themeColors(css: string, theme: string): Record<string, Rgb> {
  const block = new RegExp(`\\[data-theme="${theme}"\\]\\s*\\{([^}]*)\\}`).exec(css)?.[1] ?? "";
  const colours: Record<string, Rgb> = {};
  for (const [, name, value] of block.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
    const colour = parseRgbTriplet(value);
    if (colour) colours[name] = colour;
  }
  return colours;
}
