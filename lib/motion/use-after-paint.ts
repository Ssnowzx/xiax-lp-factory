"use client";

import { useEffect, useState } from "react";

/**
 * SEAM de agendamento do ASSENTO (Front-end Architect) — Perf XIA-76.
 * ==================================================================
 * Sinaliza `true` só DEPOIS do primeiro paint (double rAF) + idle, para que o
 * init de motion (Lenis no seat + GSAP na coreografia) NÃO dispute a main thread
 * durante a pintura do LCP.
 *
 * PORQUÊ: o LCP da LP é o sub-headline de TEXTO do hero (HTML de servidor, já
 * pintável sem JS). Se o GSAP monta junto com a hidratação, ele disputa a main
 * thread e, sob throttle (slow-4G + 4×CPU), o paint final do LCP escorrega →
 * Render Delay ~2s. Adiando o init para depois do paint, o texto pinta primeiro
 * (LCP cedo) e a coreografia assume em seguida — timing corrigido.
 *
 * NB (XIA-87): o sub-headline = LCP não recebe mais intro no `heroTimeline` (fica
 * em opacity 1 desde o paint), então o adiamento não pode gerar flash nele.
 *
 * FRONTEIRA DE PAPEL: este é o *quando* do assento (arquitetura). O *quê* da
 * coreografia (durations/eases/alvos) permanece do `motion-engineer` — este seam
 * não toca em nenhum valor de motion-token.
 */
export function useAfterPaint(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let raf1 = 0;
    let raf2 = 0;
    let idle: number | undefined;

    const schedule = () => {
      const ric = window.requestIdleCallback;
      if (typeof ric === "function") {
        // timeout garante que nunca passa do LCP por muito (cap 200ms).
        idle = ric(() => setReady(true), { timeout: 200 });
      } else {
        idle = window.setTimeout(() => setReady(true), 0);
      }
    };

    // double rAF = garantidamente depois do primeiro paint committed.
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(schedule);
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      if (idle === undefined) return;
      const cic = window.cancelIdleCallback;
      if (typeof cic === "function") cic(idle);
      else clearTimeout(idle);
    };
  }, []);

  return ready;
}
