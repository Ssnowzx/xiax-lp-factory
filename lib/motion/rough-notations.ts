/**
 * MECANISMO da rough-notation (WS3 · XIA-92) — a ilha que DESENHA as marcações
 * "à mão" no scroll, com TODAS as regras inegociáveis do Brief embutidas. É o
 * ASSENTO: o `motion-engineer` NÃO reescreve isto — ele envolve palavras da copy
 * CONGELADA com `<RoughTarget>` e ajusta os VALORES em `rough-notation-plan.ts`.
 *
 * Regras inegociáveis garantidas aqui (Brief §WS3):
 *  - desenha UMA vez por elemento no enter (`ScrollTrigger once:true`), NUNCA no tick;
 *  - fila SERIALIZADA por `data-note` (ordem) + stagger (`CADENCE.staggerMs`);
 *  - anota só após `document.fonts.ready` (rough mede o rect do texto);
 *  - resize DEBOUNCED (`CADENCE.resizeDebounceMs`) → reposiciona só as já mostradas;
 *  - SVG da anotação é appendado FORA do fluxo (position:absolute no body) → CLS 0;
 *  - `prefers-reduced-motion` → estado final INSTANTÂNEO (animate:false, sem traço);
 *  - tinta = token `--accent` (latão), lido em runtime — nunca cor nova;
 *  - teardown SPA-safe: `remove()` de cada anotação + `kill()` dos triggers.
 *
 * Usa o ticker/ScrollTrigger ÚNICO já registrado pela coreografia (o mesmo Lenis).
 * Retorna um cleanup que a coreografia chama no `mm.revert()`.
 */
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { annotate } from "rough-notation";
import type { RoughAnnotation } from "rough-notation/lib/model";
import {
  INK_VAR,
  CADENCE,
  TYPE_DEFAULTS,
  type RoughAnnotationType,
} from "./rough-notation-plan";

type Cleanup = () => void;

/** Resolve a tinta do token `--accent` (canais RGB "r g b") → `rgb(r g b)`. */
function resolveInk(): string {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(INK_VAR)
    .trim();
  if (!raw) return "currentColor";
  return /^[\d.]+\s+[\d.]+\s+[\d.]+$/.test(raw) ? `rgb(${raw})` : raw;
}

/**
 * BLOCK-01 (A11y WCAG 1.1.1 · XIA-103): o SVG que a lib desenha é decorativo
 * (`role=image`, `name=""`) e um leitor de tela o anunciaria como "imagem" vazia
 * no meio da copy. A lib insere o SVG como IRMÃO adjacente do alvo
 * (`insertAdjacentElement` "afterend", ou "beforebegin" p/ highlight) — NÃO como
 * filho —, então buscamos nos irmãos adjacentes, não em `el.querySelector`.
 * O SVG já existe de forma síncrona após `annotate()` (constructor → attach()).
 * Atributo de string: CLS/FPS/INP = 0, invisível ao render.
 */
function hideAnnotationFromA11y(el: HTMLElement): void {
  for (const node of [el.nextElementSibling, el.previousElementSibling]) {
    if (node?.classList?.contains("rough-annotation")) {
      node.setAttribute("aria-hidden", "true");
      node.setAttribute("focusable", "false");
    }
  }
}

export function runRoughNotations({ reduced }: { reduced: boolean }): Cleanup {
  const marks = Array.from(
    document.querySelectorAll<HTMLElement>("[data-rn]"),
  );
  // ASSENTO DEFENSIVO: sem alvos marcados ainda → no-op (o motion-engineer liga
  // ao envolver palavras com `<RoughTarget>`). Nunca quebra o build/mount.
  if (marks.length === 0) return () => {};

  const ink = resolveInk();
  const triggers: ScrollTrigger[] = [];
  const annotations: RoughAnnotation[] = [];
  let disposed = false;

  // fila: ordena pela ordem declarada em `data-note` (fallback: ordem no DOM).
  const ordered = marks
    .map((el, i) => ({ el, order: Number(el.dataset.note ?? i), i }))
    .sort((a, b) => a.order - b.order || a.i - b.i);

  const start = () => {
    if (disposed) return;
    ordered.forEach(({ el }, idx) => {
      const type = (el.dataset.rn as RoughAnnotationType) || "underline";
      const base = TYPE_DEFAULTS[type] ?? {};
      const annotation = annotate(el, {
        type,
        color: ink,
        animate: !reduced,
        animationDuration: reduced ? 0 : CADENCE.drawMs,
        ...base,
      });
      annotations.push(annotation);
      // BLOCK-01 (XIA-103): SVG já existe após annotate() → esconde da AX tree.
      hideAnnotationFromA11y(el);

      // desenha 1× no enter (once:true) — o stagger serializa a fila.
      const trigger = ScrollTrigger.create({
        trigger: el,
        start: "top 85%",
        once: true,
        onEnter: () => {
          if (disposed) return;
          const delay = reduced ? 0 : idx * CADENCE.staggerMs;
          window.setTimeout(() => {
            if (!disposed && !annotation.isShowing()) annotation.show();
          }, delay);
        },
      });
      triggers.push(trigger);
    });
  };

  // anota só depois das fontes carregarem (fonts.ready sempre resolve).
  const fontsReady: Promise<unknown> =
    (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts
      ?.ready ?? Promise.resolve();
  fontsReady.then(() => {
    if (!disposed) start();
  });

  // resize debounced: reposiciona só as anotações já mostradas (hide→show).
  let resizeTimer = 0;
  const onResize = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (disposed) return;
      annotations.forEach((a) => {
        if (a.isShowing()) {
          a.hide();
          a.show();
        }
      });
      ScrollTrigger.refresh();
    }, CADENCE.resizeDebounceMs);
  };
  window.addEventListener("resize", onResize);

  return () => {
    disposed = true;
    window.clearTimeout(resizeTimer);
    window.removeEventListener("resize", onResize);
    triggers.forEach((t) => t.kill());
    annotations.forEach((a) => a.remove());
  };
}
