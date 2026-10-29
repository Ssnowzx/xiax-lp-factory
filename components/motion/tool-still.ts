import { gsap } from "gsap";

import type { StillFrame } from "@/lib/motion/still-frame";

import { stillCssHeight } from "@/lib/motion/still-frame";

/**
 * Still images of the 3D tools (scissors, razor): the Blender render of the same model, shown
 * while the 3D loads and kept, motionless, under reduced motion or without WebGL. Placed with
 * transforms only (no layout), so the pivot of the render lands on the pose's pivot.
 */

interface StillPose {
  x: number;
  y: number;
  rotZ: number;
  lengthPx: number;
}

/**
 * Moves a still so its pivot sits on the pose.
 * @param img - the still, whose CSS height is `stillCssHeight(frame, baseLengthPx)`
 * @param pose - pivot position (px in the img's containing block), in-plane angle, length
 * @param frame - framing of the render
 * @param baseLengthPx - model length the CSS height was set for; other lengths scale from it
 */
export function placeStill(img: HTMLImageElement, pose: StillPose, frame: StillFrame, baseLengthPx: number) {
  const height = stillCssHeight(frame, baseLengthPx);
  const pivotY = frame.pivotYPx / frame.heightPx;
  // From the frame, not offsetWidth: the image may not have loaded yet when it is placed.
  const width = (height * frame.widthPx) / frame.heightPx;
  gsap.set(img, {
    x: pose.x - width / 2,
    y: pose.y - pivotY * height,
    rotation: pose.rotZ,
    scale: pose.lengthPx / baseLengthPx,
    transformOrigin: `50% ${pivotY * 100}%`,
  });
}
