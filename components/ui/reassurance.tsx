import { IconCheck } from "@/components/ui/icons";
import { PURCHASE_REASSURANCE } from "@/lib/data/plans";
import { cn } from "@/lib/ui/cn";

interface ReassuranceProps {
  className?: string;
  /** Centers the phrases (plan cards, closing CTA); by default they align to the start. */
  centered?: boolean;
}

/**
 * The honest reassurance next to the buy actions (change xiax-lp-v4-xchair): there is no free
 * trial — the shop's page is ready as soon as the card payment is confirmed. Each phrase opens
 * with a small inline brass check, so a long phrase wraps (balanced) with the check on its first
 * word, centered or not.
 * "Cancele quando quiser, sem multa" joins only when the owner confirms it
 * (`SHOW_CANCEL_ANYTIME` in lib/data/plans.ts).
 */
export function Reassurance({ className, centered = false }: ReassuranceProps) {
  return (
    <ul
      className={cn(
        "flex flex-wrap gap-x-4 gap-y-1.5 text-body leading-snug text-ink-subtle",
        centered && "justify-center text-center",
        className,
      )}
    >
      {PURCHASE_REASSURANCE.map((phrase) => (
        <li key={phrase} className="max-w-full text-balance">
          <IconCheck aria-hidden="true" className="mr-1.5 inline-block size-3.5 align-[-0.125em] text-accent" />
          {phrase}
        </li>
      ))}
    </ul>
  );
}
