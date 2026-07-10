import { cn } from "@/lib/ui/cn";
import { MOTIF_ICONS, type MotifName } from "@/components/decor/motif-icons";

// <Motif> — wrapper fino da CAMADA DE PERSONALIDADE barber (XIA-136 · Fase C).
// Aplica o mapa da Art Direction Spec §2 (posição/tamanho/opacidade/tinta) e o
// contrato de a11y §5. É RSC (markup puro) — nasce no HTML de servidor, sem JS.
//
// GATES honrados (dono/XIA-134 · Spec §3):
//  · A11y (lição BLOCK-01/XIA-103): `aria-hidden` no wrapper (cinto) + no <svg> (suspensório),
//    sem nome acessível, sem foco, `pointer-events:none` → o texto/CTA por baixo segue clicável.
//  · CLS 0 / zero altura: `position:absolute` dentro de caixa JÁ reservada (a <section>
//    relative ou o card). Nunca soma altura, nunca empurra nada.
//  · Cor só do DS: `currentColor` herda a tinta via `text-accent`/`text-line`/`text-ink-subtle`.
//    Zero hex fora do DS.
//  · Opacidade = valor de ARTE fechado pela Spec §2 (não é token de motion): inline `style`.
//
// SEAM de motion (`motion` prop → `data-motif`): a ilha de coreografia
// (`motion-choreography.tsx`) seleciona `[data-motif="glow|parallax|float"]` e anima
// SÓ `transform`/`opacity` por cima (subconjunto Spec §4). `prefers-reduced-motion` →
// a ilha não anima → o motivo fica no estado estático desta camada (opacity da Spec).

type MotifTint = "accent" | "line" | "ink-subtle";
type MotifMotion = "glow" | "parallax" | "float";

const TINT_CLASS: Record<MotifTint, string> = {
  accent: "text-accent",
  line: "text-line",
  "ink-subtle": "text-ink-subtle",
};

export interface MotifProps {
  /** Nome do motivo (resolve o ícone inline). */
  name: MotifName;
  /** Classe(s) de POSIÇÃO absoluta (Tailwind inset/translate) — do mapa Spec §2. */
  className?: string;
  /** Opacidade da Spec §2 (arte). Teto de disciplina §3.2. */
  opacity: number;
  /** Tinta do DS (Spec §2). accent = motivo-assinatura/divisor; line/ink-subtle = detalhe. */
  tint: MotifTint;
  /**
   * Largura da caixa (rege o tamanho — viewBox 1:1). `number` = px fixo; `string` =
   * clamp fluido (ex.: "clamp(180px,22vw,320px)") para os atrás-de-título/assinatura.
   */
  size: number | string;
  /** SEAM de motion §4 — vira `data-motif`; ausente = estático (cantos de card). */
  motion?: MotifMotion;
}

export function Motif({ name, className, opacity, tint, size, motion }: MotifProps) {
  const Icon = MOTIF_ICONS[name];
  const width = typeof size === "number" ? `${size}px` : size;
  return (
    <span
      aria-hidden="true"
      data-motif={motion}
      className={cn(
        "pointer-events-none absolute block select-none",
        TINT_CLASS[tint],
        className,
      )}
      style={{ width, opacity }}
    >
      <Icon className="size-full" />
    </span>
  );
}
