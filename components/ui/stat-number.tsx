import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/ui/cn";

// Número gigante DECORATIVO (UX/IA §8): `<p aria-hidden>` — o significado semântico
// mora no label textual ao lado. Tamanho é estilo; nível é semântica.
const stat = cva("font-display tabular-nums leading-none", {
  variants: {
    tone: { ink: "text-ink", accent: "text-accent" },
    size: { "2xl": "text-display-2xl", xl: "text-display-xl" },
  },
  defaultVariants: { tone: "accent", size: "2xl" },
});

export interface StatNumberProps extends VariantProps<typeof stat> {
  value: string;
  // Alvo do count-up (hook `[data-count-num]` consumido pelo motion-engineer). Envolve
  // SÓ os dígitos num `<span>`; prefixo/faixa/moeda/sufixo ficam como texto irmão estático.
  // Sem `countTo` (ou sem JS/reduced), a string final já está no HTML — comportamento atual.
  countTo?: number;
  countDecimals?: number;
  className?: string;
}

export function StatNumber({
  value,
  countTo,
  countDecimals = 0,
  tone,
  size,
  className,
}: StatNumberProps) {
  return (
    <p aria-hidden="true" className={cn(stat({ tone, size }), className)}>
      {countUp(value, countTo, countDecimals)}
    </p>
  );
}

// Localiza a representação pt-BR do alvo DENTRO da string ("40–70%" → 70 → "70") e recorta
// prefixo/sufixo do próprio `value`, garantindo HTML idêntico à string original sob no-JS.
// O `<span>` herda `tabular-nums` do pai → largura de dígito estável (zero CLS). Não achou
// o número no texto → devolve a string intacta (defensivo).
function countUp(value: string, countTo?: number, decimals = 0) {
  if (countTo === undefined || !Number.isFinite(countTo)) return value;
  const digits = countTo.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const idx = value.lastIndexOf(digits);
  if (idx < 0) return value;
  return (
    <>
      {value.slice(0, idx)}
      <span
        data-count-num=""
        data-count-to={countTo}
        data-count-decimals={decimals}
      >
        {value.slice(idx, idx + digits.length)}
      </span>
      {value.slice(idx + digits.length)}
    </>
  );
}
