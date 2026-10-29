import type { PageId, PlansContent, WhatsAppContent } from "@/lib/content/types";

import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/motion/reveal";
import { PlanosTable } from "@/components/sections/planos-table";

// #planos — job: OFERTA (change xiax-lp-v4-xchair). RSC header + the plan cards (SSR, indexable).
// Three plans with the same look: Essencial is live and the only one that can be bought (its
// card carries the purchase reassurance); Completo and Signature are "em breve". Every button
// that is not the checkout opens the sales WhatsApp with a message that names the plan.

export function Planos({ content, page, messages }: { content: PlansContent; page: PageId; messages: WhatsAppContent["plan"] }) {
  return (
    <Section id="planos" width="content">
      <Reveal className="mx-auto mb-block max-w-prose text-center">
        <h2 className="font-display text-display-lg type-display text-ink">
          {content.title}
        </h2>
        <p className="mt-4 text-body-lg text-ink-muted">{content.body}</p>
      </Reveal>

      <PlanosTable content={content} page={page} messages={messages} />
    </Section>
  );
}
