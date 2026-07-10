import * as React from "react";
import { cn } from "@/lib/ui/cn";
import { Badge } from "@/components/ui/badge";

// TrustStrip — faixa de logos PLACEHOLDER do hero (Fidelity Sign-off F1 / Art Direction Spec V2
// §hero · D1). Página de TESTE: NÃO inventar logo. Cada slot é um SKELETON honesto em latão
// tracejado (badge `[EXEMPLO]` + hachura `border-dashed border-line`), dimensão RESERVADA
// (`contain-intrinsic-size` + h/w fixos) → quando os logos reais entrarem (cliente na Fase E),
// troca sem CLS. Server-renderável (RSC): sai no HTML de servidor, sem depender de JS.
//
// Slot = box tracejado com uma marca-glifo genérica (mancha + barra) — lê como andaime
// intencional, nunca como logo quebrado. O significado vem do texto mono honesto abaixo,
// que É conteúdo real (não aria-hidden); só os skeletons decorativos são aria-hidden.

const SLOTS = 5;

export function TrustStrip({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-sec="hero-trust"
      className={cn("mt-block", className)}
      {...props}
    >
      <div className="flex items-center gap-3">
        <p className="font-mono text-label uppercase tracking-label text-ink-subtle">
          Barbearias que já cortam com a gente
        </p>
        <Badge tone="line" className="shrink-0">
          Exemplo
        </Badge>
      </div>

      {/* trilho de skeletons — dimensão fixa por slot → CLS 0 na troca pelo logo real */}
      <ul className="mt-4 flex flex-wrap items-center gap-3" aria-hidden="true">
        {Array.from({ length: SLOTS }).map((_, i) => (
          <li
            key={i}
            className="flex h-11 w-28 items-center justify-center gap-2 rounded-control border border-dashed border-line bg-surface/40 [contain-intrinsic-size:auto_2.75rem]"
          >
            {/* glifo genérico: mancha + barra — sem marca inventada */}
            <span className="size-4 shrink-0 rounded-pill bg-line" />
            <span className="h-2.5 w-12 rounded-pill bg-line" />
          </li>
        ))}
      </ul>

      <p className="mt-3 font-mono text-label uppercase tracking-label text-ink-subtle">
        [Placeholder — logos de barbearias reais entram antes de publicar. Nada aqui é inventado.]
      </p>
    </div>
  );
}
