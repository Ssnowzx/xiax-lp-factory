// Gate C→D — auto-check da barra (XIA-92). Prova PRELIMINAR (não substitui o Review
// Board). Roda o que já existe agora (assentos do architect: CLS 0 do #modelos +
// picker sem layout-shift na seleção) e deixa o esqueleto p/ os itens pós-fill
// (imagens ligadas, anotações rough ligadas, Lighthouse mediana-de-3).
//
// Uso: `node qa/xia92-gate.mjs` com um `next start` servindo em QA_URL.
import { chromium } from "playwright";
import fs from "node:fs";

const BASE = process.env.QA_URL || "http://localhost:3292/";
const OUT = "qa/artifacts/xia92";
fs.mkdirSync(OUT, { recursive: true });

// Mede CLS acumulado da carga + settle (layout-shift API, ignora shifts com input recente).
const measureCls = () =>
  new Promise((resolve) => {
    let cls = 0;
    const po = new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (!e.hadRecentInput) cls += e.value;
      }
    });
    po.observe({ type: "layout-shift", buffered: true });
    setTimeout(() => {
      po.disconnect();
      resolve(Number(cls.toFixed(4)));
    }, 400);
  });

async function run() {
  const browser = await chromium.launch();
  const results = { base: BASE, checks: [] };
  const add = (name, pass, detail) => results.checks.push({ name, pass, detail });

  // 1) CLS de carga (desktop, com fontes settled) — o #modelos entra sem empurrar layout.
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(200);
  const clsLoad = await page.evaluate(measureCls);
  add("CLS de carga (desktop)", clsLoad === 0, `cls=${clsLoad}`);

  // 2) #modelos existe e é RSC (título/intro no HTML de servidor).
  const modelosHtml = await page.locator("#modelos h2").first().textContent();
  add("#modelos no HTML (RSC/indexável)", Boolean(modelosHtml?.trim()), `h2="${modelosHtml?.trim()?.slice(0, 48)}"`);

  // 3) Picker: selecionar cada modelo NÃO gera layout-shift (caixa de preview reservada).
  // native input[type=radio] tem role="radio" implícito; input é sr-only → clicar o LABEL.
  const labels = page.locator('#modelos label:has(input[type="radio"])');
  const n = await labels.count();
  // baseline de posição da caixa de preview antes de trocar seleção
  const previewBox = page.locator('#modelos [aria-live="polite"]').first();
  const before = await previewBox.boundingBox();
  let shiftOnSelect = 0;
  await page.evaluate(() => {
    window.__cls = 0;
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
    }).observe({ type: "layout-shift", buffered: false });
  });
  for (let i = 0; i < n; i++) {
    await labels.nth(i).click();
    await page.waitForTimeout(80);
  }
  await page.waitForTimeout(150);
  shiftOnSelect = await page.evaluate(() => Number((window.__cls || 0).toFixed(4)));
  const after = await previewBox.boundingBox();
  // Só a ALTURA/LARGURA da caixa provam a reserva (CLS 0). O `y` de viewport muda por
  // auto-scroll do .click() do Playwright (não é layout-shift) → NÃO comparar.
  const boxStable = before && after && Math.abs(before.height - after.height) < 1 && Math.abs(before.width - after.width) < 1;
  add(`picker: ${n} modelos selecionáveis`, n >= 2, `labels=${n}`);
  add("picker: seleção NÃO redimensiona a caixa (CLS 0)", shiftOnSelect === 0 && Boolean(boxStable), `clsOnSelect=${shiftOnSelect} boxWH=${after?.width?.toFixed(0)}x${after?.height?.toFixed(0)} stable=${boxStable}`);

  // 4) Rough-notation: alvos WS3 presentes + reduced-motion = instantâneo sem traço.
  const rp = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await rp.emulateMedia({ reducedMotion: "reduce" });
  await rp.goto(BASE + "?reduced=1", { waitUntil: "networkidle" });
  const roughTargets = await rp.locator("[data-rn]").count();
  // texto marcado deve ser legível (não aria-hidden, não display:none)
  const firstTarget = await rp.locator("[data-rn]").first().isVisible();
  add(`rough WS3: ${roughTargets} alvos no DOM, texto visível (reduced-motion)`, roughTargets >= 6 && firstTarget, `data-rn=${roughTargets} visível=${firstTarget}`);

  await browser.close();

  // itens pós-fill (rodar de novo quando XIA-94/95 fecharem):
  results.pending_pos_fill = [
    "CLS 0 com next/image ligado na #galeria (XIA-94)",
    "CLS 0 com anotações rough LIGADAS (XIA-95) — o requisito central da barra",
    "Lighthouse ~100 (mediana de 3) + INP não regride vs 6c55336",
  ];

  fs.writeFileSync(`${OUT}/gate.json`, JSON.stringify(results, null, 2));
  const pass = results.checks.every((c) => c.pass);
  console.log(JSON.stringify(results, null, 2));
  console.log(pass ? "\nGATE PRELIMINAR (assentos): PASS" : "\nGATE PRELIMINAR: FAIL");
  process.exit(pass ? 0 : 1);
}

run().catch((e) => {
  console.error(e.message || e);
  process.exit(2);
});
