import { LandingPage } from "@/components/landing/landing-page";
import { BARBERSHOP } from "@/lib/content/barbershop";

// The barbershop page. Section order = the funnel (UX/IA §1, 1:1 with the Message Map), given
// by the content (lib/content/barbershop.ts). #depoimentos is out until real testimonials exist
// (xiax-lp-v3-cards-25d); its component stays in components/sections/. #preco-fixo is gone:
// pricing may follow the number of professionals, so the page makes no "unlimited barbers" /
// "fixed price" promise. v4 (xiax-lp-v4-xchair · D6): #lista-de-espera and #caixa sell what the
// Essencial already does, right after the reminder proof.
export default function Home() {
  return <LandingPage content={BARBERSHOP} />;
}
