/**
 * Instrumentação de conversão — UNIÃO DISCRIMINADA tipada, mapeada 1:1 aos
 * pontos de decisão do Message Map / Brief (dono: nextjs-arquiteto).
 *
 * Regra: ZERO string solta. Um evento que não existe aqui não é auditável.
 * Os 3 pontos de CTA primário (`hero`/`planos`/`final`) + a `.cta-bar` fixa
 * são as ÚNICAS origens de conversão (Message Map: "CTA único e destino único").
 */

/** Onde o CTA primário / TrialForm vive (UX/IA §4: mesma ação nos 3 pontos + barra fixa). */
export type CtaPlacement = "hero" | "planos" | "final" | "sticky";

export type AnalyticsEvent =
  // clique no CTA primário (antes de submeter — mede intenção)
  | { name: "cta_click"; placement: CtaPlacement }
  // submit do teste grátis (ação primária — KPI visitante→trial ≥ 4%)
  | { name: "trial_submit"; placement: CtaPlacement }
  // 200 do Server Action (sucesso da conversão)
  | { name: "trial_success"; placement: CtaPlacement }
  // falha (validação ou rede) — `reason` fechado, sem string livre
  | { name: "trial_error"; placement: CtaPlacement; reason: "validation" | "network" }
  // abertura de uma pergunta do FAQ (sinal de objeção). Message Map V2 §faq:
  // 4 objeções (ordem whatsapp → preço → config → marketplace).
  | { name: "faq_open"; question: "whatsapp" | "preco" | "config" | "marketplace" }
  // Core Web Vitals reais (Vitals island) — mesmo canal, tipado
  | {
      name: "web_vitals";
      metric: "LCP" | "CLS" | "INP" | "FCP" | "TTFB";
      value: number;
      rating: "good" | "needs-improvement" | "poor";
    };

/** Nome do evento (derivado da união — nunca digitado à mão no call site). */
export type AnalyticsEventName = AnalyticsEvent["name"];
