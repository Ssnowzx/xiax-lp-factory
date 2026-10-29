import { Button } from "@/components/ui/button";
import { HeaderNav } from "@/components/layout/header-nav";
import { SITE } from "@/lib/site";

// Header sticky (UX/IA §5) — RSC (zero JS: âncoras nativas + scroll-padding-top). Landmarks:
// <header> + <nav aria-label="Principal"> (dentro de HeaderNav). Altura = --header-h (fonte
// única). Nav horizontal ≥md (placa de comanda, link ativo com hairline de latão via HeaderNav
// — ilha client folha); no mobile o CTA primário mora na .cta-bar.
// xiax-lp-v4-xchair: no "Entrar" here — each barbershop's panel lives at its own address.
export function Header() {
  return (
    <header className="sticky top-0 z-nav h-header-h border-b border-line bg-base/90 backdrop-blur">
      <div className="mx-auto flex h-full max-w-content items-center justify-between px-gutter">
        <a
          href="#hero"
          className="font-display text-title type-display text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-accent"
        >
          {SITE.name}
        </a>

        <HeaderNav />

        {/* CTA primário só no desktop (no mobile é a .cta-bar) */}
        <Button asChild size="sm" className="hidden md:inline-flex">
          <a href="#planos">
            Ver planos <span aria-hidden="true">▸</span>
          </a>
        </Button>
      </div>
    </header>
  );
}
