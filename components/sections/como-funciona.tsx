import type { StepContent, StepsContent } from "@/lib/content/types";

import { Section } from "@/components/ui/section";
import { Kicker } from "@/components/ui/kicker";
import { Reveal } from "@/components/motion/reveal";
import { StepVisual } from "@/components/ui/step-visuals";
import { stillCssHeight } from "@/lib/motion/still-frame";
import { SWEEP_TOOLS } from "@/lib/motion/sweep-tool";

// #como-funciona — job: PROVA/MECANISMO. v3 (xiax-lp-v3-cards-25d · design D12): the three
// steps are depth cards on the leather, strung on a brass thread through numbered
// medallions. v4 (xiax-lp-v4-xchair · D3): each card shows a cut of the REAL app screen
// (time choice → day agenda → confirmation + the real day-before WhatsApp reminder), with
// the same one-shot story played over it. The thread is horizontal ≥md and vertical when the cards stack; it runs
// behind the opaque cards, so it only shows between them. Steps = <h3> (h1→h2→h3).
// xiax-lp-v3-razor-3d (design D1/D7/D8): the 3D razor makes the heading's cut once, along
// the horizontal thread (≥md) or, on a phone, along a hairline under the heading; under
// reduced motion its still lies on the end of that line. ≥md the steps sit a fixed 80 px
// below the heading (not the vh-based block gap) so the hovering razor clears both.
// xiax-lp-v5-salon (design D7): the content names the line's tool (`sweepTool`: the razor here,
// the round brush on the salon page); `data-sweep-tool` hands it to the stage, which fetches
// only that tool's model and still.

function StepCard({ step, n }: { step: StepContent; n: number }) {
  return (
    <li className="reveal-item relative flex flex-col">
      <span className="relative z-rail flex size-12 items-center justify-center rounded-full border border-accent/60 bg-surface-raised font-display text-title leading-none text-accent shadow-e2 tabular-nums">
        {n}
      </span>
      <div data-depth-card className="mt-5 flex-1">
        <div
          data-depth-stage
          className="flex h-full flex-col gap-5 rounded-surface border border-line bg-surface-raised p-4 shadow-e2 md:flex-row md:items-center md:gap-8 md:p-5 lg:flex-col lg:items-stretch lg:gap-5"
        >
          {/* Tablet: the screen beside the text, so a cut is never squeezed to a third column. */}
          <div data-depth-pass className="md:w-[46%] md:shrink-0 lg:w-full">
            <StepVisual spec={step.visual} />
          </div>
          <h3 className="text-title text-ink">
            {step.lead}
            <span className="text-ink-muted">{step.rest}</span>
          </h3>
          <span data-depth-sheen aria-hidden="true">
            <span />
          </span>
        </div>
      </div>
    </li>
  );
}

export function ComoFunciona({ content }: { content: StepsContent }) {
  const tool = SWEEP_TOOLS[content.sweepTool];
  return (
    <Section id="como-funciona" data-sweep-tool={content.sweepTool}>
      <div className="flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between md:gap-8">
        <h2 className="max-w-prose font-display text-display-lg type-display text-ink">
          {content.title}
        </h2>
        <Kicker className="shrink-0">{content.kicker}</Kicker>
      </div>

      {/* Below lg: the tool's line, where the steps' thread runs vertical. */}
      <span
        aria-hidden="true"
        data-cut-line
        className="mt-12 block h-px origin-left bg-gradient-to-r from-accent/70 via-accent/30 to-transparent lg:hidden"
      />

      <Reveal group>
        <ol className="relative mt-block grid gap-10 md:mt-20 lg:grid-cols-3 lg:gap-6">
          <span
            aria-hidden="true"
            data-step-thread
            className="pointer-events-none absolute bottom-0 left-6 top-6 w-px origin-top bg-gradient-to-b from-accent/70 via-accent/30 to-transparent lg:bottom-auto lg:left-6 lg:right-0 lg:h-px lg:w-auto lg:origin-left lg:bg-gradient-to-r"
          />
          {content.steps.map((step, i) => (
            <StepCard key={step.lead} step={step} n={i + 1} />
          ))}
        </ol>
      </Reveal>

      <p className="mt-10 font-mono text-label uppercase leading-normal tracking-label text-ink-subtle">
        {content.footnote}
      </p>

      {/* The tool's still (static branch only): src and position are set by the stage. */}
      <img
        alt=""
        aria-hidden="true"
        {...{ [tool.stillAttr]: true }}
        decoding="async"
        className="pointer-events-none invisible absolute left-0 top-0 z-rail w-auto max-w-none opacity-0"
        style={{ height: stillCssHeight(tool.stillFrame, tool.stillLengthPx) }}
      />
    </Section>
  );
}
