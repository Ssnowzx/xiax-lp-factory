import { SkipLink } from "@/components/layout/skip-link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { StickyCtaBar } from "@/components/layout/sticky-cta-bar";
import { Hero } from "@/components/sections/hero";
import { Dor } from "@/components/sections/dor";
import { ComoFunciona } from "@/components/sections/como-funciona";
import { Numeros } from "@/components/sections/numeros";
import { Galeria } from "@/components/sections/galeria";
import { Modelos } from "@/components/sections/modelos";
import { Depoimentos } from "@/components/sections/depoimentos";
import { PrecoFixo } from "@/components/sections/preco-fixo";
import { Planos } from "@/components/sections/planos";
import { Faq } from "@/components/sections/faq";
import { Final } from "@/components/sections/final";

// Composição = ordem do funil da UX/IA §1 (1:1 com o Message Map). Zero seção fora
// do funil, zero linha do funil sem seção. Landmarks: header · main · footer.
export default function Home() {
  return (
    <>
      <SkipLink />
      <Header />
      <main id="conteudo">
        <Hero />
        <Dor />
        <ComoFunciona />
        <Numeros />
        <Galeria />
        <Modelos />
        <Depoimentos />
        <PrecoFixo />
        <Planos />
        <Faq />
        <Final />
      </main>
      <Footer />
      <StickyCtaBar />
    </>
  );
}
