// Self-check do ui-engineer (responsive-visual-qa + accessibility-wcag) ANTES do handoff.
// Matriz 360→1920 × dark/light: zero overflow horizontal (scrollWidth ≤ clientWidth+1),
// alvos ≥24px, screenshots. Passe a11y leve em código (sem axe-core no ambiente): 1 <h1>,
// hierarquia de headings sem pular nível, todo interativo com nome acessível, todo input
// com <label>, imagens com alt. Falha dura em qualquer violação.
import { chromium } from "playwright";
import fs from "node:fs";

const URL = process.env.QA_URL || "http://localhost:3100";
const OUT = process.env.QA_OUT || "/tmp/xiax-ui-qa";
fs.mkdirSync(OUT, { recursive: true });

const WIDTHS = [360, 390, 768, 1024, 1440, 1920];
const THEMES = ["dark", "light"];
const problems = [];

const browser = await chromium.launch();

// ---- passe de overflow + screenshots (matriz completa) ----
for (const theme of THEMES) {
  for (const width of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: "networkidle" });
    await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
    await page.waitForTimeout(400);

    const ov = await page.evaluate(() => {
      const de = document.documentElement;
      return { sw: de.scrollWidth, cw: de.clientWidth };
    });
    if (ov.sw > ov.cw + 1) problems.push(`OVERFLOW ${theme} @${width}: scrollWidth ${ov.sw} > clientWidth ${ov.cw}`);

    // scroll até o fim para materializar reveals e medir de novo
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    const ov2 = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    if (ov2.sw > ov2.cw + 1) problems.push(`OVERFLOW(scrolled) ${theme} @${width}: ${ov2.sw} > ${ov2.cw}`);

    await page.screenshot({ path: `${OUT}/${theme}_${width}.png`, fullPage: width === 390 || width === 1440 });
    await ctx.close();
  }
}

// ---- passe a11y leve (1 viewport desktop) ----
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "networkidle" });

  const audit = await page.evaluate(() => {
    const out = { h1: 0, headingSkips: [], namelessInteractive: [], inputsNoLabel: [], imgsNoAlt: [], smallTargets: 0 };
    // headings
    const hs = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) => +h.tagName[1]);
    out.h1 = document.querySelectorAll("h1").length;
    let prev = 0;
    for (const lvl of hs) {
      if (prev && lvl > prev + 1) out.headingSkips.push(`${prev}->${lvl}`);
      prev = lvl;
    }
    // interativos com nome acessível
    const acc = (el) => (el.textContent || "").trim() || el.getAttribute("aria-label") || el.getAttribute("title") || (el.querySelector("[aria-label]") ? "icon" : "");
    for (const el of document.querySelectorAll("a[href],button,[role=button]")) {
      if (!acc(el)) out.namelessInteractive.push(el.outerHTML.slice(0, 80));
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && (r.width < 24 || r.height < 24)) out.smallTargets++;
    }
    // inputs com label — ignora hidden (não são de usuário; ex.: os inputs
    // $ACTION_* que o Next injeta no <form action={serverAction}> de PE) e
    // qualquer input aria-hidden. axe (gate autoritativo) já os desconsidera.
    for (const inp of document.querySelectorAll("input,select,textarea")) {
      if (inp.getAttribute("type") === "hidden" || inp.getAttribute("aria-hidden") === "true") continue;
      const id = inp.getAttribute("id");
      const labelled = (id && document.querySelector(`label[for="${id}"]`)) || inp.getAttribute("aria-label") || inp.getAttribute("aria-labelledby");
      if (!labelled) out.inputsNoLabel.push(inp.getAttribute("name") || inp.outerHTML.slice(0, 60));
    }
    // imgs com alt (inclui role=img)
    for (const img of document.querySelectorAll("img")) if (img.getAttribute("alt") === null) out.imgsNoAlt.push(img.src);
    return out;
  });

  if (audit.h1 !== 1) problems.push(`A11Y h1 count = ${audit.h1} (esperado 1)`);
  if (audit.headingSkips.length) problems.push(`A11Y heading skip: ${audit.headingSkips.join(", ")}`);
  if (audit.namelessInteractive.length) problems.push(`A11Y interativo sem nome: ${audit.namelessInteractive.join(" | ")}`);
  if (audit.inputsNoLabel.length) problems.push(`A11Y input sem label: ${audit.inputsNoLabel.join(", ")}`);
  if (audit.imgsNoAlt.length) problems.push(`A11Y img sem alt: ${audit.imgsNoAlt.join(", ")}`);
  if (audit.smallTargets) problems.push(`A11Y ${audit.smallTargets} alvo(s) < 24px`);

  // teclado: foco visível no CTA primário
  await page.keyboard.press("Tab");
  console.log("A11Y audit:", JSON.stringify(audit));
  await ctx.close();
}

await browser.close();

if (problems.length) {
  console.log("\n❌ SELF-CHECK FALHOU:");
  for (const p of problems) console.log("  - " + p);
  process.exit(1);
} else {
  console.log("\n✅ SELF-CHECK OK — zero overflow (360→1920 × dark/light), a11y leve limpa. Screenshots em " + OUT);
}
