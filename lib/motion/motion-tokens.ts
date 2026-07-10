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
 * MOTIF — camada de personalidade barber (XIA-136). Amplitudes FECHADAS pela Art
 * Direction Spec §4 (o diretor-de-arte é dono da intenção; canonizo os números aqui,
 * no seat, para que a ilha nunca use literal — mesmo precedente de `loop`/`pop`).
 * Justificativa vs. Brief §8: são micro-movimentos AMBIENTE de decoração atrás do
 * conteúdo (não entradas de bloco), deliberadamente pequenos p/ "vivo, mas ao fundo"
 * (Spec §4) — nunca distrair da conversão. Só `transform`/`opacity`; reduced-motion zera.
 */
export const MOTIF = {
  /** parallax dos atrás-de-título / hero (translateY máx, px) — Spec §4: ≤12px. */
  parallax: 12,
  /** floating do bookend #final (translateY máx, px) — Spec §4: ≤6px. */
  float: 6,
  /** glow do barber-pole do #hero — pulso de opacidade (Spec §4: 0.04↔0.07). */
  glowMin: 0.04,
  glowMax: 0.07,
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
