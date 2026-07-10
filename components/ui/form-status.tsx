import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/ui/cn";

// Mensagem de estado do form (UX/IA §6). `role` correto por tom:
//  danger → role="alert" (assertivo) · success/info → role="status" aria-live polite.
const status = cva("font-mono text-label uppercase", {
  variants: {
    tone: {
      danger: "text-danger",
      success: "text-success",
      info: "text-info",
    },
  },
  defaultVariants: { tone: "info" },
});

export interface FormStatusProps
  extends React.HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof status> {}

export function FormStatus({ className, tone, children, ...props }: FormStatusProps) {
  const assertive = tone === "danger";
  return (
    <p
      role={assertive ? "alert" : "status"}
      aria-live={assertive ? "assertive" : "polite"}
      className={cn(status({ tone }), className)}
      {...props}
    >
      {children}
    </p>
  );
}
