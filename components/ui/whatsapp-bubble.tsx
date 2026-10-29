import type { WhatsAppExample } from "@/lib/data/whatsapp-messages";

import { cn } from "@/lib/ui/cn";

// A message from the shop as the client's WhatsApp shows it (change xiax-lp-v4-xchair · D4).
// Real text, readable by screen readers: it is the product's own message, not decoration.
// One-way on purpose — the client answers on the site through the link, never in the chat.
// Laid out like the phone's notification (sender, app and time on one line), which also keeps
// it short enough to sit under the confirmation's date in a step card.

interface BubbleProps {
  message: WhatsAppExample;
  /** `sm` inside the step cards, `md` in a section of its own. */
  size?: "sm" | "md";
  className?: string;
}

export function WhatsAppBubble({ message, size = "md", className }: BubbleProps) {
  return (
    <figure
      className={cn(
        "rounded-field rounded-tl-none border border-line-strong bg-surface-raised text-ink shadow-e3",
        size === "sm" ? "px-3 py-2 text-[0.8125rem] leading-snug" : "px-4 py-3 text-body",
        className,
      )}
    >
      <figcaption className="flex items-baseline justify-between gap-3">
        <strong className="font-semibold">{message.business}</strong>
        <span className="shrink-0 text-[0.75rem] leading-normal text-ink-subtle tabular-nums">
          WhatsApp · {message.time}
          <span className="sr-only"> — {message.label}</span>
        </span>
      </figcaption>
      <p className="mt-1">
        {message.parts.map((part) => (part.bold ? <strong key={part.text}>{part.text}</strong> : part.text))}
      </p>
    </figure>
  );
}
