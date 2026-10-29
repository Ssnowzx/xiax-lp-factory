/**
 * Design System — LP Xbarber (Flagship V2)  ·  SEAT de motion-tokens (FONTE ÚNICA)
 * ============================================================================
 * Criado pelo `design-system-architect` a partir do **Brief V2 §8** (bandas de
 * motion aprovadas pelo cliente). É a fonte ÚNICA de números de motion — zero
 * magic number solto em componente/timeline.
 *
 * CONTRATO DE PROPRIEDADE (para não haver dois donos do mesmo número):
 *  - O DS define os VALORES (bandas do Brief) e o BP.
 *  - O `motion-engineer` é o DONO DA COREOGRAFIA: decide QUAL reveal/scrub/stagger
 *    vai em QUAL seção (Technical Storyboard) — consumindo estes tokens, sem
 *    reintroduzir literais. Se a coreografia pedir uma banda nova, ela nasce AQUI
 *    (com justificativa contra o Brief), nunca inline na timeline.
 *  - BP mora em `../ui/breakpoints` (dono único). Reexportado aqui só por
 *    conveniência do consumidor de motion (gsap.matchMedia) — o valor não é
 *    redeclarado.
 *
 * REGRAS DE MOTION (Brief V2 §8 · barra de release arbitra):
 *  - Só `transform`/`opacity` animam (ver ANIMATABLE). Nada de width/top/left/filter.
 *  - Reveals via `clip-path`/`mask` (ver CLIP) — o conteúdo NUNCA some (CLS 0).
 *  - `scrub` é sempre NUMÉRICO (0.5–1.5), nunca `true`.
 *  - Nenhuma ease `linear`.
 *  - `prefers-reduced-motion` é gate padrão: conteúdo permanece, movimento zera.
 */
import { BP, BP_PX, mq } from "../ui/breakpoints";

// Reexport do dono único (breakpoints.ts) — gsap.matchMedia lê daqui sem redeclarar.
export { BP, BP_PX, mq };

/**
 * DUR — durações em SEGUNDOS (unidade do GSAP). Bandas fechadas do Brief §8.
 * Escolha a banda pelo PAPEL; não invente valor fora da banda.
 */
export const DUR = {
  /** micro (0.2–0.4s) — hover/focus/active, troca de estado imperceptível-porém-presente. */
  micro: 0.22,
  /** micro de entrada (tooltip/badge/acordeão). */
  microIn: 0.28,
  /** reveal (0.6–0.9s) — entrada de bloco no scroll (stagger de seção). */
  reveal: 0.7,
  /** reveal enfático, topo da banda de reveal. */
  revealSlow: 0.9,
  /** hero (1.0–1.6s) — reveal do H1 / momento de abertura, uma vez por carga. */
  hero: 1.2,
  /** hero no topo da banda (quando o clip-path precisa respirar). */
  heroSlow: 1.5,
  /**
   * loop (banda AMBIENTE, repeat/yoyo infinito) — micro-movimento "vivo" do lembrete
   * WhatsApp na agenda. NÃO é uma entrada única (reveal/hero): é respiração contínua.
   * Justificativa vs. Brief §8: o Brief define bandas de ENTRADA (micro/reveal/hero) mas
   * não previa loop ambiente; a coreografia (Technical Storyboard XIA-61) pediu um pulso
   * "vivo". 2.4s = lento o bastante p/ ler como respiração (não como piscar), ~2× o topo
   * da banda hero — deliberadamente fora das bandas de entrada porque o papel é outro.
   * Arbitragem do Producer (sign-off XIA-61, 473c5ab1): a banda nova nasce AQUI, no DS.
   */
  loop: 2.4,
} as const;
export type Dur = keyof typeof DUR;

/**
 * SCRUB — suavização do ScrollTrigger (0.5–1.5). SEMPRE número, NUNCA `true`.
 * `tight` p/ count-up preciso; `loose` p/ parallax de galeria/decorativos.
 */
