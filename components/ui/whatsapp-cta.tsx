"use client";

import type { CtaPlacement } from "@/lib/analytics/events";
import type { PageId } from "@/lib/content/types";

import { Button } from "@/components/ui/button";
import { IconChat } from "@/components/ui/icons";
import { ctaClick } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";
import { salesLink } from "@/lib/contact/whatsapp";
import { cn } from "@/lib/ui/cn";

// The page's one call to action (change xiax-lp-v4-xchair · owner, 2026-10-28: no e-mail
// capture, "vai ser direto pro whatsapp"). A plain link to the sales chat with the greeting
// already typed, so it works without JS; the client island only counts the click.

interface WhatsAppCtaProps {
  /** The page the click is counted for (`content.page`). */
  page: PageId;
  placement: CtaPlacement;
  /** The page's greeting (`content.whatsapp.greeting`), already typed in the chat. */
  message: string;
  size?: "md" | "lg";
  className?: string;
}

export function WhatsAppCta({ page, placement, message, size = "md", className }: WhatsAppCtaProps) {
  return (
    <Button asChild variant="accent" size={size} className={cn("gap-2.5", className)}>
      <a
        href={salesLink(message)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track(ctaClick(page, placement))}
      >
        <IconChat className="size-[1.35em]" />
        Chamar no WhatsApp <span aria-hidden="true">▸</span>
      </a>
    </Button>
  );
}
