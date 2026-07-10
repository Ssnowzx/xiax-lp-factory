import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/ui/cn";

/**
 * Badge pill (Art Direction Spec §5 `#depoimentos`): selo `[EXEMPLO]` em latão quieto
 * (`accent-quiet` tint) — carimba o placeholder como andaime INTENCIONAL. `tone=warning`
 * disponível para avisos fortes. Raio por papel = `rounded-pill`.
 */
const badge = cva(
  "inline-flex items-center gap-1.5 rounded-pill px-3 py-1 font-mono text-label uppercase tracking-label",
  {
    variants: {
      tone: {
        accent: "bg-accent-quiet/15 text-accent",
        warning: "border border-warning/60 text-warning",
        line: "border border-line text-ink-subtle",
      },
    },
    defaultVariants: { tone: "accent" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badge> {}

export function Badge({ className, tone, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badge({ tone }), className)} {...props}>
      {children}
    </span>
  );
}
