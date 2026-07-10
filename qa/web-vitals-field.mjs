// Field CWV (LCP/CLS/INP) COM interação real — separa regressão real do ruído de
// throttle do Lighthouse. INP só existe com interação: aqui disparamos cliques/taps
// reais (FAQ, foco de input, CTA) e lemos o Event Timing API. LCP via PerformanceObserver
// (último candidato); CLS somado excluindo recent-input. Perfil mobile + desktop.
import { chromium, devices } from "playwright";

const URL = process.env.QA_URL || "http://localhost:3847/";

const OBSERVER = () => {
  window.__v = { lcp: 0, cls: 0, inp: 0, events: [] };
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) window.__v.lcp = e.startTime + (e.renderTime ? 0 : 0) || e.startTime;
  }).observe({ type: "largest-contentful-paint", buffered: true });
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) if (!e.hadRecentInput) window.__v.cls += e.value;
  }).observe({ type: "layout-shift", buffered: true });
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) {
      window.__v.events.push(e.duration);
      if (e.duration > window.__v.inp) window.__v.inp = e.duration;
    }
  }).observe({ type: "event", buffered: true, durationThreshold: 16 });
};

async function run({ label, viewport, device = {}, cpuRate = 1 }) {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport, reducedMotion: "no-preference", ...device });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  if (cpuRate > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: cpuRate });
  await page.addInitScript(OBSERVER);
  await page.goto(URL, { waitUntil: "load" });
  await page.waitForTimeout(1500);

  // ---- interações reais (geram INP) ----
  // 1) foco/tecla nos inputs do formulário de trial
  const inputs = await page.$$('form input');
  for (const inp of inputs.slice(0, 2)) {
    await inp.click({ timeout: 2000 }).catch(() => {});
    await inp.type("teste@barbearia.com", { delay: 20 }).catch(() => {});
    await page.waitForTimeout(120);
  }
  // 2) abre/fecha acordeões do FAQ (clique real)
  const faqButtons = await page.$$('#faq button, [data-state] button, button[aria-expanded]');
  for (const b of faqButtons.slice(0, 4)) {
    await b.click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(150);
  }
  // 3) scroll + clique em CTAs de plano (não navega — são teste grátis, mesma página/âncora)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.5));
  await page.waitForTimeout(300);
  const ctas = await page.$$('a[href="#hero"], a[href^="#"], button');
  for (const c of ctas.slice(0, 5)) {
    await c.click({ timeout: 1500 }).catch(() => {});
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(400);

  const v = await page.evaluate(() => ({
    lcp: Math.round(window.__v.lcp),
    cls: Number(window.__v.cls.toFixed(4)),
    inp: Math.round(window.__v.inp),
    interactions: window.__v.events.length,
    p75event: (() => {
      const s = window.__v.events.slice().sort((a, b) => a - b);
      return s.length ? Math.round(s[Math.floor(s.length * 0.75)]) : 0;
    })(),
  }));
  await context.close();
  await browser.close();
  return { label, viewport, cpuRate, ...v };
}

const desktop = await run({ label: "desktop 1x", viewport: { width: 1440, height: 900 } });
console.log(JSON.stringify(desktop));
const mobile = await run({
  label: "mobile Pixel7 4x",
  viewport: { width: 390, height: 844 },
  cpuRate: 4,
  device: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
});
console.log(JSON.stringify(mobile));
console.log("DONE");
