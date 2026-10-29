import type { Viewport } from "next";
import type { ReactNode } from "react";

import type { SeoContent } from "@/lib/content/types";

import { Vitals } from "@/components/analytics/vitals";
import { DeferredMotionChoreography } from "@/components/motion/deferred-motion-choreography";
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll";
import { jsonLdScript, softwareApplicationLd } from "@/lib/seo/json-ld";

/**
 * viewport-fit=cover (Design QA XIA-75 · I1): without it `env(safe-area-inset-*)` resolves to 0 on
 * notched phones and the sticky `.cta-bar` padding does nothing. Each root layout exports it.
 */
export const ROOT_VIEWPORT: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/** Adds `anim-ready` before paint when there is JS and no reduced motion; if JS fails, all shows. */
const ANIM_READY_SCRIPT =
  "try{if(window.matchMedia&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.classList.add('anim-ready')}}catch(e){}";

interface RootDocumentProps {
  /** `data-theme` stamped on the server, so there is no flash of the wrong theme. */
  theme: "dark" | "porcelain";
  /** The next/font variable classes that fill --font-display/-sans/-mono. */
  fontClassName: string;
  seo: SeoContent;
  children: ReactNode;
}

/**
 * The `<html>` of a landing page's root layout (change xiax-lp-v5-salon · D1): each route group is
 * its own root with its own fonts and theme, and this is everything they share.
 */
export function RootDocument({ theme, fontClassName, seo, children }: RootDocumentProps) {
  return (
    // suppressHydrationWarning: the pre-paint script adds `anim-ready` to this tag before React
    // hydrates, so its class is expected to differ from the server's.
    <html lang="pt-BR" data-theme={theme} suppressHydrationWarning className={fontClassName}>
      <body className="min-h-dvh bg-base font-sans text-ink antialiased">
        <script dangerouslySetInnerHTML={{ __html: ANIM_READY_SCRIPT }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(softwareApplicationLd(seo)) }} />
        {/* Lenis + GSAP on one ticker, client-only, reduced motion as the default gate; children
            are RSC passed by prop, so the conversion HTML ships before the JS. */}
        <SmoothScrollProvider>
          {children}
          <DeferredMotionChoreography />
        </SmoothScrollProvider>
        <Vitals />
      </body>
    </html>
  );
}
