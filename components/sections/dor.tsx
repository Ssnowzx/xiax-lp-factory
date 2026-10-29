import type { PainContent } from "@/lib/content/types";

import { RichText } from "@/components/landing/rich-text";
import { StatNumber } from "@/components/ui/stat-number";
import { Kicker } from "@/components/ui/kicker";
import { Reveal } from "@/components/motion/reveal";

// #dor — job: PROVA/CONTRASTE. O custo da falta é um número de latão (~R$2.000) ao lado
// do texto, framed as a worked example, never as a market fact (change xiax-lp-v4-xchair).
// Compactado a pedido do cliente: número em `xl` (não 2xl) alinhado ao TOPO do texto (não
// flutuando no centro), colunas próximas, sem o sangramento que abria vazio.
// Número = <p aria-hidden> (StatNumber); o significado mora no texto.
export function Dor({ content }: { content: PainContent }) {
  return (
    <section id="dor" className="relative overflow-x-clip px-gutter py-section">
      <div className="relative z-[1] mx-auto grid max-w-content items-start gap-x-10 gap-y-6 md:grid-cols-12">
        <Reveal className="md:col-span-5">
          <StatNumber value={content.stat.value} countTo={content.stat.countTo} tone="accent" size="xl" />
        </Reveal>

        <div className="md:col-span-7">
          <Kicker className="mb-3">{content.kicker}</Kicker>
          <h2 className="font-display text-display-lg type-display text-ink">
            {content.title}
          </h2>
          <p className="mt-5 max-w-prose text-body-lg text-ink-muted">
            <RichText value={content.body} />
          </p>
        </div>
      </div>
    </section>
  );
}
