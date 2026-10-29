/**
 * The content of one landing page (change xiax-lp-v5-salon · design D2). Every section of
 * `components/sections/` takes its block from here by prop, so the barbershop page (`/`) and the
 * salon page (`/salao`) share the same sections and differ only in content and theme. Blocks hold
 * plain, serializable data: the client islands (WhatsApp, plans, FAQ) receive them as props.
 */
import type { FaqQuestionId } from "@/lib/analytics/events";
import type { GallerySlot } from "@/lib/data/gallery";
import type { PlanId } from "@/lib/data/plans";
import type { Screen } from "@/lib/data/screens";
import type { WhatsAppExample } from "@/lib/data/whatsapp-messages";

export type PageId = "barbershop" | "salon";

/** Salon features a text can mention (registry: lib/content/salon-features.ts, design D4). */
export type SalonFeatureId =
  | "pauseTime"
  | "multiProfessionalVisit"
  | "roomsAndEquipment"
  | "technicalRecord"
  | "sessionPackages"
  | "anamnesis"
  | "commissionAndPartner"
  | "salonCatalog"
  | "professionalChoice"
  | "pricePerProfessional";

/**
 * A salon feature named in the copy, drawn with its state (an "Em breve" badge while it is being
 * built). `text` is how the sentence names it; the registry's title when omitted.
 */
export interface FeaturePart {
  feature: SalonFeatureId;
  text?: string;
}

/**
 * One run of a line of copy: plain text, the theme's highlight (`mark`: the brass underline in the
 * dark theme, terracotta italic in Porcelana), bold text, or a salon feature with its state.
 */
export type RichPart = string | { mark: string } | { strong: string } | FeaturePart;

/** A line of copy: a plain string, or runs rendered in order. */
export type RichText = string | readonly RichPart[];

export interface SeoContent {
  /** Route of the page, used for the canonical address. */
  path: "/" | "/salao";
  title: string;
  description: string;
  /** Primary keyword: first in `keywords` and in the hero kicker. */
  keyword: string;
  keywords: readonly string[];
  /** schema.org audience type in the JSON-LD (e.g. "Donos de barbearia"). */
  audience: string;
}

/**
 * Pre-typed WhatsApp messages. Plan messages are templates where `{plan}` becomes the plan's
 * name, so they stay serializable for the plan cards' client island.
 */
export interface WhatsAppContent {
  greeting: string;
  plan: {
    /** Available plan, before the checkout exists. */
    available: string;
    /** Plan sold on request ("sob consulta"). */
    consult: string;
    /** Plan still being built. */
    notify: string;
  };
}

export interface ChecklistItem {
  text: string;
  /** The WhatsApp-reminder glyph instead of the plain check. */
  icon?: "reminder";
}

/** A big number; `value` is the server-rendered final text, `countTo` what the count-up reaches. */
export interface StatContent {
  value: string;
  countTo: number;
  prefix?: string;
}

export interface HeroContent {
  kicker: string;
  title: RichText;
  body: string;
  checklist: readonly ChecklistItem[];
  /** Owner's screen, in the computer window. */
  desktopScreen: Screen;
  /** Client's screen, in the phone in front of it. */
  phoneScreen: Screen;
}

export interface PainContent {
  stat: StatContent;
  kicker: string;
  title: string;
  body: RichText;
}

/** Ring over a region of a step's square cut, in % of the cut. */
export interface StepRing {
  left: string;
  top: string;
  width: string;
  height: string;
}

/** How a step card shows its screen (components/ui/step-visuals.tsx). */
export interface StepVisualSpec {
  /** Stable name for the motion and the QA (`data-step-screen`). */
  kind: "booking" | "agenda" | "reminder";
  screen: Screen;
  /** Fade for cuts that stop mid-content. */
  fade: "none" | "both" | "bottom";
  ring?: StepRing;
  /** WhatsApp message that lands over the screen. */
  message?: WhatsAppExample;
}

