/** Small scalar helpers shared by the pure choreography modules (scissors, razor). */

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Hermite ease of a 0..1 value: zero slope at both ends, so blends start and stop softly. */
export const smoothstep = (t: number) => t * t * (3 - 2 * t);
