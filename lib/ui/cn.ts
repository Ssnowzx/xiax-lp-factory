import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge"; // 2.x (NÃO 3 — Tailwind 3.4)

/**
 * fontSize custom do Design System (lib/ui/theme.ts). O twMerge default só conhece
 * as escalas padrão do Tailwind — sem registrar `text-title`/`text-label`/… ele não
 * os reconhece como `font-size` e os trata como o grupo `text-color`, dropando a cor
 * quando as duas classes coexistem (ex.: `text-label` + `text-accent-ink` → cor some).
 * Causa-raiz do A11Y-01 (CTA header caía p/ text-ink → contraste 1.96:1).
 * Registrar aqui corrige TODAS as colisões latentes de text-<size> × text-<color>.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display-2xl",
            "display-xl",
            "display-lg",
            "title",
            "body-lg",
            "body",
            "label",
          ],
        },
      ],
    },
  },
});

/** Merge de classes com resolução correta de conflito Tailwind. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
