/**
 * Xchair's sales WhatsApp — the single destination of every call to action on the page (owner,
 * 2026-10-28: no e-mail capture, "vai ser direto pro whatsapp"). The env lets the owner swap the
 * number without touching code; the default is the number the owner gave.
 */
export const SALES_WHATSAPP = process.env.NEXT_PUBLIC_SALES_WHATSAPP ?? "5549991613378";

/**
 * A wa.me link that opens a chat with the message already typed — the visitor only taps send.
 * @param phone - the number in any notation; only its digits are kept (with the country code)
 * @param text - the ready message
 * @returns the https://wa.me address
 */
export function whatsappLink(phone: string, text: string): string {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

/**
 * The sales chat link.
 * @param text - the ready message (each page's greeting lives in its content, `whatsapp.greeting`)
 * @returns the https://wa.me address of the sales number
 */
export function salesLink(text: string): string {
  return whatsappLink(SALES_WHATSAPP, text);
}
