import type { Metadata, Viewport } from "next";
import { Anton, Archivo, Space_Mono } from "next/font/google";
import "../globals.css";
import { BARBERSHOP } from "@/lib/content/barbershop";
import { pageMetadata } from "@/lib/seo/page-metadata";
import { ROOT_VIEWPORT, RootDocument } from "@/components/landing/root-document";

// next/font (zero CLS) — pairing FECHADO pelo Design System (Anton × Archivo × Space Mono).
// Injeta as CSS vars que theme.fontFamily consome (--font-display/-sans/-mono).
const display = Anton({ weight: "400", subsets: ["latin"], variable: "--font-display", display: "swap" });
const sans = Archivo({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = Space_Mono({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-mono", display: "swap" });

// SEO on-page via Metadata API, from the page's content (change xiax-lp-v5-salon · D1/D8: this
// group is the barbershop's own root).
export const metadata: Metadata = pageMetadata(BARBERSHOP.seo);

export const viewport: Viewport = ROOT_VIEWPORT;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <RootDocument theme="dark" fontClassName={`${display.variable} ${sans.variable} ${mono.variable}`} seo={BARBERSHOP.seo}>
      {children}
    </RootDocument>
  );
}
