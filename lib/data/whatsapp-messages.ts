/**
 * WhatsApp examples shown on the page (change xiax-lp-v4-xchair · design D4). They follow the
 * app's real templates word for word (APPbarbearia `apps/site/lib/scheduling/message-templates.ts`:
 * `reminder24h`, `slotFreed`): the business name in bold on the first line, then the message.
 * The names, dates and the link are the fictional data of the screens (Barbearia Central); the
 * shop's address is left as "…" because each shop has its own.
 */
export interface MessagePart {
  text: string;
  bold?: boolean;
}

export interface WhatsAppExample {
  business: string;
  parts: readonly MessagePart[];
  /** Time the message arrived, as the phone shows it. */
  time: string;
  /** What a screen reader hears after the time: whose example this is. */
  label: string;
}

/** Day-before reminder (reminder24h) for the booking on the confirmed screen. */
export const REMINDER_DAY_BEFORE: WhatsAppExample = {
  business: "Barbearia Central",
  parts: [{ text: "Olá, João! Lembrete: amanhã (30/10) às 15:00 você tem Corte + barba marcado. Até lá!" }],
  time: "15:00",
  label: "exemplo de mensagem da barbearia",
};

/** Waiting-list offer (slotFreed): the freed slot, held for the next in line until a deadline. */
export const SLOT_FREED: WhatsAppExample = {
  business: "Barbearia Central",
  parts: [
    { text: "Olá, Caio! Abriu uma vaga na agenda: " },
    { text: "28/10 às 16:00", bold: true },
    {
      text: ". Ela está guardada para você até as 14:50 — depois disso passa para o próximo da lista de espera. Para confirmar, acesse: …/agendar/oferta/…",
    },
  ],
  time: "14:20",
  label: "exemplo de mensagem da barbearia",
};

/** Salon day-before reminder (reminder24h) for the booking on the salon confirmed screen. */
export const SALON_REMINDER_DAY_BEFORE: WhatsAppExample = {
  business: "Salão Aurora",
  parts: [{ text: "Olá, Mariana! Lembrete: amanhã (30/10) às 15:00 você tem Escova modelada marcado. Até lá!" }],
  time: "15:00",
  label: "exemplo de mensagem do salão",
};

/** Salon waiting-list offer (slotFreed): the free 16:00 slot of the salon agenda, held until a deadline. */
export const SALON_SLOT_FREED: WhatsAppExample = {
  business: "Salão Aurora",
  parts: [
    { text: "Olá, Renata! Abriu uma vaga na agenda: " },
    { text: "28/10 às 16:00", bold: true },
    {
      text: ". Ela está guardada para você até as 14:50 — depois disso passa para o próximo da lista de espera. Para confirmar, acesse: …/agendar/oferta/…",
    },
  ],
  time: "14:20",
  label: "exemplo de mensagem do salão",
};
