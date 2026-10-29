import Image from "next/image";

import type { Screen } from "@/lib/data/screens";

import { cn } from "@/lib/ui/cn";

// Frames for the real Xchair screens (change xiax-lp-v4-xchair · design D3). The screens are
// 2x retina captures of the app; the frame only adds the device's edge, never UI of its own.
// The <Image> keeps the file's intrinsic size so the box is reserved before it loads (CLS 0).

interface FrameProps {
  screen: Screen;
  /** next/image `sizes`, written for the slot the frame sits in. */
  sizes: string;
  priority?: boolean;
  className?: string;
}

function ScreenImage({ screen, sizes, priority, className }: FrameProps) {
  return (
    <Image
      src={screen.src}
      width={screen.width}
      height={screen.height}
      alt={screen.alt}
      sizes={sizes}
      priority={priority}
      quality={90}
      className={cn("block h-auto w-full", className)}
    />
  );
}

/** A phone: dark bezel and rounded glass around a 390 px-wide app screen. */
export function PhoneFrame({ className, ...image }: FrameProps) {
  return (
    <div className={cn("rounded-[2.2rem] border border-line-strong bg-[#050504] p-[3.5%] shadow-e4", className)}>
      <ScreenImage {...image} className="rounded-[1.8rem]" />
    </div>
  );
}

/** A computer window: a quiet title bar over the owner's panel. */
export function BrowserFrame({ className, ...image }: FrameProps) {
  return (
    <div className={cn("overflow-hidden rounded-surface border border-line-strong bg-surface shadow-e4", className)}>
      <div aria-hidden="true" className="flex items-center gap-1.5 border-b border-line px-3 py-2">
        <span className="size-2 rounded-full bg-line-strong" />
        <span className="size-2 rounded-full bg-line-strong" />
        <span className="size-2 rounded-full bg-line-strong" />
      </div>
      <ScreenImage {...image} />
    </div>
  );
}

/** A cut-out of a screen, framed like a card of the app. */
export function ScreenCrop({ className, ...image }: FrameProps) {
  return (
    <div className={cn("overflow-hidden rounded-surface border border-line-strong bg-base shadow-e3", className)}>
      <ScreenImage {...image} />
    </div>
  );
}
