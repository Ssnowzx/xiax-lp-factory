import { StatNumber } from "@/components/ui/stat-number";
import { Kicker } from "@/components/ui/kicker";
import { Reveal } from "@/components/motion/reveal";

// #dor — job: PROVA/CONTRASTE. Decisão única (§3.2): o custo da falta é um número GIGANTE
// de latão (~R$2.000) que SANGRA na margem esquerda (`-ml-gutter` → borda do viewport) e
// pesa ≥1,5× o texto. Número = <p aria-hidden> (StatNumber); o significado mora no texto.
export function Dor() {
  return (
    <section id="dor" className="relative overflow-x-clip px-gutter py-section">
      <div className="relative z-[1] mx-auto grid max-w-content items-center gap-8 md:grid-cols-12">
        <Reveal className="md:col-span-6">
          {/* sangra até a borda esquerda: -ml-gutter come o padding lateral da seção */}
          <StatNumber value="~R$ 2.000" countTo={2000} tone="accent" size="2xl" className="md:-ml-gutter" />
        </Reveal>

        <div className="md:col-span-6">
          <Kicker className="mb-3">O custo escondido</Kicker>
          <h2 className="font-display text-display-lg uppercase tracking-display-upper text-ink">
            25% de falta é R$ 2.000 saindo do seu bolso. Todo mês.
          </h2>
          <p className="mt-5 max-w-prose text-body-lg text-ink-muted">
            Barbearia que fatura R$ 8.000 com um quarto das cadeiras vazias por falta perde{" "}
            <strong className="text-ink">~R$ 2.000 por mês</strong>. O caderno e o WhatsApp na
            mão não avisam ninguém.
          </p>
        </div>
      </div>
    </section>
  );
}
