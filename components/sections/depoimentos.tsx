import { Section } from "@/components/ui/section";
import { Kicker } from "@/components/ui/kicker";
import { Badge } from "@/components/ui/badge";
import { IconQuote, PosteDivider } from "@/components/ui/icons";

// #depoimentos — job: PROVA SOCIAL [PLACEHOLDER]. Página de TESTE: NÃO inventar depoimento/
// logo/nº de clientes (Message Map + Art Direction §3.5). Decisão única: os cards-placeholder
// são HONESTAMENTE carimbados com badge de latão `[EXEMPLO]` + hachura do poste → o vazio lê
// como andaime intencional, não seção quebrada. Caixas de dimensão fixa (contain-intrinsic-size)
// → quando o conteúdo real entrar (art-producer/CMS), troca sem CLS. Cards VARIADOS (1 dominante),
// nunca 3 idênticos.

// [PLACEHOLDER — TROCAR POR REAL ANTES DE PUBLICAR]. Não é depoimento real: é andaime marcado.
const CARDS = [
  { span: "md:col-span-3", lines: 3 },
  { span: "md:col-span-3", lines: 2 },
  { span: "md:col-span-6", lines: 2 },
];

export function Depoimentos() {
  return (
    <Section id="depoimentos">
      <div className="flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between md:gap-8">
        <div>
          <Kicker className="mb-3">Prova social</Kicker>
          <h2 className="font-display text-display-lg uppercase tracking-display-upper text-ink">
            O que os donos falam.
          </h2>
        </div>
        <Badge tone="warning" className="shrink-0 self-start">
          Exemplo — trocar por real antes de publicar
        </Badge>
      </div>

      <ul className="mt-block grid gap-6 md:grid-cols-6">
        {CARDS.map((card, i) => (
          <li
            key={i}
            className={`relative flex min-h-[13rem] flex-col overflow-hidden rounded-surface border border-line bg-surface-raised shadow-e2 [contain-intrinsic-size:auto_13rem] ${card.span}`}
          >
            <PosteDivider tone="brass" />
            <div className="relative z-[1] flex flex-1 flex-col p-6">
              <div className="flex items-center justify-between">
                <IconQuote className="size-6 text-accent" />
                <Badge tone="accent">Exemplo</Badge>
              </div>

              {/* skeleton da citação — box exato, sem inventar texto */}
              <div className="mt-4 flex flex-1 flex-col gap-2.5" aria-hidden="true">
                {Array.from({ length: card.lines }).map((_, l) => (
                  <span
                    key={l}
                    className="block h-3 rounded-pill bg-line"
                    style={{ width: `${92 - l * 14}%` }}
                  />
                ))}
              </div>

              {/* rodapé: avatar (skeleton) + marca HONESTA de pendência (não inventa nome) */}
              <div className="mt-6 flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="size-10 shrink-0 rounded-pill border border-dashed border-line"
                />
                <p className="font-mono text-label uppercase tracking-label text-ink-subtle">
                  [Depoimento pendente — nome, barbearia, cidade]
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-6 font-mono text-label uppercase tracking-label text-ink-subtle">
        Placeholder da página de teste — depoimentos, logos e números reais entram antes de
        publicar. Nada aqui é inventado.
      </p>
    </Section>
  );
}
