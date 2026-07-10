// Motivos barber INLINE (XIA-136 · Fase C) — transcrição 1:1 dos 8 SVG premium do
// Asset Package (`public/motifs/*.svg`, XIA-135 `9bce10b`). São inline como JSX (não
// `<img src>`) porque só o inline permite: `currentColor` herdar a tinta do DS
// (`--accent`/`--line`/`--ink-subtle`), o `aria-hidden` interno (belt-and-suspenders
// com o wrapper) e o motion por `transform` (parallax/glow/float) — Art Direction Spec §5.
//
// FONTE DE VERDADE = os arquivos em `public/motifs/` (o diretor-de-arte é dono da arte).
// Estes componentes NÃO redesenham nem reposicionam paths: reproduzem o viewBox 48×48,
// stroke 2, caps/joins redondos e miolos de fill exatamente como entregues. Se a arte
// mudar, os arquivos mandam e estes são re-sincronizados.
//
// Cada ícone: fill/stroke em `currentColor` (a tinta vem do wrapper via `text-*`),
// `aria-hidden`, sem `<title>/<desc>` (sem nome acessível). `className` = `size-full`
// aplicado pelo `<Motif>`, que rege a caixa.

import type { SVGProps } from "react";

const strokeProps: SVGProps<SVGSVGElement> = {
  viewBox: "0 0 48 48",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
  role: "presentation",
};

export function BarberPoleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...strokeProps} {...props}>
      <circle cx="24" cy="4.5" r="1.6" fill="currentColor" stroke="none" />
      <rect x="16.5" y="7" width="15" height="4" rx="2" />
      <rect x="18" y="11" width="12" height="26" rx="6" />
      <rect x="16.5" y="37" width="15" height="4" rx="2" />
      <path d="M18 17 30 13" />
      <path d="M18 24 30 20" />
      <path d="M18 31 30 27" />
    </svg>
  );
}

export function BladeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...strokeProps} {...props}>
      <rect x="7" y="17" width="34" height="14" rx="3" />
      <rect x="15" y="21.5" width="18" height="5" rx="2.5" />
      <path d="M7 20.5H41" />
      <path d="M7 27.5H41" />
      <circle cx="11.5" cy="24" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="36.5" cy="24" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function BrushIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...strokeProps} {...props}>
      <path d="M16 21C16 10 20 7 24 7 28 7 32 10 32 21Z" />
      <path d="M20 21 21 11" />
      <path d="M24 21 24 9" />
      <path d="M28 21 27 11" />
      <rect x="15" y="21" width="18" height="4" rx="1" />
      <path d="M17 25C18 41 22 41 24 41 26 41 30 41 31 25" />
    </svg>
  );
}

export function ClippersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...strokeProps} {...props}>
      <rect x="16" y="15" width="16" height="26" rx="3" />
      <path d="M18 15V9H30V15" />
      <path d="M18.5 9V6M21.5 9V6M24.5 9V6M27.5 9V6" />
      <path d="M16 23H32" />
      <path d="M20 29H28" />
      <path d="M20 33H28" />
    </svg>
  );
}

export function CombIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...strokeProps} {...props}>
      <rect x="7" y="14" width="34" height="6" rx="2" />
      <path d="M10 20V33" />
      <path d="M13 20V33" />
      <path d="M16 20V33" />
      <path d="M19 20V33" />
      <path d="M22 20V33" />
      <path d="M26 20V34" />
      <path d="M30 20V34" />
      <path d="M34 20V34" />
      <path d="M38 20V34" />
    </svg>
  );
}

export function MustacheIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="currentColor"
      stroke="none"
      aria-hidden={true}
      focusable={false}
      role="presentation"
      {...props}
    >
      <path d="M24 21C22 19 18 16 12 16 7 16 4 19 5 22 6 25 10 25 12 22 14 20 18 20 21 22 22.5 23 23 23 24 23 25 23 25.5 23 27 22 30 20 34 20 36 22 38 25 42 25 43 22 44 19 41 16 36 16 30 16 26 19 24 21Z" />
    </svg>
  );
}

export function RazorIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...strokeProps} {...props}>
      <path d="M6 25C6 23 7.5 22 10 21.4L27 17.4 30.5 21 12 26C8.5 26.8 6 26.6 6 25Z" />
      <path d="M24 18.6 27 21" />
      <circle cx="31" cy="21.4" r="1.3" fill="currentColor" stroke="none" />
      <path d="M32.4 20.6 43 25.8 42 28 31.4 22.8Z" />
    </svg>
  );
}

export function ScissorsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...strokeProps} {...props}>
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="34" r="5" />
      <path d="M16 15 40 33" />
      <path d="M16 31 40 13" />
      <circle cx="24" cy="23" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Registro por nome — o `<Motif name>` resolve o ícone daqui. */
export const MOTIF_ICONS = {
  "barber-pole": BarberPoleIcon,
  blade: BladeIcon,
  brush: BrushIcon,
  clippers: ClippersIcon,
  comb: CombIcon,
  mustache: MustacheIcon,
  razor: RazorIcon,
  scissors: ScissorsIcon,
} as const;

export type MotifName = keyof typeof MOTIF_ICONS;
