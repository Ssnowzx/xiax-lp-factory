import Link from "next/link";

import { Kicker } from "@/components/ui/kicker";

/**
 * 404 of a page's root layout (change xiax-lp-v5-salon · D1): the page's own theme and the one way
 * back, to the start of that page.
 */
export function NotFoundPage({ home }: { home: "/" | "/salao" }) {
  return (
    <main id="conteudo" className="flex min-h-dvh items-center px-gutter py-section">
      <div className="mx-auto w-full max-w-content">
        <Kicker className="mb-4">Erro 404</Kicker>
        <h1 className="max-w-prose font-display text-display-lg type-display text-ink">
          Esta página não existe.
        </h1>
        <p className="mt-4 max-w-prose text-body-lg text-ink-muted">O endereço pode ter mudado ou estar digitado errado.</p>
        <Link
          href={home}
          className="mt-8 inline-block font-mono text-label uppercase tracking-label text-accent underline-offset-4 hover:underline"
        >
          Voltar para o início <span aria-hidden="true">▸</span>
        </Link>
      </div>
    </main>
  );
}
