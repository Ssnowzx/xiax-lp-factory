import { NotFoundPage } from "@/components/landing/not-found-page";

// 404 of the salon's root (change xiax-lp-v5-salon · D1): Porcelana theme, back to `/salao`.
export default function NotFound() {
  return <NotFoundPage home="/salao" />;
}