export const SCRUB = {
  tight: 0.5,
  base: 1,
  loose: 1.5,
} as const;
export type Scrub = keyof typeof SCRUB;

/** STAGGER — cascata entre irmãos (s). Base ~0.06 (mirror do CSS reveal-group). */
export const STAGGER = {
  tight: 0.04,
  base: 0.06,
  loose: 0.09,
} as const;
export type Stagger = keyof typeof STAGGER;

/**
 * EASE — curvas por PAPEL, em bezier [x1,y1,x2,y2]. NENHUMA é `linear`.
 * `standard`/`dramatic` são as MESMAS do micro-mirror CSS (um valor, uma origem).
 */
export const EASE = {
  /** padrão de estado (mirror de --ease-standard). */
  standard: [0.22, 1, 0.36, 1],
  /** ênfase curta (mirror de --ease-dramatic). */
  dramatic: [0.16, 1, 0.3, 1],
  /** saída suave para transições entre seções. */
  out: [0.33, 1, 0.68, 1],
  /** abertura do hero — desacelera longo no fim (clip-path do H1). */
  hero: [0.16, 0.84, 0.28, 1],
  /**
   * loop ambiente (repeat/yoyo) — simétrica in-out p/ o vai-e-volta parecer respiração.
   * bezier de `sine.inOut` (in e out iguais): sem "puxão" em nenhuma ponta do yoyo.
   */
  loop: [0.37, 0, 0.63, 1],
  /**
   * pop (overshoot de ênfase) — entrada com "estufo" curto do selo "mais popular" (#planos).
   * back.out passa de 1 e assenta: dá a sensação de POP que `dramatic` (expo.out) não dá.
   * O selo foi VISUALMENTE APROVADO com esse overshoot (Fidelity Sign-off XIA-71, rev 66ad9c6d);
   * este token apenas CANONIZA o valor que estava inline (`back.out(2)` em motion-choreography),
   * fechando o desvio D1 — zero magic number solto na timeline.
   * Justificativa vs. Brief §8: as bandas do Brief cobrem entradas suaves (in/out/inOut); um
   * overshoot de ênfase pontual é PAPEL NOVO — nasce AQUI, mesmo precedente do `loop` (arbitrado
   * pelo Producer no sign-off XIA-61). A bezier é aproximação p/ mirror CSS; a string GSAP
   * (`EASE_GSAP.pop = back.out(2)`) é a fonte de verdade que preserva o overshoot aprovado.
   */
  pop: [0.34, 1.8, 0.64, 1],
} as const;
export type Ease = keyof typeof EASE;

/** Mapa opcional de conveniência p/ quem prefere a string GSAP (mesma intenção da bezier). */
export const EASE_GSAP: Record<Ease, string> = {
  standard: "power3.out",
  dramatic: "expo.out",
  out: "power2.out",
  hero: "power4.out",
  loop: "sine.inOut",
  pop: "back.out(2)",
} as const;

/** Serializa uma bezier em string CSS `cubic-bezier(...)` — usado no mirror e em CSS-in-JS. */
export const cubic = (e: readonly [number, number, number, number]) =>
  `cubic-bezier(${e[0]}, ${e[1]}, ${e[2]}, ${e[3]})`;

/**
 * CLIP — presets de clip-path para reveals (o conteúdo permanece no fluxo; só a
 * máscara anima). Direção pelo papel. `shown` sempre revela 100%.
 */
export const CLIP = {
  shown: "inset(0 0 0 0)",
  /** entra de baixo (reveal de bloco padrão). */
  hiddenUp: "inset(0 0 100% 0)",
  /** entra da esquerda (sublinhado/hairline; H1 wipe). */
  hiddenLeft: "inset(0 100% 0 0)",
  /** entra revelando de cima (menos comum). */
  hiddenDown: "inset(100% 0 0 0)",
} as const;
export type Clip = keyof typeof CLIP;

