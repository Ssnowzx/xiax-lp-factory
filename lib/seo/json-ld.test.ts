import { describe, expect, it } from "vitest";

import { BARBERSHOP } from "@/lib/content/barbershop";
import { SALON } from "@/lib/content/salon";
import { AVAILABLE_PLANS } from "@/lib/data/plans";
import { jsonLdScript, softwareApplicationLd } from "@/lib/seo/json-ld";
import { SITE } from "@/lib/site";

describe("softwareApplicationLd", () => {
  it("should keep the barbershop's JSON-LD at the bare site address", () => {
    // ARRANGE
    const { seo } = BARBERSHOP;

    // ACT
    const ld = softwareApplicationLd(seo);

    // ASSERT
    expect(ld.url).toBe(SITE.url);
    expect(ld.description).toBe(seo.description);
    expect(ld.audience.audienceType).toBe("Donos de barbearia");
  });

  it("should point the salon's JSON-LD at its own address and audience", () => {
    // ARRANGE
    const { seo } = SALON;

    // ACT
    const ld = softwareApplicationLd(seo);

    // ASSERT
    expect(ld.url).toBe(`${SITE.url}/salao`);
    expect(ld.description).toBe(seo.description);
    expect(ld.audience.audienceType).toBe("Salões de beleza");
  });

  it("should offer only the plans that can be bought today", () => {
    // ARRANGE
    const { seo } = SALON;

    // ACT
    const { offers } = softwareApplicationLd(seo);

    // ASSERT
    expect(offers.offerCount).toBe(AVAILABLE_PLANS.length);
    expect(offers.lowPrice).toBe("99.00");
  });
});

describe("jsonLdScript", () => {
  it("should escape every < so the data cannot close its script tag", () => {
    // ARRANGE
    const data = { name: "</script><script>x</script>" };

    // ACT
    const script = jsonLdScript(data);

    // ASSERT
    expect(script).not.toContain("<");
    expect(JSON.parse(script)).toEqual(data);
  });
});
