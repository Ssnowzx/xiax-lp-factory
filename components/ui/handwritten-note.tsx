// `<HandwrittenNote>` (WS3 · XIA-95) — a "nota manuscrita + seta ← com IA".
// =====================================================================
// Elemento DECORATIVO custom, FORA da rough-notation (não é `<RoughTarget>`,
// não tem `data-rn`). Anota o passo automatizado do #como-funciona ("o sistema
// manda o lembrete") apontando "← com IA": deixa explícito que a automação é
// feita por IA (posicionamento XiaX v2), sem tocar a copy congelada do passo.
//
// Regras (Brief §WS3 + arbitragem 3):
//  - `aria-hidden` — puramente decorativo, não anuncia conteúdo (o texto real do
//    passo continua no `<h3>`, legível/indexável).
//  - tinta = token `--accent` (latão). NENHUMA cor nova, NENHUMA fonte nova: o
//    ar "manuscrito" vem da rotação + do traço à mão do SVG, não de script-font.
//  - `position:absolute` + `pointer-events:none` → não empurra layout (CLS 0) e
//    não intercepta cliques. `hidden md:block`: só onde há respiro na margem.
//  - a seta é um SVG desenhado à mão (mesma linguagem visual da rough-notation),
//    `currentColor` = accent; sem dependência da lib (é estático, não anima).
export function HandwrittenNote({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute hidden select-none text-accent md:block ${className ?? ""}`}
    >
      <span className="flex items-center gap-1.5 -rotate-[4deg]">
        {/* seta curva desenhada à mão, apontando p/ o passo (esquerda-baixo) */}
        <svg
          width="34"
          height="22"
          viewBox="0 0 34 22"
          fill="none"
          className="shrink-0"
        >
          <path
            d="M32 3C24 1 9 2 4 11c-.6 1 0 2 1 2"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M3 13 4.5 6M3 13l6.5-2"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="font-mono text-label uppercase tracking-label">
          com IA
        </span>
      </span>
    </span>
  );
}
