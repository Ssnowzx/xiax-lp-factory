import type { HeroContent, PageId } from "@/lib/content/types";

import { RichText } from "@/components/landing/rich-text";
import { Reveal } from "@/components/motion/reveal";
import { Kicker } from "@/components/ui/kicker";
import { ChkList, Chk } from "@/components/ui/chk";
import { WhatsAppCta } from "@/components/ui/whatsapp-cta";
import { IconReminder } from "@/components/ui/icons";
import { BrowserFrame, PhoneFrame } from "@/components/ui/device-frame";
import { SCREENS_NOTE, WHATSAPP_CTA_NOTE } from "@/lib/content/shared";

// #hero — job: PROMESSA. RSC: H1 (LCP), sub, checklist e CTA saem no HTML de servidor
// (indexáveis, sem depender de JS). Keyword primária no EYEBROW (Message Map V2).
// Grid editorial assimétrico ≥md — copy col 1–5; a AGENDA sangra col 6–12 até a borda.
//
// FIXES V1 (Brief §4):
//  · H1 CURTO — cabe 100% em 360→1920, some o overflow V1. v4 (xiax-lp-v4-xchair): "Falta
//    zero" was an absolute promise; the H1 now names the two pains the product works on.
//  · Colunas INDEPENDENTES: `items-start` (não `items-center`) → texto e mockup nunca
//    colidem em altura; no mobile o mockup EMPILHA abaixo (grid-cols-1 default).
//  · Linha dourada (mark-accent) ALINHADA ao bloco de texto: sublinha só a segunda frase
//    (curta, nowrap seguro dentro da coluna) — não vaza como na V1.
//  · Ritmo vertical: saída do hero por `pb-block` (respiro único), não `pb-section`
//    dobrado com o `pt-section` do #dor (some o "vazio pós-hero").
//
// Phone (owner, 2026-10-28: "o hero está muito mal posicionado"): the header sits in the
// flow, so the top pad is a short gap, not header-h + 6vh. The copy column dissolves into the
// grid (`contents`) and `order` puts promise and CTA first, the screens right after (peeking
// on the first screen), then the checklist. DOM order — and so reading and focus order —
// stays the desktop one; the reorder is visual only (the screens illustrate, they hold no
// control). ≥md is unchanged.
//
// v4 (xiax-lp-v4-xchair · D3): the hand-built agenda gave way to the REAL app — the owner's
// day agenda in a computer window, the shop's page in a phone in front of it. The example
// logos strip is gone until real shops authorise theirs.

export function Hero({ content, page, greeting }: { content: HeroContent; page: PageId; greeting: string }) {
  return (
    <section
      id="hero"
      className="relative overflow-x-clip px-gutter pb-block pt-8 md:pt-[calc(var(--header-h)+clamp(2rem,6vh,4rem))]"
    >
      <div className="relative z-[1] mx-auto grid max-w-content items-start md:grid-cols-12 md:gap-8">
        <div className="contents md:col-span-6 md:block lg:col-span-5">
          <Kicker className="mb-4">{content.kicker}</Kicker>

          {/* WS3 · headline: the marked run is the hero's signature (the theme's highlight). */}
          <h1 className="text-balance font-display text-display-xl type-display text-ink">
            <RichText value={content.title} />
          </h1>

          {/* Subtítulo limpo, sem marcações rough (strike/crossed-off removidos a pedido
              do cliente — as riscas sobre a copy ficaram confusas). */}
          <p className="mt-6 max-w-prose text-body-lg text-ink-muted">{content.body}</p>

          <Reveal group className="order-2 md:order-none">
            <ChkList className="mt-8 md:mt-6">
              {content.checklist.map((item) => (
                <Chk
                  key={item.text}
                  className="reveal-item"
                  icon={item.icon === "reminder" ? <IconReminder className="size-[1.2em]" /> : undefined}
                >
                  {item.text}
                </Chk>
              ))}
            </ChkList>
          </Reveal>

          <div className="mt-6 md:mt-8">
            <WhatsAppCta page={page} placement="hero" message={greeting} className="w-full sm:w-auto" />
            <p className="mt-3 text-pretty text-body text-ink-subtle">{WHATSAPP_CTA_NOTE}</p>
          </div>
        </div>

        {/* Mídia col 6–12 — sangra até a borda direita do viewport (`-mr-gutter` come o
            padding lateral). Caixa reservada por aspect-ratio → CLS 0: the computer window
            sits top-right, the phone overlaps its lower-left corner. */}
        <Reveal className="order-1 mt-8 md:order-none md:col-span-6 md:-mr-gutter md:mt-0 lg:col-span-7">
          <div data-hero-media className="relative aspect-[20/19] w-full [contain:layout] md:aspect-[5/4]">
            {/* v3 depth card: a fine pointer tilts the pair; the phone floats in front. */}
            <div data-depth-card className="absolute inset-0">
              <div data-depth-stage className="size-full">
                <div data-depth="1" className="absolute right-0 top-0 w-[90%] md:w-[88%]">
                  <BrowserFrame
                    screen={content.desktopScreen}
                    sizes="(min-width: 1024px) 760px, (min-width: 768px) 50vw, 90vw"
                    priority
                  />
                </div>
                <div data-depth="3" className="absolute bottom-0 left-0 w-[38%] md:w-[30%]">
                  <PhoneFrame
                    screen={content.phoneScreen}
                    sizes="(min-width: 1024px) 260px, (min-width: 768px) 15vw, 36vw"
                    priority
                  />
                </div>
              </div>
            </div>
            {/* v3: where the 3D scissors opens the page — over the panel's top edge, as if
                about to cut it. Measured by ScissorsStage; zero size, never painted. */}
            <span
              data-scissors-anchor
              aria-hidden="true"
              className="pointer-events-none absolute right-[24%] top-[-12px] size-px"
            />
          </div>
          <p className="mt-4 text-right font-mono text-label uppercase leading-normal tracking-label text-ink-subtle">
            {SCREENS_NOTE}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
