import type { CashContent } from "@/lib/content/types";

import { Section } from "@/components/ui/section";
import { Kicker } from "@/components/ui/kicker";
import { ChkList, Chk } from "@/components/ui/chk";
import { BrowserFrame } from "@/components/ui/device-frame";
import { Reveal } from "@/components/motion/reveal";
import { SCREENS_NOTE } from "@/lib/content/shared";

// #caixa — job: AMPLIAR O VALOR (change xiax-lp-v4-xchair · D6): the Xchair also keeps the
// money. Only what the Essencial does today — card fee taken off each service, the month's
// goal and result, CSV for the accountant. The screen is cut to the month chart: the rest of
// the reports screen (team commission, subscription club, occupancy) is not live yet.
export function Caixa({ content }: { content: CashContent }) {
  return (
    <Section id="caixa">
      <div className="grid items-center gap-12 md:grid-cols-12 md:gap-8">
        <div className="md:col-span-5">
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
        </div>

        <Reveal className="md:col-span-7">
          <BrowserFrame screen={content.screen} sizes="(min-width: 1024px) 680px, (min-width: 768px) 56vw, 86vw" />
          <p className="mt-4 text-right font-mono text-label uppercase leading-normal tracking-label text-ink-subtle">
            {SCREENS_NOTE}
          </p>
        </Reveal>
      </div>
    </Section>
  );
}
