"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  DUR,
  SCRUB,
  STAGGER,
  EASE_GSAP,
  CLIP,
  PARALLAX,
  DEPTH,
  STEPS,
  RAZOR,
} from "@/lib/motion/motion-tokens";
import type { GalleryLayerKind } from "@/lib/motion/depth";

import { galleryLayerMotion } from "@/lib/motion/depth";
import { storyDelays } from "@/lib/motion/steps";
import { SWEEP_TOOLS, sweepToolOf } from "@/lib/motion/sweep-tool";

/**
 * CAMADA DE COREOGRAFIA (Flagship V2) — Technical Storyboard aprovado (XIA-61, rev 42cea128).
 * =========================================================================================
 * Ilha CLIENT que PREENCHE o assento de motion (`SmoothScrollProvider`): consome o
 * `ScrollTrigger` já casado ao Lenis (um ticker só) e os motion-tokens do DS. NÃO cria
 * segundo provider, NÃO move a fronteira RSC/client, NÃO reescreve markup — seleciona os
 * alvos já renderizados (ids/classes/data-*).
 *
 * REGRAS (Brief §8 · barra de release arbitra):
 *  - Só `transform`/`opacity` (+ `clip-path` em reveal). `scrub` numérico (SCRUB.*), nunca `true`.
 *  - Zero magic number: todo parâmetro sai de token nomeado (DUR/SCRUB/STAGGER/EASE_GSAP/CLIP/PARALLAX).
 *  - `prefers-reduced-motion` é gate PADRÃO (branch `reduce` de `matchMedia`): conteúdo permanece,
 *    movimento zera. `?reduced=1` força o branch reduzido para o harness de QA.
 *  - Sem `markers`/`console.log`. Teardown SPA-safe via `mm.revert()`.
 *
 * POSSE vs. tier CSS: o reveal CSS (`html.anim-ready:not(.gsap-live) .reveal ...`) é o fallback
 * sem-JS/pré-hidratação. Ao montar, marcamos `html.gsap-live` → o CSS de reveal sai de cena e o
 * GSAP assume os mesmos alvos (sem double-drive). Os desenhos decorativos (mark-accent/hair-draw/
 * acordeão) seguem no CSS — não são escopados por `:not(.gsap-live)`.
 *
 * HOOKS DEFENSIVOS (ligam sozinhos quando as dependências chegarem, sem quebrar o build):
 *  - count-up: ativa em `[data-count-num]` (hook do `ui-engineer` no StatNumber).
 *  (v4 · xiax-lp-v4-xchair: the hand-built hero agenda is gone, and with it the slot assembly
 *  and the "live" reminder pulse — the hero shows the real app screens now.)
 *
 * ARQUITETURA: cada bloco do storyboard vira uma função local nomeada (XIA-79 · Eixo 9); o
 * callback do `matchMedia` só orquestra a ordem, mantendo-se fino.
 */

const ENTER = "top 85%";
/** The razor's cut point (xiax-lp-v3-razor-3d · design D7): the line it cuts draws mid-screen,
 *  so the 3D razor (scissors-stage) can ride the drawing front. Same point with or without it. */
const CUT_AT = `top ${RAZOR.cutAtVh * 100}%`;
const TOGGLE = "play none none reverse";

type InHero = (el: Element) => boolean;

// ---- 1. Reveals de bloco (fora do hero) — entrada no scroll ------------------
function blockReveals(inHero: InHero) {
  gsap.utils.toArray<HTMLElement>(".reveal").forEach((el) => {
    if (inHero(el)) return;
    gsap.fromTo(
      el,
      { autoAlpha: 0, y: 16 },
      {
        autoAlpha: 1,
        y: 0,
        duration: DUR.reveal,
        ease: EASE_GSAP.standard,
        scrollTrigger: { trigger: el, start: ENTER, toggleActions: TOGGLE },
      },
    );
  });
}

// ---- 2. Stagger de grupos (fora do hero) — cascata no scroll -----------------
function groupStaggers(inHero: InHero) {
  gsap.utils.toArray<HTMLElement>(".reveal-group").forEach((group) => {
    if (inHero(group)) return;
    const items = group.querySelectorAll<HTMLElement>(".reveal-item");
    if (!items.length) return;
    gsap.fromTo(
      items,
      { autoAlpha: 0, y: 16 },
      {
        autoAlpha: 1,
        y: 0,
        duration: DUR.reveal,
        ease: EASE_GSAP.standard,
        stagger: STAGGER.base,
        scrollTrigger: { trigger: group, start: ENTER, toggleActions: TOGGLE },
      },
    );
  });
}

