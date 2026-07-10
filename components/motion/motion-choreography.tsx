"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  DUR,
  SCRUB,
  STAGGER,
  EASE_GSAP,
  CLIP,
  PARALLAX,
  SCISSORS,
  mq,
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

// ---- 9. Trilho da tesoura (scroll-cut) — decisão do cliente ------------------
// A tesoura desce/sobe pela LATERAL DIREITA ligada ao scroll, "cortando a página":
// uma linha fina de latão é DESENHADA atrás dela (stroke-dashoffset, o único jeito de
// "cortar" — sem rastro a tesoura só desliza) e ao INVERTER o scroll ela gira 180° e
// aponta p/ cima (a lâmina sempre lidera). As lâminas abrem/fecham no scroll ("snip").
//
// FORA-DE-CLIP (armadilha do brief): o SVG é `position: fixed` na gutter, filho DIRETO
// do <body> (o SmoothScrollProvider não renderiza DOM) — nenhum ancestral tem transform/
// contain/filter/overflow que o corte; ele NÃO mora dentro de nenhuma <section> com
// `overflow-x-clip`. CLS 0 (fora do fluxo). Só `transform`/`opacity` + `stroke-dashoffset`.
// Lateral DIREITA: a coluna de texto ocupa a gutter esquerda em TODA seção; a direita só
// tem o AgendaMock (sangra) no #hero — 10/11 seções têm a gutter direita livre.

// Geometria do SVG da tesoura (pareia com o markup): pivô do rivet no viewBox 48×104.
const SCISSORS_PIVOT = "24 46";

function selectRail(rail: HTMLElement) {
  return {
    line: rail.querySelector<HTMLElement>("[data-scissors-line]"),
    scissors: rail.querySelector<HTMLElement>("[data-scissors]"),
    bladeL: rail.querySelector<SVGGElement>('[data-blade="l"]'),
    bladeR: rail.querySelector<SVGGElement>('[data-blade="r"]'),
  };
}

// 9a. Ramo ATIVO (≥md, sem reduced): tesoura ligada ao scroll.
function scissorsRail(rail: HTMLElement) {
  const { line, scissors, bladeL, bladeR } = selectRail(rail);
  if (!line || !scissors || !bladeL || !bladeR) return;

  // A tesoura PARA no topo do footer (a divisória `poste-hair`), não invade o rodapé:
  // encurta o rail fixed pela altura do footer. Como o curso da tesoura e o `h-full` da
  // linha derivam de `rail.clientHeight`, ambos se ajustam sozinhos → no fim do scroll a
  // lâmina descansa exatamente na divisória. XIA-123.
  const footer = document.querySelector<HTMLElement>("footer");
  rail.style.bottom = footer ? `${footer.offsetHeight}px` : "0px";

  // Estado inicial: rastro ainda não cortado (scaleY 0, cresce p/ 1), tesoura no topo
  // apontando p/ baixo. Centragem X é do wrapper flex — o GSAP só mexe em `y`/`rotation`.
  gsap.set(scissors, { y: 0, rotation: 0 });
  gsap.set(line, { clipPath: "inset(0px 0px 100% 0px)" });
  gsap.set([bladeL, bladeR], { svgOrigin: SCISSORS_PIVOT, rotation: 0 });

  // Flip 180° ao inverter a direção — `quickTo` é sancionado fora de timeline (gate 4)
  // e reaproveita o tween (barato). Tween por tempo → ease NÃO-linear (token do DS).
  const flipTo = gsap.quickTo(scissors, "rotation", {
    duration: DUR.microIn,
    ease: EASE_GSAP.standard,
  });
  let dir = 1;

  // O rastro fica sempre À FRENTE da tesoura, na direção do movimento (pedido do cliente):
  //  - DESCENDO: a tesoura lidera no topo e o rastro se estende ABAIXO dela, no caminho a
  //    percorrer → clipa o trecho ACIMA da lâmina (`inset(top …)`).
  //  - SUBINDO: a tesoura corta o rastro de baixo p/ cima → clipa o trecho ABAIXO da
  //    lâmina (`inset(bottom …)`), o comportamento que o cliente aprovou.
  // Por isso o clip é dirigido no onUpdate (depende da direção), não num tween linear.
  const applyLineClip = (d: number, p: number) => {
    const clip =
      d === -1
        ? `inset(0px 0px ${(1 - p) * 100}% 0px)` // subindo: corta de baixo
        : `inset(${p * 100}% 0px 0px 0px)`; //        descendo: rastro à frente
    gsap.set(line, { clipPath: clip });
  };
  applyLineClip(1, 0); // topo, descendo: rastro inteiro à frente (tesoura no topo)

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: document.documentElement,
      start: "top top",
      end: "bottom bottom",
      scrub: SCRUB.base, // numérico (nunca `true`)
      invalidateOnRefresh: true, // re-mede o curso da tesoura em resize/rotate
      onUpdate: (self) => {
        // Direção: gira a tesoura (a lâmina passa a liderar o sentido do movimento).
        if (self.direction !== dir) {
          dir = self.direction;
          flipTo(dir === -1 ? SCISSORS.flipDeg : 0);
        }
        applyLineClip(dir, self.progress);
        // "Corte": lâminas abrem/fecham conforme percorre a página. sin²(p·snips·π)
        // fica ≥0 e faz `snips` ciclos abre-fecha suaves; 0 = repouso (lâmina aberta).
        const theta =
          Math.sin(self.progress * SCISSORS.snips * Math.PI) ** 2 * SCISSORS.snipDeg;
        gsap.set(bladeL, { rotation: theta });
        gsap.set(bladeR, { rotation: -theta });
      },
    },
  });
  // Curso da tesoura medido por função → recalcula no refresh sem magic number.
  tl.to(
    scissors,
    { y: () => rail.clientHeight - scissors.offsetHeight, ease: "none" },
    0,
  );
}

