/**
 * Modelo de dados da TABELA MULTI-PLANO (`#planos` V2) — TIPADO, TS strict.
 * Fonte da verdade: **Brief V2 §5** (rev `872091a9`, [XIA-52]) — 4 tiers por
 * CAPACIDADE, toggle mensal/anual, "mais popular" em destaque.
 *
 * FRONTEIRA DE PAPEL (Front-end Architect): eu entrego o MODELO tipado, pronto
 * pro `ui-engineer` renderizar a tabela — não decido pixel/cor/escala (Design
 * System) nem reescrevo copy de conversão (Message Map). Preço/feature vêm do
 * Brief §5 (CRO/copywriter afinam no build; o shape não muda).
 *
 * GUARDRAILS INEGOCIÁVEIS codificados aqui (Brief §2):
 *  - Planos diferenciam por CAPACIDADE, **barbeiros ILIMITADOS em TODOS os tiers**
 *    (`UNLIMITED_BARBERS` + linha base). Um tier que limite barbeiro mata o
 *    diferencial que derruba o "é caro" — o tipo não permite representar isso.
 *  - Ação primária ÚNICA: todo CTA de plano → **iniciar teste grátis**, NUNCA
 *    checkout. Por isso não existe `checkoutHref` no modelo — só `PLAN_CTA`
 *    (placement "planos", mesmo destino dos demais CTAs primários).
 */
import type { CtaPlacement } from "@/lib/analytics/events";

/** Ciclo de cobrança — o toggle do `#planos`. Anual ≈ "2 meses grátis" (Brief §5). */
export type BillingPeriod = "monthly" | "annual";

/** Invariante de negócio (Brief §2.2): barbeiros ILIMITADOS em todos os tiers. */
export const UNLIMITED_BARBERS = true as const;

/**
 * CTA único de plano — TODOS os tiers apontam pro MESMO destino (teste grátis).
 * `placement: "planos"` casa 1:1 com a união de analytics (events.ts) — o clique
 * é auditável como conversão do ponto de decisão "tabela de planos".
 */
export const PLAN_CTA = {
  label: "Começar teste grátis",
  /** âncora da ação primária → o TrialForm (placement="planos") no fim da seção,
   * id `#planos-form`; leva o clique ao ato de conversão, não ao topo da seção. */
  href: "#planos-form",
  placement: "planos" satisfies CtaPlacement,
} as const;

/** Reforço de risco inline, repetido em cada card (Brief §5 / UX/IA §1). */
export const TRIAL_REASSURANCE = "14 dias grátis · sem cartão · cancele quando quiser";

export interface Plan {
  /** id estável (não é o rótulo — sobrevive a mudança de nome). */
  id: "corte" | "corte-barba" | "premium" | "vip";
  /** nome exibido (Brief §5 — cliente confirma no gate). */
  name: string;
  /** "para quem" — 1 linha de qualificação. */
  tagline: string;
  /** preço MENSAL, em centavos de BRL (inteiro — sem float). */
  priceMonthlyCents: number;
  /** preço equivalente/mês no plano ANUAL, em centavos (~2 meses grátis). */
  priceAnnualPerMonthCents: number;
  /** tier destacado como "mais popular" (composição por token plan-popular). */
  popular: boolean;
  /**
   * `true` → o card exibe "Tudo do <plano anterior>, mais:" antes de `features`
   * (Brief §5: "cada tier soma ao anterior"). `features` lista só o INCREMENTO.
   */
  includesPrevious: boolean;
  /** features INCREMENTAIS deste tier (o base lista o pacote inicial). */
  features: readonly string[];
}

/**
 * Os 4 tiers, na ordem de exibição (Corte → VIP). Preços/features = Brief §5.
 * `as const` → readonly, o `ui-engineer` consome sem poder mutar a fonte.
 */
export const PLANS: readonly Plan[] = [
  {
    id: "corte",
    name: "Corte",
    tagline: "Pra quem quer parar de perder horário agora",
    priceMonthlyCents: 9890,
    priceAnnualPerMonthCents: 8290,
    popular: false,
    includesPrevious: false,
    features: [
      "Agenda online única (todos os barbeiros)",
      "Lembrete automático no WhatsApp 24h antes",
      "Página de agendamento própria",
      "Barbeiros ilimitados",
      "Cancele quando quiser",
    ],
  },
  {
    id: "corte-barba",
    name: "Corte + Barba",
    tagline: "Pra barbearia que quer controle e faturamento",
    priceMonthlyCents: 14990,
    priceAnnualPerMonthCents: 12490,
    popular: true,
    includesPrevious: true,
    features: [
      "Confirmação + lembrete duplo no WhatsApp",
      "Controle de no-show",
      "Relatórios de faturamento e ocupação",
      "Bloqueio de horário",
      "Histórico do cliente",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    tagline: "Pra quem quer receita recorrente e marketing",
    priceMonthlyCents: 22990,
    priceAnnualPerMonthCents: 19190,
    popular: false,
    includesPrevious: true,
    features: [
      "Clube de Assinatura (mensalidade recorrente dos clientes)",
      "Campanhas no WhatsApp",
      "Integração de pagamento",
      "Múltiplas unidades",
    ],
  },
  {
    id: "vip",
    name: "VIP",
    tagline: "Pra rede ou barbearia de marca",
    priceMonthlyCents: 34990,
    priceAnnualPerMonthCents: 29190,
    popular: false, // só o "Corte + Barba" é o "mais popular"
    includesPrevious: true,
    features: [
      "App próprio (white-label)",
      "IA de agenda e atendimento",
      "Gerente de conta + suporte prioritário",
      "Unidades ilimitadas",
    ],
  },
] as const;

/** Menor preço mensal da tabela — usado no JSON-LD (lowPrice) e no copy "a partir de". */
export const PLAN_PRICE_FROM_CENTS = Math.min(...PLANS.map((p) => p.priceMonthlyCents));

/** Preço a exibir para um plano no ciclo escolhido (centavos). */
export function planPriceCents(plan: Plan, period: BillingPeriod): number {
  return period === "annual" ? plan.priceAnnualPerMonthCents : plan.priceMonthlyCents;
}

/**
 * Formata centavos de BRL como "R$ 98,90" (pt-BR). Sem dependência externa —
 * `Intl.NumberFormat` é nativo. O `/mês` é responsabilidade de layout (ui-engineer).
 */
const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});
export function formatBRL(cents: number): string {
  return BRL.format(cents / 100);
}

/** Opções do toggle mensal/anual (rótulo + selo de economia no anual). */
export const BILLING_OPTIONS: readonly { period: BillingPeriod; label: string; note?: string }[] = [
  { period: "monthly", label: "Mensal" },
  { period: "annual", label: "Anual", note: "~2 meses grátis" },
] as const;