// ---- 4. HERO — abertura cerimonial na carga (acima da dobra) -----------------
// `media`/`mediaH` chegam MEDIDOS de fora (fase measure→mutate, XIA-82): a leitura
// de layout (offsetHeight) acontece ANTES de qualquer tween mutar o DOM → zero reflow forçado.
function heroTimeline(hero: HTMLElement, media: HTMLElement | null, mediaH: number) {
  const h1 = hero.querySelector<HTMLElement>("h1");
  // sub-headline (<p>) = elemento LCP. NÃO recebe intro: com o init adiado (XIA-82)
  // ele já pintou em opacidade cheia; qualquer `fromTo` o esconderia (autoAlpha:0 →
  // flash) ou o saltaria (y → jump) DEPOIS do paint (XIA-85/87). Vital vence: fica
  // em opacity 1, no lugar, desde o paint. A abertura cerimonial segue no h1 (clip),
  // no mockup (reveal) e no checklist (stagger) ao redor — intenção intacta.
  const checks = hero.querySelectorAll<HTMLElement>(".reveal-group .reveal-item");
  const mediaWrap = hero.querySelector<HTMLElement>(".reveal"); // wrapper do mockup

  const tl = gsap.timeline({ defaults: { ease: EASE_GSAP.standard } });
  if (h1) {
    tl.fromTo(
      h1,
      { clipPath: CLIP.hiddenUp, y: 24, autoAlpha: 1 },
      {
        clipPath: CLIP.shown,
        y: 0,
        duration: DUR.hero,
        ease: EASE_GSAP.hero,
        // `CLIP.shown` é `inset(0 0 0 0)` — revela 100% do texto, mas CONTINUA
        // sendo um clip na borda da caixa: o que desenhar fora dela seria decepado.
        // Limpar a prop no fim tira o clip do caminho. A timeline não tem
        // ScrollTrigger e nunca reverte, então o `fromTo` não precisa do valor
        // final preservado. XIA-120.
        onComplete: () => gsap.set(h1, { clipPath: "none" }),
      },
      0,
    );
  }
  if (mediaWrap) {
    tl.fromTo(
      mediaWrap,
      { autoAlpha: 0, y: 20 },
      { autoAlpha: 1, y: 0, duration: DUR.revealSlow, ease: EASE_GSAP.out },
      0.3,
    );
  }
  if (checks.length) {
    tl.fromTo(
      checks,
      { autoAlpha: 0, y: 12 },
      { autoAlpha: 1, y: 0, duration: DUR.reveal, stagger: STAGGER.base },
      0.5,
    );
  }

  // Parallax do mockup (medium) — em elemento INTERNO (yPercent) p/ não brigar
  // com o reveal do wrapper. scrub numérico, decorativo. `mediaH` já foi medido
  // na fase MEASURE (sem reflow); guard contra 0 evita yPercent Infinity.
  if (media) {
    gsap.fromTo(
      media,
      { yPercent: 0 },
      {
        yPercent: mediaH ? -(PARALLAX.medium / mediaH) * 100 : -6,
        ease: "none",
        scrollTrigger: {
          trigger: hero,
          start: "top top",
          end: "bottom top",
          scrub: SCRUB.base,
        },
      },
    );
  }
}

// ---- 5. Galeria — parallax inside each clipped frame (v3 · design D6) ---------
// The frame no longer moves (it is the depth stage that tilts); its images do, like a view
// through a window: the plate lags the page most, the cut-out subject a little less (so it
// reads nearer), and a whole photo drifts like the plate. Each layer zooms just enough that
// no frame edge ever shows.
const GALLERY_LAYER_KINDS: readonly GalleryLayerKind[] = ["plate", "subject", "full"];

function galleryParallax() {
  gsap.utils.toArray<HTMLElement>("#galeria [data-gallery-layer]").forEach((layer) => {
    const kind = GALLERY_LAYER_KINDS.find((k) => k === layer.dataset.galleryLayer);
    if (!kind) return;
    const motion = galleryLayerMotion(kind, DEPTH.galleryShiftPct, DEPTH.gallerySubjectFactor);
    gsap.fromTo(
      layer,
      { yPercent: motion.fromYPercent, scale: motion.scale },
      {
        yPercent: motion.toYPercent,
        ease: "none",
        scrollTrigger: {
          trigger: layer.closest("[data-slot]") ?? layer,
          start: "top bottom",
          end: "bottom top",
          scrub: SCRUB.loose,
        },
      },
    );
  });
}

