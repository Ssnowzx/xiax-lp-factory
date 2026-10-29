import type { Metadata } from "next";

import type { SeoContent } from "@/lib/content/types";

import { SITE } from "@/lib/site";

/**
 * The public address of a landing page: the bare site address for the home page, the address
 * plus the path for any other page (no trailing slash either way).
 * @param path - the page's route ("/" or "/salao")
 * @returns the absolute address
 */
export function pageUrl(path: SeoContent["path"]): string {
  return path === "/" ? SITE.url : `${SITE.url}${path}`;
}

/**
 * The `metadata` of a landing page's root layout, from its content (change xiax-lp-v5-salon ·
 * D8): title, description and keywords, the canonical path and the social cards. The home page is
 * shared at the bare site address; any other page at the address plus its path.
 * @param seo - the page's SEO block (`content.seo`)
 * @returns the Next.js metadata for the layout
 */
export function pageMetadata(seo: SeoContent): Metadata {
  const url = pageUrl(seo.path);
  return {
    metadataBase: new URL(SITE.url),
    title: seo.title,
    description: seo.description,
    keywords: [...seo.keywords],
    alternates: { canonical: seo.path },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      url,
      siteName: SITE.name,
      title: seo.title,
      description: seo.description,
    },
    twitter: { card: "summary_large_image", title: seo.title, description: seo.description },
    robots: { index: true, follow: true },
  };
}
