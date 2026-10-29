import type { ShowcaseContent, ShowcaseTheme } from "@/lib/content/types";

import { Section } from "@/components/ui/section";
import { Kicker } from "@/components/ui/kicker";
import { Badge } from "@/components/ui/badge";
import { ChkList, Chk } from "@/components/ui/chk";
import { PhoneFrame } from "@/components/ui/device-frame";
import { Reveal } from "@/components/motion/reveal";
import { SCREENS_NOTE } from "@/lib/content/shared";

// #modelos — job: DIFERENCIAÇÃO / anti-objeção "cara de planilha genérica". v6 (owner,
// 2026-10-29): the app now ships every look, so the section shows the four of the page's
// segment side by side, each with its name and one line. It only informs: no picker, no
// "quero este" — the owner picks in the panel. RSC only — no client island. Each phone is a
// depth card like the other surfaces (a fine pointer tilts it).

/** Below lg the phones are a swipeable row (the next one peeks); from lg, four columns. */
const PHONE_SIZES = "(min-width: 440px) 280px, 64vw";

function ThemeCard({ theme, defaultLabel }: { theme: ShowcaseTheme; defaultLabel: string }) {
  return (
    <li className="reveal-item w-[64vw] max-w-[17.5rem] shrink-0 snap-start lg:w-auto lg:max-w-none">
      <div data-depth-card>
        <div data-depth-stage>
          <div data-depth="2">
            <PhoneFrame screen={theme.screen} sizes={PHONE_SIZES} />
          </div>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <p className="font-display text-title type-display text-ink">{theme.name}</p>
        {theme.isDefault ? <Badge>{defaultLabel}</Badge> : null}
      </div>
      <p className="mt-2 text-body text-ink-muted">{theme.description}</p>
    </li>
  );
}

export function Modelos({ content }: { content: ShowcaseContent }) {
  const { themes } = content;
  return (
    <Section id="modelos" width="content">
      <div className="grid gap-10 md:grid-cols-12 md:gap-8">
        <Reveal className="md:col-span-7">
          <Kicker className="mb-3">{content.kicker}</Kicker>
          <h2 className="max-w-prose font-display text-display-lg type-display text-ink">
            {content.title}
          </h2>
          <p className="mt-4 max-w-prose text-body-lg text-ink-muted">{content.body}</p>
        </Reveal>

        <Reveal group className="md:col-span-5 md:pt-9">
          <ChkList>
            {content.features.map((feature) => (
              <Chk key={feature} className="reveal-item">
                {feature}
              </Chk>
            ))}
          </ChkList>
        </Reveal>
      </div>

      <Reveal className="mt-block max-w-prose">
        <h3 className="font-display text-title type-display text-ink">{themes.title}</h3>
        <p className="mt-3 text-body-lg text-ink-muted">{themes.note}</p>
      </Reveal>

      <Reveal group className="mt-8">
        {/* Bleeds to the screen edge below lg so the row scrolls under the gutter; the vertical
            padding keeps the phone shadows inside the scroller's clip. */}
        <div
          role="region"
          aria-label={themes.title}
          tabIndex={0}
          data-lenis-prevent-horizontal
          className="-mx-gutter -my-6 snap-x snap-mandatory scroll-px-gutter overflow-x-auto overflow-y-hidden px-gutter py-6 [scrollbar-width:none] lg:m-0 lg:overflow-visible lg:p-0 [&::-webkit-scrollbar]:hidden"
        >
          <ul className="flex gap-5 lg:grid lg:grid-cols-4 lg:gap-6">
            {themes.items.map((theme) => (
              <ThemeCard key={theme.name} theme={theme} defaultLabel={themes.defaultLabel} />
            ))}
          </ul>
        </div>
      </Reveal>

      <p className="mt-8 text-center font-mono text-label uppercase leading-normal tracking-label text-ink-subtle">
        {SCREENS_NOTE}
      </p>
    </Section>
  );
}
