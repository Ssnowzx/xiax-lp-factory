import { describe, expect, it } from "vitest";

import { SALES_WHATSAPP, salesLink, whatsappLink } from "@/lib/contact/whatsapp";

function textOf(link: string): string | null {
  return new URL(link).searchParams.get("text");
}

describe("whatsappLink", () => {
  it("should address the chat by the digits of the number only", () => {
    // ARRANGE
    const phone = "+55 (49) 99161-3378";

    // ACT
    const link = whatsappLink(phone, "Oi");

    // ASSERT
    expect(link.startsWith("https://wa.me/5549991613378?text=")).toBe(true);
  });

  it("should carry the ready message, accents and punctuation intact", () => {
    // ARRANGE
    const message = "Olá! Quero saber mais sobre o plano Signature do Xchair.";

    // ACT
    const link = whatsappLink(SALES_WHATSAPP, message);

    // ASSERT
    expect(textOf(link)).toBe(message);
  });
});

describe("salesLink", () => {
  it("should open the sales chat with the page's greeting", () => {
    // ARRANGE
    const greeting = "Olá! Tenho um salão de beleza e quero conhecer o Xchair.";

    // ACT
    const link = salesLink(greeting);

    // ASSERT
    expect(link).toBe(whatsappLink(SALES_WHATSAPP, greeting));
    expect(textOf(link)).toBe(greeting);
  });
});
