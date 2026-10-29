"use client";

import * as Accordion from "@radix-ui/react-accordion";

import type { FaqQuestionId } from "@/lib/analytics/events";
import type { FaqContent } from "@/lib/content/types";

import { RichText } from "@/components/landing/rich-text";
import { track } from "@/lib/analytics/track";

// #faq — job: OBJEÇÃO + risk-reversal, colada ao clique final. Radix Accordion
// (ARIA/teclado/roving corretos). Client, mas o texto SSRa no HTML → indexável.
// Header do Radix é <h3> por padrão (hierarquia h2→h3 sem pular nível).
// xiax-lp-v4-xchair: no "cancele quando quiser" line until the owner confirms self-cancel.
// v5 (xiax-lp-v5-salon · D2): the questions are the page's content.

/** Narrows the accordion's value back to a question id of this page. */
const questionOf = (content: FaqContent, value: string): FaqQuestionId | undefined =>
  content.items.find((item) => item.id === value)?.id;

export function Faq({ content }: { content: FaqContent }) {
  return (
    <section id="faq" className="relative overflow-x-clip px-gutter py-section">
      <div className="relative z-[1] mx-auto max-w-content">
        <h2 className="max-w-prose font-display text-display-lg type-display text-ink">
          {content.title}
        </h2>

        <Accordion.Root
          type="single"
          collapsible
          className="mt-block divide-y divide-line border-y border-line"
          onValueChange={(value) => {
            const question = questionOf(content, value);
            if (question) track({ name: "faq_open", question });
          }}
        >
          {content.items.map((item) => (
            <Accordion.Item key={item.id} value={item.id}>
              <Accordion.Header>
                <Accordion.Trigger className="faq-question group flex w-full items-center justify-between gap-4 py-5 text-left font-mono text-body-lg uppercase tracking-label text-ink transition-colors duration-micro ease-standard hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-accent motion-reduce:transition-none">
                  {item.question}
                  <span
                    aria-hidden="true"
                    className="text-accent transition-transform duration-micro ease-standard group-data-[state=open]:rotate-45 motion-reduce:transition-none"
                  >
                    +
                  </span>
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="overflow-hidden pb-5 text-body text-ink-muted data-[state=closed]:animate-none">
                <p className="max-w-prose">
                  <RichText value={item.answer} />
                </p>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </div>
    </section>
  );
}
