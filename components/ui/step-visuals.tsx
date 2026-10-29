import Image from "next/image";

import type { StepRing, StepVisualSpec } from "@/lib/content/types";

import { WhatsAppBubble } from "@/components/ui/whatsapp-bubble";

// #como-funciona visuals (change xiax-lp-v4-xchair · design D3): each step shows a cut of the
// real app screen, replacing the hand-built mini screens of xiax-lp-v3-cards-25d. All three
// share one square stage, the screen edge to edge (owner, 2026-10-28: the mixed-size first cut
// "não encaixou bem"); a timeline cut fades at its edges instead of stopping mid-row. The
// choreography is the same story, told on top of the screenshot: [data-step-in] the screen
// rises in → [data-step-key] the ring marks the moment (slot picked, free slot on the agenda)
// → [data-step-after] the real day-before WhatsApp reminder lands over the confirmation's
// details, never over its date. Static markup is the final frame, so no-JS and reduced motion
// show the whole step. Animated nodes sit INSIDE depth layers, never on them; nothing between
// the stage and a layer clips (depth rule, globals.css). The screen, its ring and its message
// come from the page's content (change xiax-lp-v5-salon · D2).

/** Card-width `sizes`: one column on a phone, a third of the 1200 px content ≥md. */
const STEP_SIZES = "(min-width: 768px) 360px, calc(100vw - 14vw - 2rem)";

/** Fades for cuts that stop mid-content (a timeline, a screen continuing below). */
const FADE = {
  none: "",
  both: "[mask-image:linear-gradient(to_bottom,transparent,black_9%,black_88%,transparent)]",
  bottom: "[mask-image:linear-gradient(to_bottom,black_62%,transparent_96%)]",
} as const;

/** Ring over a screen region, in % of the square cut (crop boxes in optimize-screens.mjs). */
function StepRingLayer({ ring }: { ring: StepRing }) {
  return (
    <div data-depth="2" aria-hidden="true" className="pointer-events-none absolute" style={ring}>
      <span data-step-key="pop" className="block size-full rounded-[10px] border-2 border-accent shadow-[0_0_24px_rgb(var(--accent)/0.45)]" />
    </div>
  );
}

export function StepVisual({ spec }: { spec: StepVisualSpec }) {
  const { kind, screen, fade, ring, message } = spec;
  return (
    <div data-step-screen={kind} data-depth-pass className="relative aspect-square w-full">
      <div data-depth-pass className="absolute inset-0">
        <div data-step-in className="relative size-full overflow-hidden rounded-field border border-line bg-base">
          <Image
            src={screen.src}
            alt={screen.alt}
            fill
            sizes={STEP_SIZES}
            quality={90}
            className={`object-cover object-top ${FADE[fade]}`}
          />
        </div>
      </div>
      {ring && <StepRingLayer ring={ring} />}
      {message && (
        <div data-depth="3" className="absolute inset-x-[6%] bottom-[5%]">
          <div data-step-after>
            <WhatsAppBubble message={message} size="sm" />
          </div>
        </div>
      )}
    </div>
  );
}
