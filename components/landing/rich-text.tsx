import { Fragment } from "react";

import type { RichPart, RichText as RichTextValue } from "@/lib/content/types";

import { FeatureMention } from "@/components/landing/feature-mention";

// A line of page copy (lib/content/types.ts): plain runs, the theme's highlight, bold text and
// salon features with their state, in order. No hooks — renders on the server or inside a client
// island alike.

function Part({ part }: { part: RichPart }) {
  if (typeof part === "string") return <>{part}</>;
  if ("mark" in part) return <span className="mark-accent text-accent">{part.mark}</span>;
  if ("strong" in part) return <strong className="text-ink">{part.strong}</strong>;
  return <FeatureMention id={part.feature} text={part.text} />;
}

export function RichText({ value }: { value: RichTextValue }) {
  if (typeof value === "string") return <>{value}</>;
  return (
    <>
      {value.map((part, i) => (
        <Fragment key={i}>
          <Part part={part} />
        </Fragment>
      ))}
    </>
  );
}
