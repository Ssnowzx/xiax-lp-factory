import Image from "next/image";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/ui/cn";
import { GALLERY_SLOTS, type GallerySlot } from "@/lib/data/gallery";

// #galeria — job: PROVA VISUAL (NOVA · Brief §7 / UX/IA §8). Eleva a percepção de
// qualidade ANTES da prova social e do preço. Bento editorial assimétrico: 1
// destaque + 5 satélites — JAMAIS 6 retângulos iguais.
//
// FRONTEIRA (Front-end Architect): esta é a SEAT RSC com a RESERVA de dimensão
// (16:9 travado → CLS 0). O `ui-engineer` (WS1 · XIA-94) trocou cada `.media-frame`
// placeholder por `next/image fill + object-cover` consumindo `lib/data/gallery.ts`
// (src/alt/sizes reais). Nenhum slot leva `priority` (tudo abaixo da dobra, lazy →
// o LCP do hero não muda). O `motion-engineer` pluga hover-zoom + parallax por cima
// da MESMA caixa (só transform/opacity, reduced-motion desliga) — o `data-slot` é o
// alvo estável. É RSC: zero JS, o conteúdo (título/sub) sai no HTML e é indexável.

/**
 * `object-position` por slot (refino XIA-114 P4): o feature agora é a FOTO de
 * atendimento (não mais o screenshot) → `object-center` preserva o corte no centro
 * do box 16:9. Dois satélites pedem enquadramento fino: o cliente-celular (#02) tem
 * o rosto à direita → 62%; o dono (#05) está deslocado à esquerda → 42%. O resto
 * fica no centro (composição fiel). Confirmado no Fidelity Sign-off com o diretor-de-arte.
 */
function objectPositionFor(slot: GallerySlot): string {
  switch (slot.id) {
    case "gallery-02":
      return "object-[62%_center]";
    case "gallery-05":
      return "object-[42%_center]";
    default:
      return "object-center";
  }
}

/** Um slot da vitrine com a imagem real (reserva 16:9 pelo container → CLS 0). */
function GallerySlotBox({ slot }: { slot: GallerySlot }) {
  const isFeature = slot.role === "feature";
  return (
    <div
      className={cn(
        // reserva de dimensão (aspect-media = 16/9, token do DS) → CLS 0
        "media-frame reveal-item",
        slot.colSpan,
        // moldura por papel (Asset Package §6): destaque ganha o único anel latão
        isFeature ? "shadow-e3 ring-1 ring-accent/40" : "shadow-e2",
      )}
      data-slot={slot.id}
    >
      <Image
        src={slot.src}
        alt={slot.alt}
        fill
        sizes={slot.sizes}
        // lazy por padrão (sem priority) — tudo abaixo da dobra, não mexe no LCP.
        // fill deixa o container 16:9 mandar; object-cover preenche e recorta.
        className={cn("object-cover", objectPositionFor(slot))}
      />
    </div>
  );
}

export function Galeria() {
  return (
    <Section id="galeria" width="content">
      <Reveal className="mx-auto mb-block max-w-prose text-center">
        <h2 className="font-display text-display-lg uppercase tracking-display-upper text-ink">
          Feito pra barbearia. Não parece planilha.
        </h2>
        <p className="mt-4 text-body-lg text-ink-muted">
          A agenda, o app do cliente e o lembrete — do jeito que aparece na sua tela.
        </p>
      </Reveal>

      {/* bento assimétrico: 1 col (mobile) → 6 col (tablet) → 12 col (desktop).
          As imagens carregam lazy abaixo da dobra (fora do first-load). */}
      <Reveal
        group
        className="grid grid-cols-1 gap-4 md:grid-cols-6 md:gap-5 lg:grid-cols-12"
      >
        {GALLERY_SLOTS.map((slot) => (
          <GallerySlotBox key={slot.id} slot={slot} />
        ))}
      </Reveal>
    </Section>
  );
}
