import { Fragment } from "react";

import type { ReactNode } from "react";
import type { PageContent, SectionKey } from "@/lib/content/types";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { SkipLink } from "@/components/layout/skip-link";
import { StickyCtaBar } from "@/components/layout/sticky-cta-bar";
import { Caixa } from "@/components/sections/caixa";
import { ComoFunciona } from "@/components/sections/como-funciona";
import { Dor } from "@/components/sections/dor";
import { Faq } from "@/components/sections/faq";
import { FeitoParaSalao } from "@/components/sections/feito-para-salao";
import { Final } from "@/components/sections/final";
import { Galeria } from "@/components/sections/galeria";
import { Hero } from "@/components/sections/hero";
import { ListaDeEspera } from "@/components/sections/lista-de-espera";
import { Modelos } from "@/components/sections/modelos";
import { Numeros } from "@/components/sections/numeros";
import { Planos } from "@/components/sections/planos";

// One landing page from its content (change xiax-lp-v5-salon · D2): the sections in the order
// the content gives (the funnel), inside the shared header · main · footer landmarks. Every
// section key has a renderer, so a new section cannot be listed in a content without one.

const SECTIONS: Record<SectionKey, (content: PageContent) => ReactNode> = {
  hero: (c) => <Hero content={c.hero} page={c.page} greeting={c.whatsapp.greeting} />,
  pain: (c) => <Dor content={c.pain} />,
  steps: (c) => <ComoFunciona content={c.steps} />,
  numbers: (c) => <Numeros content={c.numbers} />,
  waitlist: (c) => <ListaDeEspera content={c.waitlist} />,
  salonFeatures: (c) => (c.salonFeatures ? <FeitoParaSalao content={c.salonFeatures} /> : null),
  cash: (c) => <Caixa content={c.cash} />,
  gallery: (c) => <Galeria content={c.gallery} />,
  showcase: (c) => <Modelos content={c.showcase} />,
  plans: (c) => <Planos content={c.plans} page={c.page} messages={c.whatsapp.plan} />,
  faq: (c) => <Faq content={c.faq} />,
  final: (c) => <Final content={c.final} page={c.page} greeting={c.whatsapp.greeting} />,
};

export function LandingPage({ content }: { content: PageContent }) {
  return (
    <>
      <SkipLink />
      <Header />
      <main id="conteudo">
        {content.order.map((key) => (
          <Fragment key={key}>{SECTIONS[key](content)}</Fragment>
        ))}
      </main>
      <Footer />
      <StickyCtaBar page={content.page} greeting={content.whatsapp.greeting} />
    </>
  );
}
