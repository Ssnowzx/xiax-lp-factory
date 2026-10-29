import { ImageResponse } from "next/og";
import { BARBERSHOP } from "@/lib/content/barbershop";
import { SITE } from "@/lib/site";

// Barbershop share image: the page's look — espresso background, Anton titles in bone with the
// brass highlight, Space Mono labels — and a barber at work. The edge runtime reads no CSS vars,
// so the token colours are inline (styles/tokens.css, [data-theme="dark"]); next/og cannot use
// woff2, so the fonts are the TTFs in assets/fonts/ (OFL, Google Fonts).
export const runtime = "edge";
export const alt = BARBERSHOP.seo.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BASE = "#14110E";
const INK = "#F3ECE0";
const MUTED = "#C4B6A2";
const ACCENT = "#D6A24E";
const LINE = "#332C24";

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
  const [anton, mono, photo] = await Promise.all([
    load(new URL("../../assets/fonts/Anton-Regular.ttf", import.meta.url)),
    load(new URL("../../assets/fonts/SpaceMono-Regular.ttf", import.meta.url)),
    // A portrait cut of the gallery photo (assets/gallery-src/v3/gallery-04-full.png).
    load(new URL("../../assets/og/barbershop-photo.jpg", import.meta.url)),
  ]);
  return new ImageResponse(
    (
      <div style={{ height: "100%", width: "100%", display: "flex", background: BASE, padding: "72px 80px", fontFamily: "Space Mono" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 640 }}>
          <div style={{ fontFamily: "Anton", fontSize: 44, color: INK }}>{SITE.name.toUpperCase()}</div>
          <div style={{ display: "flex", flexDirection: "column", fontFamily: "Anton", fontSize: 62, lineHeight: 1.04, textTransform: "uppercase" }}>
            <span style={{ color: INK }}>O cliente marca sozinho.</span>
            <span style={{ color: ACCENT }}>O WhatsApp lembra por você.</span>
          </div>
          <div style={{ fontSize: 17, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED }}>
            Lembretes no WhatsApp · Lista de espera · Página da sua barbearia
          </div>
        </div>
        <img
          src={jpegDataUrl(photo)}
          alt=""
          width={320}
          height={412}
          style={{ marginLeft: "auto", alignSelf: "center", objectFit: "cover", border: `2px solid ${LINE}`, borderRadius: 14 }}
        />
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Anton", data: anton, style: "normal", weight: 400 },
        { name: "Space Mono", data: mono, style: "normal", weight: 400 },
      ],
    },
  );
}
