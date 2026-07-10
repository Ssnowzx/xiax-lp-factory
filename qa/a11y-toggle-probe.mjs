// BillingToggle (planos-table) — widget NOVO em V2. Semântica de radiogroup WAI-ARIA:
// roving tabindex + setas/Home/End, um só selecionado, teclado completo sem trap.
// Prova ao vivo: (a) role/aria corretos, (b) só o selecionado é tabbable, (c) ArrowRight/
// Left/Home/End movem seleção+foco, (d) aria-checked segue, (e) Tab SAI do grupo (sem trap).
// Uso: node qa/a11y-toggle-probe.mjs  (server prod :3000)
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
const OUT = "qa/artifacts/a11y";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
await page.goto("http://localhost:3000", { waitUntil: "networkidle" });

const group = page.locator('[role=radiogroup]').first();
await group.scrollIntoViewIfNeeded();
await page.waitForTimeout(300);

const snap = async () => page.evaluate(() => {
  const radios = [...document.querySelectorAll('[role=radio]')];
  return {
    groupLabel: document.querySelector('[role=radiogroup]')?.getAttribute("aria-label"),
    radios: radios.map((r) => ({
      label: r.textContent.trim().replace(/\s+/g, " ").slice(0, 20),
      checked: r.getAttribute("aria-checked"),
      tabindex: r.tabIndex,
      focused: document.activeElement === r,
    })),
  };
});

const report = { initial: await snap() };

// foca o radio selecionado (roving: só o tabindex 0 recebe foco no Tab)
const selected = page.locator('[role=radio][aria-checked=true]').first();
await selected.focus();
report.afterFocus = await snap();

await page.keyboard.press("ArrowRight");
await page.waitForTimeout(200);
report.afterArrowRight = await snap();

await page.keyboard.press("ArrowLeft");
await page.waitForTimeout(200);
report.afterArrowLeft = await snap();

await page.keyboard.press("End");
await page.waitForTimeout(200);
report.afterEnd = await snap();

await page.keyboard.press("Home");
await page.waitForTimeout(200);
report.afterHome = await snap();

// Tab deve SAIR do grupo (sem trap)
await page.keyboard.press("Tab");
const escaped = await page.evaluate(() => {
  const a = document.activeElement;
  return { tag: a.tagName, role: a.getAttribute("role"), stillInGroup: a.getAttribute("role") === "radio" };
});
report.tabEscapes = escaped;

await browser.close();

// Veredito
const r0 = report.afterFocus.radios;
const checkedCount = r0.filter((x) => x.checked === "true").length;
const tabbableCount = r0.filter((x) => x.tabindex === 0).length;
const arrowMoved = report.afterArrowRight.radios.findIndex((x) => x.checked === "true") !==
                   report.afterFocus.radios.findIndex((x) => x.checked === "true");
const endLast = report.afterEnd.radios[report.afterEnd.radios.length - 1].checked === "true";
const homeFirst = report.afterHome.radios[0].checked === "true";
const noTrap = report.tabEscapes.stillInGroup === false;

report.verdict = {
  singleSelected: checkedCount === 1,
  rovingTabindex: tabbableCount === 1,
  arrowMovesSelection: arrowMoved,
  endSelectsLast: endLast,
  homeSelectsFirst: homeFirst,
  noKeyboardTrap: noTrap,
};
const pass = Object.values(report.verdict).every(Boolean);
report.PASS = pass;
writeFileSync(`${OUT}/toggle-probe.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.verdict, null, 2));
console.log("groupLabel:", report.initial.groupLabel);
console.log(pass ? "BILLING TOGGLE: PASS" : "BILLING TOGGLE: FAIL");
process.exit(pass ? 0 : 1);
