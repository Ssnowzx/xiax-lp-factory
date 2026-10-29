/**
 * The salon features and their state (change xiax-lp-v5-salon · design D4) — the ONE place that
 * says whether the app already does something for a salon. Any copy that names a feature cites it
 * by id (`{ feature: "pauseTime" }`), and `FeatureMention` draws the "Em breve" badge from here, so
 * launching a feature is flipping its `status` (and taking it off the dated list in the test).
 */
import type { SalonFeatureId } from "@/lib/content/types";

export type SalonFeatureStatus = "available" | "coming";

export interface SalonFeature {
  title: string;
  /** The pain it solves, in one sentence for the salon owner. */
  pain: string;
  /** `available`: the app does it today; `coming`: being built, always shown with "Em breve". */
  status: SalonFeatureStatus;
  /** The plan it belongs to. */
  plan: "essencial" | "completo";
}

export const SALON_FEATURES: Record<SalonFeatureId, SalonFeature> = {
  professionalChoice: {
    title: "Escolha da profissional",
    pain: "A cliente marca com quem ela prefere, e cada profissional tem a sua agenda.",
    status: "available",
    plan: "completo",
  },
  pricePerProfessional: {
    title: "Preço e duração por profissional",
    pain: "A escova de uma profissional pode durar e custar diferente da escova de outra.",
    status: "available",
    plan: "completo",
  },
  pauseTime: {
    title: "Tempo de pausa da química",
    pain: "Enquanto a química age, a profissional atende outra cliente, e a agenda sabe que ela está livre.",
    status: "coming",
    plan: "completo",
  },
  multiProfessionalVisit: {
    title: "Várias profissionais na mesma visita",
    pain: "Cabelo com uma, unha com outra, no mesmo horário: a cliente marca tudo de uma vez.",
    status: "coming",
    plan: "completo",
  },
  roomsAndEquipment: {
    title: "Salas e equipamentos",
    pain: "A cabine e o lavatório entram na agenda, e ninguém marca dois atendimentos no mesmo lugar.",
    status: "coming",
    plan: "completo",
  },
  technicalRecord: {
    title: "Ficha técnica com alergia e fórmula da coloração",
    pain: "A fórmula da última coloração e as alergias da cliente ficam guardadas, à mão de quem atende.",
    status: "coming",
    plan: "completo",
  },
  sessionPackages: {
    title: "Pacotes de sessões",
    pain: "Você vende o pacote de sessões e a agenda desconta cada uma, sem caderno.",
    status: "coming",
    plan: "completo",
  },
  anamnesis: {
    title: "Anamnese",
    pain: "A ficha de saúde antes do procedimento de estética, preenchida pela cliente e guardada.",
    status: "coming",
    plan: "completo",
  },
  commissionAndPartner: {
    title: "Comissão e relatório do salão-parceiro",
    pain: "A parte de cada profissional sai calculada, com o relatório da Lei do Salão-Parceiro (13.352/2016).",
    status: "coming",
    plan: "completo",
  },
  salonCatalog: {
    title: "Categorias e catálogo de salão",
    pain: "Cabelo, unhas, cílios, sobrancelha e estética já vêm prontos para você só ajustar preço e duração.",
    status: "coming",
    plan: "completo",
  },
};

/**
 * Every salon feature a content mentions (`{ feature: id }` runs), at any depth, in order.
 * @param value - a page content, or any part of it
 * @returns the cited ids
 */
export function featureIdsIn(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(featureIdsIn);
  if (!value || typeof value !== "object") return [];
  if ("feature" in value && typeof value.feature === "string") return [value.feature];
  return Object.values(value).flatMap(featureIdsIn);
}
