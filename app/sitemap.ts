import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// sitemap nativo do App Router (Brief: sitemap on-page). LP de rota única.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE.url,
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
