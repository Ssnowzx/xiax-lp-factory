import { Section } from "@/components/ui/section";
import { Kicker } from "@/components/ui/kicker";
import { Reveal } from "@/components/motion/reveal";
import { RoughTarget } from "@/components/motion/rough-target";
import { HandwrittenNote } from "@/components/ui/handwritten-note";
import { Motif } from "@/components/decor/motif";
import type { RoughAnnotationType } from "@/lib/motion/rough-notation-plan";

// #como-funciona — job: PROVA/MECANISMO. Decisão única (§3.3): os 3 passos são um TRILHO
// ÚNICO — numerais gravados em latão conectados por uma HAIRLINE que lê como a listra do
// poste, NÃO 3 cards soltos (anti-slop explícito). F-pattern: front-load nos 2 primeiros
// termos. Passos = <h3> (h1→h2→h3 sem pular nível). Seção em bg-surface (leve elevação).
//
// WS3 (XIA-95): a lista numerada ganha 1 marca rough por item (paleta circle/underline/box).
// Copy CONGELADA — `pre`+`mark`+`post` só ISOLAM a palavra-alvo p/ o `<RoughTarget>` a
// envolver; o texto renderizado é idêntico ao V1. O passo automatizado (3) usa `underline`
// + a nota manuscrita "← com IA" (Ref.2 do Brief), explicitando a autoria por IA.
type Step = {
  n: string;
  pre: string;
  mark: string;
  type: RoughAnnotationType;
  note: number;
  post: string;
  t: string;
  ai?: boolean;
};
const STEPS: Step[] = [
  { n: "1", pre: "O cliente agenda ", mark: "sozinho", type: "circle", note: 4, post: "", t: " na sua página, sem te chamar no WhatsApp." },
  { n: "2", pre: "Tudo cai ", mark: "numa agenda só", type: "box", note: 5, post: "", t: " — todos os barbeiros, num lugar só." },
  { n: "3", pre: "O sistema manda o ", mark: "lembrete", type: "underline", note: 6, post: "", t: " no WhatsApp 24h antes.", ai: true },
];

export function ComoFunciona() {
  return (
    <Section
      id="como-funciona"
      className="bg-surface"
      decor={
        // Spec §2: comb no CANTO inferior-direito (o trilho-poste já é a decisão forte).
        // 40px op 0.08 --line · estático (canto não anima §4).
        <Motif
          name="comb"
          tint="line"
          opacity={0.08}
          size={40}
          className="bottom-6 right-6"
        />
      }
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between md:gap-8">
        <h2 className="max-w-prose font-display text-display-lg uppercase tracking-display-upper text-ink">
          No automático, do agendamento ao lembrete.
        </h2>
        <Kicker className="shrink-0">O mecanismo</Kicker>
      </div>

      <Reveal group>
        <ol className="relative mt-block grid gap-10 md:grid-cols-3 md:gap-6">
          {/* TRILHO conector — horizontal ≥md (desenha esq→dir), vertical no mobile. */}
          <span
            aria-hidden="true"
            className="hair-draw pointer-events-none absolute left-[1.5rem] top-2 bottom-2 hidden w-px bg-line md:left-0 md:right-0 md:top-8 md:bottom-auto md:block md:h-px md:w-auto md:bg-gradient-to-r md:from-accent md:via-line md:to-line"
          />

          {STEPS.map((step) => (
            <li key={step.n} className="reveal-item relative flex items-start gap-4 md:block">
              {/* numeral gravado de latão — máscara bg-surface "corta" a hairline sob ele */}
              <span className="relative z-rail flex h-16 w-12 shrink-0 items-center justify-center bg-surface font-display text-display-lg leading-none text-accent tabular-nums md:w-16 md:justify-start">
                {step.n}
              </span>
              {/* nota manuscrita decorativa — só no passo automatizado, aponta "← com IA" */}
              {step.ai ? <HandwrittenNote className="right-0 top-0 md:-top-1" /> : null}
              <h3 className="mt-1 text-title text-ink md:mt-4">
                {step.pre}
                <RoughTarget type={step.type} note={step.note}>
                  {step.mark}
                </RoughTarget>
                {step.post}
                <span className="text-ink-muted">{step.t}</span>
              </h3>
            </li>
          ))}
        </ol>
      </Reveal>

      <p className="mt-10 font-mono text-label uppercase tracking-label text-ink-subtle">
        Configura em minutos — feito pra barbearia, não pra salão genérico.
      </p>
    </Section>
  );
}
