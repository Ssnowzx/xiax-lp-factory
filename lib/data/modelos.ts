/**
 * Modelo de dados da seção "modelos personalizados" (WS2 · XIA-92, NOVA) — TIPADO.
 * =============================================================================
 * Porta o PADRÃO de UX da vitrine de temas do repo-ref (cards selecionáveis +
 * preview ao vivo) — NUNCA o visual da barbearia-ref. Tudo veste os tokens/paleta
 * XiaX (dark premium latão). Fonte da direção: Brief §WS2.
 *
 * FRONTEIRA DE PAPEL (não há dois donos):
 *  - Front-end Architect: entrega a SHAPE + a fronteira (shell RSC + ilha client de
 *    seleção + caixa de preview reservada → CLS 0) e o funil (após #galeria, antes
 *    de #depoimentos, sem tocar a ordem congelada nem a âncora #planos-form).
 *  - ux-arquiteto: entrega a mini UX/IA (anatomia do card, 5 estados, conteúdo do
 *    preview) ANTES do build — pode ajustar esta shape.
 *  - ui-engineer: constrói a UI final nos tokens do Design System (Radix p/
 *    comportamento, WCAG 2.2 AA).
 *  - copywriter-conversao (leve): refina a copy abaixo (SEAM). Zero lorem.
 */

/**
 * INTENT do tratamento tipográfico do wordmark no preview (mini UX/IA §4) —
 * SEMÂNTICO, não é fonte. O `ui-engineer` mapeia p/ os tokens de família
 * disponíveis (display/sans/mono); o `design-system`/`diretor-de-arte` refina a
 * fonte real de cada vibe. NÃO introduz fonte nova aqui.
 */
export type ModeloTipoVibe = "serif" | "geometric" | "condensed";

export interface Modelo {
  /** id estável (key/estado de seleção). */
  id: string;
  /** nome do modelo/identidade exibido no card. */
  nome: string;
  /** rótulo curto (kicker do card) — a "vibe" em 1–2 palavras. */
  vibe: string;
  /** uma frase de venda no tom XiaX (SEAM — copywriter refina). Legenda sob o preview. */
  descricao: string;
  /**
   * Conteúdo do PREVIEW (mini UX/IA §4) — a página PÚBLICA de agendamento do
   * cliente da barbearia, re-vestida por modelo. Marcas FICTÍCIAS de exemplo
   * (rotuladas como exemplo no aria-label) — SEAM, copywriter refina.
   */
  preview: {
    /** wordmark fictício no mock (ex.: "Barbearia São Jorge"). */
    marca: string;
    /** tagline de exemplo no mock. */
    tagline: string;
    /** intent do tratamento do wordmark (design-system mapeia a fonte real). */
    tipoVibe: ModeloTipoVibe;
  };
}

/**
 * SEAM de copy (pt-BR, tom XiaX) — adaptado do PADRÃO do repo-ref (nunca o visual).
 * copywriter refina nome/vibe/descrição/marca/tagline. Real, sem lorem. As marcas
 * do preview são exemplos FICTÍCIOS que dão vida à diferença entre os modelos.
 */
export const MODELOS: readonly Modelo[] = [
  {
    id: "classica",
    nome: "Clássica",
    vibe: "Tradição",
    descricao:
      "Sóbria e atemporal — a cara da barbearia de bairro que nunca sai de moda.",
    preview: {
      marca: "Barbearia São Jorge",
      tagline: "Tradição desde 1990",
      tipoVibe: "serif",
    },
  },
  {
    id: "moderna",
    nome: "Moderna",
    vibe: "Linhas limpas",
    descricao:
      "Geométrica e com muito respiro: passa organização e preço justo sem esforço.",
    preview: {
      marca: "Studio Corte",
      tagline: "Seu horário, no ponto",
      tipoVibe: "geometric",
    },
  },
  {
    id: "urbana",
    nome: "Urbana",
    vibe: "Atitude",
    descricao:
      "Contraste alto e pegada jovem, pra barbearia que fala a língua da quebrada.",
    preview: {
      marca: "Quebrada Barber",
      tagline: "O corte é lei",
      tipoVibe: "condensed",
    },
  },
  {
    id: "premium",
    nome: "Premium",
    vibe: "Alto padrão",
    descricao:
      "Sóbria e encorpada — para a barbearia-clube que cobra pela experiência, não só pelo corte.",
    preview: {
      marca: "Navalha & Co.",
      tagline: "Clube de assinatura",
      tipoVibe: "serif",
    },
  },
] as const;

