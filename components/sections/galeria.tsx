import Image from "next/image";

import type { GalleryContent } from "@/lib/content/types";

import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/ui/cn";
import type { GallerySlot } from "@/lib/data/gallery";
import type { GalleryLayerKind } from "@/lib/motion/depth";

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
 * Framing of the photo in its 16:9 box: the slot's own `objectPosition` when the subject sits off
 * centre (barbershop #02 at 62%, #05 at 42% — refino XIA-114 P4), else centred.
 */
function objectPositionFor(slot: GallerySlot): string {
  return slot.objectPosition ?? "object-center";
}

interface GalleryImageProps {
  slot: GallerySlot;
  kind: GalleryLayerKind;
  src: string;
  alt: string;
}

/** One image of a slot, in its own wrapper: the wrapper is what the scroll parallax moves. */
function GalleryImage({ slot, kind, src, alt }: GalleryImageProps) {
  return (
    <div className="absolute inset-0" data-gallery-layer={kind}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={slot.sizes}
        // lazy por padrão (sem priority) — tudo abaixo da dobra, não mexe no LCP.
        // fill deixa o container 16:9 mandar; object-cover preenche e recorta.
        className={cn("object-cover", objectPositionFor(slot))}
      />
    </div>
  );
}

/**
 * Um slot da vitrine (reserva 16:9 pelo `.media-frame` → CLS 0). v3 (design D6): the
 * outer box is a depth card (reveal + perspective) and the frame itself is the stage that
 * tilts. The frame clips, so depth inside it comes from parallax, not translateZ: a
 * layered photo moves plate and subject at different speeds; any other photo moves whole.
 */
function GallerySlotBox({ slot }: { slot: GallerySlot }) {
  const isFeature = slot.role === "feature";
  return (
    // self-start keeps the box as tall as its 16:9 frame, as before the wrapper existed
    <div className={cn("reveal-item self-start", slot.colSpan)} data-depth-card data-slot={slot.id}>
      <div
        className={cn(
          "media-frame",
          // moldura por papel (Asset Package §6): destaque ganha o único anel latão — and, in
          // Porcelana, the arch (`.frame-arch`, a no-op in the dark theme)
          isFeature ? "frame-arch shadow-e3 ring-1 ring-accent/40" : "shadow-e2",
        )}
        data-depth-stage
      >
        {slot.layers ? (
          <>
            {/* the plate carries the scene's alt; the subject repeats part of it → decorative */}
            <GalleryImage slot={slot} kind="plate" src={slot.layers.plate} alt={slot.alt} />
            <GalleryImage slot={slot} kind="subject" src={slot.layers.subject} alt="" />
          </>
        ) : (
          <GalleryImage slot={slot} kind="full" src={slot.src} alt={slot.alt} />
        )}
        <span data-depth-sheen aria-hidden>
          <span />
        </span>
      </div>
    </div>
  );
}

export function Galeria({ content }: { content: GalleryContent }) {
  return (
    <Section id="galeria" width="content">
      <Reveal className="mx-auto mb-block max-w-prose text-center">
        <h2 className="font-display text-display-lg type-display text-ink">
          {content.title}
        </h2>
        <p className="mt-4 text-body-lg text-ink-muted">{content.body}</p>
      </Reveal>

      {/* bento assimétrico: 1 col (mobile) → 6 col (tablet) → 12 col (desktop).
          As imagens carregam lazy abaixo da dobra (fora do first-load). */}
      <Reveal
        group
        className="grid grid-cols-1 gap-4 md:grid-cols-6 md:gap-5 lg:grid-cols-12"
      >
        {content.slots.map((slot) => (
          <GallerySlotBox key={slot.id} slot={slot} />
        ))}
      </Reveal>
    </Section>
  );
}
