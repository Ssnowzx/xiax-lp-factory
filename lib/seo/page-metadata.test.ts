import { describe, expect, it } from "vitest";

import type { SeoContent } from "@/lib/content/types";

import { BARBERSHOP } from "@/lib/content/barbershop";
import { pageMetadata } from "@/lib/seo/page-metadata";
import { SITE } from "@/lib/site";

const SALON_SEO: SeoContent = {
  path: "/salao",
  title: "Sistema de Agendamento para Salão de Beleza | Xchair",
  description: "Sistema de agendamento para salão de beleza.",
  keyword: "sistema de agendamento para salão de beleza",
  keywords: ["sistema de agendamento para salão de beleza", "agenda salão"],
  audience: "Salões de beleza",
};

describe("pageMetadata", () => {
  it("should point the canonical address at the page's path", () => {
    // ARRANGE
    const seo = SALON_SEO;

    // ACT
    const metadata = pageMetadata(seo);

    // ASSERT
    expect(metadata.alternates?.canonical).toBe("/salao");
  });

  it("should give the page's title, description and keywords to search engines", () => {
    // ARRANGE
    const seo = BARBERSHOP.seo;

    // ACT
    const metadata = pageMetadata(seo);

    // ASSERT
    expect(metadata.title).toBe("Sistema de Agendamento para Barbearia | Xchair");
    expect(metadata.description).toBe(seo.description);
    expect(metadata.keywords).toEqual(seo.keywords);
  });

  it("should share the home page at the bare site address", () => {
    // ARRANGE
    const seo = BARBERSHOP.seo;

    // ACT
    const metadata = pageMetadata(seo);

    // ASSERT
    expect(metadata.openGraph?.url).toBe(SITE.url);
  });

  it("should share any other page at the site address plus its path", () => {
    // ARRANGE
    const seo = SALON_SEO;

    // ACT
    const metadata = pageMetadata(seo);

    // ASSERT
    expect(metadata.openGraph?.url).toBe(`${SITE.url}/salao`);
    expect(metadata.openGraph?.title).toBe(seo.title);
    expect(metadata.twitter?.description).toBe(seo.description);
  });

  it("should keep every page indexable", () => {
    // ARRANGE
    const seo = SALON_SEO;

    // ACT
    const metadata = pageMetadata(seo);

    // ASSERT
    expect(metadata.robots).toEqual({ index: true, follow: true });
  });
});
