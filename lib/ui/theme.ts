/**
 * Design System — LP Xbarber
 * Bridge 1:1 tokens.css → theme.extend do Tailwind (dono: design-system-architect).
 *
 * Cor sempre via SEMÂNTICO em canais RGB → rgb(var(--x) / <alpha-value>) faz o
 * <alpha-value> do Tailwind funcionar (bg-accent/15, bg-overlay/70 etc).
 * O componente usa bg-base/text-ink/border-line-strong — NUNCA o primitivo.
 *
 * tailwind.config.ts:
 *   import { xbarberTheme } from './lib/ui/theme'
 *   import { BP_PX } from './lib/ui/breakpoints'
 *   theme: { screens: BP_PX, extend: xbarberTheme }
 *   darkMode: ['selector', '[data-theme="dark"]']
 */
const rgb = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

export const xbarberTheme = {
  colors: {
    base: rgb("--base"),
    surface: rgb("--surface"),
    "surface-raised": rgb("--surface-raised"),
    overlay: rgb("--overlay"),

    ink: rgb("--ink"),
    "ink-muted": rgb("--ink-muted"),
    "ink-subtle": rgb("--ink-subtle"),

    line: rgb("--line"),
    "line-strong": rgb("--line-strong"),

    accent: rgb("--accent"),
    "accent-ink": rgb("--accent-ink"),
    "accent-quiet": rgb("--accent-quiet"),

    // cor de TEMA do preview #modelos (P5 · XIA-115) — resolvida por
    // data-preview-theme no [data-modelo-preview]. Só o accent do PREVIEW usa
    // (text-preview-accent no wordmark · bg-preview-accent/90 + text-preview-accent-ink
    // no CTA). NUNCA no chrome da LP. Alpha do <alpha-value> preservado (bg-.../90).
    "preview-accent": rgb("--preview-accent"),
    "preview-accent-ink": rgb("--preview-accent-ink"),

    success: rgb("--success"),
    "success-ink": rgb("--success-ink"),
    warning: rgb("--warning"),
    "warning-ink": rgb("--warning-ink"),
    danger: rgb("--danger"),
    "danger-ink": rgb("--danger-ink"),
    info: rgb("--info"),
    "info-ink": rgb("--info-ink"),
  },

  fontFamily: {
    // via next/font (zero CLS) — variáveis CSS injetadas no <html>
    display: ["var(--font-display)", "Impact", "sans-serif"], // Anton
    sans: ["var(--font-sans)", "system-ui", "sans-serif"],     // Archivo
    mono: ["var(--font-mono)", "ui-monospace", "monospace"],   // Space Mono
  },

  // escala de tipo por PAPEL + clamp fluido (display 8–20vw). [fontSize, {lineHeight, letterSpacing}]
  fontSize: {
    "display-2xl": ["clamp(4rem, 13vw, 10rem)", { lineHeight: "0.9", letterSpacing: "-0.01em" }],  // números gigantes
    "display-xl": ["clamp(2.6rem, 7vw, 5.5rem)", { lineHeight: "0.95", letterSpacing: "-0.005em" }], // H1
    "display-lg": ["clamp(2rem, 4.5vw, 3.25rem)", { lineHeight: "1.0", letterSpacing: "0" }],          // H2
    // preço dominante do card de plano — clamp com TETO menor que display-lg: o card
    // ocupa ~1/4 do viewport no lg:grid-cols-4, então o vw não pode reger o tamanho
    // sozinho (senão "R$ 349,90/mês" vaza o card estreito ~1024/1280 — B1 XIA-75).
    price: ["clamp(1.9rem, 3.3vw, 2.75rem)", { lineHeight: "1", letterSpacing: "0" }],
    title: ["clamp(1.25rem, 2vw, 1.6rem)", { lineHeight: "1.15", letterSpacing: "0" }],
    "body-lg": ["1.125rem", { lineHeight: "1.6" }],
    body: ["0.969rem", { lineHeight: "1.62" }],   // ~15.5px, medida 46–70ch (via max-w-prose)
    label: ["0.75rem", { lineHeight: "1", letterSpacing: "0.16em" }], // 12px — piso legível (Lighthouse BP), mono uppercase
  },

  letterSpacing: {
    // display por caixa: condensada caixa-alta abre; caixa-baixa fecha
    "display-upper": "0.014em",
    "display-lower": "-0.02em",
    label: "0.16em",
  },

  spacing: {
    section: "var(--space-section)",     // ritmo ENTRE seções (py-section)
    block: "var(--space-block)",          // respiro DENTRO da seção (gap-block/space-y-block)
    gutter: "var(--space-gutter)",
    "header-h": "var(--header-h)",
  },

  borderRadius: {
    control: "var(--radius-control)",
    field: "var(--radius-field)",
    surface: "var(--radius-surface)",
    window: "var(--radius-window)",
    media: "var(--radius-media)",         // moldura da galeria (rounded-media)
    pill: "var(--radius-pill)",
  },

  aspectRatio: {
    media: "16 / 9",                      // slot da galeria (aspect-media) — reserva CLS 0
  },

  boxShadow: {
    e1: "var(--shadow-e1)",
    e2: "var(--shadow-e2)",
    e3: "var(--shadow-e3)",
    e4: "var(--shadow-e4)",
    e5: "var(--shadow-e5)",
    media: "var(--shadow-media)",          // moldura da galeria (shadow-media = e3)
    "plan-popular": "var(--plan-popular-shadow)", // tier destacado (= e4)
  },

  zIndex: {
    rail: "40",
    badge: "45",
    nav: "50",
    hud: "55",
    "sticky-cta": "60",
    cursor: "90",
    modal: "95",
    preloader: "100",
  },

  transitionTimingFunction: {
    standard: "var(--ease-standard)",
    dramatic: "var(--ease-dramatic)",
  },

  transitionDuration: {
    micro: "220ms",
    "micro-in": "280ms",
  },

  maxWidth: {
    prose: "68ch", // medida de leitura 46–70ch
    content: "1200px",
  },
} as const;
