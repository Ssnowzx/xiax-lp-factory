import { describe, expect, it } from "vitest";

import type { SectionKey } from "@/lib/content/types";

import { BARBERSHOP } from "@/lib/content/barbershop";
import { collectStrings } from "@/lib/content/test-helpers";
import { PLANS } from "@/lib/data/plans";

const FUNNEL: readonly SectionKey[] = [
  "hero",
  "pain",
  "steps",
  "numbers",
  "waitlist",
  "cash",
  "gallery",
  "showcase",
  "plans",
  "faq",
  "final",
];

describe("barbershop content", () => {
  it("should list the sections in the barbershop funnel order", () => {
    // ARRANGE
    const expected = FUNNEL;

    // ACT
    const order = BARBERSHOP.order;

    // ASSERT
    expect(order).toEqual(expected);
  });

  it("should have a block for every section in its order", () => {
    // ARRANGE
    const order = BARBERSHOP.order;

    // ACT
    const missing = order.filter((key) => BARBERSHOP[key] === undefined);

    // ASSERT
    expect(missing).toEqual([]);
  });

  it("should leave out the salon features block", () => {
    // ARRANGE
    const content = BARBERSHOP;

    // ACT
    const block = content.salonFeatures;

    // ASSERT
    expect(block).toBeUndefined();
  });

  it("should carry the SEO title, description and primary keyword", () => {
    // ARRANGE
    const { seo } = BARBERSHOP;

    // ACT
    const keywordInDescription = seo.description.toLowerCase().includes(seo.keyword);

    // ASSERT
    expect(seo.path).toBe("/");
    expect(seo.title).toContain("Barbearia");
    expect(seo.keyword).toBe("sistema de agendamento para barbearia");
    expect(seo.keywords[0]).toBe(seo.keyword);
    expect(keywordInDescription).toBe(true);
  });

  it("should greet the sales WhatsApp as a barbershop", () => {
    // ARRANGE
    const { whatsapp } = BARBERSHOP;

    // ACT
    const greeting = whatsapp.greeting;

    // ASSERT
    expect(greeting).toBe("Olá! Tenho uma barbearia e quero conhecer o Xchair.");
  });

  it("should name the plan in every plan message", () => {
    // ARRANGE
    const templates = Object.values(BARBERSHOP.whatsapp.plan);

    // ACT
    const withoutPlan = templates.filter((template) => !template.includes("{plan}"));

    // ASSERT
    expect(templates).toHaveLength(3);
    expect(withoutPlan).toEqual([]);
  });

  it("should keep the old plan names, trial and card-free promises off the plan cards", () => {
    // ARRANGE
    const text = collectStrings(BARBERSHOP.plans).join(" ");

    // ACT
    const leftovers = ["Premium", "VIP", "98,90", "349,90", "14 dias", "sem cartão", "teste grátis"].filter((s) => text.includes(s));

    // ASSERT
    expect(leftovers).toEqual([]);
  });

  it("should mention AI only on a coming-soon plan", () => {
    // ARRANGE
    const mentionsAi = (id: keyof typeof BARBERSHOP.plans.cards) =>
      collectStrings(BARBERSHOP.plans.cards[id].features).some((f) => /\bIA\b/.test(f));

    // ACT
    const withAi = PLANS.filter((plan) => mentionsAi(plan.id));

    // ASSERT
    expect(withAi.length).toBeGreaterThan(0);
    expect(withAi.every((plan) => plan.status === "soon")).toBe(true);
  });

  it("should never mention a salon in any text, alt or message", () => {
    // ARRANGE
    const strings = collectStrings(BARBERSHOP);

    // ACT
    const salon = strings.filter((text) => /sal[aã]o/i.test(text));

    // ASSERT
    expect(strings.length).toBeGreaterThan(100);
    expect(salon).toEqual([]);
  });

  it("should show the four looks of the segment with Navalha as the default", () => {
    // ARRANGE
    const { items } = BARBERSHOP.showcase.themes;

    // ACT
    const names = items.map((theme) => theme.name);
    const defaults = items.filter((theme) => theme.isDefault).map((theme) => theme.name);

    // ASSERT
    expect(names).toEqual(["Navalha", "Velha Guarda", "Poste", "Oficina"]);
    expect(defaults).toEqual(["Navalha"]);
  });

  it("should give every look its own screen", () => {
    // ARRANGE
    const { items } = BARBERSHOP.showcase.themes;

    // ACT
    const sources = new Set(items.map((theme) => theme.screen.src));

    // ASSERT
    expect(sources.size).toBe(items.length);
  });

  it("should tell the owner the look is switched in the panel, not picked on the page", () => {
    // ARRANGE
    const { note } = BARBERSHOP.showcase.themes;

    // ACT
    const pointsToPanel = /painel/.test(note);

    // ASSERT
    expect(pointsToPanel).toBe(true);
  });
});
