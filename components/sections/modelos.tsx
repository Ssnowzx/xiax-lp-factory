import type { ShowcaseContent } from "@/lib/content/types";

import { Section } from "@/components/ui/section";
import { Kicker } from "@/components/ui/kicker";
import { Badge } from "@/components/ui/badge";
import { ChkList, Chk } from "@/components/ui/chk";
import { PhoneFrame } from "@/components/ui/device-frame";
import { Reveal } from "@/components/motion/reveal";
import { SCREENS_NOTE } from "@/lib/content/shared";

// #modelos — job: DIFERENCIAÇÃO / anti-objeção "cara de planilha genérica". v4
// (xiax-lp-v4-xchair · D5): the picker of four styles and five colours sold what the Xchair
// does not have. The section now shows the REAL page in its one style (Navalha) in a phone,
// with what it carries and an honest "mais estilos em breve". RSC only — no client island.
// The phone is a depth card like the other surfaces (a fine pointer tilts it).
export function Modelos({ content }: { content: ShowcaseContent }) {
  return (
    <Section id="modelos" width="content">
      <div className="grid items-center gap-12 md:grid-cols-12 md:gap-8">
        <div className="md:col-span-7 lg:col-span-6">
          <Reveal>
            <Kicker className="mb-3">{content.kicker}</Kicker>
            <h2 className="max-w-prose font-display text-display-lg type-display text-ink">
              {content.title}
            </h2>
            <p className="mt-4 max-w-prose text-body-lg text-ink-muted">{content.body}</p>
          </Reveal>

          <Reveal group>
            <ChkList className="mt-8">
              {content.features.map((feature) => (
                <Chk key={feature} className="reveal-item">
                  {feature}
                </Chk>
              ))}
            </ChkList>
          </Reveal>

          <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2">
            <Badge>{content.style.name}</Badge>
            <span className="text-body text-ink-muted">{content.style.description}</span>
            <Badge tone="line">{content.style.soon}</Badge>
          </div>
        </div>

        <Reveal className="mx-auto w-full max-w-[18rem] md:col-span-5 md:max-w-[20rem] lg:col-span-6">
          <div data-depth-card>
            <div data-depth-stage>
              <div data-depth="2">
                <PhoneFrame
                  screen={content.screen}
                  sizes="(min-width: 768px) 320px, 288px"
                />
              </div>
            </div>
          </div>
          <p className="mt-4 text-center font-mono text-label uppercase leading-normal tracking-label text-ink-subtle">
            {SCREENS_NOTE}
          </p>
        </Reveal>
      </div>
    </Section>
  );
}
