/**
 * Constantes do site — FONTE ÚNICA de URL/nome/handles.
 *
 * ⚠️ PÁGINA DE TESTE (piloto). O domínio do Xchair ainda não foi decidido: `url` vem de
 * NEXT_PUBLIC_SITE_URL (canonical, OG, sitemap, robots, JSON-LD). Defina antes de publicar.
 * Trocar aqui propaga para todos os consumidores.
 */

/**
 * The site's public address: NEXT_PUBLIC_SITE_URL when set; otherwise, on Vercel, the project's
 * production address (so share previews and canonicals never point at localhost there).
 * @param env - The environment to read (process.env in the app)
 * @returns The absolute address, without a trailing slash
 */
export function resolveSiteUrl(env: Record<string, string | undefined>): string {
  if (env.NEXT_PUBLIC_SITE_URL) return env.NEXT_PUBLIC_SITE_URL;
  if (env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

export const SITE = {
  name: "Xchair",
  maker: "Xiax",
  // domain not decided yet (change xiax-lp-v4-xchair): never invent one — set NEXT_PUBLIC_SITE_URL
  // read member by member: Next inlines NEXT_PUBLIC_* only when written out in full
  url: resolveSiteUrl({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
  }),
  /**
   * Abacate Pay checkout for the Essencial plan (card + CPF). Null until the owner gives the
   * address: the plan's button then opens the sales WhatsApp instead of a dead link.
   */
  checkoutUrl: process.env.NEXT_PUBLIC_CHECKOUT_URL ?? null,
  locale: "pt-BR",
  // Each page's title, description and keyword live in its content (lib/content/<page>.ts · seo).
} as const;
