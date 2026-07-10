import { Section } from "@/components/ui/section";
import { StatNumber } from "@/components/ui/stat-number";
import { Kicker } from "@/components/ui/kicker";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/motion/reveal";
import { Motif } from "@/components/decor/motif";

// #preco-fixo — job: PROVA/CONTRASTE DE PREÇO. Decisão única (§3.6): uma coluna "concorrente"
// que SOBE (mais alta/densa) vs. uma coluna "Xbarber" que fica PARADA (baixa/estável) — a
// ASSIMETRIA é o argumento. Só o lado Xbarber ganha latão; o concorrente fica ink-muted
// (apagado de propósito). O contraste de cor reforça o contraste de preço.
export function PrecoFixo() {
  return (
    <Section
      id="preco-fixo"
      decor={
        // Spec §2: blade ATRÁS DO TÍTULO, borda direita (longe das cifras de preço,
        // que ficam nos cards abaixo). op 0.05 accent · parallax §4.
        <Motif
          name="blade"
          tint="accent"
          opacity={0.05}
          size="clamp(200px,24vw,340px)"
          motion="parallax"
          className="right-0 top-4 translate-x-[26%] md:top-8"
        />
      }
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between md:gap-8">
        <h2 className="max-w-prose font-display text-display-lg uppercase tracking-display-upper text-ink">
          Preço fixo. Barbeiro ilimitado.
        </h2>
        <Kicker className="shrink-0">O contraste de preço</Kicker>
      </div>

      <div className="mt-block grid items-end gap-6 md:grid-cols-12">
        {/* Concorrente — sobe: mais alto/denso, apagado (ink-muted, sem accent) */}
        <div className="rounded-surface border border-line bg-surface p-7 md:col-span-7 md:pb-12">
          <p className="font-mono text-label uppercase tracking-label text-ink-subtle">
            Booksy / Trinks — cobram por barbeiro
          </p>
          <Reveal>
            <StatNumber value="R$ 280+" countTo={280} tone="ink" size="2xl" className="mt-4 text-ink-muted" />
          </Reveal>
          <p className="mt-3 max-w-prose text-body-lg text-ink-muted">
            Com 4 barbeiros, a conta já passa de R$ 280/mês. E{" "}
            <span className="text-ink">sobe de novo a cada barbeiro</span> que você coloca.
          </p>
        </div>

        {/* Xbarber — parado: baixo/estável, o único com latão */}
        <div className="rounded-surface border border-accent/40 bg-surface-raised p-7 shadow-e2 md:col-span-5">
          <Badge tone="accent" className="mb-4">
            Preço fixo
          </Badge>
          <p className="text-title text-ink">Quantos barbeiros você quiser. O preço não muda.</p>
          <p className="mt-3 text-body text-ink-muted">
            Barbeiros ilimitados em todos os planos, sem cobrar por cadeira. O plano muda pela
            capacidade da barbearia — não pelo número de barbeiros. Escolha a sua na tabela abaixo.
          </p>
        </div>
      </div>
    </Section>
  );
}
