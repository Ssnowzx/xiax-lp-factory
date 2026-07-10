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
  MOTIF,
} from "@/lib/motion/motion-tokens";
import { runRoughNotations } from "@/lib/motion/rough-notations";

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
 * GSAP assume os mesmos alvos (sem double-drive). Os desenhos decorativos (mark-brass/hair-draw/
 * acordeão) seguem no CSS — não são escopados por `:not(.gsap-live)`.
 *
 * HOOKS DEFENSIVOS (ligam sozinhos quando as dependências chegarem, sem quebrar o build):
 *  - count-up: ativa em `[data-count-num]` (hook do `ui-engineer` no StatNumber).
 *  - lembrete "vivo": ativa em `[data-agenda-pulse]` + var CSS `--dur-loop` (hook `ui-engineer` +
 *    token `DUR.loop`/`--dur-loop` do `design-system-architect`).
 *
 * ARQUITETURA: cada bloco do storyboard vira uma função local nomeada (XIA-79 · Eixo 9); o
 * callback do `matchMedia` só orquestra a ordem, mantendo-se fino.
 */

const ENTER = "top 85%";
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

// ---- 3. Depoimentos (sem wrapper .reveal no markup) — reveal sutil -----------
function testimonialReveal() {
  const depoItems = gsap.utils.toArray<HTMLElement>("#depoimentos ul > li");
  if (!depoItems.length) return;
  gsap.fromTo(
    depoItems,
    { autoAlpha: 0, y: 16 },
    {
      autoAlpha: 1,
      y: 0,
      duration: DUR.reveal,
      ease: EASE_GSAP.out,
      stagger: STAGGER.base,
      scrollTrigger: {
        trigger: "#depoimentos",
        start: "top 80%",
        toggleActions: TOGGLE,
      },
    },
  );
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
        // sendo um clip na borda da caixa. O `rough-notation` appenda o SVG do
        // círculo DENTRO do h1, e a elipse de "zero" vaza ~34px abaixo dele:
        // esses 34px eram decepados. Limpar a prop no fim tira o clip do
        // caminho. A timeline não tem ScrollTrigger e nunca reverte, então o
        // `fromTo` não precisa do valor final preservado. XIA-120.
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

// ---- 5. Galeria — parallax leve por slot (soft), profundidade alternada ------
function galleryParallax() {
  gsap.utils
    .toArray<HTMLElement>("#galeria .media-frame")
    .forEach((frame, i) => {
      const depth = i % 2 === 0 ? PARALLAX.soft : PARALLAX.soft * 0.6;
      gsap.fromTo(
        frame,
        { yPercent: depth * 0.15 },
        {
          yPercent: -depth * 0.15,
          ease: "none",
          scrollTrigger: {
            trigger: frame,
            start: "top bottom",
            end: "bottom top",
            scrub: SCRUB.loose,
          },
        },
      );
    });
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
function countUp() {
  gsap.utils.toArray<HTMLElement>("[data-count-num]").forEach((el) => {
    const to = parseFloat(el.dataset.countTo ?? el.textContent ?? "0");
    if (!Number.isFinite(to)) return;
    const dec = parseInt(el.dataset.countDecimals ?? "0", 10);
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
      onUpdate: () => {
        el.textContent = state.v.toLocaleString("pt-BR", {
          minimumFractionDigits: dec,
          maximumFractionDigits: dec,
        });
      },
    });
  });
}

// ---- 8. Lembrete "vivo" (ativa com [data-agenda-pulse] + var --dur-loop) -----
// `loopDur` chega MEDIDO de fora (fase measure→mutate, XIA-82): o `getComputedStyle`
// do --dur-loop roda ANTES das mutações do build → não força recalc depois delas.
function livePulse(loopDur: number) {
  const pulse = document.querySelector<HTMLElement>("[data-agenda-pulse]");
  if (!pulse || !Number.isFinite(loopDur) || loopDur <= 0) return;
  gsap.to(pulse, {
    scale: 1.08,
    autoAlpha: 0.72,
    transformOrigin: "center",
    duration: loopDur,
    ease: EASE_GSAP.loop, // token canônico (DS) — fecha o magic number do XIA-74.
    repeat: -1,
    yoyo: true,
    scrollTrigger: {
      trigger: pulse,
      start: "top bottom",
      end: "bottom top",
      toggleActions: "play pause resume pause",
    },
  });
}

// ---- 9. Motivos barber (XIA-136) — camada de personalidade ------------------
// Hooks defensivos: ligam sozinhos quando o `ui-engineer` marcou `[data-motif=...]`
// (no-op sem alvo). Só `transform`/`opacity`. Subconjunto Spec §4 — cantos de card
// NÃO recebem `data-motif` (ficam estáticos por construção).