/**
 * Cores de tema do PREVIEW (#modelos · P5 · XIA-115/116) — conjunto FECHADO,
 * pré-validado WCAG AA (pior par 7.08:1). O accent é escopado ao preview via
 * `data-preview-theme` no `[data-modelo-preview]` (seam XIA-115); NUNCA no chrome
 * da LP. O estado da cor é do picker (independente do modelo), inicia em "brass".
 */
export const MODELOS_CORES = [
  { id: "brass", nome: "Latão" },
  { id: "cobre", nome: "Cobre" },
  { id: "sage", nome: "Sálvia" },
  { id: "azure", nome: "Aço" },
  { id: "malva", nome: "Malva" },
] as const;
export type ModeloCorId = (typeof MODELOS_CORES)[number]["id"];

/**
 * Dicionário de microcopy UX (mini UX/IA §7 · pt-BR · i18n-ready) — separado da
 * copy de conversão e do SEAM de marketing. NUNCA culpa o usuário.
 */
export const MODELOS_UI = {
  /** aria-label do radiogroup. */
  radiogroupLabel: "Modelos de identidade da barbearia",
  /** prefixo do anúncio (região live) da troca de modelo. → "Prévia: Moderna". */
  livePrefix: "Prévia:",
  /** aria-label do 2º radiogroup (cor do tema · P5). */
  corRadiogroupLabel: "Cor do tema",
  /** caption sempre visível com a cor selecionada. → "Cor: Latão". */
  corAtualLabel: (cor: string) => `Cor: ${cor}`,
  /** aria-label de cada swatch de cor. → "Cor Latão". */
  corSwatchLabel: (cor: string) => `Cor ${cor}`,
  /** anúncio (região live) que combina modelo + cor. → "Prévia: Moderna · cor Latão". */
  livePreviewLabel: (modelo: string, cor: string) => `Prévia: ${modelo} · cor ${cor}`,
  /** aria-label do mock de preview (rotula como EXEMPLO p/ leitor de tela). */
  previewImgLabel: (nome: string, marca: string) =>
    `Prévia da página de agendamento no modelo ${nome} — marca de exemplo ${marca}.`,
  /** rótulo (visualmente oculto) do cue de seleção. */
  selecionadoSr: "Modelo selecionado",
  /** estado 5 — vazio defensivo (sempre com próxima ação, nunca beco sem saída). */
  vazioTitulo: "Modelos indisponíveis no momento.",
  vazioAcao: "Fale com a gente sobre o seu",
  /** handoff subordinado ao funil (link quieto, nunca CTA primário). */
  handoff: "Quero minha barbearia assim",
} as const;

/**
 * Grade de serviços do preview — CONSTANTE (mini UX/IA §4): a estrutura é fixa
 * entre modelos ("o motor é o mesmo, muda só a pele"). Não é conteúdo por-modelo.
 */
export const MODELOS_PREVIEW_SERVICOS: readonly { servico: string; preco: string }[] = [
  { servico: "Corte", preco: "R$ 45" },
  { servico: "Barba", preco: "R$ 30" },
  { servico: "Combo", preco: "R$ 65" },
] as const;

/** Cabeçalho da seção (SEAM — copywriter refina, tom XiaX). */
export const MODELOS_INTRO = {
  kicker: "Modelos personalizados",
  titulo: "Sua barbearia com a sua cara — não um modelo genérico.",
  subtitulo:
    "Escolha o modelo e veja a página de agendamento assumir a identidade do seu negócio.",
} as const;
