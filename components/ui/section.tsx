import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/ui/cn";

// Primitiva de layout (Design System §7): ritmo vertical `py-section` + gutter fluido.
// `width` controla a medida: prose (leitura), content (1200px), bleed (full).
const container = cva("mx-auto w-full", {
  variants: {
    width: {
      prose: "max-w-prose",
      content: "max-w-content",
      bleed: "max-w-none",
    },
  },
  defaultVariants: { width: "content" },
});

export interface SectionProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof container> {
  /** id de âncora = DOM = Map = Blueprint (UX/IA §1). */
  id?: string;
  /** `scroll-margin-top` já vem do CSS global via seletor [id]. */
  /**
   * Camada de personalidade barber (XIA-136): motivos `<Motif>` decorativos, absolutos,
   * ancorados à `<section>` (que é `relative`) — FORA do container de medida, para poder
   * sangrar/atrás-de-título até a borda. `overflow-x-clip` evita scroll-x do sangramento.
   * `aria-hidden` + `pointer-events:none` vêm do próprio `<Motif>`. CLS 0 (absolute).
   */
  decor?: React.ReactNode;
}

export function Section({ id, width, className, decor, children, ...props }: SectionProps) {
  return (
    <section
      id={id}
      className={cn("relative px-gutter py-section", decor && "overflow-x-clip", className)}
      {...props}
    >
      {decor}
      {/* container acima da camada de decor (motif absoluto tem z auto): `relative z-[1]`
          garante que o CONTEÚDO (título/texto/CTA) sempre pinte por cima do motivo. */}
      <div className={cn(container({ width }), decor && "relative z-[1]")}>{children}</div>
    </section>
  );
}
