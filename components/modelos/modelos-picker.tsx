"use client";

import { useState, useId } from "react";
import { cn } from "@/lib/ui/cn";
import { IconCheck } from "@/components/ui/icons";
import { ModelosPreview } from "@/components/modelos/modelos-preview";
import { MODELOS_UI, MODELOS_CORES, type Modelo, type ModeloCorId } from "@/lib/data/modelos";

/**
 * ILHA CLIENT (WS2 · XIA-94 / fix XIA-92) — picker de modelos.
 * ============================================================
 * UI final sobre mini UX/IA (XIA-93) nos tokens do Design System.
 *
 * Radix RadioGroup@1.4.3 apresentou conflito de contexto durante o prerender
 * estático do Next.js 14 (erro `useContext` null no bundle SSR). Substituído por
 * radiogroup NATIVO (input[type=radio] + label) que o browser gerencia com
 * comportamento idêntico (roving tabindex + setas navegam e selecionam + Tab
 * entra/sai do grupo) — WCAG 2.2 AA, sem dependência extra, sem SSR issue.
 *
 * LAYOUT (mini UX/IA §3): 390-first = trilho horizontal scroll-snap; desktop =
 * rail vertical à esquerda + preview grande à direita (Z: controle→efeito).
 * CLS 0: preview box em altura fixa (h-64 md:h-72 overflow-hidden).
 */