/** Propriedades cuja animação é PERMITID A (perf gate). Fora desta lista → QA rejeita. */
export const ANIMATABLE = ["transform", "opacity", "clip-path"] as const;

/**
 * SCISSORS — "trilho da tesoura" (scroll-cut). Decisão fechada com o cliente: uma
 * tesoura ligada ao scroll desce/sobe pela lateral direita "cortando a página" e
 * desenha uma LINHA de latão atrás (stroke-dashoffset num SVG fixo, fora do fluxo);
 * ao inverter o scroll ela gira 180° (a lâmina sempre lidera o sentido do movimento).
 * As amplitudes/ritmo do CORTE nascem AQUI (seat), nunca inline na timeline — mesmo
 * precedente de `loop`/`pop`. Só `transform`/`opacity`; scrub numérico; reduced-motion
 * → estático (linha inteira desenhada, tesoura em repouso).
 *
 * Justificativa vs. Brief §8: papel NOVO (gimmick decorativo de scroll pedido pelo
 * cliente), fora das bandas de ENTRADA (micro/reveal/hero) — é micro-movimento CONTÍNUO
 * dirigido pelo scroll, análogo ao `loop` ambiente. Graus deliberadamente pequenos
 * ("corta, mas não distrai da conversão"); a tesoura vive só na gutter (≥md).
 */
export const SCISSORS = {
  /** amplitude de abertura/fechamento das lâminas por "snip" (graus). Baixo de
   *  propósito: acima de ~6° os anéis (cabos) se cruzam, o que uma tesoura real não
   *  faz — o cliente pediu um fechamento mais contido. */
  snipDeg: 5,
  /** nº de snips (ciclos abre-fecha) ao longo da página inteira — ritmo do corte. */
  snips: 16,
  /** rotação ao inverter o scroll: a tesoura vira e a lâmina passa a apontar p/ cima. */
  flipDeg: 180,

  // v3 · 3D scissors (change xiax-lp-v3-scissors-3d · design D5). Sizes are the on-screen
  // length of the model (ring top → blade tip). snipDeg may go up after visual review:
  // the 3D rings sit on different depths and do not cross like the old SVG strokes did.
  /** on-screen length (px) while opening the page in the hero. */
  heroLengthPx: 220,
  /** on-screen length (px) on the right rail. */
  railLengthPx: 64,
  /** on-screen length (px) in the mobile corner: small enough to live in the page's right
   *  margin (7vw), off the content column (owner, 2026-10-28: "menor e mais no canto"). */
  mobileLengthPx: 34,
  /** gap (px) between the mobile scissors and the viewport edges / CTA bar. */
  mobileMarginPx: 8,
  /** half the upright model's on-screen width over its length (the rings, measured). */
  mobileHalfWidthFrac: 0.18,
  /** ambient spin speed (deg/s) around the vertical axis, hero only. */
  heroSpinDegPerSec: 18,
  /** resting in-plane angle (deg) in the hero — diagonal reads as "about to cut". */
  heroTiltZDeg: -28,
  /** max lean (deg) toward the pointer. */
  pointerTiltDeg: 10,
  /** distance (px) from the scissors at which the pointer lean saturates. */
  pointerRadiusPx: 360,
  /** fraction of the hero height scrolled when the hero → rail transition starts… */
  transitionStart: 0.55,
  /** …and ends. */
  transitionEnd: 1,
  /** rivet position along the model, from the ring top (0) to the blade tip (1). */
  pivotFromTop: 0.4,
  /** device-pixel-ratio cap for the WebGL canvas (GPU memory on a full-screen canvas). */
  maxDpr: 1.75,
} as const;

/**
 * PARALLAX — amplitude MÁXIMA de deslocamento (px de translate) por papel.
 * Galeria/decorativos usam `soft`; o mockup de agenda `medium`. Sempre via transform.
 */
export const PARALLAX = {
  soft: 24,
  medium: 40,
} as const;
export type Parallax = keyof typeof PARALLAX;

