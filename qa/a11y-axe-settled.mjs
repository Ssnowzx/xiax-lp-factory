// A11y gate — SETTLED DOM. axe só enxerga o DOM atual; os reveal-items (Reveal seat)
// nascem opacity:0 sob html.anim-ready e só chegam a opacity:1 quando o IntersectionObserver
// (ou GSAP) os revela. Um scan em networkidle SEM rolar a página lê o conteúdo abaixo da
// dobra em opacity parcial → axe compõe a cor com o fundo escuro e ACUSA falso contraste.
// Aqui rolamos a página inteira, ESPERAMOS todo reveal-item chegar a opacity>=0.99 e só
// então rodamos o axe — a leitura do DOM assentado (o que o usuário realmente vê). Análogo
// à "passada limpa de FPS": não medir durante a animação.
// Uso: node qa/a11y-axe-settled.mjs   (server prod em :3000)
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = "http://localhost:3000";
const TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];
const OUT = "qa/artifacts/a11y";
mkdirSync(OUT, { recursive: true });

async function settle(page) {
  // Força o ESTADO FINAL de todo reveal (opacity:1 / transform:none). O reveal nasce
  // opacity:0 sob anim-ready e só chega a 1 quando revelado — medir contraste durante a
  // animação é ler uma cor composta (falso). Aqui injetamos o estado assentado para ler
  // os TOKENS REAIS que o usuário vê após a revelação (idêntico ao que o reduced-motion
  // já expõe, mas no esquema de cor DEFAULT, sem alterar nenhuma cor).
  await page.addStyleTag({
    content: `.reveal, .reveal-item { opacity: 1 !important; transform: none !important; }`,
  });
  await page.evaluate(() => {
    document.querySelectorAll(".reveal, .reveal-group").forEach((el) =>
      el.setAttribute("data-revealed", "true"),
    );
  });
  await page.waitForTimeout(200);
}

const results = [];
async function scan(page, label) {
  const r = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const v = r.violations;
  const maxImpact = v.map((x) => x.impact).sort((a, b) =>
    ["minor", "moderate", "serious", "critical"].indexOf(b) -
    ["minor", "moderate", "serious", "critical"].indexOf(a))[0] || "—";
  writeFileSync(`${OUT}/${label}.json`, JSON.stringify(v, null, 2));
  results.push({ label, count: v.length, maxImpact, ids: v.map((x) => `${x.id}(${x.nodes.length})`) });
  console.log(`\n[${label}] violations=${v.length} maxImpact=${maxImpact}`);
  for (const x of v) {
    console.log(`  - ${x.id} [${x.impact}] ${x.nodes.length} node(s)`);
    for (const n of x.nodes.slice(0, 6)) {
      const d = n.any?.find((a) => a.data)?.data;
      console.log(`      → ${n.target.join(" ")}${d ? ` | ${d.contrastRatio}:1 fg=${d.fgColor} bg=${d.bgColor}` : ""}`);
    }
  }
}

const browser = await chromium.launch();

// ---- Desktop settled ----
const ctxD = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctxD.newPage();
await page.goto(BASE, { waitUntil: "networkidle" });
await settle(page);
await scan(page, "06-settled-desktop");

// plano popular + toggle anual (troca de ciclo — estado do preço)
const annual = page.locator('[role=radio]').nth(1);
if (await annual.count()) { await annual.click(); await page.waitForTimeout(500); }
await scan(page, "07-settled-annual");
await ctxD.close();

// ---- Mobile settled ----
const ctxM = await browser.newContext({ viewport: { width: 375, height: 780 }, isMobile: true });
const pageM = await ctxM.newPage();
await pageM.goto(BASE, { waitUntil: "networkidle" });
await settle(pageM);
await scan(pageM, "08-settled-mobile");
await ctxM.close();

await browser.close();

console.log("\n================ RESUMO (SETTLED) ================");
let total = 0;
for (const r of results) { total += r.count; console.log(`${r.label.padEnd(24)} ${String(r.count).padStart(2)} viol  ${r.maxImpact.padEnd(9)} ${r.ids.join(", ")}`); }
console.log(`\nTOTAL (settled): ${total}`);
console.log(total === 0 ? "GATE AXE (settled): PASS" : "GATE AXE (settled): FAIL");
writeFileSync(`${OUT}/summary-settled.json`, JSON.stringify(results, null, 2));
process.exit(total === 0 ? 0 : 1);