// ---- 5b. Como funciona — each mini screen plays its step once (v3 · design D12) --
// `delays` arrive MEASURED (storyDelays over the screens' tops): side by side, the three
// screens play 1 → 2 → 3 as one story; stacked on a phone, each starts as it scrolls in.
// Every tween ends with clearProps so no inline transform is left behind.
// A horizontal line (the thread ≥md, the phone hairline) is the razor's cut line: it draws at
// CUT_AT at the cut's pace, and side by side the screens start with it — the cut sets the
// steps going. The vertical thread (cards stacked) draws as it enters, like any reveal.
// All of it plays again on each way down (owner, 2026-10-28): see rewindWhenLeftBelow.
// xiax-lp-v5-salon (D7): the pace is the page's tool's — the razor's cut, the brush's slower roll.
function drawLine(line: HTMLElement | null, axis: "x" | "y"): gsap.core.Tween | null {
  if (!line) return null;
  const isCut = axis === "x";
  const scale = isCut ? "scaleX" : "scaleY";
  const tool = SWEEP_TOOLS[sweepToolOf(document.querySelector<HTMLElement>("#como-funciona")?.dataset.sweepTool) ?? "razor"];
  return gsap.fromTo(
    line,
    { [scale]: 0 },
    {
      [scale]: 1,
      duration: isCut ? tool.drawS : DUR.revealSlow,
      ease: isCut ? tool.drawEase : EASE_GSAP.standard,
      clearProps: "transform",
      scrollTrigger: { trigger: line, start: isCut ? CUT_AT : ENTER, toggleActions: "play none none none" },
    },
  );
}

/** `cutLine`: start with the cut (cards side by side); null: start as the screen enters. */
function stepScreen(screen: HTMLElement, delay: number, cutLine: HTMLElement | null): gsap.core.Timeline {
  const q = gsap.utils.selector(screen);
  const rise = { autoAlpha: 0, y: STEPS.riseYPx };
  const settle = { autoAlpha: 1, y: 0, clearProps: "transform" };
  const start = cutLine
    ? { trigger: cutLine, start: CUT_AT }
    : { trigger: screen, start: ENTER };
  const tl = gsap.timeline({
    defaults: { duration: DUR.microIn, ease: EASE_GSAP.standard },
    scrollTrigger: { ...start, toggleActions: "play none none none" },
  });
  tl.fromTo(q("[data-step-in]"), rise, { ...settle, stagger: STAGGER.tight }, delay);
  q("[data-step-key]").forEach((key: HTMLElement) => {
    const from = key.dataset.stepKey === "drop" ? { autoAlpha: 0, y: -STEPS.dropYPx } : { autoAlpha: 0, scale: STEPS.popFromScale };
    tl.fromTo(key, from, { autoAlpha: 1, y: 0, scale: 1, ease: EASE_GSAP.pop, clearProps: "transform" }, ">");
  });
  const typing = q("[data-step-typing]");
  if (typing.length) {
    tl.fromTo(typing, { autoAlpha: 0 }, { autoAlpha: 1 }, ">").to(typing, { autoAlpha: 0 }, `>+${STEPS.typingHoldS}`);
  }
  const after = q("[data-step-after]");
  if (after.length) tl.fromTo(after, rise, settle, ">");
  return tl;
}

/**
 * Once the cut line drops back out of view below (the visitor went up past the section), the
 * section's one-shot animations rewind there, out of sight, so the next way down plays them
 * again. The razor follows: a line back at nothing re-arms its cut (design D4). Coming back
 * up from below plays nothing — the line stays cut.
 */
function rewindWhenLeftBelow(cutLine: HTMLElement | null, animations: (gsap.core.Animation | null)[]) {
  if (!cutLine) return;
  ScrollTrigger.create({
    trigger: cutLine,
    start: `top ${RAZOR.approachFromVh * 100}%`,
    onLeaveBack: () => animations.forEach((animation) => animation?.pause(0)),
  });
}

/** Layout reads for #como-funciona, taken in the MEASURE phase (before any mutation). */
function measureSteps() {
  const thread = document.querySelector<HTMLElement>("#como-funciona [data-step-thread]");
  const hairline = document.querySelector<HTMLElement>("#como-funciona [data-cut-line]");
  const screens = gsap.utils.toArray<HTMLElement>("#como-funciona [data-step-screen]");
  return {
    thread,
    threadVertical: (thread?.offsetWidth ?? 0) <= 1,
    hairline: (hairline?.offsetWidth ?? 0) > 1 ? hairline : null,
    screens,
    delays: storyDelays(screens.map((el) => el.getBoundingClientRect().top), STEPS.storyGapS),
  };
}

/** Lines, step screens and their rewind (MUTATE phase), from `measureSteps`. */
function stepsMotion({ thread, threadVertical, hairline, screens, delays }: ReturnType<typeof measureSteps>) {
  const threadDraw = drawLine(thread, threadVertical ? "y" : "x");
  const hairlineDraw = drawLine(hairline, "x");
  const screensStartWith = threadVertical ? null : thread;
  const screenPlays = screens.map((screen, i) => stepScreen(screen, delays[i] ?? 0, screensStartWith));
  rewindWhenLeftBelow(hairline ?? thread, [threadDraw, hairlineDraw, ...screenPlays]);
}

