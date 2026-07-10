/**
 * Design System — LP Xbarber
 * Micro-motion — SUBCONJUNTO do seat canônico (lib/motion/motion-tokens.ts).
 *
 * V2 Flagship: o seat canônico de motion agora existe (motion-engineer é o dono da
 * coreografia). Este arquivo deixou de ser fonte e passou a REEXPORTAR o subconjunto
 * MICRO do seat — um valor, uma origem. As CSS vars em styles/tokens.css
 * (--dur-micro / --ease-standard / --ease-dramatic) são o MIRROR CSS deste subconjunto.
 *
 * Import legado (`@/lib/ui/motion-micro`) segue funcionando: DUR/EASE/cubic vêm do seat.
 */
export { DUR, EASE, cubic } from "../motion/motion-tokens";