/**
 * DEPTH — 2.5D depth cards (change xiax-lp-v3-cards-25d). Only the card's inner stage
 * animates (rotateX/rotateY); layers sit at static translateZ heights, so tilting the
 * stage separates them like a diorama. Same precedent as `loop`/`pop`/`SCISSORS`: a new
 * role (continuous pointer/scroll-driven tilt) outside the Brief's entrance bands, so its
 * numbers are born here. Degrees stay small on purpose: depth must read as premium, not
 * as a gimmick competing with the CTA.
 */
export const DEPTH = {
  /** max tilt (deg) following a fine pointer (desktop). */
  tiltDeg: 8,
  /** max tilt (deg) driven by scroll on touch devices — half the pointer tilt. */
  touchTiltDeg: 4,
  /** CSS perspective (px) on the card; lower = stronger 3D distortion. */
  perspectivePx: 900,
  /** translateZ (px) for depth layers 1, 2 and 3. */
  layerPx: [10, 22, 36],
  /** permanent extra translateZ (px) for the "Mais popular" plan. */
  popularLiftPx: 18,
  /** peak opacity of the brass sheen layer. */
  sheenOpacity: 0.22,
  /** #galeria inner parallax (design D6): plate / whole-photo amplitude, % of the frame height. */
  galleryShiftPct: 2.5,
  /**
   * the cut-out subject drifts this fraction of the plate amplitude, the same way. Its slip
   * over the plate peaks at 2.5 × (1 − 0.45) = 1.375% ≈ 12 px of the 900 px master, inside
   * the 14 px the layer gate passed without halo or hole (assets/prompts/gallery.md).
   */
  gallerySubjectFactor: 0.45,
} as const;

/**
 * STEPS — #como-funciona mini screens (change xiax-lp-v3-cards-25d · design D12). Each step
 * card plays its screen once on entering: items rise in, the key element (picked slot,
 * dropped booking, WhatsApp bubble) pops, then the outcome line appears. Entrance durations
 * reuse DUR; these are the distances and pauses specific to the story.
 */
export const STEPS = {
  /** delay (s) between cards on the same row, so 1 → 2 → 3 reads as one sequence. */
  storyGapS: 0.9,
  /** rise (px) of each screen item as it fades in. */
  riseYPx: 6,
  /** how far (px) the new booking falls into the barber's column. */
  dropYPx: 28,
  /** start scale of the popping key element. */
  popFromScale: 0.85,
  /** how long (s) the "typing…" dots stay before the reminder lands. */
  typingHoldS: 0.5,
} as const;

/**
 * RAZOR — the 3D straight razor's one cut in #como-funciona (change xiax-lp-v3-razor-3d ·
 * design D1/D6). Lying flat on the steps' thread line, tip to the right and edge down: it
 * enters closed from the right edge, backs up to the line start while it opens and turns to
 * face the light (scroll-driven), cuts left → right on the thread's own draw, then leaves
 * right. Lengths in px, angles in degrees, progress values 0..1.
 */
