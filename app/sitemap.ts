import type { MetadataRoute } from "next";

import type { SeoContent } from "@/lib/content/types";

import { pageUrl } from "@/lib/seo/page-metadata";

// sitemap nativo do App Router (Brief: sitemap on-page). One entry per landing page (change
// xiax-lp-v5-salon · D1): the barbershop at the root and the salon at /salao.
const PAGES: readonly SeoContent["path"][] = ["/", "/salao"];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map((path) => ({
    url: pageUrl(path),
    changeFrequency: "monthly",
    priority: 1,
  }));
}
