import * as React from "react";
import { cn } from "@/lib/ui/cn";
import { IconCheck } from "@/components/ui/icons";

/**
 * `.chk` — item de checklist com CHECK gravado de latão (Art Direction Spec: check bespoke,
 * não o ✓ default; ≤3 accents por bloco). Semântica de lista (<ul>/<li>) preservada.
 * O check é `aria-hidden`: o significado é o texto ao lado.
 */
export function ChkList({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLUListElement>) {
  return (
    <ul className={cn("flex flex-col gap-2.5", className)} {...props}>
      {children}
    </ul>
  );
}

export function Chk({
  className,
  children,
  icon,
  ...props
}: React.LiHTMLAttributes<HTMLLIElement> & { icon?: React.ReactNode }) {
  return (
    <li className={cn("flex items-start gap-2.5 text-body text-ink", className)} {...props}>
      <span className="mt-[0.15em] text-accent">{icon ?? <IconCheck className="size-[1.15em]" />}</span>
      <span>{children}</span>
    </li>
  );
}
