/**
 * Framing of the still renders of the 3D tools (assets/3d/<tool>/build-<tool>.py, and
 * scripts/v3-assets/brush-still.py for the brush): an orthographic front view, the model's -Y
 * end down (blade tip, brush handle), pivot on the vertical center line. Pure data, so
 * server components can size an <img> without pulling in the motion runtime.
 */

/** px per model unit, image size (px), pivot y from the top (px). */
export interface StillFrame {
  unitPx: number;
  widthPx: number;
  heightPx: number;
  pivotYPx: number;
}

/** 480 px per unit, 16 px margin above and below → 212 × 512 px, rivet at y = 205.4 px. */
export const SCISSORS_STILL_FRAME: StillFrame = { unitPx: 480, widthPx: 212, heightPx: 512, pivotYPx: 205.4 };

/** 960 px per unit (sharp at 2x for a ~300 px razor), 32 px margin above and below →
 *  208 × 1024 px, pin at y = 32 + 0.52 · 960. */
export const RAZOR_STILL_FRAME: StillFrame = { unitPx: 960, widthPx: 208, heightPx: 1024, pivotYPx: 531.2 };

/** 640 px per unit (sharp at 2x for the 260 px brush), 32 px margins → 240 × 705 px (the
 *  height rounds up), barrel centre at y = 32 + 0.27 · 640 (scripts/v3-assets/brush-still.py). */
export const BRUSH_STILL_FRAME: StillFrame = { unitPx: 640, widthPx: 240, heightPx: 705, pivotYPx: 204.8 };

/** CSS height that shows the model `lengthPx` long. */
export const stillCssHeight = (frame: StillFrame, lengthPx: number) => (lengthPx * frame.heightPx) / frame.unitPx;
