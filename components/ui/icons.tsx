import * as React from "react";
import { cn } from "@/lib/ui/cn";

/**
 * Família de ícones BESPOKE "latão gravado" (Art Direction Spec §2.5).
 * Grade 24×24 · traço 1.5 · linecap/linejoin round · `currentColor` (herda text-ink/
 * text-accent). Decorativos → `aria-hidden`. NÃO é Lucide/Material/emoji: estética de
 * gravação em placa de barbeiro. As duas exceções Lucide (chevron do FAQ, seta ▸ do CTA)
 * são utilitárias e ficam nos seus componentes; aqui é o vocabulário de marca.
 */
type IconProps = React.SVGProps<SVGSVGElement>;

const base = "inline-block shrink-0";

function svgProps(className?: string): IconProps {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    focusable: false,
    className: cn(base, className),
  };
}

/** Check gravado — não o ✓ default. Usado no `.chk` (≤3 por bloco), sempre em text-accent. */
export function IconCheck({ className, ...rest }: IconProps) {
  return (
    <svg {...svgProps(className)} {...rest}>
      <path d="M4.5 12.8l3.9 4.2c.3.3.8.3 1 0L19.5 6.8" />
    </svg>
  );
}

/** Lembrete no WhatsApp = balão de mensagem + relógio (24h antes). NÃO o logo do WhatsApp
    (evita marca de terceiro). Detalhe do relógio herda o accent quando aplicado. */
export function IconReminder({ className, ...rest }: IconProps) {
  return (
    <svg {...svgProps(className)} {...rest}>
      {/* balão */}
      <path d="M3.5 6.5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H8l-3.2 2.7c-.5.4-1.3.1-1.3-.6V6.5Z" />
      {/* relógio sobreposto */}
      <circle cx="17.5" cy="15.5" r="4" />
      <path d="M17.5 13.6v2l1.3 1" />
    </svg>
  );
}

/** Navalha reta em hairline — marcador de lista / âncora ótica (linha fina, não clip-art). */
export function IconRazor({ className, ...rest }: IconProps) {
  return (
    <svg {...svgProps(className)} {...rest}>
      <path d="M3.5 15.5 15 4c.4-.4 1-.4 1.4 0l.6.6c.4.4.4 1 0 1.4L5.5 17.5" />
      <path d="M4 20.5h9" />
      <path d="M15.5 6.5l3 3" />
    </svg>
  );
}

/** Aspas gravadas — âncora do card de depoimento (em text-accent). */
export function IconQuote({ className, ...rest }: IconProps) {
  return (
    <svg {...svgProps(className)} {...rest} strokeWidth={1.75}>
      <path d="M9 6C6 7 4.5 9.4 4.5 12.8V18h5.2v-5.4H7.4C7.4 9.8 8.2 8 10 7.2L9 6Z" />
      <path d="M19 6c-3 1-4.5 3.4-4.5 6.8V18h5.2v-5.4h-2.3c0-2.8.8-4.6 2.6-5.4L19 6Z" />
    </svg>
  );
}

/**
 * Listra diagonal do poste de barbeiro em hairline (Art Direction Spec §2.5) — 1 textura
 * deliberada. Divisória decorativa entre seções / hachura do estado-placeholder. `aria-hidden`.
 * `tone`: `line` (neutro) ou `brass` (accent pontual).
 */
export function PosteDivider({
  className,
  tone = "line",
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { tone?: "line" | "brass" }) {
  return (
    <div
      aria-hidden="true"
      role="presentation"
      className={cn("poste-hair", tone === "brass" && "poste-hair--brass", className)}
      {...rest}
    />
  );
}
