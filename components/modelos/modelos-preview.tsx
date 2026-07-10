import { cn } from "@/lib/ui/cn";
import {
  MODELOS_UI,
  MODELOS_PREVIEW_SERVICOS,
  type Modelo,
  type ModeloCorId,
  type ModeloTipoVibe,
} from "@/lib/data/modelos";

/**
 * PREVIEW da seção #modelos (mini UX/IA §4) — a página PÚBLICA de agendamento do
 * cliente da barbearia, emoldurada como "dispositivo editorial" (mesma técnica do
 * `agenda-mock.tsx`, superfície DIFERENTE: aqui é a vitrine de MARCA, não a agenda
 * interna). Só tokens XiaX (espresso/latão) — NUNCA o visual da barbearia-ref.
 *
 * Se re-veste por modelo: wordmark (nome + tratamento), tagline. A grade de
 * serviços é CONSTANTE ("o motor é o mesmo, muda só a pele"). `role="img"` +
 * aria-label rotulado como EXEMPLO → o leitor de tela trata como 1 imagem e ignora
 * os descendentes decorativos. O "Agendar" é ilustração (não interativo real).
 *
 * CLS 0: estrutura idêntica entre modelos → altura fixa por construção (min-h
 * guarda). Alvo de motion (`data-modelo-preview`): o cross-fade da troca é do
 * `motion-engineer`; meu slice é só a transição de cor via token (motion-reduce).
 */

/**
 * INTENT do wordmark → tokens de família DISPONÍVEIS (display/sans/mono). Não há
 * fonte serif no pairing fechado do DS: mapeio a intenção com o que existe (caixa/
 * tracking/peso distinguem visivelmente as 3 vibes) e sinalizo p/ o design-system/
 * diretor-de-arte refinarem a fonte real. Token-only, zero hex/px.
 */
const WORDMARK_TREATMENT: Record<ModeloTipoVibe, string> = {
  // clássico/sóbrio — sans contido, caixa natural (intent: serifada no futuro)
  serif: "font-sans font-semibold tracking-tight",
  // geométrico/limpo — sans caixa-alta com respiro
  geometric: "font-sans font-semibold uppercase tracking-label",
  // condensado/urbano — display Anton caixa-alta (o mais "alto" dos três)
  condensed: "font-display uppercase tracking-display-upper",
};

export function ModelosPreview({ modelo, corId }: { modelo: Modelo; corId: ModeloCorId }) {
  return (
    <div
      role="img"
      aria-label={MODELOS_UI.previewImgLabel(modelo.nome, modelo.preview.marca)}
      data-modelo-preview
      data-preview-theme={corId}
      className="flex h-full w-full flex-col overflow-hidden rounded-window border border-line bg-surface shadow-e3"
    >
      {/* barra de janela — "página no ar" (estável entre modelos) */}
      <div className="flex items-center gap-3 border-b border-line bg-surface-raised px-4 py-3">
        <span className="flex shrink-0 gap-1.5" aria-hidden="true">
          <span className="size-2 rounded-full bg-line-strong" />
          <span className="size-2 rounded-full bg-line-strong" />
          <span className="size-2 rounded-full bg-line-strong" />
        </span>
        <span className="truncate font-mono text-label lowercase tracking-label text-ink-subtle">
          agendar.suabarbearia.com
        </span>
      </div>

      {/* corpo da página pública */}
      <div className="flex flex-1 flex-col gap-4 p-5">
        {/* cabeçalho de marca — RE-VESTE por modelo (transição de cor via token) */}
        <div className="flex flex-col gap-1">
          <span
            className={cn(
              "text-title text-preview-accent transition-colors duration-[--dur-micro] ease-[--ease-standard] motion-reduce:transition-none",
              WORDMARK_TREATMENT[modelo.preview.tipoVibe],
            )}
          >
            {modelo.preview.marca}
          </span>
          <span className="text-body text-ink-muted">{modelo.preview.tagline}</span>
        </div>

        {/* grade de serviços — CONSTANTE ("muda a pele, não o motor") */}
        <ul className="flex flex-col gap-2">
          {MODELOS_PREVIEW_SERVICOS.map(({ servico, preco }) => (
            <li
              key={servico}
              className="flex items-center gap-3 rounded-field border border-line bg-surface-raised px-3 py-2.5"
            >
              <span className="min-w-0 flex-1 truncate text-body text-ink">{servico}</span>
              <span className="font-mono text-label tabular-nums text-ink-muted">{preco}</span>
              {/* affordance "Agendar" — ILUSTRAÇÃO, não controle real */}
              <span className="rounded-control border border-line px-2.5 py-1 font-mono text-label uppercase tracking-label text-ink-subtle">
                Agendar
              </span>
            </li>
          ))}
        </ul>

        {/* CTA da página-exemplo — decorativo (o CTA real é #planos-form, congelado).
            transition-colors (XIA-118 P5): quando o ui-engineer trocar bg-accent →
            bg-preview-accent, a troca de --preview-accent por data-preview-theme anima
            suave (o browser trata a var como color). motion-reduce:transition-none →
            sem movimento sob prefers-reduced-motion. CLS 0: cor não move layout. */}
        <span className="mt-auto inline-flex items-center justify-center rounded-control bg-preview-accent/90 px-4 py-2.5 font-mono text-label uppercase tracking-label text-preview-accent-ink transition-colors duration-[--dur-micro] ease-[--ease-standard] motion-reduce:transition-none">
          Agendar horário
        </span>
      </div>
    </div>
  );
}