// 9a. Atrás-de-título (#numeros/#preco-fixo/#faq): parallax leve no scroll (translateY
// ≤12px, sem rotação). `y` em px direto → sem medir layout. scrub decorativo (loose).
function motifParallax() {
  gsap.utils.toArray<HTMLElement>('[data-motif="parallax"]').forEach((el) => {
    const sec = el.closest("section") ?? el;
    gsap.fromTo(
      el,
      { y: MOTIF.parallax },
      {
        y: -MOTIF.parallax,
        ease: "none",
        scrollTrigger: {
          trigger: sec,
          start: "top bottom",
          end: "bottom top",
          scrub: SCRUB.loose,
        },
      },
    );
  });
}

// 9b. #hero barber-pole: brilho suave (pulso de opacidade 0.04↔0.07, loop lento) +
// parallax leve no scroll. Gesto "vivo, mas ao fundo".
function motifHeroPole() {
  const pole = document.querySelector<HTMLElement>('[data-motif="glow"]');
  if (!pole) return;
  gsap.fromTo(
    pole,
    { opacity: MOTIF.glowMin },
    {
      opacity: MOTIF.glowMax,
      duration: DUR.loop,
      ease: EASE_GSAP.loop,
      repeat: -1,
      yoyo: true,
    },
  );
  gsap.fromTo(
    pole,
    { y: MOTIF.parallax },
    {
      y: -MOTIF.parallax,
      ease: "none",
      scrollTrigger: {
        trigger: "#hero",
        start: "top top",
        end: "bottom top",
        scrub: SCRUB.loose,
      },
    },
  );
}

// 9c. #final scissors: floating sutil (translateY ≤6px, loop lento) — bookend do hero.
function motifFloat() {
  const el = document.querySelector<HTMLElement>('[data-motif="float"]');
  if (!el) return;
  gsap.fromTo(
    el,
    { y: MOTIF.float },
    {
      y: -MOTIF.float,
      duration: DUR.loop,
      ease: EASE_GSAP.loop,
      repeat: -1,
      yoyo: true,
    },
  );
}

export function MotionChoreography() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const root = document.documentElement;
    const forceReduced =
      new URLSearchParams(window.location.search).get("reduced") === "1";

    const mm = gsap.matchMedia();
    // ASSENTO rough-notation (WS3): cleanup fora do ciclo GSAP (SVGs no body não são
    // revertidos por mm.revert()). Re-armado a cada callback, limpo no teardown.
    let roughCleanup: () => void = () => {};

    mm.add(
      {
        reduce: "(prefers-reduced-motion: reduce)",
        ok: "(prefers-reduced-motion: no-preference)",
      },
      (ctx) => {
        const reduced = Boolean(ctx.conditions?.reduce) || forceReduced;

        // rough-notation roda nos DOIS ramos: reduced → estado final instantâneo
        // (animate:false). No-op se o motion-engineer ainda não marcou alvos.
        roughCleanup();
        roughCleanup = runRoughNotations({ reduced });

        // Reduced: só toma posse (tier CSS sai por :not(.gsap-live)); conteúdo 100%
        // visível, zero movimento. Antecipado p/ não medir layout à toa.
        if (reduced) {
          root.classList.add("gsap-live");
          return;
        }

        const hero = document.querySelector<HTMLElement>("#hero");
        const inHero: InHero = (el) => !!hero && hero.contains(el);
        const heroMedia = hero?.querySelector<HTMLElement>('[role="img"]') ?? null;

        // ── MEASURE (XIA-82 · NIT forced-reflow) ─────────────────────────────
        // TODAS as leituras de layout ANTES de qualquer mutação (classList/tweens):
        // measure→mutate elimina o reflow forçado (~35ms) de ler geometria após
        // mutar o DOM. Ler antes do `gsap-live` é seguro: o estado escondido do
        // reveal é só opacity+transform (não altera offsetHeight).
        const heroMediaH = heroMedia?.offsetHeight ?? 0;
        const loopDur = parseFloat(
          getComputedStyle(root).getPropertyValue("--dur-loop").trim(),
        );

        // ── MUTATE ───────────────────────────────────────────────────────────
        // Posse: o GSAP assume os reveals (o tier CSS sai por :not(.gsap-live)).
        root.classList.add("gsap-live");

        blockReveals(inHero);
        groupStaggers(inHero);
        testimonialReveal();
        if (hero) heroTimeline(hero, heroMedia, heroMediaH);
        galleryParallax();
        popularFlagPop();
        countUp();
        livePulse(loopDur);
        // camada de personalidade barber (XIA-136) — subconjunto Spec §4
        motifParallax();
        motifHeroPole();
        motifFloat();

        ScrollTrigger.refresh();
      },
    );

    return () => {
      roughCleanup();
      mm.revert();
    };
  }, []);

  return null;
}
