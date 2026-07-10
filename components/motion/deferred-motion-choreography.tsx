"use client";

import { useAfterPaint } from "@/lib/motion/use-after-paint";
import { MotionChoreography } from "@/components/motion/motion-choreography";

/**
 * GATE de agendamento do assento (Front-end Architect) — Perf XIA-76.
 * ==================================================================
 * Só monta a camada de coreografia (GSAP/ScrollTrigger do `motion-engineer`)
 * DEPOIS do primeiro paint, para que o `registerPlugin` + `heroTimeline` não
 * empurrem o paint do LCP sob throttle. Mesma coreografia, mesmos tokens — só o
 * *quando* muda. NB (XIA-87): o sub-headline = LCP NÃO recebe mais intro — fica
 * em opacity 1 desde o paint, então o adiamento nunca gera flash nele.
 *
 * Enquanto não montada, o tier CSS de reveal (`html.anim-ready:not(.gsap-live)`)
 * segue no comando; ao montar, a coreografia marca `gsap-live` e assume os alvos
 * (posse já resolvida em motion-choreography.tsx). Sem double-drive, sem CLS.
 */
export function DeferredMotionChoreography() {
  const afterPaint = useAfterPaint();
  if (!afterPaint) return null;
  return <MotionChoreography />;
}
