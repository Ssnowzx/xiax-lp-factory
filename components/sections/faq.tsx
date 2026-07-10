"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { track } from "@/lib/analytics/track";
import { Motif } from "@/components/decor/motif";
import type { AnalyticsEvent } from "@/lib/analytics/events";

// #faq — job: OBJEÇÃO + risk-reversal, colada ao clique final. Radix Accordion
// (ARIA/teclado/roving corretos). Client, mas o texto SSRa no HTML → indexável.
// Header do Radix é <h3> por padrão (hierarquia h2→h3 sem pular nível).
type FaqId = Extract<AnalyticsEvent, { name: "faq_open" }>["question"];

const ITEMS: { id: FaqId; q: string; a: string }[] = [
  {
    id: "whatsapp",
    q: "Já me viro no WhatsApp",
    a: "Vira — até a primeira falta do mês. O WhatsApp na mão não manda lembrete sozinho nem mostra o buraco na agenda, e a falta continua saindo do seu bolso: numa casa de R$ 8.000, são ~R$ 2.000/mês parados. O Xbarber manda o lembrete no WhatsApp 24h antes, por você — até 70% menos falta.",
  },
  {
    id: "preco",
    q: "É caro?",
    a: "Um preço fixo pra barbearia inteira. Booksy e Trinks cobram por barbeiro — com 4 já passam de R$ 280/mês, e sobe a cada barbeiro novo. Aqui é a partir de R$ 98,90 com barbeiros ilimitados: bota o time todo que o preço não mexe. E você testa 14 dias grátis, sem cartão.",
  },
  {
    id: "config",
    q: "É complicado configurar?",
    a: "Não. Você cria a conta, cadastra os barbeiros e os serviços (com preço e duração) e já começa a agendar no mesmo dia — sem instalar programa, sem técnico e sem manual. A tela é feita pra barbearia: quem está na cadeira entende de primeira. E dá pra deixar tudo pronto nos 14 dias grátis, sem cartão.",
  },
  {
    id: "marketplace",
    q: "Meus clientes viram do concorrente?",
    a: "Nunca — porque o Xbarber não é marketplace. Nos apps que também são vitrine, o cliente abre pra marcar com você e vê um monte de barbearia concorrente na mesma tela. Aqui não: sua agenda mostra só a sua barbearia e a sua base de clientes é só sua — ninguém usa ela pra empurrar concorrente pro seu cliente. Você conquista o cliente uma vez, e ele volta pra você, não pra plataforma.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="relative overflow-x-clip px-gutter py-section">
      {/* Spec §2: barber-pole ATRÁS DO TÍTULO, sangrando na borda direita (o H2 é
          esquerdo → o pole não cruza o texto). op 0.05 --line · parallax §4. */}
      <Motif
        name="barber-pole"
        tint="line"
        opacity={0.05}
        size="clamp(200px,24vw,340px)"
        motion="parallax"
        className="right-0 top-8 translate-x-[24%]"
      />
      <div className="relative z-[1] mx-auto max-w-content">
        <h2 className="max-w-prose font-display text-display-lg uppercase tracking-display-upper text-ink">
          Ainda na dúvida?
        </h2>

        <Accordion.Root
          type="single"
          collapsible
          className="mt-block divide-y divide-line border-y border-line"
          onValueChange={(value) => {
            if (value) track({ name: "faq_open", question: value as FaqId });
          }}
        >
          {ITEMS.map((item) => (
            <Accordion.Item key={item.id} value={item.id}>
              <Accordion.Header>
                <Accordion.Trigger className="group flex w-full items-center justify-between gap-4 py-5 text-left font-mono text-body-lg uppercase tracking-label text-ink transition-colors duration-micro ease-standard hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-accent motion-reduce:transition-none">
                  {item.q}
                  <span
                    aria-hidden="true"
                    className="text-accent transition-transform duration-micro ease-standard group-data-[state=open]:rotate-45 motion-reduce:transition-none"
                  >
                    +
                  </span>
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="overflow-hidden pb-5 text-body text-ink-muted data-[state=closed]:animate-none">
                <p className="max-w-prose">{item.a}</p>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>

        <p className="mt-6 font-mono text-label uppercase tracking-label text-ink-subtle">
          Cancela em dois cliques — o risco de sair é zero.
        </p>
      </div>
    </section>
  );
}
