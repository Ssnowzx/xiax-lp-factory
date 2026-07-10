import { Button } from "@/components/ui/button";
import { HeaderNav } from "@/components/layout/header-nav";
import { MICROCOPY } from "@/lib/ux/microcopy";

// Header sticky (UX/IA §5) — RSC (zero JS: âncoras nativas + scroll-padding-top). Landmarks:
// <header> + <nav aria-label="Principal"> (dentro de HeaderNav). Altura = --header-h (fonte
// única). Nav horizontal ≥md (placa de comanda, link ativo com hairline de latão via HeaderNav
// — ilha client folha); no mobile o CTA primário mora na .cta-bar (aqui só "Entrar").
export function Header() {
  return (
    <header className="sticky top-0 z-nav h-header-h border-b border-line bg-base/90 backdrop-blur">
      <div className="mx-auto flex h-full max-w-content items-center justify-between px-gutter">
        <a
          href="#hero"
          className="font-display text-title uppercase tracking-display-upper text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-accent"
        >
          Xbarber
        </a>

        <HeaderNav />

        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <a href="#planos">{MICROCOPY.nav.entrar}</a>
          </Button>
          {/* CTA primário só no desktop (no mobile é a .cta-bar) */}
          <Button asChild size="sm" className="hidden md:inline-flex">
            <a href="#planos">
              Começar teste grátis <span aria-hidden="true">▸</span>
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
