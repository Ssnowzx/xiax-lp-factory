import { Section } from "@/components/ui/section";
import { Kicker } from "@/components/ui/kicker";
import { Reveal } from "@/components/motion/reveal";
import { ModelosPicker } from "@/components/modelos/modelos-picker";
import { Motif } from "@/components/decor/motif";
import { MODELOS, MODELOS_INTRO } from "@/lib/data/modelos";

// #modelos — job: DIFERENCIAÇÃO / anti-objeção "cara de planilha genérica" (Brief §WS2,
// NOVA). Prova que o XiaX veste a IDENTIDADE da barbearia. Posição no funil: DEPOIS da
// prova visual (#galeria) e ANTES da prova social (#depoimentos) — não toca a ordem
// congelada nem a âncora #planos-form.
//
// FRONTEIRA (Front-end Architect): shell RSC — título/intro/CTA saem no HTML de
// servidor (indexáveis, h2 sem pular nível). A seleção + preview ao vivo é a ilha
// client de folha (`ModelosPicker`), montada por cima. O `ui-engineer` finaliza a UI
// (Radix RadioGroup, 5 estados) e o `copywriter` refina a copy (SEAM em lib/data/modelos).
export function Modelos() {
  return (
    <Section
      id="modelos"
      width="content"
      decor={
        // Spec §2: brush no CANTO topo-esquerdo do FRAME EXTERNO (NUNCA dentro de
        // [data-modelo-preview] — protege o CLS 0 e o radiogroup de cor P5). 36px op 0.08 --line.
        <Motif
          name="brush"
          tint="line"
          opacity={0.08}
          size={36}
          className="left-6 top-10 md:left-10"
        />
      }
    >
      <Reveal className="flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between md:gap-8">
        <h2 className="max-w-prose font-display text-display-lg uppercase tracking-display-upper text-ink">
          {MODELOS_INTRO.titulo}
        </h2>
        <Kicker className="shrink-0">{MODELOS_INTRO.kicker}</Kicker>
      </Reveal>

      <p className="mt-4 max-w-prose text-body-lg text-ink-muted">
        {MODELOS_INTRO.subtitulo}
      </p>

      <ModelosPicker modelos={MODELOS} />
    </Section>
  );
}
