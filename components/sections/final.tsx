import type { FinalContent, NextStepContent, PageId } from "@/lib/content/types";
import type { Plan } from "@/lib/data/plans";

import { RichText } from "@/components/landing/rich-text";
import { Reveal } from "@/components/motion/reveal";
import { Kicker } from "@/components/ui/kicker";
import { Section } from "@/components/ui/section";
import { WhatsAppCta } from "@/components/ui/whatsapp-cta";
import { WHATSAPP_CTA_NOTE } from "@/lib/content/shared";
import { PLANS, formatBRL } from "@/lib/data/plans";

// #final — job: CTA (close). Owner, 2026-10-28: "melhore" this block and drop the e-mail — the
// action goes straight to WhatsApp. The promise still closes as a poster ("com menos falta" in
// brass, the #hero's loop), now on a panel with the one action, what the tap does, and the
// three steps after it; the first step shows the very message the chat opens with, so nothing
// about the tap is a surprise. No media: the steps are the picture.

const AVAILABLE_PLAN = PLANS.find((plan) => plan.status === "available");

function SentMessage({ text }: { text: string }) {
  return (
    <p className="mt-3 w-fit max-w-full rounded-field rounded-tr-none border border-accent/30 bg-accent/10 px-3 py-2 text-[0.8125rem] leading-snug text-ink">
      <span className="sr-only">Mensagem pronta: </span>
      {text}
    </p>
  );
}

function NextStepItem({ step, n }: { step: NextStepContent; n: number }) {
  return (
    <li className="reveal-item relative flex gap-4">
      <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full border border-accent/60 bg-surface-raised font-display text-title leading-none text-accent shadow-e2 tabular-nums">
        {n}
      </span>
      <div className="min-w-0 pt-1.5">
        <h3 className="text-body-lg font-medium text-ink">{step.title}</h3>
        <p className="mt-1 text-body text-ink-muted">{step.body}</p>
        {step.sent && <SentMessage text={step.sent} />}
      </div>
    </li>
  );
}

function PriceLine({ plan }: { plan: Plan }) {
  return (
    <p className="mt-7 border-t border-line pt-4 text-body text-ink-muted">
      <span className="font-medium text-ink">{plan.name}</span> · {formatBRL(plan.price.monthlyCents)}/mês ·{" "}
      {plan.price.notes.join(" · ")}
    </p>
  );
}

function NextSteps({ steps, className }: { steps: readonly NextStepContent[]; className?: string }) {
  return (
    <div className={className}>
      <Kicker>O que acontece depois</Kicker>
      <Reveal group>
        <ol className="relative mt-5 flex flex-col gap-6">
          <span
            aria-hidden="true"
            className="absolute bottom-5 left-5 top-5 w-px bg-gradient-to-b from-accent/60 via-accent/25 to-transparent"
          />
          {steps.map((step, i) => (
            <NextStepItem key={step.title} step={step} n={i + 1} />
          ))}
        </ol>
      </Reveal>
      {AVAILABLE_PLAN && <PriceLine plan={AVAILABLE_PLAN} />}
    </div>
  );
}

export function Final({ content, page, greeting }: { content: FinalContent; page: PageId; greeting: string }) {
  return (
    <Section id="final" width="content">
      <div className="relative overflow-hidden rounded-window border border-accent/35 bg-base shadow-e3">
        {/* Brass glow behind the action: a token tint, no image. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-32 -top-32 size-[34rem] rounded-full bg-[radial-gradient(closest-side,rgb(var(--accent)/0.13),transparent)]"
        />
        <div className="relative grid gap-12 p-6 sm:p-10 lg:grid-cols-12 lg:items-center lg:gap-14 lg:p-14">
          <div className="lg:col-span-7">
            <Kicker>{content.kicker}</Kicker>
            <Reveal>
              <h2 className="mt-4 text-balance font-display text-display-lg type-display text-ink">
                <RichText value={content.title} />
              </h2>
            </Reveal>
            <p className="mt-5 max-w-prose text-body-lg text-ink-muted">{content.body}</p>
            {/* The note sits under its own button; the plans link is the quiet way out. */}
            <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-7">
              <div className="flex flex-col gap-3">
                <WhatsAppCta page={page} placement="final" message={greeting} size="lg" className="w-full sm:w-auto" />
                <p className="text-pretty text-center text-body text-ink-subtle sm:text-left">{WHATSAPP_CTA_NOTE}</p>
              </div>
              <a
                href="#planos"
                className="text-center font-mono text-label uppercase tracking-label text-ink-muted underline-offset-4 transition-colors duration-micro hover:text-ink hover:underline sm:mt-[1.15rem] sm:text-left"
              >
                Ver planos e preços <span aria-hidden="true">▸</span>
              </a>
            </div>
          </div>
          <NextSteps steps={content.nextSteps} className="lg:col-span-5" />
        </div>
      </div>
    </Section>
  );
}
