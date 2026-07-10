"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { cn } from "@/lib/ui/cn";
import { DUR, EASE_GSAP } from "@/lib/motion/motion-tokens";
import { Button } from "@/components/ui/button";
import { IconCheck } from "@/components/ui/icons";
import { Reveal } from "@/components/motion/reveal";
import { track } from "@/lib/analytics/track";
import {
  PLANS,
  BILLING_OPTIONS,
  PLAN_CTA,
  TRIAL_REASSURANCE,
  UNLIMITED_BARBERS,
  planPriceCents,
  formatBRL,
  type BillingPeriod,
  type Plan,
} from "@/lib/data/plans";

// #planos — TABELA MULTI-PLANO (Brief V2 §5 · Message Map V2). Ilha CLIENT: só o
// toggle mensal/anual precisa de estado; o conteúdo (nomes/preços/features) SSRa no
// HTML e é indexável. 4 tiers por CAPACIDADE, "mais popular" destacado por COMPOSIÇÃO
// de tokens (window + anel latão + e4 + tint), check dourado (brass), preços tabular-nums.
//
// GUARDRAILS honrados: barbeiros ILIMITADOS visíveis em TODOS os tiers (chip fixo);
// TODO CTA de plano → teste grátis (PLAN_CTA.href → #planos-form), NUNCA checkout.

/**
 * Toggle de cobrança — segmented control BESPOKE com semântica de RADIOGROUP
 * (WAI-ARIA): roving tabindex + setas/Home/End. Um só selecionado; teclado completo.
 * Aparência 100% do DS (pill, tint latão no ativo), zero look default.
 */