export function ModelosPicker({ modelos }: { modelos: readonly Modelo[] }) {
  const [selectedId, setSelectedId] = useState(modelos[0]?.id ?? "");
  // Cor do tema: estado INDEPENDENTE do modelo (mini UX/IA XIA-116), inicia em "brass".
  const [selectedCorId, setSelectedCorId] = useState<ModeloCorId>("brass");
  const selected = modelos.find((m) => m.id === selectedId) ?? modelos[0];
  const corNome = MODELOS_CORES.find((c) => c.id === selectedCorId)?.nome ?? "";
  const groupName = useId();

  if (!selected) {
    return (
      <div className="mt-block flex min-h-[16rem] flex-col items-start justify-center gap-3 rounded-window border border-line bg-surface p-6 shadow-e2">
        <p className="text-body-lg text-ink-muted">{MODELOS_UI.vazioTitulo}</p>
        <a
          href="#planos-form"
          className="inline-flex w-fit items-center py-2 rounded-control font-mono text-label uppercase tracking-label text-accent underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-base"
        >
          {MODELOS_UI.vazioAcao} →
        </a>
      </div>
    );
  }

  return (
    <div className="mt-block grid gap-6 md:grid-cols-2 md:gap-8">
      {/* PICKER — native radiogroup: browser gerencia roving tabindex + setas. */}
      <div
        role="radiogroup"
        aria-label={MODELOS_UI.radiogroupLabel}
        className={cn(
          "flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-pl-1 pb-2",
          "md:grid md:grid-cols-1 md:gap-3 md:overflow-visible md:pb-0",
        )}
      >
        {modelos.map((m) => {
          const isSelected = m.id === selected.id;
          const inputId = `${groupName}-${m.id}`;
          return (
            <label
              key={m.id}
              htmlFor={inputId}
              className={cn(
                // BASE: layout + a11y + tokens (idêntico ao Radix variant)
                "group relative flex shrink-0 basis-[76%] snap-start cursor-pointer flex-col items-start gap-1",
                "rounded-surface border p-4 text-left sm:basis-[44%] md:basis-auto",
                "min-h-touch", // alvo ≥ 44px (WCAG 2.5.8)
                "transition-colors duration-[--dur-micro] ease-[--ease-standard] motion-reduce:transition-none",
                // ESTADO default → hover
                "border-line hover:border-accent/30 hover:bg-surface-raised",
                // ESTADO selecionado: tint + anel (via has-[:checked])
                "has-[:checked]:border-accent/40 has-[:checked]:bg-accent/[0.08] has-[:checked]:ring-1 has-[:checked]:ring-accent/40",
                // ESTADO focus-visible (teclado): anel no input → outline no label via has-
                "has-[:focus-visible]:outline-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-base",
              )}
            >
              {/* Input nativo — visualmente oculto mas no DOM (acessível, clicável,
                  roving-tabindex nativo, setas navegam e selecionam no grupo). */}
              <input
                type="radio"
                id={inputId}
                name={groupName}
                value={m.id}
                checked={isSelected}
                onChange={() => setSelectedId(m.id)}
                className="sr-only"
              />
              <span className="flex w-full items-start justify-between gap-2">
                <span
                  className={cn(
                    "font-mono text-label uppercase tracking-label text-ink-subtle transition-colors",
                    isSelected && "text-accent",
                  )}
                >
                  {m.vibe}
                </span>
                {/* Cue não-cor (check). Espaço reservado size-5 → sem shift ao marcar. */}
                <span className="grid size-5 shrink-0 place-items-center" aria-hidden="true">
                  {isSelected && <IconCheck className="size-5 text-accent" />}
                </span>
              </span>
              <span className="text-title text-ink">{m.nome}</span>
            </label>
          );
        })}
      </div>

      {/* PREVIEW — âncora primária. Caixa reservada (CLS 0), derivada do estado. */}
      <div className="flex flex-col gap-4">
        {/* região live (visualmente oculta): anuncia modelo + cor ao leitor de tela */}
        <p className="sr-only" aria-live="polite">
          {MODELOS_UI.livePreviewLabel(selected.nome, corNome)}
        </p>

        <div className="h-64 overflow-hidden md:h-72">
          <ModelosPreview modelo={selected} corId={selectedCorId} />
        </div>

        {/* 2º radiogroup NATIVO — cor do tema (P5). Swatch = a MESMA cor de tema
            (data-swatch-theme → CSS token, sem JS de cor). Cue não-cor = check.
            Espaço do check reservado (inset-0) → sem shift ao marcar. */}
        <div
          role="radiogroup"
          aria-label={MODELOS_UI.corRadiogroupLabel}
          className="flex flex-wrap gap-2"
        >
          {MODELOS_CORES.map((cor) => {
            const isSel = cor.id === selectedCorId;
            const inputId = `${groupName}-cor-${cor.id}`;
            return (
              <label
                key={cor.id}
                htmlFor={inputId}
                aria-label={MODELOS_UI.corSwatchLabel(cor.nome)}
                className={cn(
                  "relative min-h-touch min-w-touch cursor-pointer rounded-full p-0.5",
                  "has-[:focus-visible]:outline-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-base",
                  isSel && "ring-1 ring-accent/40",
                )}
              >
                <input
                  type="radio"
                  id={inputId}
                  name={`${groupName}-cor`}
                  value={cor.id}
                  checked={isSel}
                  onChange={() => setSelectedCorId(cor.id)}
                  className="sr-only"
                />
                <span
                  data-swatch-theme={cor.id}
                  className="block size-8 rounded-full border border-line/20"
                  aria-hidden="true"
                />
                <span className="absolute inset-0 grid place-items-center" aria-hidden="true">
                  {isSel && <IconCheck className="size-4 text-surface" />}
                </span>
              </label>
            );
          })}
        </div>
        {/* caption: nome da cor selecionada, sempre visível (cue não-cor redundante) */}
        <p className="font-mono text-label uppercase tracking-label text-ink-subtle">
          {MODELOS_UI.corAtualLabel(corNome)}
        </p>

        <p className="max-w-prose text-body-lg text-ink-muted">{selected.descricao}</p>

        {/* handoff SUBORDINADO ao funil — link quieto, NUNCA CTA primário accent */}
        <a
          href="#planos-form"
          className="inline-flex w-fit items-center gap-1 py-2 rounded-control font-mono text-label uppercase tracking-label text-ink-subtle underline-offset-4 outline-none transition-colors hover:text-accent hover:underline focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-base"
        >
          {MODELOS_UI.handoff} →
        </a>
      </div>
    </div>
  );
}
