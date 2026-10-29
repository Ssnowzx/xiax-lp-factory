"use client";

import Image from "next/image";

import type { PageId, PlanCardContent, PlansContent, WhatsAppContent } from "@/lib/content/types";

import { RichText } from "@/components/landing/rich-text";
import { cn } from "@/lib/ui/cn";
import { Button } from "@/components/ui/button";
import { IconCheck } from "@/components/ui/icons";
import { Reassurance } from "@/components/ui/reassurance";
import { Reveal } from "@/components/motion/reveal";
import { ctaClick } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";
import { SITE } from "@/lib/site";
import { COMING_SOON_LABEL } from "@/lib/content/shared";
import { PLANS, PLAN_CTA_PLACEMENT, formatBRL, planCta, type Plan } from "@/lib/data/plans";

// #planos — the three plans (change xiax-lp-v4-xchair). Client island only for the click
// tracking; names, prices and features SSR in the HTML and are indexable. Essencial is the one
// plan that can be bought today: it carries the brass ring (data-popular → depth lift) and the
// "Disponível agora" flag. Completo and Signature wear an "Em breve" flag, and their features get
// a hollow marker instead of the brass check, so nothing planned reads as included today.
// v5 (xiax-lp-v5-salon · D10): each card's tagline and functions, the ring and the plan messages
// come from the page's content; names, prices and states stay in lib/data/plans.ts.

type PlanMessages = WhatsAppContent["plan"];

/** The flag over a card: its state, after the page's own label on the featured card (D10). */
function PlanFlag({ plan, label }: { plan: Plan; label?: string }) {
  const available = plan.status === "available";
  const state = available ? "Disponível agora" : COMING_SOON_LABEL;
  return (
    <span
      data-popular-flag={available || undefined}
      className={cn(
        "absolute -top-3 left-6 inline-flex items-center rounded-pill px-3 py-1 font-mono text-label uppercase tracking-label shadow-e2",
        available ? "bg-accent text-accent-ink" : "border border-line-strong bg-surface text-ink",
      )}
    >
      {label ? `${label} · ${state}` : state}
    </span>
  );
}

function PlanPriceBlock({ plan }: { plan: Plan }) {
  return (
    <div data-depth="3" className="mt-5">
      <p>
        {/* reserved row, so every price sits on the same line across cards */}
        <span className="block h-4 font-mono text-label uppercase tracking-label text-ink-subtle">
          {plan.price.from ? "a partir de" : ""}
        </span>
        <span className="mt-1 flex items-end gap-1.5">
          <span data-price className="font-display text-price leading-none tabular-nums text-ink">
            {formatBRL(plan.price.monthlyCents)}
          </span>
          <span className="pb-1 font-mono text-label uppercase tracking-label text-ink-subtle">/mês</span>
        </span>
      </p>
      <ul className="mt-2 min-h-[3.24em] text-body text-ink-subtle">
        {plan.price.notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </div>
  );
}

function PlanFeatures({ plan, card, prevName }: { plan: Plan; card: PlanCardContent; prevName?: string }) {
  const available = plan.status === "available";
  return (
    <ul className="mt-5 flex flex-1 flex-col gap-2.5">
      {plan.includesPrevious && prevName && (
        <li className="text-body font-medium text-ink">Tudo do {prevName}, mais:</li>
      )}
      {card.features.map((feature, i) => (
        <li key={i} className="flex items-start gap-2.5 text-body text-ink-muted">
          {available ? (
            <IconCheck className="mt-[0.15em] size-[1.15em] text-accent" />
          ) : (
            <span aria-hidden="true" className="mt-[0.55em] size-2 shrink-0 rounded-full border border-ink-subtle" />
          )}
          <span>
            <RichText value={feature} />
          </span>
        </li>
      ))}
    </ul>
  );
}

function PlanAction({ plan, page, messages }: { plan: Plan; page: PageId; messages: PlanMessages }) {
  const cta = planCta(plan, SITE.checkoutUrl, messages);
  const available = plan.status === "available";
  return (
    <div className="mt-7">
      <Button
        asChild
        variant={available ? "accent" : "outline"}
        size="md"
        className="h-auto min-h-11 w-full py-3 text-center leading-snug"
      >
        <a
          href={cta.href}
          {...(cta.external && { target: "_blank", rel: "noopener noreferrer" })}
          onClick={() => track(ctaClick(page, PLAN_CTA_PLACEMENT))}
        >
          {cta.label} <span aria-hidden="true">▸</span>
        </a>
      </Button>
      {available && <Reassurance centered className="mt-3" />}
    </div>
  );
}

interface PlanCardProps {
  plan: Plan;
  card: PlanCardContent;
  featured: boolean;
  /** The page's label for its featured card ("O plano do salão"); none on the others. */
  flagLabel?: string;
  page: PageId;
  messages: PlanMessages;
  prevName?: string;
}

/** One plan card. `data-plan`/`data-popular` are stable targets for the motion and QA. */
// v3 depth card: the <article> keeps the reveal (outer transform owner); the stage carries
// the visual card and the tilt. Price and brass icon float on the top layer.
function PlanCard({ plan, card, featured, flagLabel, page, messages, prevName }: PlanCardProps) {
  return (
    <article
      data-plan={plan.id}
      data-popular={featured || undefined}
      data-depth-card
      // lift of the featured card via margin (NOT translate: the reveal seat resets transform)
      className={cn("reveal-item relative flex flex-col", featured && "lg:-mt-4")}
    >
      <div
        data-depth-stage
        className={cn(
          "flex flex-1 flex-col rounded-window border p-6",
          featured
            ? // brass tint painted over an opaque base: the v3 leather must not show through
              "border-accent/50 bg-base bg-[linear-gradient(rgb(var(--accent)/0.06),rgb(var(--accent)/0.06))] shadow-plan-popular ring-1 ring-accent"
            : "border-line bg-surface-raised shadow-e2",
        )}
      >
        <PlanFlag plan={plan} label={flagLabel} />

        <div data-depth-pass className="flex items-start justify-between gap-3">
          <h3 className="font-display text-title type-display text-ink">{plan.name}</h3>
          <Image data-depth="3" src={card.icon ?? plan.icon} alt="" width={56} height={56} className="-mt-1 size-14 shrink-0" />
        </div>
        <p className="mt-1 min-h-[3.24em] text-body text-ink-muted">{card.tagline}</p>

        <PlanPriceBlock plan={plan} />
        <PlanFeatures plan={plan} card={card} prevName={prevName} />
        <PlanAction plan={plan} page={page} messages={messages} />

        <span data-depth-sheen aria-hidden="true">
          <span />
        </span>
      </div>
    </article>
  );
}

export function PlanosTable({ content, page, messages }: { content: PlansContent; page: PageId; messages: PlanMessages }) {
  return (
    <Reveal group className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:items-start">
      {PLANS.map((plan, i) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          card={content.cards[plan.id]}
          featured={plan.id === content.featured}
          flagLabel={plan.id === content.featured ? content.featuredLabel : undefined}
          page={page}
          messages={messages}
          prevName={plan.includesPrevious ? PLANS[i - 1]?.name : undefined}
        />
      ))}
    </Reveal>
  );
}
