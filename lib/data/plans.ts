/**
 * Plans of `#planos` (change xiax-lp-v4-xchair) — the single source of names, prices and states.
 * What each card says (tagline, functions) is the page's copy, in lib/content/<page>.ts
 * (change xiax-lp-v5-salon · D10). Three products with the same look:
 *  - Essencial: the way in, already live — the ONLY plan that can be bought;
 *  - Completo: runs the whole business, being built ("em breve");
 *  - Signature: the high ticket that works for revenue, still to come ("em breve", sob consulta).
 *
 * Golden rule (owner's prompt): the page only promises what the system already does. Features of
 * the coming-soon plans are shown under their "Em breve" badge, never as included today.
 *
 * Prices are a hypothesis the owner is still validating with barbershop owners [CONFIRMAR].
 * Annual billing exists only for Essencial, so there is no monthly/annual toggle.
 */
import type { CtaPlacement } from "@/lib/analytics/events";
import type { WhatsAppContent } from "@/lib/content/types";

import { salesLink } from "@/lib/contact/whatsapp";

export type PlanId = "essencial" | "completo" | "signature";

/** `available` can be bought today; `soon` is planned and shown under "Em breve". */
export type PlanStatus = "available" | "soon";

export interface PlanPrice {
  /** headline monthly price, in BRL cents (integer — no float) */
  monthlyCents: number;
  /** shows "a partir de" before the amount (Signature) */
  from: boolean;
  /** short lines under the price: annual price, team-size tiers, unit, "sob consulta" */
  notes: readonly string[];
}

export interface Plan {
  /** stable id (not the label — survives a rename) */
  id: PlanId;
  name: string;
  status: PlanStatus;
  price: PlanPrice;
  /**
   * `true` → the card says "Tudo do <previous plan>, mais:" before its functions, which then list
   * only what this plan adds.
   */
  includesPrevious: boolean;
  /** Decorative brass object for the plan (v3 depth cards), served from /public. */
  icon: string;
}

/** Analytics placement of every plan button (matches the union in lib/analytics/events.ts). */
export const PLAN_CTA_PLACEMENT = "planos" satisfies CtaPlacement;

const BRL_WHOLE = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
const BRL_CENTS = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

/**
 * Formats BRL cents for the page: "R$ 99" for a whole amount, "R$ 98,90" otherwise. The "/mês"
 * belongs to the layout.
 * @param cents - amount in BRL cents
 * @returns the pt-BR currency text
 */
export function formatBRL(cents: number): string {
  return cents % 100 === 0 ? BRL_WHOLE.format(cents / 100) : BRL_CENTS.format(cents / 100);
}

const ESSENCIAL: Plan = {
  id: "essencial",
  icon: "/icons/plans/essencial.webp",
  name: "Essencial",
  status: "available",
  price: {
    monthlyCents: 9900,
    from: false,
    notes: ["1 profissional", `${formatBRL(7900)}/mês no plano anual`],
  },
  includesPrevious: false,
};

const COMPLETO: Plan = {
  id: "completo",
  icon: "/icons/plans/completo.webp",
  name: "Completo",
  status: "soon",
  price: {
    monthlyCents: 22900,
    from: false,
    notes: ["até 5 profissionais", `${formatBRL(32900)}/mês de 6 a 10`],
  },
  includesPrevious: true,
};

const SIGNATURE: Plan = {
  id: "signature",
  icon: "/icons/plans/signature.webp",
  name: "Signature",
  status: "soon",
  price: {
    monthlyCents: 99000,
    from: true,
    notes: ["por unidade", "sob consulta"],
  },
  includesPrevious: true,
};

/** The three plans, in display order. */
export const PLANS: readonly Plan[] = [ESSENCIAL, COMPLETO, SIGNATURE];

export interface PlanCta {
  label: string;
  href: string;
  /** `true` → leaves the page (the checkout or the sales WhatsApp) */
  external: boolean;
}

/** The page's plan message with the plan's name in place of `{plan}`. */
const planMessage = (template: string, plan: Plan) => template.split("{plan}").join(plan.name);

/**
 * The plan's button. Only an available plan can go to the checkout, and only once its address
 * exists; until then, and for the plans still being built, it opens the sales WhatsApp with the
 * page's message for that plan.
 * @param plan - the plan of the card
 * @param checkoutUrl - the Abacate Pay checkout address (`SITE.checkoutUrl`), or null
 * @param messages - the page's plan messages (`content.whatsapp.plan`), `{plan}` = the name
 * @returns the button's label and destination
 */
export function planCta(plan: Plan, checkoutUrl: string | null, messages: WhatsAppContent["plan"]): PlanCta {
  if (plan.status === "available") {
    return checkoutUrl
      ? { label: `Assinar o ${plan.name}`, href: checkoutUrl, external: true }
      : { label: `Quero conhecer o ${plan.name}`, href: salesLink(planMessage(messages.available, plan)), external: true };
  }
  if (plan.price.notes.includes("sob consulta")) {
    return { label: `Consultar o ${plan.name}`, href: salesLink(planMessage(messages.consult, plan)), external: true };
  }
  return { label: "Quero ser avisado", href: salesLink(planMessage(messages.notify, plan)), external: true };
}

/**
 * [CONFIRMAR] "Cancele quando quiser, sem multa" stays off until the owner confirms a barbershop
 * can cancel by itself. Switch to `true` to show it everywhere the reassurance appears.
 */
export const SHOW_CANCEL_ANYTIME = false;

/**
 * The honest reassurance next to the buy actions: the shop's page is ready as soon as the card
 * payment is confirmed (there is no free trial).
 * @param showCancelAnytime - whether the owner confirmed the cancel-anytime promise
 * @returns the phrases, in display order
 */
export function purchaseReassurance(showCancelAnytime: boolean): readonly string[] {
  const ready = "Sua página fica pronta assim que o pagamento é confirmado";
  return showCancelAnytime ? [ready, "Cancele quando quiser, sem multa"] : [ready];
}

/** Phrases rendered by components/ui/reassurance.tsx. */
export const PURCHASE_REASSURANCE = purchaseReassurance(SHOW_CANCEL_ANYTIME);

/**
 * The lowest monthly price among the plans that can be bought today.
 * @param plans - the plans to look at
 * @returns the price in cents, or null when none can be bought
 */
export function lowestAvailablePriceCents(plans: readonly Plan[]): number | null {
  const prices = plans.filter((p) => p.status === "available").map((p) => p.price.monthlyCents);
  return prices.length ? Math.min(...prices) : null;
}

/** Lowest price that can be bought today — JSON-LD `lowPrice` and any "a partir de" copy. */
export const PLAN_PRICE_FROM_CENTS = lowestAvailablePriceCents(PLANS) ?? ESSENCIAL.price.monthlyCents;

/** Plans that can be bought today (JSON-LD offers should count only these). */
export const AVAILABLE_PLANS: readonly Plan[] = PLANS.filter((p) => p.status === "available");
