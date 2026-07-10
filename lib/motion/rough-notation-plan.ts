/**
 * SEAM da rough-notation (WS3 · XIA-92) — FONTE ÚNICA dos números/opções das
 * marcações "à mão" no scroll. Espelha o contrato de posse do `motion-tokens.ts`:
 *
 * CONTRATO DE PROPRIEDADE:
 *  - O **Front-end Architect** (nextjs-arquiteto) cria este SEAM e o mecanismo
 *    (`rough-notations.ts` + `<RoughTarget>`), que garantem as regras INEGOCIÁVEIS
 *    do Brief (desenhar 1×/enter, fila serializada, fonts.ready, resize debounced,
 *    SVG fora do fluxo → CLS 0, reduced-motion instantâneo, tinta = --accent).
 *  - O **motion-engineer** é o DONO dos VALORES: escolhe as palavras-alvo dentro da
 *    copy CONGELADA (envolvendo-as com `<RoughTarget>`), o TIPO por elemento e
 *    ajusta as opções abaixo. Se precisar de uma banda nova, ela nasce AQUI — nunca
 *    como literal solto na ilha (regra 10 do Front-end Architect).
 *
 * Nenhum literal de motion vive fora deste arquivo; a ilha (`rough-notations.ts`)
 * só consome estas constantes.
 */
import type { RoughAnnotationType } from "rough-notation/lib/model";

/**
 * TINTA — a cor da marcação é SEMPRE o token `--accent` (latão), lido em runtime
 * de `:root`. NUNCA um hex/rgb novo (Brief · arbitragem 3: Design System vence).
 * A ilha resolve `--accent` (canais RGB, ex. "214 162 78") → `rgb(214 162 78)`.
 */
export const INK_VAR = "--accent" as const;

/** Cadência da FILA serializada (Brief: stagger ~120ms; desenho ~1×/elemento). */
export const CADENCE = {
  /** duração do traço de cada anotação (ms). rough default = 800. */
  drawMs: 620,
  /** intervalo entre anotações consecutivas na fila (ms) — o "~120ms" do Brief. */
  staggerMs: 120,
  /** debounce do redraw em resize (ms) — o "~150ms" do Brief. */
  resizeDebounceMs: 150,
} as const;

/**
 * Opções-base por TIPO de anotação (rough-notation). O motion-engineer ajusta
 * strokeWidth/padding/iterations/multiline por alvo. `animate`/`animationDuration`/
 * `color` são injetados pela ilha (não repetir aqui — a ilha manda a tinta e o tempo).
 */
type PlanOptions = {
  strokeWidth?: number;
  padding?: number | [number, number];
  iterations?: number;
  multiline?: boolean;
};

export const TYPE_DEFAULTS: Record<RoughAnnotationType, PlanOptions> = {
  underline: { strokeWidth: 2, padding: 2, iterations: 2 },
  box: { strokeWidth: 2, padding: 4, iterations: 2 },
  // padding [10,16] (era [6,10]): o traço de círculo é desenhado "à mão" (rough)
  // com wobble que estoura a própria caixa do SVG quando o padding é apertado — o
  // arco superior/inferior era clipado. Mais folga na geometria do SVG (que a lib
  // dimensiona = rect + padding) deixa a elipse respirar inteira em 360px sem tocar
  // a caixa de layout do #hero (overflow-x-clip da section intacto). XIA-118 P1.
  circle: { strokeWidth: 2, padding: [10, 16], iterations: 2 },
  highlight: { strokeWidth: 12, iterations: 1, multiline: true },
  "strike-through": { strokeWidth: 2, iterations: 2 },
  "crossed-off": { strokeWidth: 2, iterations: 2 },
  bracket: { strokeWidth: 2, padding: 4, iterations: 1 },
};

/** Tipos aceitos no atributo `data-rn` — reexport para o `<RoughTarget>` tipar. */
export type { RoughAnnotationType };
