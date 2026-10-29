import { notFound } from "next/navigation";

// An unknown address under /salao gets the salon group's not-found.tsx, in its own root layout and
// theme, instead of the barbershop's catch-all. The fixed route /salao always wins over it.
export default function Missing() {
  notFound();
}
