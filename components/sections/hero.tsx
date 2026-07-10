import { TrialForm } from "@/components/forms/trial-form";
import { Reveal } from "@/components/motion/reveal";
import { RoughTarget } from "@/components/motion/rough-target";
import { Kicker } from "@/components/ui/kicker";
import { ChkList, Chk } from "@/components/ui/chk";
import { AgendaMock } from "@/components/ui/agenda-mock";
import { TrustStrip } from "@/components/ui/trust-strip";
import { IconReminder } from "@/components/ui/icons";

// #hero — job: PROMESSA. RSC: H1 (LCP), sub, checklist e CTA saem no HTML de servidor
// (indexáveis, sem depender de JS). Keyword primária no EYEBROW (Message Map V2).
// Grid editorial assimétrico ≥md — copy col 1–5; a AGENDA sangra col 6–12 até a borda.
//
// FIXES V1 (Brief §4):
//  · H1 CURTO ("Agenda cheia. Falta zero.") — cabe 100% em 360→1920, some o overflow V1.
//  · Colunas INDEPENDENTES: `items-start` (não `items-center`) → texto e mockup nunca
//    colidem em altura; no mobile o mockup EMPILHA abaixo (grid-cols-1 default).
//  · Linha dourada (mark-brass) ALINHADA ao bloco de texto: sublinha só "Falta zero"
//    (curto, nowrap seguro dentro da coluna) — não vaza como na V1.
//  · Ritmo vertical: saída do hero por `pb-block` (respiro único), não `pb-section`
//    dobrado com o `pt-section` do #dor (some o "vazio pós-hero").

export function Hero() {
  return (
    <section
      id="hero"
      className="relative overflow-x-clip px-gutter pb-block pt-[calc(var(--header-h)+clamp(2rem,6vh,4rem))]"
    >
      <div className="relative z-[1] mx-auto grid max-w-content items-start gap-10 md:grid-cols-12 md:gap-8">
        <div className="md:col-span-6 lg:col-span-5">
          <Kicker className="mb-4">Sistema de agendamento para barbearia</Kicker>

          {/* WS3 · headline: "Falta zero" é a assinatura do hero, marcada só pelo
              `mark-brass` (sublinhado latão). O círculo rough em "zero" foi removido
              a pedido do cliente. */}
          <h1 className="text-balance font-display text-display-xl uppercase tracking-display-upper text-ink">
            Agenda cheia.{" "}
            <span className="mark-brass text-accent">Falta zero</span>.
          </h1>

          {/* WS3 · headline: strike-through + crossed-off como flourish latão de ÊNFASE
              (tinta = --accent, não caneta vermelha) sobre a promessa — copy inalterada,
              só ganha o wrapper. Desenham pós-fonts.ready, sobre o texto-LCP já pintado. */}
          <p className="mt-6 max-w-prose text-body-lg text-ink-muted">
            Agenda única pra{" "}
            <RoughTarget type="strike-through" note={2}>todos os barbeiros</RoughTarget> +
            lembrete automático no WhatsApp{" "}
            {/* nowrap: `crossed-off` só lê como UM X se o alvo ocupar uma linha só.
                Sem isso, "24h antes" quebra em 390px e vira dois X. */}
            <RoughTarget type="crossed-off" note={3} className="whitespace-nowrap">
              24h antes
            </RoughTarget>. O cliente
            lembra, você fatura.
          </p>

          <Reveal group>
            <ChkList className="mt-6">
              <Chk className="reveal-item" icon={<IconReminder className="size-[1.2em]" />}>
                Lembrete automático no WhatsApp
              </Chk>
              <Chk className="reveal-item">Agenda de todos num lugar só</Chk>
              <Chk className="reveal-item">Barbeiros ilimitados, preço fixo</Chk>
            </ChkList>
          </Reveal>

          <div className="mt-8">
            <TrialForm placement="hero" />
            <p className="mt-3 font-mono text-label uppercase tracking-label text-ink-subtle">
              14 dias grátis · sem cartão · cancele quando quiser
            </p>
          </div>

          {/* Trust-strip: faixa de logos PLACEHOLDER honesta (F1 do Fidelity Sign-off).
              Reveal → o motion-engineer anima via [data-sec="hero-trust"] sem tocar o markup. */}
          <Reveal>
            <TrustStrip />
          </Reveal>
        </div>

        {/* Mídia col 6–12 — sangra até a borda direita do viewport (`-mr-gutter` come o
            padding lateral). Caixa reservada por aspect-ratio → CLS 0. Coluna independente:
            no mobile empilha (col-span full); ≥md ocupa a direita sem forçar altura do texto. */}
        <Reveal className="md:col-span-6 md:-mr-gutter lg:col-span-7">
          <div className="aspect-[4/5] w-full [contain:layout_paint] sm:aspect-[4/3]">
            <AgendaMock />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
