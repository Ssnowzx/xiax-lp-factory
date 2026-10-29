import { ImageResponse } from "next/og";
import { SALON } from "@/lib/content/salon";
import { SITE } from "@/lib/site";

// Salon share image (change xiax-lp-v5-salon · D8): ivory Porcelana, Fraunces titles with the
// terracotta italic highlight. The edge runtime reads no CSS vars, so the token colours are inline
// (styles/tokens.css, [data-theme="porcelain"]); next/og cannot use woff2, so the fonts are the TTFs
// in assets/fonts/ (OFL, Google Fonts).
export const runtime = "edge";
export const alt = SALON.seo.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BASE = "#F6F1EA";
const INK = "#1C1714";
const MUTED = "#6E625A";
const ACCENT = "#7B4A3C";
const LINE = "#E3D9CC";

const load = (url: URL) => fetch(url).then((res) => res.arrayBuffer());

/** next/og takes an image as a data URL; built in chunks, since a spread of every byte overflows. */
function jpegDataUrl(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return `data:image/jpeg;base64,${btoa(binary)}`;
}

export default async function OpengraphImage() {
  // Each URL is a literal: the bundler only ships a font it can read in the source.
  const [serif, serifItalic, manrope, photo] = await Promise.all([
    load(new URL("../../../assets/fonts/Fraunces-Medium.ttf", import.meta.url)),
    load(new URL("../../../assets/fonts/Fraunces-Italic.ttf", import.meta.url)),
    load(new URL("../../../assets/fonts/Manrope-Medium.ttf", import.meta.url)),
    // A portrait cut of gallery photo salon-01 (the blow-dry with the round brush).
    load(new URL("../../../assets/og/salon-arch.jpg", import.meta.url)),
  ]);
  return new ImageResponse(
    (
      <div style={{ height: "100%", width: "100%", display: "flex", background: BASE, padding: "72px 80px", fontFamily: "Manrope" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 760 }}>
          <div style={{ fontFamily: "Fraunces", fontSize: 40, color: INK }}>{SITE.name}</div>
          <div style={{ display: "flex", flexDirection: "column", fontFamily: "Fraunces", fontSize: 64, lineHeight: 1.08, color: INK }}>
            <span>A cliente marca sozinha.</span>
            <span style={{ fontStyle: "italic", color: ACCENT }}>O WhatsApp lembra por você.</span>
          </div>
          <div style={{ fontSize: 20, letterSpacing: "0.07em", textTransform: "uppercase", color: MUTED }}>
            Lembretes no WhatsApp · Lista de espera · Página do seu salão
          </div>
        </div>
        {/* The Porcelana arch: the frame of the app's salon photos. */}
        <img
          src={jpegDataUrl(photo)}
          alt=""
          width={240}
          height={470}
          style={{
            marginLeft: "auto",
            alignSelf: "center",
            objectFit: "cover",
            border: `2px solid ${LINE}`,
            borderTopLeftRadius: 120,
            borderTopRightRadius: 120,
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
          }}
        />
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Fraunces", data: serif, style: "normal", weight: 500 },
        { name: "Fraunces", data: serifItalic, style: "italic", weight: 500 },
        { name: "Manrope", data: manrope, style: "normal", weight: 500 },
      ],
    },
  );
}
