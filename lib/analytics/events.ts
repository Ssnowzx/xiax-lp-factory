/**
 * Instrumentação de conversão — UNIÃO DISCRIMINADA tipada, mapeada 1:1 aos
 * pontos de decisão do Message Map / Brief (dono: nextjs-arquiteto).
 *
 * Regra: ZERO string solta. Um evento que não existe aqui não é auditável.
 * Os 3 pontos de CTA primário (`hero`/`planos`/`final`) + a `.cta-bar` fixa
 * são as ÚNICAS origens de conversão (Message Map: "CTA único e destino único").
 */
import type { PageId } from "@/lib/content/types";

/** Onde o CTA primário vive (UX/IA §4: mesma ação nos 3 pontos + barra fixa). */
export type CtaPlacement = "hero" | "planos" | "final" | "sticky";

/** FAQ questions, by stable id (Message Map V2 §faq: whatsapp → preço → config → marketplace → celular). */
export type FaqQuestionId = "equipe" | "pausa" | "servicos" | "whatsapp" | "preco" | "config" | "marketplace" | "celular";

export type AnalyticsEvent =
  // clique no CTA primário — abre o WhatsApp de vendas (ou o checkout do Essencial, quando
  // existir). A conversa acontece fora da página, então o clique é a conversão que dá para medir.
  // v5 (xiax-lp-v5-salon · D9): `page` tells the barbershop's clicks from the salon's.
  | { name: "cta_click"; page: PageId; placement: CtaPlacement }
  // abertura de uma pergunta do FAQ (sinal de objeção). Message Map V2 §faq:
  // 5 objeções (ordem whatsapp → preço → config → marketplace → celular).
  | { name: "faq_open"; question: FaqQuestionId }
  // Core Web Vitals reais (Vitals island) — mesmo canal, tipado
  | {
      name: "web_vitals";
      metric: "LCP" | "CLS" | "INP" | "FCP" | "TTFB";
      value: number;
      rating: "good" | "needs-improvement" | "poor";
    };

/** Nome do evento (derivado da união — nunca digitado à mão no call site). */
export type AnalyticsEventName = AnalyticsEvent["name"];

/**
 * The click on a call to action, tagged with the page it happened on.
 * @param page - the landing page (`content.page`)
 * @param placement - where the CTA sits on that page
 * @returns the event for `track()`
 */
export function ctaClick(page: PageId, placement: CtaPlacement): AnalyticsEvent {
  return { name: "cta_click", page, placement };
}
