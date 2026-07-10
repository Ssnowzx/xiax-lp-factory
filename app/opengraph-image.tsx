import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

// OG image gerada por next/og (Brief: OG on-page). Cores dos tokens (espresso/latão)
// inline — o runtime edge não lê CSS vars. Um ponto único; se o token virar, atualizar aqui.
export const runtime = "edge";
export const alt = SITE.title;
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
          Xbarber
        </div>
        <div style={{ fontSize: 76, lineHeight: 1.05, color: "#F4EDE2", fontWeight: 800 }}>
          O sistema de agendamento para barbearia que acaba com a falta.
        </div>
        <div style={{ fontSize: 30, color: "#C4B6A2" }}>
          Lembrete no WhatsApp · Agenda única · 14 dias grátis, sem cartão
        </div>
      </div>
    ),
    { ...size },
  );
}