// 9b. Ramo ESTÁTICO (reduced-motion / ?reduced=1): sem movimento. Decisão: a LINHA
// fica inteira desenhada (o corte é o que vende a metáfora — mantê-lo estático preserva
// a identidade) e a tesoura repousa no topo, apontando p/ baixo. Conteúdo intacto.
function scissorsStatic(rail: HTMLElement) {
  const { line, scissors } = selectRail(rail);
  if (line) gsap.set(line, { clipPath: "inset(0px 0px 0% 0px)" });
  if (scissors) gsap.set(scissors, { y: 0, rotation: 0 });
}

export function MotionChoreography() {
  const railRef = useRef<HTMLDivElement>(null);

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

        ScrollTrigger.refresh();
      },
    );

    // Trilho da tesoura (scroll-cut) — registro SEPARADO com gate de largura próprio:
    // só existe ≥md (mobile: sem gutter livre → o CSS `hidden md:block` já o esconde e
    // aqui nem construímos os triggers). Reduced/?reduced=1 → ramo estático (linha inteira).
    mm.add(
      {
        reduce: "(prefers-reduced-motion: reduce)",
        ok: "(prefers-reduced-motion: no-preference)",
        isDesktop: mq("md"),
      },
      (ctx) => {
        const rail = railRef.current;
        if (!rail || !ctx.conditions?.isDesktop) return;
        const reduced = Boolean(ctx.conditions?.reduce) || forceReduced;
        if (reduced) {
          scissorsStatic(rail);
          return;
        }
        scissorsRail(rail);
      },
    );

    return () => {
      roughCleanup();
      mm.revert();
    };
  }, []);

  // SVG decorativo puro (aria-hidden, pointer-events:none) — `position: fixed` na gutter
  // direita, fora de qualquer <section> (nada o corta). `hidden md:block`: sem tesoura no
  // mobile. CLS 0 (fora do fluxo). `text-accent` = latão (token do DS) via currentColor.
  return (
    <div
      ref={railRef}
      aria-hidden="true"
      className="pointer-events-none fixed right-0 z-rail hidden w-[clamp(48px,6vw,72px)] text-accent md:block"
      style={{ top: "var(--header-h)", bottom: 0 }}
    >
      {/* Linha do corte — o "rastro" pontilhado e discreto que a tesoura vai deixando.
          Os traços são um `repeating-linear-gradient` de altura fixa (não distorce), e a
          REVELAÇÃO de cima p/ baixo é via `clip-path: inset()` (a ponta acompanha a
          tesoura). clip-path com % não sofre o autoRound do GSAP (que arredonda px), e a
          área pintada é só 1px de largura — sem o custo de repaint do stroke-dashoffset
          que derrubava o FPS. XIA-122. */}
      <div
        data-scissors-line
        className="absolute top-0 h-full w-px"
        style={{
          left: "calc(50% - 0.5px)",
          opacity: 0.4,
          backgroundImage:
            "repeating-linear-gradient(to bottom, currentColor 0 2px, transparent 2px 8px)",
          clipPath: "inset(0 0 100% 0)",
        }}
      />

      {/* Wrapper de CENTRAGEM (flexbox, sem transform) → o GSAP fica dono só de `y`/
          `rotation` na tesoura, sem conflitar com centragem nem piscar fora do eixo. */}
      <div className="absolute inset-x-0 top-0 flex justify-center">
        {/* Tesoura — SVG de aspecto FIXO (viewBox 48×104), transladada em px pelo scroll;
            gira 180° ao subir. Lâminas = dois <g> que giram no pivô do rivet (SCISSORS_PIVOT). */}
        <div data-scissors className="w-[clamp(20px,2.4vw,28px)]">
          <svg viewBox="0 0 48 104" fill="none" className="h-auto w-full">
            <g
              data-blade="l"
              stroke="currentColor"
              strokeWidth={3.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="15" cy="12" r="6.5" />
              <path d="M15 18 L24 46 L30 98" />
            </g>
            <g
              data-blade="r"
              stroke="currentColor"
              strokeWidth={3.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="33" cy="12" r="6.5" />
              <path d="M33 18 L24 46 L18 98" />
            </g>
            <circle cx="24" cy="46" r="2.8" fill="currentColor" />
          </svg>
        </div>
      </div>
    </div>
  );
}
