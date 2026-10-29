/**
 * Lighting of the 3D scene per page theme (change xiax-lp-v5-salon · design D7). Pure data,
 * so the stage can pick it from `<html data-theme>` before three.js loads.
 *
 * `dark` is the scene as it always was (the barbershop page must not change by one pixel).
 * `porcelain` lowers the exposure and the room light and warms the key, so the brass and
 * champagne metals keep their colour on the ivory page instead of blowing out to white.
 */

export interface LightingPreset {
  /** renderer tone-mapping exposure (three's default is 1). */
  exposure: number;
  /** strength of the room environment the metals reflect (three's default is 1). */
  environmentIntensity: number;
  /** the directional key light, upper left, in front. */
  key: { color: number; intensity: number };
}

export type SceneTheme = "dark" | "porcelain";

export const LIGHTING_PRESETS: Record<SceneTheme, LightingPreset> = {
  /** Warm key light so brass reads as brass on the espresso page (#14110E). */
  dark: { exposure: 1, environmentIntensity: 1, key: { color: 0xffe2b0, intensity: 1.6 } },
  porcelain: { exposure: 0.8, environmentIntensity: 0.7, key: { color: 0xffcf96, intensity: 1.5 } },
};

/**
 * The preset for a page theme; any theme without its own preset is lit as the dark page.
 * @param theme - `document.documentElement.dataset.theme`
 */
export function lightingPreset(theme: string | undefined): LightingPreset {
  return theme === "porcelain" ? LIGHTING_PRESETS.porcelain : LIGHTING_PRESETS.dark;
}
