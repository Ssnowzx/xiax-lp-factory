import { ImageResponse } from "next/og";
import { BARBERSHOP } from "@/lib/content/barbershop";
import { SITE } from "@/lib/site";

// OG image gerada por next/og (Brief: OG on-page). Cores dos tokens (espresso/latão)
// inline — o runtime edge não lê CSS vars. Um ponto único; se o token virar, atualizar aqui.
export const runtime = "edge";
export const alt = BARBERSHOP.seo.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#14110E", // --base (dark)
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 34,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#D6A24E", // --accent
          }}
        >
          {SITE.name}
        </div>
        <div style={{ fontSize: 76, lineHeight: 1.05, color: "#F4EDE2", fontWeight: 800 }}>
          O cliente marca sozinho. O WhatsApp lembra por você.
        </div>
        <div style={{ fontSize: 30, color: "#C4B6A2" }}>
          Confirmação e lembretes no WhatsApp · Lista de espera · Página da sua barbearia
        </div>
      </div>
    ),
    { ...size },
  );
}
