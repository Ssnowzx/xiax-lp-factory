import type { NumbersContent } from "@/lib/content/types";

import { Section } from "@/components/ui/section";
import { StatNumber } from "@/components/ui/stat-number";
import { Kicker } from "@/components/ui/kicker";
import { Reveal } from "@/components/motion/reveal";

// #numeros — job: PROVA. Três stats na MESMA linha de base (o cliente rejeitou a linha
// quebrada com o número deslocado — lia "solto"). O destaque vem só da COR (latão), não do
// tamanho: um accent por seção. O "até" é rótulo pequeno sobre o número (não gigante).
// Números = <p aria-hidden> (StatNumber). xiax-lp-v4-xchair: every number is either cited
// (who + year, linked below) or a product fact or a labelled example — the unsourced "70%"
// and "98%" were dropped.
export function Numeros({ content }: { content: NumbersContent }) {
  return (
    <Section id="numeros">
      <div className="flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between md:gap-8">
        <h2 className="max-w-prose font-display text-display-lg type-display text-ink">
          {content.title}
        </h2>
        <Kicker className="shrink-0">{content.kicker}</Kicker>
      </div>

      <Reveal group>
        <ul className="mt-block grid gap-x-8 gap-y-10 sm:grid-cols-3 sm:items-end">
          {content.stats.map((stat) => (
            <li key={stat.value} className="reveal-item">
              <StatNumber
                value={stat.value}
                prefix={stat.prefix}
                countTo={stat.countTo}
                tone={stat.anchor ? "accent" : "ink"}
                size="xl"
              />
              <p className="mt-3 max-w-[24ch] text-body text-ink-muted">{stat.label}</p>
            </li>
          ))}
        </ul>
      </Reveal>

      <p className="mt-12 font-mono text-label uppercase leading-normal tracking-label text-ink-subtle">
        {content.source.before}{" "}
        <a
          href={content.source.href}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-line underline-offset-4 transition-colors duration-micro ease-standard hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-accent motion-reduce:transition-none"
        >
          {content.source.label}
        </a>
        {content.source.after}
      </p>
    </Section>
  );
}
