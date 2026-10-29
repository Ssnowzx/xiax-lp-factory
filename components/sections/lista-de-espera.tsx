import type { WaitlistContent } from "@/lib/content/types";

import { Section } from "@/components/ui/section";
import { Kicker } from "@/components/ui/kicker";
import { ScreenCrop } from "@/components/ui/device-frame";
import { WhatsAppBubble } from "@/components/ui/whatsapp-bubble";
import { Reveal } from "@/components/motion/reveal";
import { SCREENS_NOTE } from "@/lib/content/shared";

// #lista-de-espera — job: DIFERENCIAÇÃO (change xiax-lp-v4-xchair · D6). The owner's prompt
// calls the waiting list the strongest differentiator: it fills the chair of whoever cancels
// with no one at the shop typing. Visual = the real "Precisa de atenção hoje" panel (a free
// slot with people waiting) and the real offer message the next in line receives. Steps are
// an <ol> of plain text — the order is the meaning.
export function ListaDeEspera({ content }: { content: WaitlistContent }) {
  return (
    <Section id="lista-de-espera">
      <div className="grid items-center gap-12 md:grid-cols-12 md:gap-8">
        <div className="md:col-span-6">
          <Reveal>
            <Kicker className="mb-3">{content.kicker}</Kicker>
            <h2 className="max-w-prose font-display text-display-lg type-display text-ink">
              {content.title}
            </h2>
            <p className="mt-4 max-w-prose text-body-lg text-ink-muted">{content.body}</p>
          </Reveal>

          <Reveal group>
            <ol className="mt-8 flex flex-col gap-4">
              {content.steps.map((step, i) => (
                <li key={step} className="reveal-item flex items-start gap-4 text-body text-ink">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-accent/60 font-display text-body-lg leading-none text-accent tabular-nums">
                    {i + 1}
                  </span>
                  <span className="pt-1">{step}</span>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>

        <Reveal className="md:col-span-6">
          <div className="flex flex-col">
            <ScreenCrop
              screen={content.screen}
              sizes="(min-width: 768px) 380px, 75vw"
              className="w-[78%] max-w-[24rem]"
            />
            <WhatsAppBubble message={content.message} className="-mt-16 ml-auto w-[78%] max-w-[24rem] sm:-mt-24" />
          </div>
          <p className="mt-4 font-mono text-label uppercase leading-normal tracking-label text-ink-subtle">
            {SCREENS_NOTE}
          </p>
        </Reveal>
      </div>
    </Section>
  );
}
