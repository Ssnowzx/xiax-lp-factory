import { IconReminder } from "@/components/ui/icons";

// Mídia primária do #hero (Art Direction Spec §2.5 / §5 `hero-agenda` · refino XIA-114):
// a PRÓPRIA agenda do Xbarber renderizada como PAINEL DE OPERAÇÃO do dia — tema espresso,
// detalhes latão, grão leve. NÃO é screenshot de banco de imagens. Enquanto o mock real
// (art-producer) não chega, esta é uma prévia fiel construída só com tokens, no box exato
// (aspect-ratio) → CLS 0. O root é `flex flex-col` + a grade `flex-1` → o conteúdo preenche
// a caixa 4/5→4/3 (mata o vazio preto da V1). `role="img"` + `aria-label`; interior decorativo.

const COLUMNS = [
  {
    barber: "Rafa",
    slots: [
      { time: "09:00", label: "Corte + barba", state: "done" as const },
      { time: "10:00", label: "Degradê", state: "reminded" as const },
      { time: "11:00", label: "Barba", state: "confirmed" as const },
      { time: "12:00", label: "Livre", state: "free" as const },
    ],
  },
  {
    barber: "Diego",
    slots: [
      { time: "09:00", label: "Barba", state: "done" as const },
      { time: "10:00", label: "Corte", state: "confirmed" as const },
      { time: "11:00", label: "Corte + barba", state: "reminded" as const },
      { time: "12:00", label: "Livre", state: "free" as const },
    ],
  },
];

const STATE_STYLES: Record<string, string> = {
  done: "border-line bg-surface text-ink-muted",
  confirmed: "border-line-strong bg-surface-raised text-ink",
  reminded: "border-accent/45 bg-accent-quiet/10 text-ink",
  free: "border-dashed border-line bg-transparent text-ink-subtle",
};

// Resumo do dia (Art Direction Spec §refino P2) — faixa de 3 stats entre header e grade.
// Latão só no "Lembretes" (budget de accent do painel: pílula + este stat). Tudo tabular.
const RESUMO: readonly [string, string][] = [
  ["Ocupação", "86%"],
  ["Hoje", "R$ 1.240"],
  ["Lembretes", "14"],
];

export function AgendaMock() {
  return (
    <div
      role="img"
      aria-label="Prévia do painel de operação do dia no Xbarber: resumo com 86% de ocupação, R$ 1.240 hoje e 14 lembretes enviados; agenda dos barbeiros Rafa e Diego."
      className="flex h-full w-full flex-col overflow-hidden rounded-window border border-line bg-surface shadow-e3"
    >
      {/* barra de janela — comanda */}
      <div className="flex items-center justify-between border-b border-line bg-surface-raised px-4 py-3">
        <span className="font-mono text-label uppercase tracking-label text-ink-subtle">
          Agenda · Hoje
        </span>
        <span className="flex items-center gap-3">
          {/* data curta à esq. da pílula — ancora o "dia" sem roubar o latão */}
          <span className="font-mono text-label tabular-nums text-ink-subtle">Ter · 14</span>
          <span className="inline-flex items-center gap-1.5 font-mono text-label uppercase tracking-label text-accent">
            {/* farol do lembrete "vivo": só o atributo — o loop (scale/opacity via --dur-loop)
                é do motion-engineer. tabular/inline-block do ícone → pulso sem CLS. */}
            <IconReminder className="size-4" data-agenda-pulse="" />
            Lembrete 24h
          </span>
        </span>
      </div>

      {/* resumo do dia — 3 stats (latão só em "Lembretes") */}
      <div className="grid grid-cols-3 divide-x divide-line border-b border-line bg-surface-raised">
        {RESUMO.map(([label, val], i) => (
          <div key={label} className="flex flex-col items-center gap-0.5 py-2">
            <span className="font-mono text-label uppercase tracking-label text-ink-subtle">
              {label}
            </span>
            <span
              className={`font-mono text-body-lg tabular-nums ${i === 2 ? "text-accent" : "text-ink"}`}
            >
              {val}
            </span>
          </div>
        ))}
      </div>

      {/* grade de horários — preenche o resto da caixa (flex-1) */}
      <div className="grid flex-1 grid-cols-2 gap-px bg-line">
        {COLUMNS.map((col) => (
          <div key={col.barber} className="flex flex-col gap-3 bg-surface p-4">
            <span className="font-mono text-label uppercase tracking-label text-ink-muted">
              {col.barber}
            </span>
            {col.slots.map((slot) => (
              <div
                key={slot.time}
                className={`flex items-center gap-3 rounded-field border px-3 py-2.5 ${STATE_STYLES[slot.state]}`}
              >
                <span className="font-mono text-label tabular-nums text-ink-subtle">
                  {slot.time}
                </span>
                <span className="min-w-0 flex-1 truncate text-body">{slot.label}</span>
                {slot.state === "reminded" && <IconReminder className="size-4 text-accent" />}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* rodapé — fecha o preenchimento e prova o benefício do dia (sem latão: budget cheio) */}
      <div className="flex items-center gap-2 rounded-b-window border-t border-line bg-surface-raised px-4 py-2">
        <IconReminder className="size-4 shrink-0 text-ink-subtle" />
        <span className="font-mono text-label text-ink-muted">
          WhatsApp enviado a 14 clientes hoje
        </span>
      </div>
    </div>
  );
}