function BillingToggle({
  value,
  onChange,
}: {
  value: BillingPeriod;
  onChange: (p: BillingPeriod) => void;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function focusAt(i: number) {
    const n = BILLING_OPTIONS.length;
    const idx = ((i % n) + n) % n;
    const opt = BILLING_OPTIONS[idx];
    onChange(opt.period);
    refs.current[idx]?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent, i: number) {
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        focusAt(i + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        focusAt(i - 1);
        break;
      case "Home":
        e.preventDefault();
        focusAt(0);
        break;
      case "End":
        e.preventDefault();
        focusAt(BILLING_OPTIONS.length - 1);
        break;
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label="Ciclo de cobrança"
      className="inline-flex items-center gap-1 rounded-pill border border-line bg-surface p-1"
    >
      {BILLING_OPTIONS.map((opt, i) => {
        const selected = opt.period === value;
        return (
          <button
            key={opt.period}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(opt.period)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "inline-flex items-center gap-2 rounded-pill px-4 py-2 font-mono text-label uppercase tracking-label",
              "transition-[color,background-color] duration-micro ease-standard motion-reduce:transition-none",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-accent",
              selected
                ? "bg-accent text-accent-ink shadow-e1"
                : "text-ink-muted hover:text-ink active:translate-y-px",
            )}
          >
            {opt.label}
            {opt.note && (
              <span
                className={cn(
                  "rounded-pill px-1.5 py-0.5",
                  selected ? "bg-accent-ink/15 text-accent-ink" : "text-accent",
                )}
              >
                {opt.note}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Um card de plano. `data-popular`/`data-plan` = alvos estáveis pro motion-engineer. */
function PlanCard({ plan, prevName, period }: { plan: Plan; prevName?: string; period: BillingPeriod }) {
  const price = formatBRL(planPriceCents(plan, period));
  return (
    <article
      data-plan={plan.id}
      data-popular={plan.popular || undefined}
      className={cn(
        "reveal-item relative flex flex-col rounded-window border p-6",
        // lift do "mais popular" via margin (NÃO translate: o seat de reveal reseta
        // transform:none ao revelar e cancelaria um translate). data-popular pro motion.
        plan.popular
          ? "border-accent/50 bg-accent/[0.06] shadow-plan-popular ring-1 ring-accent xl:-mt-4"
          : "border-line bg-surface-raised shadow-e2",
      )}
    >
      {plan.popular && (
        <span
          data-popular-flag
          className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-pill bg-accent px-3 py-1 font-mono text-label uppercase tracking-label text-accent-ink shadow-e2"
        >
          <span aria-hidden="true">★</span> Mais popular
        </span>
      )}

      <h3 className="font-display text-title uppercase tracking-display-upper text-ink">
        {plan.name}
      </h3>
      <p className="mt-1 min-h-[2.4em] text-body text-ink-muted">{plan.tagline}</p>

      {/* preço dominante — tabular-nums pra alinhar dígitos entre ciclos */}
      <p className="mt-5 flex items-end gap-1.5">
        <span
          data-price
          className="font-display text-price leading-none tabular-nums text-ink"
        >
          {price}
        </span>
        <span className="pb-1 font-mono text-label uppercase tracking-label text-ink-subtle">
          /mês
        </span>
      </p>
      <p className="mt-1.5 h-[1.2em] text-body text-ink-subtle">
        {period === "annual" ? "no plano anual · 2 meses grátis" : ""}
      </p>

      {/* guardrail visível em TODOS os tiers: barbeiros ilimitados */}
      {UNLIMITED_BARBERS && (
        <p className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-pill bg-accent-quiet/15 px-3 py-1 font-mono text-label uppercase tracking-label text-accent">
          Barbeiros ilimitados
        </p>
      )}

      <ul className="mt-5 flex flex-1 flex-col gap-2.5">
        {plan.includesPrevious && prevName && (
          <li className="text-body font-medium text-ink">Tudo do {prevName}, mais:</li>
        )}
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-body text-ink-muted">
            <IconCheck className="mt-[0.15em] size-[1.15em] text-accent" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-7">
        <Button
          asChild
          variant={plan.popular ? "accent" : "outline"}
          size="md"
          className="w-full"
        >
          <a
            href={PLAN_CTA.href}
            onClick={() => track({ name: "cta_click", placement: PLAN_CTA.placement })}
          >
            {PLAN_CTA.label} <span aria-hidden="true">▸</span>
          </a>
        </Button>
        <p className="mt-3 text-center font-mono text-label uppercase tracking-label text-ink-subtle">
          {TRIAL_REASSURANCE}
        </p>
      </div>
    </article>
  );
}

export function PlanosTable() {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const gridRef = useRef<HTMLDivElement>(null);
  const firstRun = useRef(true);

  // D2 — cross-fade micro do preço ao trocar mensal/anual. O React já re-renderiza o
  // NOVO valor antes deste efeito; animar autoAlpha 0→1 lê como troca suave (não corte).
  // Só `opacity`, DUR.micro, num timeline (gate 4). Reduced/`?reduced=1` = troca instantânea.
  useEffect(() => {
    // pula a montagem inicial: cross-fade só faz sentido numa TROCA de ciclo.
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const grid = gridRef.current;
    if (!grid) return;

    const forceReduced =
      new URLSearchParams(window.location.search).get("reduced") === "1";
    const reduced =
      forceReduced ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return; // conteúdo já correto (troca instantânea), sem movimento.

    const prices = grid.querySelectorAll<HTMLElement>("[data-price]");
    if (!prices.length) return;

    const tl = gsap.timeline();
    tl.fromTo(
      prices,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: DUR.micro, ease: EASE_GSAP.standard },
    );
    return () => {
      tl.kill();
      gsap.set(prices, { clearProps: "opacity,visibility" });
    };
  }, [period]);

  return (
    <div ref={gridRef}>
      <div className="mb-block flex justify-center">
        <BillingToggle value={period} onChange={setPeriod} />
      </div>

      <Reveal
        group
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4 xl:items-start"
      >
        {PLANS.map((plan, i) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            prevName={plan.includesPrevious ? PLANS[i - 1]?.name : undefined}
            period={period}
          />
        ))}
      </Reveal>
    </div>
  );
}