// ---- 6. Planos — pop do selo "mais popular" na entrada ----------------------
function popularFlagPop() {
  const popularFlag = document.querySelector<HTMLElement>(
    "#planos [data-popular-flag]",
  );
  if (!popularFlag) return;
  gsap.fromTo(
    popularFlag,
    { autoAlpha: 0, scale: 0.6 },
    {
      autoAlpha: 1,
      scale: 1,
      duration: DUR.microIn,
      ease: EASE_GSAP.pop, // token canônico (DS) — fecha D1; preserva o overshoot aprovado.
      scrollTrigger: { trigger: "#planos", start: "top 70%" },
    },
  );
}

// ---- 7. Count-up (ativa quando o ui-engineer expuser [data-count-num]) -------
// The number's own text never changes: it stays at its final, server-rendered value
// (made transparent) and the counting digits are drawn by an absolutely positioned,
// aria-hidden copy on top. Text that changed width in the flow would push whatever
// follows it ("+", "%") on every frame — a layout shift.
interface CountOverlay {
  start(): void;
  set(text: string): void;
  end(): void;
}

function countOverlay(el: HTMLElement): CountOverlay {
  const live = document.createElement("span");
  live.setAttribute("aria-hidden", "true");
  return {
    start() {
      live.style.cssText = `position:absolute;top:0;inset-inline-start:0;white-space:nowrap;color:${getComputedStyle(el).color}`;
      el.style.position = "relative";
      el.style.color = "transparent";
      el.append(live);
    },
    set(text) {
      live.textContent = text;
    },
    end() {
      live.remove();
      el.style.removeProperty("position");
      el.style.removeProperty("color");
    },
  };
}

/** Starts every count-up; the returned cleanup puts the real numbers back if motion is reverted mid-count. */
function countUp(): () => void {
  const overlays: CountOverlay[] = [];
  gsap.utils.toArray<HTMLElement>("[data-count-num]").forEach((el) => {
    const to = parseFloat(el.dataset.countTo ?? el.textContent ?? "0");
    if (!Number.isFinite(to)) return;
    const dec = parseInt(el.dataset.countDecimals ?? "0", 10);
    const format = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
    const overlay = countOverlay(el);
    overlays.push(overlay);
    const state = { v: 0 };
    gsap.to(state, {
      v: to,
      duration: DUR.revealSlow,
      ease: EASE_GSAP.out,
      scrollTrigger: {
        trigger: el,
        start: ENTER,
        toggleActions: "play none none none",
      },
      onStart: overlay.start,
      onUpdate: () => overlay.set(format(state.v)),
      onComplete: overlay.end,
    });
  });
  return () => overlays.forEach((overlay) => overlay.end());
}

export function MotionChoreography() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const root = document.documentElement;
    const forceReduced =
      new URLSearchParams(window.location.search).get("reduced") === "1";

    const mm = gsap.matchMedia();

    mm.add(
      {
        reduce: "(prefers-reduced-motion: reduce)",
        ok: "(prefers-reduced-motion: no-preference)",
      },
      (ctx) => {
        const reduced = Boolean(ctx.conditions?.reduce) || forceReduced;

        // Reduced: só toma posse (tier CSS sai por :not(.gsap-live)); conteúdo 100%
        // visível, zero movimento. Antecipado p/ não medir layout à toa.
        if (reduced) {
          root.classList.add("gsap-live");
          return;
        }

        const hero = document.querySelector<HTMLElement>("#hero");
        const inHero: InHero = (el) => !!hero && hero.contains(el);
        const heroMedia = hero?.querySelector<HTMLElement>("[data-hero-media]") ?? null;

        // ── MEASURE (XIA-82 · NIT forced-reflow) ─────────────────────────────
        // TODAS as leituras de layout ANTES de qualquer mutação (classList/tweens):
        // measure→mutate elimina o reflow forçado (~35ms) de ler geometria após
        // mutar o DOM. Ler antes do `gsap-live` é seguro: o estado escondido do
        // reveal é só opacity+transform (não altera offsetHeight).
        const heroMediaH = heroMedia?.offsetHeight ?? 0;
        const steps = measureSteps();

        // ── MUTATE ───────────────────────────────────────────────────────────
        // Posse: o GSAP assume os reveals (o tier CSS sai por :not(.gsap-live)).
        root.classList.add("gsap-live");

        blockReveals(inHero);
        groupStaggers(inHero);
        if (hero) heroTimeline(hero, heroMedia, heroMediaH);
        stepsMotion(steps);
        galleryParallax();
        popularFlagPop();
        const countCleanup = countUp();

        ScrollTrigger.refresh();
        return countCleanup;
      },
    );

    return () => mm.revert();
  }, []);

  // The scissors rail moved to ScissorsStage (xiax-lp-v3-scissors-3d · design D7).
  return null;
}
