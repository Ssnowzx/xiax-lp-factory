// XIA-80 — verificação dos fixes do Review Board R1 (ui-engineer).
// B1 preço/"mês" · B2 CTA plano · I2 touch 44px · BP font-size ≥12px.
import { chromium } from "playwright";
const BASE = process.env.QA_URL || "http://localhost:3210/";
const browser = await chromium.launch();

async function at(width) {
  const ctx = await browser.newContext({ viewport: { width, height: 1366 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(`${BASE}?reduced=1`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const r = await page.evaluate(() => {
    const cards = [...document.querySelectorAll("[data-plan]")];
    const overflow = [];
    // B1 preço + /mês  ·  B2 CTA
    cards.forEach((c) => {
      c.querySelectorAll("p, a, span").forEach((el) => {
        if (el.scrollWidth > el.clientWidth + 1)
          overflow.push({ plan: c.dataset.plan, sel: el.tagName.toLowerCase() + "." + (typeof el.className === "string" ? el.className.trim().split(/\s+/)[0] : ""), scroll: el.scrollWidth, client: el.clientWidth, over: el.scrollWidth - el.clientWidth, txt: el.textContent.trim().slice(0, 20) });
      });
    });
    // I2 — altura do CTA de plano
    const cta = cards[0]?.querySelector("a[href='#planos-form'], a");
    const ctaH = cta ? Math.round(cta.getBoundingClientRect().height) : null;
    // doc-level overflow-X
    const docOverflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    // grid cols
    const grid = cards[0]?.closest(".grid");
    const cols = grid ? getComputedStyle(grid).gridTemplateColumns.split(" ").length : null;
    const cardW = cards[0] ? Math.round(cards[0].getBoundingClientRect().width) : null;
    return { overflow, ctaH, docOverflow, cols, cardW };
  });
  await ctx.close();
  return r;
}

// BP — menor font-size renderizado em % de texto legível (proxy do Lighthouse audit)
async function fonts() {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1366 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(`${BASE}?reduced=1`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const r = await page.evaluate(() => {
    const small = new Map();
    document.querySelectorAll("*").forEach((el) => {
      if (!el.children.length && el.textContent.trim()) {
        const fs = parseFloat(getComputedStyle(el).fontSize);
        if (fs < 12) {
          const k = el.className && typeof el.className === "string" ? el.className.trim().split(/\s+/).slice(0, 2).join(".") : el.tagName;
          small.set(k, +fs.toFixed(2));
        }
      }
    });
    return { under12: [...small.entries()] };
  });
  await ctx.close();
  return r;
}

for (const w of [768, 1024, 1280, 1440, 1920]) {
  const r = await at(w);
  console.log(`\n== ${w}px == cols=${r.cols} cardW=${r.cardW}px ctaH=${r.ctaH}px docOverflowX=${r.docOverflow}px`);
  if (r.overflow.length) r.overflow.forEach((o) => console.log(`  OVERFLOW ${o.plan} ${o.sel} "${o.txt}" client=${o.client} scroll=${o.scroll} over=+${o.over}`));
  else console.log("  overflow interno: NENHUM ✓");
}
console.log("\n== FONT-SIZE (<12px) ==", JSON.stringify(await fonts()));
await browser.close();
