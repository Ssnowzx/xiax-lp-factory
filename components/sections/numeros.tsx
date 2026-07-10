import { Section } from "@/components/ui/section";
import { StatNumber } from "@/components/ui/stat-number";
import { Kicker } from "@/components/ui/kicker";
import { Reveal } from "@/components/motion/reveal";

// #numeros — job: PROVA (spine numérico REAL). Decisão única (§3.4): LINHA QUEBRADA de
// stats — o `70%` é maior e deslocado ACIMA da baseline dos irmãos; jamais 3 cards iguais
// (anti-slop). Um accent por seção → só o 70% em latão. Números = <p aria-hidden> (StatNumber).
const STATS = [
  { value: "até 70%", countTo: 70, label: "menos faltas com lembrete automático", anchor: true },
  { value: "98%", countTo: 98, label: "de abertura no WhatsApp (e-mail fica em ~20%)", anchor: false },
  { value: "~R$ 2.000", countTo: 2000, label: "de volta no seu caixa por mês", anchor: false },
];

export function Numeros() {
  return (
    <Section id="numeros">
      <div className="flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between md:gap-8">
        <h2 className="max-w-prose font-display text-display-lg uppercase tracking-display-upper text-ink">
          Os números que enchem a cadeira.
        </h2>
        <Kicker className="shrink-0">A prova em números</Kicker>
      </div>

      <Reveal group>
        <ul className="mt-block grid gap-10 md:grid-cols-3 md:items-end md:gap-8">
          {STATS.map((stat) => (
            <li
              key={stat.value}
              className={
                stat.anchor
                  ? "reveal-item md:-translate-y-8" // 70% sobe acima da baseline (quebra do grid)
                  : "reveal-item"
              }
            >
              <StatNumber
                value={stat.value}
                countTo={stat.countTo}
                tone={stat.anchor ? "accent" : "ink"}
                size={stat.anchor ? "2xl" : "xl"}
              />
              <p className="mt-2 max-w-[24ch] text-body text-ink-muted">{stat.label}</p>
            </li>
          ))}
        </ul>
      </Reveal>

      <p className="mt-12 font-mono text-label uppercase tracking-label text-ink-subtle">
        Fonte: dados de mercado de lembrete automático e abertura de WhatsApp; conta da dor
        sobre faturamento médio.
      </p>
    </Section>
  );
}
