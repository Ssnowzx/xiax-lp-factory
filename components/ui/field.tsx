import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/ui/cn";

// Contrato canônico do Design System (XIA-32 §6). <label> SEMPRE visível.
const field = cva(
  "w-full rounded-field bg-surface px-4 h-11 text-body text-ink placeholder:text-ink-subtle " +
    "border transition-colors duration-micro ease-standard " +
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-accent " +
    "disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      state: {
        default: "border-line-strong",
        invalid: "border-danger",
        disabled: "border-line",
      },
    },
    defaultVariants: { state: "default" },
  },
);

export interface FieldInputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof field> {}

/** Input estilizado pelo token de campo. `state` dirige a borda (default/invalid). */
export const FieldInput = React.forwardRef<HTMLInputElement, FieldInputProps>(
  function FieldInput({ className, state, ...props }, ref) {
    return <input ref={ref} className={cn(field({ state }), className)} {...props} />;
  },
);

/** Label sempre visível (Radix Label) — nunca placeholder-as-label. */
export function FieldLabel({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      className={cn("mb-1.5 block font-mono text-label uppercase text-ink-subtle", className)}
      {...props}
    />
  );
}
