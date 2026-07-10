import type { ReactNode } from "react";
import type { RoughAnnotationType } from "@/lib/motion/rough-notation-plan";

/**
 * `<RoughTarget>` (WS3 · XIA-92) — ASSENTO RSC da marcação rough-notation.
 * =====================================================================
 * NÃO é client: renderiza só um `<mark>` semântico. O texto-alvo SAI no HTML de
 * servidor (indexável) e continua LEGÍVEL + SELECIONÁVEL — a marcação "à mão" é
 * desenhada por cima como SVG decorativo (fora do fluxo) pela ilha
 * `lib/motion/rough-notations.ts` no scroll. Se o JS não rodar, fica o texto puro.
 *
 * PAPÉIS (não há dois donos):
 *  - Front-end Architect: entrega este assento + o mecanismo + o CSS que neutraliza
 *    o `<mark>` nativo. As regras (1×/enter, fila, fonts.ready, CLS 0, a11y) vivem
 *    no mecanismo, não aqui.
 *  - motion-engineer: ENVOLVE as palavras-alvo da copy CONGELADA com `<RoughTarget>`,
 *    escolhe o `type` por alvo e a ordem `note` da fila. Ajusta valores no
 *    `rough-notation-plan.ts`. Copy NÃO muda — só ganha o wrapper.
 *
 * A11y: a marcação é decorativa; o `<mark>` carrega o texto real (semântica de
 * destaque). O SVG desenhado é `pointer-events:none` (globals) e não anuncia
 * conteúdo. Não usar para texto que já é link/heading interativo.
 */
export function RoughTarget({
  children,
  type = "underline",
  note,
  className,
}: {
  children: ReactNode;
  /** tipo de anotação rough-notation (Brief §WS3). */
  type?: RoughAnnotationType;
  /** ordem na FILA serializada (menor desenha antes). Default = ordem no DOM. */
  note?: number;
  className?: string;
}) {
  return (
    <mark
      className={className ? `rn-target ${className}` : "rn-target"}
      data-rn={type}
      data-note={note}
    >
      {children}
    </mark>
  );
}
