/**
 * Constantes do site — FONTE ÚNICA de URL/nome/handles.
 *
 * ⚠️ PÁGINA DE TESTE (piloto). O domínio do Xchair ainda não foi decidido: `url` vem de
 * NEXT_PUBLIC_SITE_URL (canonical, OG, sitemap, robots, JSON-LD). Defina antes de publicar.
 * Trocar aqui propaga para todos os consumidores.
 */
export const SITE = {
  name: "Xchair",
  maker: "Xiax",
  // domain not decided yet (change xiax-lp-v4-xchair): never invent one — set NEXT_PUBLIC_SITE_URL
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  /**
   * Abacate Pay checkout for the Essencial plan (card + CPF). Null until the owner gives the
   * address: the plan's button then opens the sales WhatsApp instead of a dead link.
   */
  checkoutUrl: process.env.NEXT_PUBLIC_CHECKOUT_URL ?? null,
  locale: "pt-BR",
  // Each page's title, description and keyword live in its content (lib/content/<page>.ts · seo).
} as const;
