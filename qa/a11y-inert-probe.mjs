// A11Y-02 (aria-hidden-focus) re-auditoria — PROVA no DOM AO VIVO.
// React 18.3.1 descarta o boolean `inert` no JSX → o fix seta HTMLElement.inert
// pela propriedade DOM. Aqui provamos: (a) atributo `inert` refletido no DOM
// quando oculta, (b) <a> NÃO-focável dentro do container aria-hidden,
// (c) ao ficar visível: aria-hidden=false + inert removido + <a> focável.
// Uso: node qa/a11y-inert-probe.mjs  (server prod em :3000)
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = "http://localhost:3000";
const OUT = "qa/artifacts/a11y";
mkdirSync(OUT, { recursive: true });
const report = {};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 375, height: 780 }, isMobile: true });
const page = await ctx.newPage();
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(700);

// -------- ESTADO OCULTO (topo da página: #hero visível → barra oculta) --------
const hidden = await page.evaluate(() => {
  const bar = document.querySelector('[class*="z-sticky-cta"]');
  if (!bar) return { error: "sticky-cta container não encontrado" };
  const link = bar.querySelector('a[href="#planos"]');
  if (!link) return { error: "link do CTA sticky não encontrado" };
  // tenta focar o link programaticamente
  link.focus();
  const focused = document.activeElement === link;
  return {
    barFound: true,
    ariaHidden: bar.getAttribute("aria-hidden"),
    inertProp: bar.inert,                       // propriedade DOM
    hasInertAttr: bar.hasAttribute("inert"),    // atributo refletido no HTML
    inertAttrValue: bar.getAttribute("inert"),
    linkFocusableWhenHidden: focused,           // DEVE ser false
    linkTabIndex: link.tabIndex,
  };
});
report.hiddenState = hidden;
console.log("[OCULTO]", JSON.stringify(hidden, null, 2));

// axe no estado oculto (a11y-02 é aria-hidden-focus)
const axHidden = await new AxeBuilder({ page })
  .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
report.axeHidden = {
  violations: axHidden.violations.length,
  ariaHiddenFocus: axHidden.violations.filter((v) => v.id === "aria-hidden-focus").length,
  ids: axHidden.violations.map((v) => `${v.id}(${v.nodes.length})`),
};
console.log("[AXE OCULTO]", JSON.stringify(report.axeHidden, null, 2));

// -------- ESTADO VISÍVEL (rola p/ zona entre #hero e #planos, sem CTA primário na tela) --------
// Provado empiricamente: ~45% da altura do body deixa hero/planos/final fora do viewport.
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.45));
await page.waitForTimeout(900);

const visible = await page.evaluate(() => {
  const bar = document.querySelector('[class*="z-sticky-cta"]');
  const link = bar.querySelector('a[href="#planos"]');
  link.focus();
  const focused = document.activeElement === link;
  return {
    ariaHidden: bar.getAttribute("aria-hidden"),
    inertProp: bar.inert,
    hasInertAttr: bar.hasAttribute("inert"),
    linkFocusableWhenVisible: focused,          // DEVE ser true
  };
});
report.visibleState = visible;
console.log("[VISÍVEL]", JSON.stringify(visible, null, 2));

await browser.close();

// -------- Veredito A11Y-02 --------
const pass =
  hidden.barFound === true &&
  hidden.ariaHidden === "true" &&
  hidden.inertProp === true &&
  hidden.hasInertAttr === true &&
  hidden.linkFocusableWhenHidden === false &&
  report.axeHidden.ariaHiddenFocus === 0 &&
  report.axeHidden.violations === 0 &&
  visible.ariaHidden === "false" &&
  visible.inertProp === false &&
  visible.hasInertAttr === false &&
  visible.linkFocusableWhenVisible === true;

report.verdict = pass ? "A11Y-02 RESOLVED" : "A11Y-02 STILL OPEN";
writeFileSync(`${OUT}/inert-probe.json`, JSON.stringify(report, null, 2));
console.log("\n================ A11Y-02 ================");
console.log(report.verdict);
process.exit(pass ? 0 : 1);
