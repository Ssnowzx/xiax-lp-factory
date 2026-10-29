import type { SeoContent } from "@/lib/content/types";

import { SITE } from "@/lib/site";
import { AVAILABLE_PLANS, PLAN_PRICE_FROM_CENTS } from "@/lib/data/plans";
import { pageUrl } from "@/lib/seo/page-metadata";

/**
 * JSON-LD tipado (SoftwareApplication) — Brief/UX/IA §8 exigem dados estruturados.
 * Renderizado a partir de RSC com `<` escapado (script.ts abaixo). Sem client.
 *
 * Preços (change xiax-lp-v4-xchair): `AggregateOffer` counts ONLY the plans that can be
 * bought today (`AVAILABLE_PLANS`); plans marked "em breve" never become offers. `lowPrice`
 * comes from `lib/data/plans.ts`, the same source as the table → SEO and UI never diverge.
 * `aggregateRating` is omitted on purpose: there are no real reviews yet (nothing invented).
 * v5 (xiax-lp-v5-salon · D8): description, audience and address come from the page's content.
 * @param seo - the page's SEO block
 * @returns the SoftwareApplication object for the page's JSON-LD
 */
export function softwareApplicationLd(seo: SeoContent) {
  const lowPrice = (PLAN_PRICE_FROM_CENTS / 100).toFixed(2);
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE.name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: seo.description,
    url: pageUrl(seo.path),
    inLanguage: SITE.locale,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "BRL",
      lowPrice, // lowest price that can be bought today — source: lib/data/plans.ts
      offerCount: AVAILABLE_PLANS.length,
      // the real checkout: card subscription (Abacate Pay); no free trial exists
      description: "Assinatura no cartão, mensal ou anual.",
    },
    audience: {
      "@type": "Audience",
      audienceType: seo.audience,
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
