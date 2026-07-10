import type { Metadata, Viewport } from "next";
import { Anton, Archivo, Space_Mono } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/site";
import { softwareApplicationLd, jsonLdScript } from "@/lib/seo/json-ld";
import { Vitals } from "@/components/analytics/vitals";
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll";
import { DeferredMotionChoreography } from "@/components/motion/deferred-motion-choreography";

// next/font (zero CLS) — pairing FECHADO pelo Design System (Anton × Archivo × Space Mono).
// Injeta as CSS vars que theme.fontFamily consome (--font-display/-sans/-mono).
const display = Anton({ weight: "400", subsets: ["latin"], variable: "--font-display", display: "swap" });
const sans = Archivo({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = Space_Mono({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-mono", display: "swap" });

// SEO on-page via Metadata API (só em RSC — zero next/head, zero <title> manual).
export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: SITE.title,
  description: SITE.description,
  keywords: [SITE.keyword, "agenda barbearia", "lembrete WhatsApp barbearia", "reduzir falta barbearia"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE.url,
    siteName: SITE.name,
    title: SITE.title,
    description: SITE.description,
  },
  twitter: { card: "summary_large_image", title: SITE.title, description: SITE.description },
  robots: { index: true, follow: true },
};

// viewport-fit=cover (Design QA XIA-75 · I1): sem isto o UA serve o default e
// `env(safe-area-inset-*)` resolve 0 em device com notch — o padding da .cta-bar
// sticky fica inerte. Mantém width/initial-scale do default do Next.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // data-theme="dark" estampado no servidor (sem FOUC). Ortogonal a reduced-motion.
    <html lang="pt-BR" data-theme="dark" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="min-h-dvh bg-base font-sans text-ink antialiased">
        {/* Progressive enhancement: só habilita o estado "escondido" dos reveals quando há
            JS e sem prefers-reduced-motion. Roda antes do paint; se o JS falhar, tudo aparece. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(window.matchMedia&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.classList.add('anim-ready')}}catch(e){}",
          }}
        />
        {/* JSON-LD SoftwareApplication (RSC, `<` escapado) — Brief/UX/IA §8. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(softwareApplicationLd()) }}
        />
        {/* ASSENTO de motion SSR-safe: Lenis (único scroll engine) + GSAP num único
            ticker, montado só no client, com prefers-reduced-motion como gate padrão.
            children são RSC (passados por prop) → o HTML de conversão sai antes do JS. */}
        <SmoothScrollProvider>
          {children}
          {/* Camada de coreografia Flagship (Storyboard XIA-61): consome o ScrollTrigger
              já casado ao Lenis; monta só no client, gate de reduced-motion próprio. */}
          <DeferredMotionChoreography />
        </SmoothScrollProvider>
        {/* Instrumentação de Core Web Vitals → canal tipado (track). */}
        <Vitals />
      </body>
    </html>
  );
}
