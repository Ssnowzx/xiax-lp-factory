import { SITE } from "@/lib/site";
import { PosteDivider } from "@/components/ui/icons";

// Footer (UX/IA §1) — legal/crédito. Decisão única (Art Direction): rodapé mínimo de comanda
// com HAIRLINE DE LATÃO no topo, tudo em mono `text-ink-subtle`. `pb` reserva a altura da
// .cta-bar fixa no mobile para não obscurecer o último conteúdo focável.
export function Footer() {
  return (
    <footer>
      <PosteDivider tone="brass" />
      <div className="relative px-gutter py-12 pb-24 md:pb-12">
        <div className="relative z-[1] mx-auto flex max-w-content flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <span className="font-display text-title uppercase tracking-display-upper text-ink">
              {SITE.name}
            </span>
            <span className="font-mono text-label uppercase tracking-label text-ink-subtle">
              © {SITE.name}
            </span>
          </div>
          {/* IMP-3: "Termos"/"Privacidade" removidos — apontavam href="#" (placeholder
              proibido em produção) e as rotas /termos //privacidade ainda não existem.
              Reintroduzir como <Link> quando as páginas legais forem publicadas. */}
          <div className="flex flex-wrap items-center gap-6">
            <span className="font-mono text-label uppercase tracking-label text-ink-subtle">
              feito pela Xiax
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
