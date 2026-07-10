import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/ui/cn";

// Contrato canônico do Design System (XIA-32 §6). Aplicado, não reescrito.
// Cinco estados: hover · focus-visible · active · disabled · loading (aria-busy).
const button = cva(
  "inline-flex items-center justify-center gap-2 rounded-control font-mono uppercase tracking-label " +
    "transition-[filter,transform] duration-micro ease-standard motion-reduce:transition-none " +
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-accent " +
    "active:translate-y-px disabled:opacity-50 disabled:pointer-events-none aria-busy:cursor-progress aria-busy:pointer-events-none",
  {
    variants: {
      variant: {
        solid: "bg-ink text-base hover:brightness-110",
        accent: "bg-accent text-accent-ink hover:brightness-110", // CTA "Começar teste grátis"
        outline: "border border-line-strong text-ink hover:bg-surface", // "Entrar" [CTA-o]
        ghost: "text-ink-muted hover:text-ink hover:bg-surface",
      },
      size: {
        sm: "h-9 px-4 text-label",
        md: "h-11 px-6 text-label", // 44px — piso do CTA primário
        lg: "h-14 px-8 text-label",
      },
    },
    defaultVariants: { variant: "accent", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {
  /** Compõe num filho (ex.: `<a>`) via Radix Slot — nunca aninha 2 interativos. */
  asChild?: boolean;
  /** 5º estado: `aria-busy`, desabilita e troca o rótulo por `loadingLabel` no box fixo (CLS 0). */
  loading?: boolean;
  loadingLabel?: React.ReactNode;
}

/**
 * `forwardRef`: Radix/motion targetam este ref sem reescrever o markup.
 * `loading` só se aplica ao `<button>` real (asChild delega o estado ao filho).
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, asChild, loading, loadingLabel, disabled, type, children, ...props },
  ref,
) {
  const Comp = asChild ? Slot : "button";
  const nativeProps = asChild
    ? {}
    : {
        type: type ?? ("button" as const),
        disabled: disabled || loading,
        "aria-busy": loading || undefined,
      };
  return (
    <Comp ref={ref} className={cn(button({ variant, size }), className)} {...nativeProps} {...props}>
      {loading && loadingLabel ? loadingLabel : children}
    </Comp>
  );
});

export { button as buttonVariants };
