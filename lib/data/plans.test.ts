import { describe, expect, it } from "vitest";

import type { WhatsAppContent } from "@/lib/content/types";
import type { Plan } from "@/lib/data/plans";

import { SALES_WHATSAPP, whatsappLink } from "@/lib/contact/whatsapp";
import {
  PLANS,
  PLAN_PRICE_FROM_CENTS,
  formatBRL,
  lowestAvailablePriceCents,
  planCta,
  purchaseReassurance,
} from "@/lib/data/plans";

/** A page's plan messages; salon wording, so nothing here can pass on the barbershop's defaults. */
const MESSAGES: WhatsAppContent["plan"] = {
  available: "Olá! Tenho um salão de beleza e quero conhecer o plano {plan} do Xchair para o meu salão.",
  consult: "Olá! Tenho um salão e quero saber mais sobre o plano {plan} do Xchair.",
  notify: "Olá! Tenho um salão e quero ser avisada quando o plano {plan} do Xchair sair.",
};

function planById(id: Plan["id"]): Plan {
  const plan = PLANS.find((p) => p.id === id);
  if (!plan) throw new Error(`missing plan ${id}`);
  return plan;
}

describe("formatBRL", () => {
  it("should drop the cents of a whole amount", () => {
    // ARRANGE
    const cents = 9900;

    // ACT
    const text = formatBRL(cents);

    // ASSERT
    expect(text.replace(/\s/g, " ")).toBe("R$ 99");
  });

  it("should keep two decimals when the amount has cents", () => {
    // ARRANGE
    const cents = 9890;

    // ACT
    const text = formatBRL(cents);

    // ASSERT
    expect(text.replace(/\s/g, " ")).toBe("R$ 98,90");
  });

  it("should group thousands the Brazilian way", () => {
    // ARRANGE
    const cents = 123400;

    // ACT
    const text = formatBRL(cents);

    // ASSERT
    expect(text.replace(/\s/g, " ")).toBe("R$ 1.234");
  });
});

describe("planCta", () => {
  it("should send the available plan to the checkout when its address is set", () => {
    // ARRANGE
    const essencial = planById("essencial");

    // ACT
    const cta = planCta(essencial, "https://pay.example/essencial", MESSAGES);

    // ASSERT
    expect(cta.href).toBe("https://pay.example/essencial");
    expect(cta.label).toBe("Assinar o Essencial");
    expect(cta.external).toBe(true);
  });

  it("should send the available plan to the sales WhatsApp with the page's message while there is no checkout address", () => {
    // ARRANGE
    const essencial = planById("essencial");
    const message = "Olá! Tenho um salão de beleza e quero conhecer o plano Essencial do Xchair para o meu salão.";

    // ACT
    const cta = planCta(essencial, null, MESSAGES);

    // ASSERT
    expect(cta.href).toBe(whatsappLink(SALES_WHATSAPP, message));
    expect(cta.label).toBe("Quero conhecer o Essencial");
    expect(cta.external).toBe(true);
  });

  it("should never send a coming-soon plan to the checkout", () => {
    // ARRANGE
    const completo = planById("completo");

    // ACT
    const cta = planCta(completo, "https://pay.example/essencial", MESSAGES);

    // ASSERT
    expect(cta.href).toBe(whatsappLink(SALES_WHATSAPP, "Olá! Tenho um salão e quero ser avisada quando o plano Completo do Xchair sair."));
    expect(cta.label).toBe("Quero ser avisado");
  });

  it("should invite a Signature consultation through the sales WhatsApp", () => {
    // ARRANGE
    const signature = planById("signature");

    // ACT
    const cta = planCta(signature, null, MESSAGES);

    // ASSERT
    expect(cta.href).toBe(whatsappLink(SALES_WHATSAPP, "Olá! Tenho um salão e quero saber mais sobre o plano Signature do Xchair."));
    expect(cta.label).toBe("Consultar o Signature");
  });
});

describe("purchaseReassurance", () => {
  it("should only promise the page is ready on payment by default", () => {
    // ARRANGE
    const showCancelAnytime = false;

    // ACT
    const lines = purchaseReassurance(showCancelAnytime);

    // ASSERT
    expect(lines).toEqual(["Sua página fica pronta assim que o pagamento é confirmado"]);
  });

  it("should add the cancel-anytime line once the owner confirms it", () => {
    // ARRANGE
    const showCancelAnytime = true;

    // ACT
    const lines = purchaseReassurance(showCancelAnytime);

    // ASSERT
    expect(lines).toContain("Cancele quando quiser, sem multa");
  });
});

describe("lowestAvailablePriceCents", () => {
  it("should ignore plans that cannot be bought yet", () => {
    // ARRANGE
    const plans = PLANS;

    // ACT
    const lowest = lowestAvailablePriceCents(plans);

    // ASSERT
    expect(lowest).toBe(9900);
    expect(PLAN_PRICE_FROM_CENTS).toBe(lowest);
  });

  it("should be null when no plan can be bought", () => {
    // ARRANGE
    const soonOnly = PLANS.filter((p) => p.status === "soon");

    // ACT
    const lowest = lowestAvailablePriceCents(soonOnly);

    // ASSERT
    expect(lowest).toBeNull();
  });
});

describe("PLANS", () => {
  it("should offer exactly one plan that can be bought today", () => {
    // ARRANGE
    const plans = PLANS;

    // ACT
    const available = plans.filter((p) => p.status === "available").map((p) => p.id);

    // ASSERT
    expect(available).toEqual(["essencial"]);
  });

  it("should keep the old plan names and prices out of the plan data", () => {
    // ARRANGE
    const text = JSON.stringify(PLANS);

    // ACT
    const leftovers = ["Corte", "Premium", "VIP", "9890", "34990"].filter((s) => text.includes(s));

    // ASSERT
    expect(leftovers).toEqual([]);
  });
});
