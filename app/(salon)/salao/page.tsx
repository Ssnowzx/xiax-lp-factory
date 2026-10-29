import { LandingPage } from "@/components/landing/landing-page";
import { SALON } from "@/lib/content/salon";

// The salon page. Same sections as the barbershop, in the salon funnel (lib/content/salon.ts):
// "Feito para salão" right after the waiting list, before the cash.
export default function SalonPage() {
  return <LandingPage content={SALON} />;
}
