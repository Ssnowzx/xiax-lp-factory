import * as React from "react";
import { cn } from "@/lib/ui/cn";

/**
 * Kicker mono "de comanda" (Art Direction Spec §2.1, quebra #5): rótulo órfão em mono
 * caixa-alta, alinhado opticamente ao topo do H2 vizinho. Token único: `text-label`.
 */
export function Kicker({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("font-mono text-label uppercase tracking-label text-ink-subtle", className)}
      {...props}
    >
      {children}
    </p>
  );
}
