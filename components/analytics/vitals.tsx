"use client";

import { useReportWebVitals } from "next/web-vitals";
import { track } from "@/lib/analytics/track";
import type { AnalyticsEvent } from "@/lib/analytics/events";

// Métricas que o Brief guarda (LCP<2,5s / CLS<0,1 / INP<200ms). Encaminha CWV
// reais pro MESMO canal tipado (track). Zero UI — só instrumentação (client).
const TRACKED: ReadonlyArray<Extract<AnalyticsEvent, { name: "web_vitals" }>["metric"]> = [
  "LCP",
  "CLS",
  "INP",
  "FCP",
  "TTFB",
];

export function Vitals() {
  useReportWebVitals((metric) => {
    const name = metric.name as (typeof TRACKED)[number];
    if (!TRACKED.includes(name)) return;
    track({
      name: "web_vitals",
      metric: name,
      value: Math.round(metric.value),
      rating: metric.rating,
    });
  });
  return null;
}
