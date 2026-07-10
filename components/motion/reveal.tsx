"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

/**
 * ASSENTO de motion SSR-safe (Standard = micro/CSS apenas).
 * Progressive enhancement: o conteúdo é VISÍVEL por padrão (sem JS / reduced-motion).
 * O estado "escondido" só existe sob `html.anim-ready` (script no <body>), e a
 * revelação vem daqui setando [data-revealed="true"] — zero shift de layout (só
 * opacity/transform). O DS é dono dos valores (motion-micro.ts / --ease-*).
 */
export interface RevealProps {
  children: ReactNode;
  className?: string;
  /** stagger: filhos marcados `.reveal-item` animam em cascata (CSS). */
  group?: boolean;
}

export function Reveal({ children, className, group }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!document.documentElement.classList.contains("anim-ready")) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-revealed", "true");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn(group ? "reveal-group" : "reveal", className)}>
      {children}
    </div>
  );
}
