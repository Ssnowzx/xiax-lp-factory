/**
 * qa/contrast-check.mjs — prova WCAG 2.2 AA dos PARES do Design System em código.
 * Fonte dos primitivos: styles/tokens.css. Roda: `node qa/contrast-check.mjs`.
 * Saída não-zero se qualquer par novo ficar abaixo do limiar (texto 4.5 · UI/grande 3).
 */
const P = {
  "espresso-950": [20, 17, 14], "espresso-900": [28, 24, 21], "espresso-850": [36, 31, 26],
  "espresso-800": [51, 44, 36], "espresso-600": [122, 106, 82], "espresso-500": [138, 122, 95],
  "bone-25": [255, 253, 249], "bone-50": [251, 246, 236], "bone-100": [243, 236, 224],
  "bone-200": [226, 215, 196], "bone-300": [196, 182, 162], "bone-400": [156, 143, 124],
  "bone-500": [110, 98, 82], "bone-600": [92, 81, 66], "bone-900": [35, 28, 20],
  "brass-400": [214, 162, 78], "brass-700": [138, 90, 22],
};
const lin = ([r, g, b]) => {
  const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const cr = (a, b) => { const l1 = lin(P[a]), l2 = lin(P[b]); const hi = Math.max(l1, l2), lo = Math.min(l1, l2); return (hi + 0.05) / (lo + 0.05); };

// PARES NOVOS V2 — fundo = surface-raised (moldura da galeria + card de plano destacado).
const PAIRS = [
  // [rótulo, fg, bg, limiar]
  ["DARK  media-label ink-subtle/surface-raised", "bone-400", "espresso-850", 4.5],
  ["DARK  media-border line-strong/surface-raised", "espresso-600", "espresso-850", 3],
  ["DARK  check/anel accent/surface-raised", "brass-400", "espresso-850", 3],
  ["LIGHT media-label ink-subtle/surface-raised", "bone-500", "bone-25", 4.5],
  ["LIGHT media-border line-strong/surface-raised", "espresso-500", "bone-25", 3],
  ["LIGHT check/anel accent/surface-raised", "brass-700", "bone-25", 3],
];
let fail = 0;
for (const [label, fg, bg, min] of PAIRS) {
  const ratio = cr(fg, bg);
  const ok = ratio >= min;
  if (!ok) fail++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${ratio.toFixed(2)} (>=${min})  ${label}`);
}
console.log(fail ? `\n${fail} par(es) abaixo do limiar.` : "\nTodos os pares novos passam AA nos dois temas.");
process.exit(fail ? 1 : 0);
