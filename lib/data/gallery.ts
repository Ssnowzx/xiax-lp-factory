/**
 * Modelo de dados da GALERIA (`#galeria` V2, NOVA) — TIPADO, TS strict.
 * Fonte da verdade: **Asset Package** (`asset-package`, [XIA-56]) + **UX/IA V2 §8**
 * ([XIA-57]) — bento editorial assimétrico, 6 slots, 16:9 TRAVADO, 1 destaque.
 *
 * FRONTEIRA DE PAPEL: eu entrego a RESERVA de dimensão (CLS 0), o mapa de slots
 * e agora os MASTERS REAIS (Brief §WS1 · XIA-92) — assets on-theme do repo-ref
 * otimizados por `scripts/optimize-gallery.mjs` (sharp em BUILD) para
 * `/public/gallery/<id>.{jpg|png}`. O `ui-engineer` troca cada `.media-frame`
 * placeholder por `next/image` usando `src`/`alt`/`sizes` daqui; o
 * `motion-engineer` pluga hover-zoom/parallax por cima da MESMA caixa (só
 * transform/opacity).
 *
 * CLS 0 (crítico): a caixa 16:9 é reservada pelo container (`.media-frame` =
 * `aspect-media`). Por isso o `next/image` entra com **`fill` + `object-cover`**
 * (NÃO `width/height`, que imporia a proporção do master) — a caixa manda, a
 * imagem preenche e recorta. Nenhum slot ganha `priority` (tudo abaixo da dobra,
 * lazy; o LCP do hero não muda).
 */

/** Papel do slot no bento — muda só a área no grid, NUNCA a proporção (16:9 em todos). */
export type GallerySlotRole = "feature" | "satellite";

export interface GallerySlot {
  /** id do slot = nome do master emitido em `/public/gallery/<id>.{jpg|png}`. */
  id: "gallery-02" | "gallery-03" | "gallery-04" | "gallery-05" | "gallery-06";
  role: GallerySlotRole;
  /**
   * spans do bento por breakpoint (Tailwind). Container:
   * `grid-cols-1 md:grid-cols-6 lg:grid-cols-12`.
   *   desktop(12): fileira1 = 8 + 4 · fileira2 = 3+3+3+3
   *   tablet(6):   destaque full (6) + satélites em pares (3+3)
   *   mobile(1):   stack, todos full — destaque primeiro
   */
  colSpan: string;
  /** `sizes` do next/image (Asset Package §2) — orienta o srcset responsivo. */
  sizes: string;
  /** dimensão-alvo do master 16:9 (Asset Package §2). Reserva a caixa. */
  target: { w: number; h: number };
  /** caminho do master otimizado em /public (saída de `optimize-gallery.mjs`). */
  src: string;
  /** alt pt-BR — descreve o conteúdo REAL (a11y/SEO); vazio = decorativo (nunca aqui). */
  alt: string;
}

/**
 * Os 6 slots na ordem de leitura (destaque primeiro). `as const` → readonly.
 * A ordem no array = ordem no DOM = ordem de stack no mobile (destaque no topo).
 */
export const GALLERY_SLOTS: readonly GallerySlot[] = [
  // FEATURE = atendimento (master físico barbearia-atendimento.jpg, cf. optimize-gallery.mjs).
  // Refino XIA-114 P4: corta gallery-01 (screenshot) e promove o corte a destaque; re-span
  // fecha as 12 col — 8+row-span-2 (feature) · 4-4 (col direita empilhada) · 6-6 (fileira 3).
  {
    id: "gallery-04",
    role: "feature",
    colSpan: "md:col-span-6 lg:col-span-8 lg:row-span-2",
    sizes: "(min-width:768px) 66vw, 100vw",
    target: { w: 1600, h: 900 },
    src: "/gallery/gallery-04.jpg",
    alt: "Barbeiro fazendo um corte degradê em um cliente na cadeira da barbearia",
  },
  // topo-direita (empilha sobre #6 na direita do feature)
  {
    id: "gallery-02",
    role: "satellite",
    colSpan: "md:col-span-3 lg:col-span-4",
    sizes: "(min-width:768px) 33vw, 100vw",
    target: { w: 1200, h: 675 },
    src: "/gallery/gallery-02.jpg",
    alt: "Cliente sorrindo agenda um horário pelo celular na barbearia",
  },
  // sob #2 (direita, empilhada — fecha a coluna direita do feature)
  {
    id: "gallery-06",
    role: "satellite",
    colSpan: "md:col-span-3 lg:col-span-4",
    sizes: "(min-width:768px) 33vw, 100vw",
    target: { w: 1024, h: 576 },
    src: "/gallery/gallery-06.jpg",
    alt: "Navalha, pomada e produtos de barbearia sobre a bancada de madeira",
  },
  // linha 3 esq.
  {
    id: "gallery-03",
    role: "satellite",
    colSpan: "md:col-span-3 lg:col-span-6",
    sizes: "(min-width:768px) 50vw, 100vw",
    target: { w: 1024, h: 576 },
    src: "/gallery/gallery-03.jpg",
    alt: "Salão da barbearia com cadeiras de couro, espelhos e plantas",
  },
  // linha 3 dir.
  {
    id: "gallery-05",
    role: "satellite",
    colSpan: "md:col-span-3 lg:col-span-6",
    sizes: "(min-width:768px) 50vw, 100vw",
    target: { w: 1024, h: 576 },
    src: "/gallery/gallery-05.jpg",
    alt: "Dono da barbearia de braços cruzados, com avental, no salão",
  },
] as const;
