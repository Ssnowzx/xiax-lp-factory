/**
 * Test utility (not shipped): every string inside a content value, at any depth — copy, alts,
 * SEO, WhatsApp messages — so a word scan cannot miss a field.
 * @param value - the content, or any part of it
 * @returns the strings, in object order
 */
export function collectStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectStrings);
  if (value && typeof value === "object") return Object.values(value).flatMap(collectStrings);
  return [];
}

/**
 * Test utility (not shipped): the strings a content writes as plain copy — everything except the
 * runs that name a salon feature (`{ feature }`), which carry their own state badge.
 * @param value - the content, or any part of it
 * @returns the strings, in object order
 */
export function plainStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(plainStrings);
  if (value && typeof value === "object") return "feature" in value ? [] : Object.values(value).flatMap(plainStrings);
  return [];
}
