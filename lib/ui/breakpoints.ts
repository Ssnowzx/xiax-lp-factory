/**
 * Design System — LP Xbarber
 * FONTE ÚNICA de breakpoints (dono: design-system-architect).
 *
 * Ninguém redeclara min-width literal. Consomem esta fonte:
 *  - tailwind.config.ts  → theme.screens = BP (via px)
 *  - gsap.matchMedia / IntersectionObserver da .cta-bar → BP.md
 *  - qualquer media query em JS → import { BP } from '@/lib/ui/breakpoints'
 *
 * Mobile-first (UX/IA nasce a 390px). Valores em px, sem unidade nas chaves numéricas.
 */
export const BP = {
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export type Breakpoint = keyof typeof BP;

/** `${n}px` pronto para tailwind.config.screens e matchMedia. */
export const BP_PX: Record<Breakpoint, string> = {
  sm: `${BP.sm}px`,
  md: `${BP.md}px`,
  lg: `${BP.lg}px`,
  xl: `${BP.xl}px`,
};

/** Ex.: matchMedia(mq('md')) → dispara ≥768px. Fecha o contrato da .cta-bar (some ≥md). */
export const mq = (bp: Breakpoint) => `(min-width: ${BP_PX[bp]})`;
