"use client";

import { useEffect, useState } from "react";

// Nav da header como PLACA DE COMANDA (Art Direction, decisão única do HEADER): links em
// mono caixa-alta; SÓ o link ativo ganha o hairline de latão embaixo (scrollspy). Ilha client
// folha — a header segue RSC. PE: sem JS os links âncora funcionam igual (só sem o realce ativo).
const NAV = [
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#planos", label: "Preço" },
  { href: "#faq", label: "Dúvidas" },
];

export function HeaderNav() {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const ids = NAV.map((n) => n.href.slice(1));
    const targets = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;

    // offset do topo = altura real do header (--header-h, fonte única — sem número mágico).
    const headerH =
      parseInt(getComputedStyle(document.documentElement).getPropertyValue("--header-h"), 10) || 64;

    const visible = new Map<string, number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.set(e.target.id, e.intersectionRatio);
          else visible.delete(e.target.id);
        }
        let best: string | null = null;
        let bestRatio = 0;
        for (const [id, ratio] of visible) {
          if (ratio >= bestRatio) {
            best = id;
            bestRatio = ratio;
          }
        }
        setActive(best);
      },
      { rootMargin: `-${headerH}px 0px -55% 0px`, threshold: [0.1, 0.35, 0.6] },
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);

  return (
    <nav aria-label="Principal" className="hidden items-center gap-7 md:flex">
      {NAV.map((item) => {
        const isActive = active === item.href.slice(1);
        return (
          <a
            key={item.href}
            href={item.href}
            aria-current={isActive ? "true" : undefined}
            className={[
              "relative inline-flex items-center py-2.5 font-mono text-label uppercase tracking-label transition-colors duration-micro ease-standard motion-reduce:transition-none",
              "hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-accent",
              "after:absolute after:inset-x-0 after:-bottom-px after:h-px after:origin-left after:scale-x-0 after:bg-accent after:transition-transform after:duration-micro after:ease-standard motion-reduce:after:transition-none",
              isActive ? "text-accent after:scale-x-100" : "text-ink-muted",
            ].join(" ")}
          >
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
