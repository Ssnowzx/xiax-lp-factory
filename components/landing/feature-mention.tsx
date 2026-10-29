import type { SalonFeatureId } from "@/lib/content/types";

import { Badge } from "@/components/ui/badge";
import { COMING_SOON_LABEL } from "@/lib/content/shared";
import { SALON_FEATURES } from "@/lib/content/salon-features";
import { cn } from "@/lib/ui/cn";

// A salon feature named in the copy (change xiax-lp-v5-salon · D4). Its state comes from the
// registry, so a feature still being built carries the "Em breve" badge everywhere it is named,
// and launching it removes every badge at once. `data-feature-status` is what qa/v5-coming-soon.mjs
// checks.

/** The "Em breve" badge. */
export function ComingSoon({ className }: { className?: string }) {
  return (
    <Badge data-coming-soon className={cn("whitespace-nowrap px-2 py-0.5 align-[0.12em]", className)}>
      {COMING_SOON_LABEL}
    </Badge>
  );
}

interface FeatureMentionProps {
  id: SalonFeatureId;
  /** How the sentence names the feature; the registry's title when omitted. */
  text?: string;
}

export function FeatureMention({ id, text }: FeatureMentionProps) {
  const feature = SALON_FEATURES[id];
  return (
    <span data-feature={id} data-feature-status={feature.status}>
      {text ?? feature.title}
      {feature.status === "coming" && (
        <>
          {" "}
          <ComingSoon />
        </>
      )}
    </span>
  );
}
