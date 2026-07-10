import type { AnalyticsEvent } from "./events";

/**
 * `track()` provider-agnóstico e TIPADO. Só aceita eventos da união (events.ts).
 * Hoje é um STUB (Standard/piloto): empurra pro dataLayer se existir e loga em dev.
 * Trocar o corpo por GA4/Plausible/PostHog é uma mudança de UMA função — o call
 * site (tipado) não muda. Seguro em SSR (checa `window`).
 */
export function track(event: AnalyticsEvent): void {
  if (typeof window === "undefined") return;

  // dataLayer-agnóstico: qualquer provider que leia window.dataLayer captura.
  const w = window as typeof window & { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ event: event.name, ...event });

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.debug("[analytics]", event);
  }
}
