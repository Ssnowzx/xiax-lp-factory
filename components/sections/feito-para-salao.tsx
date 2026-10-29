import type { SalonFeaturesContent, SalonFeatureId } from "@/lib/content/types";

import { Section } from "@/components/ui/section";
import { Kicker } from "@/components/ui/kicker";
import { Badge } from "@/components/ui/badge";
import { ComingSoon } from "@/components/landing/feature-mention";
import { Reveal } from "@/components/motion/reveal";
import { SALON_FEATURES } from "@/lib/content/salon-features";

// #feito-para-salao (salon page only · change xiax-lp-v5-salon · D4): one card per salon feature,
// with the pain it solves and its state from the registry. A feature still being built shows the
// "Em breve" badge and never an app screen; the note under the cards says which plan brings them
// and what the Essencial does today. `data-feature-status` is what qa/v5-coming-soon.mjs checks.

/** Shown on a feature that already works in the app. */
const AVAILABLE_LABEL = "Já funciona no app";

function FeatureCard({ id }: { id: SalonFeatureId }) {
  const feature = SALON_FEATURES[id];
  return (
    <li
      className="reveal-item flex flex-col gap-3 rounded-surface border border-line bg-surface-raised p-5 shadow-e2"
      data-feature={id}
      data-feature-status={feature.status}
    >
      <div>
        {feature.status === "coming" ? <ComingSoon /> : <Badge tone="line">{AVAILABLE_LABEL}</Badge>}
      </div>
      <h3 className="font-display text-title type-display text-ink">{feature.title}</h3>
      <p className="text-body text-ink-muted">{feature.pain}</p>
    </li>
  );
}

export function FeitoParaSalao({ content }: { content: SalonFeaturesContent }) {
  return (
    <Section id="feito-para-salao">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
        <Reveal className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <Kicker className="mb-3">{content.kicker}</Kicker>
            <h2 className="max-w-prose font-display text-display-lg type-display text-ink">{content.title}</h2>
            <p className="mt-4 max-w-prose text-body-lg text-ink-muted">{content.body}</p>
          </div>
        </Reveal>
        <div className="lg:col-span-8">
          <Reveal group>
            <ul className="grid gap-4 sm:grid-cols-2">
              {content.items.map((id) => (
                <FeatureCard key={id} id={id} />
              ))}
            </ul>
          </Reveal>
          <p className="mt-6 max-w-prose text-body text-ink-muted">{content.note}</p>
        </div>
      </div>
    </Section>
  );
}
