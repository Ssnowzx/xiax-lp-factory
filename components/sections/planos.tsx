import { Section } from "@/components/ui/section";
import { TrialForm } from "@/components/forms/trial-form";
import { Reveal } from "@/components/motion/reveal";
import { PlanosTable } from "@/components/sections/planos-table";
import { Motif } from "@/components/decor/motif";

// #planos — job: OFERTA (Message Map V2). RSC: header + tabela SSRam (indexáveis);
// só o toggle mensal/anual é ilha client (PlanosTable). 4 tiers por CAPACIDADE, cada
// um soma ao anterior, "mais popular" destacado, check dourado, barbeiros ILIMITADOS
// em todos. Destino ÚNICO de conversão: TODOS os CTAs → teste grátis (#planos-form),
// jamais checkout.

export function Planos() {
  return (
    <Section
      id="planos"
      width="content"
      decor={
        // Spec §2: razor AO LADO (não sobre) do botão do #planos-form. Só ≥lg, onde há
        // folga lateral do form centrado (max-w-xl) — no mobile o form é largo, sem espaço.
        // 32px op 0.10 accent · estático (perto-de-CTA: folga ≥16px, nunca sobre §3.2/§3.3).
        <Motif
          name="razor"
          tint="accent"
          opacity={0.1}
          size={32}
          className="bottom-24 right-[12%] hidden lg:block"
        />
      }
    >
      <Reveal className="mx-auto mb-block max-w-prose text-center">
        <h2 className="font-display text-display-lg uppercase tracking-display-upper text-ink">
          Um plano pra cada fase da sua barbearia.
        </h2>
        <p className="mt-4 text-body-lg text-ink-muted">
          Cada plano soma ao anterior. A diferença é a capacidade — os barbeiros são
          ilimitados em todos.
        </p>
      </Reveal>

      <PlanosTable />

      <p className="mt-block text-center font-mono text-label uppercase tracking-label text-ink-subtle">
        Barbeiros ilimitados em todos os planos · 14 dias grátis, sem cartão · cancele quando
        quiser
      </p>

      {/* Destino do CTA de plano: o MESMO teste grátis do #hero/#final. scroll-margin-top
          global recua o header sticky. */}
      <div id="planos-form" className="mx-auto mt-block max-w-xl">
        <TrialForm placement="planos" />
      </div>
    </Section>
  );
}
