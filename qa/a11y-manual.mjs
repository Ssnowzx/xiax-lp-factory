// Passe manual A11y (o que o axe não pega): teclado + foco visível + zoom/reflow + grayscale.
// Grava vídeo do keyboard-walk (padrão motion-qa). Uso: node qa/a11y-manual.mjs
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = "http://localhost:3000";
const OUT = "qa/artifacts/a11y";
mkdirSync(`${OUT}/video`, { recursive: true });
const log = [];
const rec = (k, v) => { log.push({ [k]: v }); console.log(k, JSON.stringify(v)); };

const browser = await chromium.launch();

// ---------- 1) Keyboard walk (com vídeo) ----------
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  recordVideo: { dir: `${OUT}/video`, size: { width: 1280, height: 900 } },
});
const page = await ctx.newPage();
await page.goto(BASE, { waitUntil: "networkidle" });

// 1º Tab → deve focar o skip-link e ele deve ficar visível
await page.keyboard.press("Tab");
const first = await page.evaluate(() => {
  const a = document.activeElement;
  const r = a.getBoundingClientRect();
  const s = getComputedStyle(a);
  return { tag: a.tagName, text: (a.textContent || "").trim().slice(0, 30), href: a.getAttribute("href"),
    onScreen: r.top >= 0 && r.left >= 0, outline: s.outlineStyle, outlineWidth: s.outlineWidth };
});
rec("firstFocusable(skip-link)", first);
await page.screenshot({ path: `${OUT}/skiplink-focus.png`, clip: { x: 0, y: 0, width: 480, height: 120 } });

// Walk até 60 tabs; registra ordem, foco visível e detecta trap
const order = []; let trap = false;
for (let i = 0; i < 60; i++) {
  const cur = await page.evaluate(() => {
    const a = document.activeElement; if (!a || a === document.body) return null;
    const s = getComputedStyle(a);
    const posTab = a.getAttribute("tabindex");
    return { tag: a.tagName, label: (a.getAttribute("aria-label") || a.textContent || "").trim().replace(/\s+/g, " ").slice(0, 34),
      hasFocusRing: (s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0) || s.boxShadow !== "none",
      tabindex: posTab };
  });
  if (cur) order.push(cur);
  await page.keyboard.press("Tab");
  await page.waitForTimeout(60);
  const back = await page.evaluate(() => document.activeElement === document.body);
  if (back && i > 3) break; // completou o ciclo (voltou pro body/topo)
}
const positiveTab = order.filter((o) => o.tabindex && Number(o.tabindex) > 0);
const noRing = order.filter((o) => !o.hasFocusRing);
rec("tabStops", order.length);
rec("tabOrderSample", order.slice(0, 14));
rec("positiveTabindex", positiveTab);
rec("focusStopsWithoutVisibleRing", noRing.map((o) => `${o.tag}:${o.label}`));

// ---------- 2) FAQ accordion via teclado (Enter abre; foco não some) ----------
await page.locator("#faq").scrollIntoViewIfNeeded();
const faqBtn = page.locator("#faq button").first();
await faqBtn.focus();
await page.keyboard.press("Enter");
await page.waitForTimeout(300);
const faqState = await faqBtn.getAttribute("aria-expanded");
rec("faqEnterOpens(aria-expanded)", faqState);
await page.keyboard.press("Enter");
await page.waitForTimeout(200);
rec("faqEnterCloses(aria-expanded)", await faqBtn.getAttribute("aria-expanded"));

await ctx.close(); // finaliza o vídeo

// ---------- 3) Zoom/reflow 400% (≈ viewport 320px) — sem scroll horizontal (1.4.10) ----------
const ctxZ = await browser.newContext({ viewport: { width: 320, height: 1024 } });
const pageZ = await ctxZ.newPage();
await pageZ.goto(BASE, { waitUntil: "networkidle" });
await pageZ.waitForTimeout(400);
const reflow = await pageZ.evaluate(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
  overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
}));
rec("reflow320(1.4.10)", { ...reflow, pass: reflow.overflowX <= 2 });
await pageZ.screenshot({ path: `${OUT}/reflow-320.png`, fullPage: false });

// text 200% (1.4.4) — dobra o rem e checa overflow horizontal
await pageZ.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
await pageZ.waitForTimeout(300);
const text200 = await pageZ.evaluate(() => ({
  overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
}));
rec("text200(1.4.4)", { ...text200, pass: text200.overflowX <= 2 });
await ctxZ.close();

// ---------- 4) Grayscale (1.4.1) — status não pode depender só de cor ----------
const ctxG = await browser.newContext({ viewport: { width: 1280, height: 900 }, forcedColors: "none" });
const pageG = await ctxG.newPage();
await pageG.goto(BASE, { waitUntil: "networkidle" });
await pageG.addStyleTag({ content: "html{filter:grayscale(1) contrast(1)}" });
await pageG.locator("#faq").scrollIntoViewIfNeeded();
await pageG.waitForTimeout(300);
await pageG.screenshot({ path: `${OUT}/grayscale-full.png`, fullPage: true });
rec("grayscaleShot", "grayscale-full.png (revisão visual: nav ativo, erro, links carregam texto/forma além de cor)");

await browser.close();
writeFileSync(`${OUT}/manual-pass.json`, JSON.stringify(log, null, 2));
console.log("\nManual pass concluído. Evidências em", OUT);
