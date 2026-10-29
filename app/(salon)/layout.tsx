import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "../globals.css";
import { SALON } from "@/lib/content/salon";
import { pageMetadata } from "@/lib/seo/page-metadata";
import { ROOT_VIEWPORT, RootDocument } from "@/components/landing/root-document";

// The salon's own root (change xiax-lp-v5-salon · D1/D3): Fraunces titles (optical size axis, plus
// its italic, the theme's highlight) and Manrope for text and labels — the Porcelana tokens point
// --font-mono at --font-sans. Owner, 2026-10-28: the app's Bodoni Moda was hard to read on the
// page ("não dá de ler direito"); Fraunces keeps the editorial serif with sturdier strokes.
// None of these load on `/`.
const display = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-display",
  display: "swap",
});
const sans = Manrope({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = pageMetadata(SALON.seo);

export const viewport: Viewport = ROOT_VIEWPORT;

export default function SalonLayout({ children }: { children: React.ReactNode }) {
  return (
    <RootDocument theme="porcelain" fontClassName={`${display.variable} ${sans.variable}`} seo={SALON.seo}>
      {children}
    </RootDocument>
  );
}
