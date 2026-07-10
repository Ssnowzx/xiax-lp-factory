import { SITE } from "@/lib/site";
import { PLANS, PLAN_PRICE_FROM_CENTS } from "@/lib/data/plans";

/**
 * JSON-LD tipado (SoftwareApplication) — Brief/UX/IA §8 exigem dados estruturados.
 * Renderizado a partir de RSC com `<` escapado (script.ts abaixo). Sem client.
 *
 * Preços: V2 é MULTI-PLANO (Brief §5) — `AggregateOffer` com `lowPrice` = menor
 * mensalidade REAL (a partir de R$98,90) e `offerCount` = nº de tiers. A fonte é
 * `lib/data/plans.ts` (mesma da tabela) → SEO e UI nunca divergem de preço.
 * `aggregateRating` é OMITIDO de propósito — não há avaliações reais no piloto
 * (regra do Brief: prova social é placeholder, não inventar).
 */
export function softwareApplicationLd() {
  const lowPrice = (PLAN_PRICE_FROM_CENTS / 100).toFixed(2);
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE.name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: SITE.description,
    url: SITE.url,
    inLanguage: SITE.locale,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "BRL",
      lowPrice, // menor mensalidade real (a partir de) — fonte: PLANS
      offerCount: PLANS.length,
      // teste grátis de 14 dias, sem cartão, barbeiros ilimitados (Brief §5)
      description:
        "Planos a partir de R$98,90/mês com barbeiros ilimitados. Teste grátis de 14 dias, sem cartão.",
    },
    audience: {
      "@type": "Audience",
      audienceType: "Donos de barbearia",
    },
  } as const;
}

/**
 * Serializa JSON-LD para injeção em <script type="application/ld+json">,
 * escapando `<` para impedir quebra de contexto / injeção. NUNCA usar sem isto.
 */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