export const RAZOR = {
  /** on-screen length as a fraction of the cut line's width, clamped to the two limits
   *  (≈ 294 px at 1440 — big enough to read as an object, not an icon). */
  lengthFrac: 0.25,
  minLengthPx: 160,
  maxLengthPx: 320,
  /** line height (fraction of the viewport, from the top) where the back-up starts: just
   *  below the fold, so the razor arrives with the section. */
  approachFromVh: 1.05,
  /** cut point: the line at 60% of the viewport — mid-screen, cards in view. Also the scroll
   *  trigger of the thread and of the step screens (motion-choreography). */
  cutAtVh: 0.6,
  /** fold on entry (180 = shut; 165 keeps the edge clear of the scales' outline). */
  closedFoldDeg: 165,
  /** fraction of the back-up by which the blade is fully open: it opens downward (edge side),
   *  so it must be open before it backs up over the steps' medallions (~0.37 at 1280). */
  openBy: 0.33,
  /** 3/4 turn on entry (rotY away from facing) and when it faces front. */
  turnDeg: 40,
  faceBy: 0.85,
  /** fraction of the back-up by which the scissors have fully stepped out (design D9). */
  giveWayBy: 0.2,
  /** how high it hovers above the line while backing up (fraction of the length), clear of
   *  the heading above; it drops onto the line to cut. */
  liftFrac: 0.085,
  /** least hover over the steps' thread: the 48 px medallions on it (radius 24) plus 12 px
   *  of air. The phone hairline has nothing on it and keeps the plain `liftFrac`. */
  threadClearPx: 36,
  /** fraction of the cut over which it drops from the hover onto the line. */
  dropBy: 0.12,
  /** the cut itself: duration (s) and ease of the line's draw, slow enough to be seen. */
  cutS: 1.1,
  cutEase: "power2.inOut",
  /** pin position along the model, from the handle butt (0) to the blade tip (1). */
  pinFromButt: 0.52,
  /** blade geometry as fractions of the length, measured on the v2 still (razor.glb): the
   *  edge starts this far from the pin (past the shank and jimps) and runs this far off the
   *  pin's axis. */
  heelFromPin: 0.135,
  edgeFromPin: 0.067,
  /** gap kept between the blade tip and the left screen edge at the start of the cut. */
  marginPx: 8,
  /** exit after the cut: duration (s) and how far (deg) the nose lifts on the way out. */
  exitS: 0.45,
  exitLiftDeg: 8,
  /** max lean toward the pointer before the cut — gentler than SCISSORS.pointerTiltDeg. */
  pointerTiltDeg: 6,
} as const;

/**
 * BRUSH — the 3D round brush's one pass in #como-funciona on the salon page (change
 * xiax-lp-v5-salon · design D7), the salon's counterpart of RAZOR. Lying on the steps' line
 * with its handle trailing, it enters from the right edge, lands on the line start, rolls
 * along the line spinning about its own axis (no slipping) and leaves right. Lengths in px,
 * angles in degrees, progress values 0..1. Same lifecycle as RAZOR, so the same trigger points.
 */
export const BRUSH = {
  /** on-screen length (handle end → barrel top) as a fraction of the line's width, clamped to
   *  the two limits (≈ 235 px at 1440: a round brush reads as an object at ~60 px of barrel). */
  lengthFrac: 0.2,
  minLengthPx: 120,
  maxLengthPx: 260,
  /** bristle tip radius over the model length (assets/3d/brush/REPORT.md: tips ~0.135).
   *  It is the ROLLING radius: spin = distance / (tipRadiusFrac × length). */
  tipRadiusFrac: 0.135,
  /** model extent from the origin (barrel centre) along its axis, as fractions of the length:
   *  the handle end (-Y) and the barrel top (+Y); they add up to the full 1.0. */
  handleFrac: 0.73,
  headFrac: 0.27,
  /** line height (fraction of the viewport, from the top) where the approach starts / ends —
   *  the razor's, so both tools arrive with the section at the same scroll. */
  approachFromVh: 1.05,
  cutAtVh: 0.6,
  /** fraction of the approach by which the scissors have fully stepped out (design D9). */
  giveWayBy: 0.2,
  /** hover above the line while approaching (fraction of the length, bristle tips to line);
   *  never lower than the line's own clearance, never into the heading. */
  liftFrac: 0.1,
  /** fraction of the sweep over which it drops from the hover onto the line. */
  dropBy: 0.12,
  /** the sweep itself: duration (s) of the line's draw, slower than the razor's cut so the
   *  roll is seen. */
  sweepS: 1.6,
  /** the sweep's ease: the razor's, so the brush rolls in and out of the line the same way. */
  sweepEase: "power2.inOut",
  /** exit after the sweep: duration (s). */
  exitS: 0.45,
  /** gap kept between the handle end and the left screen edge at the start of the sweep. */
  marginPx: 8,
} as const;
