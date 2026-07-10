import { Section } from "@/components/ui/section";
import { TrialForm } from "@/components/forms/trial-form";
import { Reveal } from "@/components/motion/reveal";
import { Motif } from "@/components/decor/motif";

// #final — job: CTA (close). Repete a MESMA ação primária; nada compete com o botão. Decisão
// única (§3.9): a promessa fecha como cartaz — "a falta" volta sublinhada em latão, fechando
// o ciclo do #hero. Respiro amplo (py-section), só tipo + CTA (sem mídia).
export function Final() {
  return (
    <Section
      id="final"
      className="bg-surface"
      decor={
        // Spec §2/§4: scissors = ASSINATURA REPRISE (bookend do hero), FLUTUA ao lado do
        // CTA final (nunca sobre — conteúdo centrado max-w-2xl deixa folga ≥md). op 0.08
        // accent · floating (translateY ≤6px, loop lento §4).
        <Motif
          name="scissors"
          tint="accent"
          opacity={0.08}
          size="clamp(120px,14vw,200px)"
          motion="float"
          className="right-[5%] top-1/2 hidden -translate-y-1/2 md:block"
        />
      }
    >
      <div className="mx-auto max-w-2xl text-center">
        <Reveal>
          <h2 className="font-display text-display-lg uppercase tracking-display-upper text-ink">
            Comece hoje. Feche o mês{" "}
            <span className="mark-brass text-accent">sem falta</span>.
          </h2>
        </Reveal>
        <p className="mx-auto mt-5 max-w-prose text-body-lg text-ink-muted">
          Agenda única, lembrete no WhatsApp e a cadeira cheia — em 14 dias grátis, sem cartão.
          O mesmo teste do topo.
        </p>

        <div className="mx-auto mt-8 max-w-xl text-left">
          <TrialForm placement="final" />
          <p className="mt-3 text-center font-mono text-label uppercase tracking-label text-ink-subtle">
            14 dias grátis · sem cartão · cancele quando quiser
          </p>
        </div>
      </div>
    </Section>
  );
}
