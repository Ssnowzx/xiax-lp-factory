// A11y gate — @axe-core/playwright · WCAG 2.2 AA (tags wcag2a/2aa/21aa/22aa).
// Scan de cada ESTADO relevante do DOM (axe só enxerga o DOM atual).
// Uso: node qa/a11y-axe.mjs   (server prod em :3000)
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = "http://localhost:3000";
const TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];
const OUT = "qa/artifacts/a11y";
mkdirSync(OUT, { recursive: true });

const results = [];
async function scan(page, label) {
  const r = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const v = r.violations;
  const maxImpact =
    v.map((x) => x.impact).sort((a, b) =>
      ["minor", "moderate", "serious", "critical"].indexOf(b) -
      ["minor", "moderate", "serious", "critical"].indexOf(a))[0] || "—";
  writeFileSync(`${OUT}/${label}.json`, JSON.stringify(v, null, 2));
  results.push({ label, count: v.length, maxImpact, ids: v.map((x) => `${x.id}(${x.nodes.length})`) });
  console.log(`\n[${label}] violations=${v.length} maxImpact=${maxImpact}`);
  for (const x of v) {
    console.log(`  - ${x.id} [${x.impact}] ${x.nodes.length} node(s) :: ${x.help}`);
    for (const n of x.nodes.slice(0, 4)) console.log(`      → ${n.target.join(" ")} | ${n.failureSummary?.split("\n")[0]}`);
  }
}

const browser = await chromium.launch();

// ---- Desktop (1280) ----
const ctxD = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctxD.newPage();
await page.goto(BASE, { waitUntil: "networkidle" });
await scan(page, "01-default-desktop");

// FAQ accordion aberto
const faqTrigger = page.locator("#faq button").first();
await faqTrigger.scrollIntoViewIfNeeded();
await faqTrigger.click();
await page.waitForTimeout(400);
await scan(page, "02-faq-open");

// Form: e-mail inválido submetido (tenta renderizar estado de erro)
const email = page.locator("#hero input[type=email], input[name=email]").first();
await email.scrollIntoViewIfNeeded();
await email.fill("nao-e-email");
await page.locator('form button[type=submit]').first().click();
await page.waitForTimeout(700);
await scan(page, "03-form-invalid-submit");
await ctxD.close();

// ---- Mobile (375) — .cta-bar visível ----
const ctxM = await browser.newContext({ viewport: { width: 375, height: 780 }, isMobile: true });
const pageM = await ctxM.newPage();
await pageM.goto(BASE, { waitUntil: "networkidle" });
await pageM.waitForTimeout(600);
await scan(pageM, "04-mobile-default");
await ctxM.close();

// ---- reduced-motion (delegado a motion, mas axe estrutural deve seguir 0) ----
const ctxR = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
const pageR = await ctxR.newPage();
await pageR.goto(BASE, { waitUntil: "networkidle" });
await scan(pageR, "05-reduced-motion");
await ctxR.close();

await browser.close();

console.log("\n================ RESUMO ================");
let total = 0;
for (const r of results) { total += r.count; console.log(`${r.label.padEnd(26)} ${String(r.count).padStart(2)} viol  ${r.maxImpact.padEnd(9)} ${r.ids.join(", ")}`); }
console.log(`\nTOTAL violations across states: ${total}`);
console.log(total === 0 ? "GATE AXE: PASS (violations = [])" : "GATE AXE: FAIL");
writeFileSync(`${OUT}/summary.json`, JSON.stringify(results, null, 2));
process.exit(total === 0 ? 0 : 1);