export interface StepContent {
  /** Bold start of the sentence. */
  lead: string;
  /** Rest of the sentence, joined to `lead` as written (leading space or dash included). */
  rest: string;
  visual: StepVisualSpec;
}

export interface StepsContent {
  title: string;
  kicker: string;
  steps: readonly StepContent[];
  footnote: string;
  /** The 3D tool that sweeps the steps' line (design D7). */
  sweepTool: "razor" | "brush";
}

export interface NumberStat extends StatContent {
  label: string;
  /** The one number in the accent colour. */
  anchor: boolean;
}

export interface NumbersContent {
  title: string;
  kicker: string;
  stats: readonly NumberStat[];
  /** The source line: `before` + the linked study + `after`. */
  source: { before: string; label: string; href: string; after: string };
}

export interface WaitlistContent {
  kicker: string;
  title: string;
  body: string;
  steps: readonly string[];
  screen: Screen;
  message: WhatsAppExample;
}

/** "Feito para salão" (salon page only): the salon features, each with its pain and state. */
export interface SalonFeaturesContent {
  kicker: string;
  title: string;
  body: string;
  items: readonly SalonFeatureId[];
  /** The honest line under the cards: which plan brings them and what works today. */
  note: string;
}

export interface CashContent {
  kicker: string;
  title: string;
  body: string;
  features: readonly string[];
  screen: Screen;
}

export interface GalleryContent {
  title: string;
  body: string;
  slots: readonly GallerySlot[];
}

/** One look of the booking page, as the app wears it. */
export interface ShowcaseTheme {
  name: string;
  description: string;
  screen: Screen;
  /** The look the page opens in before the owner picks one. */
  isDefault?: boolean;
}

export interface ShowcaseContent {
  kicker: string;
  title: string;
  body: string;
  features: readonly string[];
  /**
   * The looks the owner switches between in the panel (Configurações). Shown so the owner knows
   * the page can change; the page never asks them to pick one here.
   */
  themes: {
    title: string;
    note: string;
    /** Badge on the look marked `isDefault`. */
    defaultLabel: string;
    items: readonly ShowcaseTheme[];
  };
}

export interface PlanCardContent {
  /** Brass object over the card, when the page needs another than the plan's (lib/data/plans.ts). */
  icon?: string;
  tagline: string;
  features: readonly RichText[];
}

export interface PlansContent {
  title: string;
  body: string;
  /** The card with the ring (design D10). */
  featured: PlanId;
  /** Extra flag text on the featured card when it is not the available one ("O plano do salão"). */
  featuredLabel?: string;
  cards: Record<PlanId, PlanCardContent>;
}

export interface FaqItem {
  id: FaqQuestionId;
  question: string;
  answer: RichText;
}

export interface FaqContent {
  title: string;
  items: readonly FaqItem[];
}

export interface NextStepContent {
  title: string;
  body: string;
  /** The message the visitor sends, shown as their own chat bubble. */
  sent?: string;
}

export interface FinalContent {
  kicker: string;
  title: RichText;
  body: string;
  nextSteps: readonly NextStepContent[];
}

/** The page's blocks, by section. `salonFeatures` exists only on the salon page. */
export interface SectionBlocks {
  hero: HeroContent;
  pain: PainContent;
  steps: StepsContent;
  numbers: NumbersContent;
  waitlist: WaitlistContent;
  salonFeatures?: SalonFeaturesContent;
  cash: CashContent;
  gallery: GalleryContent;
  showcase: ShowcaseContent;
  plans: PlansContent;
  faq: FaqContent;
  final: FinalContent;
}

export type SectionKey = keyof SectionBlocks;

export interface PageContent extends SectionBlocks {
  page: PageId;
  /** Funnel order of the sections on this page. */
  order: readonly SectionKey[];
  seo: SeoContent;
  whatsapp: WhatsAppContent;
}
