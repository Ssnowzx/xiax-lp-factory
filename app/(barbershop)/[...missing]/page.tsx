import { notFound } from "next/navigation";

// With one root layout per page (design D1) there is no app-wide not-found: an unknown address
// would get Next's bare English 404. This catch-all sends it to the barbershop group's
// not-found.tsx, inside its root layout. Fixed routes (/, /salao) always win over it.
export default function Missing() {
  notFound();
}
