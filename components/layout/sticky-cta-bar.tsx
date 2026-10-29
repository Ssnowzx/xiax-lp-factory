"use client";

import { useEffect, useRef, useState } from "react";

import type { PageId } from "@/lib/content/types";

import { mq } from "@/lib/ui/breakpoints";
import { WhatsAppCta } from "@/components/ui/whatsapp-cta";

/**
 * .cta-bar fixa (mobile, thumb-zone). UX/IA §5:
 *  - some ≥ md (BP dono único) — via matchMedia, não literal;
 *  - some quando #hero/#planos/#final estão visíveis (IntersectionObserver) →
 *    NUNCA 2 CTAs primários idênticos na mesma tela.
 * Abre o WhatsApp de vendas, a mesma ação dos 3 pontos (dono, 28/10/2026: "direto pro whatsapp").
 */
const PRIMARY_SECTIONS = ["hero", "planos", "final"];

export function StickyCtaBar({ page, greeting }: { page: PageId; greeting: string }) {
  const [visible, setVisible] = useState(false);
  const anchorsVisible = useRef(new Set<string>());
  const barRef = useRef<HTMLDivElement>(null);

  // A11Y-02 (aria-hidden-focus): quando oculta, o CTA precisa sair do tab order
  // E das ATs. React 18.3.1 NÃO serializa o atributo `inert` booleano no JSX (o
  // renderer descarta booleanos em atributos não-`data-`/`aria-`), então o setamos
  // pela propriedade DOM `HTMLElement.inert` — reflete o atributo de forma nativa,
  // independente da versão do React.
  useEffect(() => {
    if (barRef.current) barRef.current.inert = !visible;
  }, [visible]);

  useEffect(() => {
    const isDesktop = window.matchMedia(mq("md"));
    const targets = PRIMARY_SECTIONS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null,
    );

    const compute = () => {
      // esconde no desktop OU quando qualquer seção com CTA primário está na tela
      setVisible(!isDesktop.matches && anchorsVisible.current.size === 0);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) anchorsVisible.current.add(e.target.id);
          else anchorsVisible.current.delete(e.target.id);
        }
        compute();
      },
      { threshold: 0.2 },
    );
    targets.forEach((t) => io.observe(t));
    isDesktop.addEventListener("change", compute);
    compute();

    return () => {
      io.disconnect();
      isDesktop.removeEventListener("change", compute);
    };
  }, []);

  return (
    <div
      ref={barRef}
      aria-hidden={!visible}
      data-sticky-cta
      className={[
        "fixed inset-x-0 bottom-0 z-sticky-cta md:hidden",
        "border-t border-line bg-surface/95 backdrop-blur",
        "px-gutter pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3",
        "transition-transform duration-micro ease-standard",
        visible ? "translate-y-0" : "pointer-events-none translate-y-full",
      ].join(" ")}
    >
      <WhatsAppCta page={page} placement="sticky" message={greeting} className="w-full" />
    </div>
  );
}
