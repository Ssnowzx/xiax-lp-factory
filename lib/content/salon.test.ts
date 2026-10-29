import { describe, expect, it } from "vitest";

import type { SectionKey } from "@/lib/content/types";

import { SALON } from "@/lib/content/salon";
import { SALON_FEATURES, featureIdsIn } from "@/lib/content/salon-features";
import { collectStrings, plainStrings } from "@/lib/content/test-helpers";
import { PLANS } from "@/lib/data/plans";

const SALON_FUNNEL: readonly SectionKey[] = [
  "hero",
  "pain",
  "steps",
  "numbers",
  "waitlist",
  "salonFeatures",
  "cash",
  "gallery",
  "showcase",
  "plans",
  "faq",
  "final",
];

/** Barbershop words: the salon page never uses them (spec vertical-pages). */
const BARBERSHOP_WORDS = /barbear|barbeir|\bbarbas?\b|navalha/i;
/** Promises the page never makes (spec salon-landing · "Nada inventado"). */
const FORBIDDEN = /teste grátis|14 dias|sem cartão|zero falta|nunca mais|depoimento/i;
/** Plain-text names of features still being built: they must be cited through the registry. */
const COMING_FEATURE_WORDS = /pausa|anamnese|pacotes? de sess|ficha técnica|salas e equipamentos|salão-parceiro|várias profissionais na mesma/i;

describe("salon content", () => {
  it("should list the 12 sections in the salon funnel order", () => {
    // ARRANGE
    const expected = SALON_FUNNEL;

    // ACT
    const order = SALON.order;

    // ASSERT
    expect(order).toEqual(expected);
  });

  it("should have a block for every section in its order", () => {
    // ARRANGE
    const order = SALON.order;

    // ACT
    const missing = order.filter((key) => SALON[key] === undefined);

    // ASSERT
    expect(missing).toEqual([]);
  });

  it("should never use a barbershop word in any text, alt, SEO field or message", () => {
    // ARRANGE
    const strings = collectStrings(SALON);

    // ACT
    const barbershop = strings.filter((text) => BARBERSHOP_WORDS.test(text));

    // ASSERT
    expect(strings.length).toBeGreaterThan(100);
    expect(barbershop).toEqual([]);
  });

  it("should greet the sales WhatsApp as a beauty salon", () => {
    // ARRANGE
    const { whatsapp } = SALON;

    // ACT
    const greeting = whatsapp.greeting;

    // ASSERT
    expect(greeting).toBe("Olá! Tenho um salão de beleza e quero conhecer o Xchair.");
  });

  it("should name the plan in every plan message", () => {
    // ARRANGE
    const templates = Object.values(SALON.whatsapp.plan);

    // ACT
    const withoutPlan = templates.filter((template) => !template.includes("{plan}"));

    // ASSERT
    expect(withoutPlan).toEqual([]);
  });

  it("should feature the Completo as the salon's plan", () => {
    // ARRANGE
    const { plans } = SALON;

    // ACT
    const featured = [plans.featured, plans.featuredLabel];

    // ASSERT
    expect(featured).toEqual(["completo", "O plano do salão"]);
  });

  it("should list in the Completo card the salon features the section shows", () => {
    // ARRANGE
    const sectionIds = SALON.salonFeatures?.items ?? [];

    // ACT
    const cardIds = featureIdsIn(SALON.plans.cards.completo.features);

    // ASSERT
    expect(sectionIds.length).toBeGreaterThan(0);
    expect(sectionIds.filter((id) => !cardIds.includes(id))).toEqual([]);
  });

  it("should answer the 8 salon questions", () => {
    // ARRANGE
    const expected = ["equipe", "pausa", "servicos", "whatsapp", "preco", "config", "marketplace", "celular"];

    // ACT
    const ids = SALON.faq.items.map((item) => item.id);

    // ASSERT
    expect(ids).toEqual(expected);
  });

  it("should say the team plan is coming when asked about several professionals", () => {
    // ARRANGE
    const answer = SALON.faq.items.find((item) => item.id === "equipe")?.answer;

    // ACT
    const text = collectStrings(answer).join(" ");

    // ASSERT
    expect(text).toMatch(/Completo/);
    expect(text).toMatch(/em breve/i);
    expect(text).toMatch(/Essencial/);
    expect(text).toMatch(/1 profissional/);
  });

  it("should make none of the forbidden promises", () => {
    // ARRANGE
    const strings = collectStrings(SALON);

    // ACT
    const promises = strings.filter((text) => FORBIDDEN.test(text));

    // ASSERT
    expect(promises).toEqual([]);
  });

  it("should mention AI only on a coming-soon plan", () => {
    // ARRANGE
    const ai = (id: (typeof PLANS)[number]["id"]) => collectStrings(SALON.plans.cards[id].features).some((f) => /\bIA\b/.test(f));

    // ACT
    const withAi = PLANS.filter((plan) => ai(plan.id));

    // ASSERT
    expect(withAi.every((plan) => plan.status === "soon")).toBe(true);
  });

  it("should name a feature under construction only through the registry, so it always shows its badge", () => {
    // ARRANGE
    const { faq, ...rest } = SALON;
    const answers = faq.items.map((item) => item.answer);

    // ACT
    const loose = [...plainStrings(rest), ...plainStrings(answers)].filter((text) => COMING_FEATURE_WORDS.test(text));

    // ASSERT
    expect(loose).toEqual([]);
  });

  it("should only cite features that exist in the registry", () => {
    // ARRANGE
    const cited = featureIdsIn(SALON);

    // ACT
    const unknown = cited.filter((id) => !(id in SALON_FEATURES));

    // ASSERT
    expect(cited.length).toBeGreaterThan(0);
    expect(unknown).toEqual([]);
  });

  it("should sweep the steps with the round brush", () => {
    // ARRANGE
    const { steps } = SALON;

    // ACT
    const tool = steps.sweepTool;

    // ASSERT
    expect(tool).toBe("brush");
  });

  it("should show the four looks of the segment with Porcelana as the default", () => {
    // ARRANGE
    const { items } = SALON.showcase.themes;

    // ACT
    const names = items.map((theme) => theme.name);
    const defaults = items.filter((theme) => theme.isDefault).map((theme) => theme.name);

    // ASSERT
    expect(names).toEqual(["Porcelana", "Rosé", "Sálvia", "Noite de Gala"]);
    expect(defaults).toEqual(["Porcelana"]);
  });

  it("should give every look its own screen", () => {
    // ARRANGE
    const { items } = SALON.showcase.themes;

    // ACT
    const sources = new Set(items.map((theme) => theme.screen.src));

    // ASSERT
    expect(sources.size).toBe(items.length);
  });

  it("should tell the owner the look is switched in the panel, not picked on the page", () => {
    // ARRANGE
    const { note } = SALON.showcase.themes;

    // ACT
    const pointsToPanel = /painel/.test(note);

    // ASSERT
    expect(pointsToPanel).toBe(true);
  });
});
