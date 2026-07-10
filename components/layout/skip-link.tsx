import { MICROCOPY } from "@/lib/ux/microcopy";

/**
 * Skip-link (UX/IA §5) — 1º tabbável do documento; invisível até o foco.
 * `sr-only`-like: fora da tela, volta com position:fixed no :focus-visible (globals.css).
 */
export function SkipLink() {
  return (
    <a href="#conteudo" className="skip-link">
      {MICROCOPY.nav.skip}
    </a>
  );
}
