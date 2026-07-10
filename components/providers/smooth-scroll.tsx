"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
  type MutableRefObject,
} from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useAfterPaint } from "@/lib/motion/use-after-paint";

/**
 * ASSENTO de motion SSR-safe (Flagship V2) — GSAP + Lenis num ÚNICO ticker.
 * =========================================================================
 * FRONTEIRA DE PAPEL (Front-end Architect): aqui mora só o ASSENTO arquitetural
 * — scroll engine + provider/boundary + gate de reduced-motion. NÃO há coreografia
 * (reveal/scrub/stagger): isso é do `motion-engineer` (Technical Storyboard),
 * que consome o `ScrollTrigger` já casado ao Lenis e os motion-tokens.
 *
 * REGRAS DO ASSENTO (Brief §técnico + motion-tokens):
 *  1. **Lenis = ÚNICO scroll engine.** Ninguém mais instancia scroll suave.
 *  2. **UM ticker só:** o rAF do Lenis é dirigido pelo `gsap.ticker` (`autoRaf:false`).
 *     Dois rAF = jank; aqui há exatamente um. `lagSmoothing(0)` p/ sync com scrub.
 *  3. **`prefers-reduced-motion` é gate PADRÃO:** se `reduce`, o Lenis NÃO monta
 *     (scroll nativo) — o conteúdo permanece 100%, zero movimento imposto. Reage a
 *     mudança de preferência em runtime.
 *  4. **SSR-safe / zero CLS:** só roda em `useEffect` (client). O Lenis v1 não
 *     embrulha o layout num wrapper transformado — não há shift. É um CLIENT
 *     wrapper que recebe children RSC por prop: os filhos continuam server-rendered
 *     (o HTML de conversão sai antes de qualquer JS).
 *
 * Consumo pelo motion-engineer: `ScrollTrigger` já atualiza no scroll do Lenis;
 * para scroll programático (CTAs de âncora) use `useLenis()` → `lenis.scrollTo(...)`.
 */

interface SmoothScrollApi {
  /** instância viva do Lenis, ou `null` sob reduced-motion / antes do mount. */
  lenisRef: MutableRefObject<Lenis | null>;
}

const SmoothScrollContext = createContext<SmoothScrollApi | null>(null);

/** Acesso à instância do Lenis (nullable — respeita reduced-motion e SSR). */
export function useLenis(): Lenis | null {
  const ctx = useContext(SmoothScrollContext);
  return ctx?.lenisRef.current ?? null;
}

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  // Perf XIA-76: adia o init do Lenis para DEPOIS do primeiro paint — o assento
  // não pode disputar a main thread durante a pintura do LCP (texto do hero).
  const afterPaint = useAfterPaint();

  useEffect(() => {
    if (!afterPaint) return;
    // registro idempotente do plugin (client-only — o plugin toca em `window`).
    gsap.registerPlugin(ScrollTrigger);

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");

    // dirige o rAF do Lenis pelo ticker do GSAP → UM ticker só.
    const raf = (time: number) => lenisRef.current?.raf(time * 1000);

    const start = () => {
      if (lenisRef.current) return; // já montado
      const lenis = new Lenis({ autoRaf: false }); // nós dirigimos o rAF (regra 2)
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
      lenisRef.current = lenis;
    };

    const stop = () => {
      if (!lenisRef.current) return;
      gsap.ticker.remove(raf);
      lenisRef.current.destroy();
      lenisRef.current = null;
    };

    // gate padrão: só liga o scroll suave quando o usuário NÃO pede menos movimento.
    const apply = () => (media.matches ? stop() : start());
    apply();
    media.addEventListener("change", apply);

    return () => {
      media.removeEventListener("change", apply);
      stop();
    };
  }, [afterPaint]);

  return (
    <SmoothScrollContext.Provider value={{ lenisRef }}>
      {children}
    </SmoothScrollContext.Provider>
  );
}
