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
}

export function Section({ id, width, className, children, ...props }: SectionProps) {
  return (
    <section id={id} className={cn("relative px-gutter py-section", className)} {...props}>
      <div className={container({ width })}>{children}</div>
    </section>
  );
}
