import { describe, expect, it } from "vitest";

import type { SalonFeatureId } from "@/lib/content/types";

import { BARBERSHOP } from "@/lib/content/barbershop";
import { SALON_FEATURES, featureIdsIn } from "@/lib/content/salon-features";

/**
 * What the app does NOT do for a salon yet, copied from the app's map (proposal of
 * xiax-lp-v5-salon) on 2026-10-28. When the app launches one, flip its status in
 * salon-features.ts AND take it off this list, in the same change.
 */
const NOT_IN_APP_ON_2026_10_28: readonly SalonFeatureId[] = [
  "pauseTime",
  "multiProfessionalVisit",
  "roomsAndEquipment",
  "technicalRecord",
  "sessionPackages",
  "anamnesis",
  "commissionAndPartner",
  "salonCatalog",
];

/** Every page content whose text can mention a salon feature. */
const CONTENTS = [BARBERSHOP];

describe("SALON_FEATURES", () => {
  it("should never mark as available a feature the app does not have yet", () => {
    // ARRANGE
    const missing = NOT_IN_APP_ON_2026_10_28;

    // ACT
    const sold = missing.filter((id) => SALON_FEATURES[id].status === "available");

    // ASSERT
    expect(sold).toEqual([]);
  });

  it("should mark pause, shared visits, rooms, technical record, packages, anamnesis, commission and catalog as coming", () => {
    // ARRANGE
    const ids = NOT_IN_APP_ON_2026_10_28;

    // ACT
    const statuses = ids.map((id) => SALON_FEATURES[id].status);

    // ASSERT
    expect(statuses.every((status) => status === "coming")).toBe(true);
  });

  it("should mark as available what the app already does for a salon", () => {
    // ARRANGE
    const live: readonly SalonFeatureId[] = ["professionalChoice", "pricePerProfessional"];

    // ACT
    const statuses = live.map((id) => SALON_FEATURES[id].status);

    // ASSERT
    expect(statuses).toEqual(["available", "available"]);
  });

  it("should give every feature a name and the pain it solves", () => {
    // ARRANGE
    const features = Object.values(SALON_FEATURES);

    // ACT
    const incomplete = features.filter((feature) => !feature.title.trim() || !feature.pain.trim());

    // ASSERT
    expect(features).toHaveLength(10);
    expect(incomplete).toEqual([]);
  });

  it("should explain that the professional serves another client while the chemistry works", () => {
    // ARRANGE
    const pause = SALON_FEATURES.pauseTime;

    // ACT
    const pain = pause.pain.toLowerCase();

    // ASSERT
    expect(pain).toContain("química");
    expect(pain).toContain("outra cliente");
  });
});

describe("featureIdsIn", () => {
  it("should find every feature a content mentions, at any depth", () => {
    // ARRANGE
    const content = { a: ["texto ", { feature: "pauseTime" }], b: { c: [{ feature: "anamnesis" }, { strong: "x" }] } };

    // ACT
    const ids = featureIdsIn(content);

    // ASSERT
    expect(ids).toEqual(["pauseTime", "anamnesis"]);
  });

  it("should only cite features that exist in the registry", () => {
    // ARRANGE
    const cited = CONTENTS.flatMap((content) => featureIdsIn(content));

    // ACT
    const unknown = cited.filter((id) => !(id in SALON_FEATURES));

    // ASSERT
    expect(unknown).toEqual([]);
  });
});
