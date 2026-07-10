// XIA-85 R2 — PROVA do hero pós-adiamento de init (useAfterPaint).
// A coreografia monta PÓS-PAINT; o sub-headline (<p> = LCP, SEM classe .reveal)
// pinta em opacidade cheia e só então o heroTimeline roda `fromTo(sub,{autoAlpha:0})`
// (immediateRender:true). RISCO = flash: visível → 0 → reveal.
//
// Prova empírica: sampler rAF injetado ANTES da navegação lê a opacidade computada
// de h1/sub/checks/mockup em TODO frame desde o 1º paint. Detecta a assinatura
// "pintou visível → sumiu → reapareceu" e MEDE a janela visível-antes-de-sumir.
// Roda em CPU 1x e 4x (throttle ALONGA a janela = pior caso). Vídeo por célula.
import { chromium } from "playwright";
import fs from "node:fs";

const URL = process.env.QA_URL || "http://localhost:3185";
const OUT = process.env.QA_OUT || "qa/artifacts/xia85";
fs.mkdirSync(`${OUT}/video`, { recursive: true });
fs.mkdirSync(`${OUT}/frames`, { recursive: true });

async function cell({ cpuRate, label }) {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "no-preference",
    recordVideo: { dir: `${OUT}/video`, size: { width: 1440, height: 900 } },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  if (cpuRate > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: cpuRate });

  // vitals + sampler rAF: liga no 1º frame possível, lê opacidade computada por frame.
  await page.addInitScript(() => {
    window.__lcp = 0; window.__cls = 0; window.__lcpEl = "";
    try {
      new PerformanceObserver((l) => { for (const e of l.getEntries()) { window.__lcp = e.startTime; window.__lcpEl = (e.element && (e.element.tagName + "." + (e.element.className||"").split(" ")[0])) || window.__lcpEl; } }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true });
    } catch {}
    window.__samples = [];
    const t0 = performance.now();
    const op = (el) => el ? Number(getComputedStyle(el).opacity) : null;
    const tick = () => {
      const hero = document.querySelector("#hero");
      if (hero) {
        const sub = hero.querySelector("p");
        const h1 = hero.querySelector("h1");
        const chk = hero.querySelector(".reveal-item");
        const mock = hero.querySelector(".reveal");
        window.__samples.push({
          t: Math.round(performance.now() - t0),
          gsapLive: document.documentElement.classList.contains("gsap-live"),
          sub: op(sub), h1: op(h1), chk: op(chk), mock: op(mock),
        });
      }
      if (performance.now() - t0 < 3500) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  await page.goto(URL, { waitUntil: "commit" });
  // burst de screenshots na janela de mount (visual complementar ao sampler)
  for (const ms of [0, 60, 120, 200, 320, 500, 800, 1400]) {
    await page.waitForTimeout(ms === 0 ? 0 : ms - (ms === 60 ? 0 : 0));
  }
  // deixa a timeline do hero completar e o sampler encerrar
  await page.waitForTimeout(3600);

  const samples = await page.evaluate(() => window.__samples);
  const diag = await page.evaluate(() => ({
    lcp: Math.round(window.__lcp), lcpEl: window.__lcpEl,
    cls: Number((window.__cls || 0).toFixed(4)),
    gsapLive: document.documentElement.classList.contains("gsap-live"),
    subFinal: Number(getComputedStyle(document.querySelector("#hero p")).opacity),
    h1Final: Number(getComputedStyle(document.querySelector("#hero h1")).opacity),
  }));

  // ANÁLISE do flash: a partir das amostras do sub.
  // "pintou" = atingiu >=0.9 antes de gsapLive; "sumiu" = caiu <=0.05 depois de pintar.
  let paintedT = null, droppedT = null, firstGsapLiveT = null;
  let peakBeforeLive = 0;
  for (const s of samples) {
    if (s.gsapLive && firstGsapLiveT === null) firstGsapLiveT = s.t;
    if (firstGsapLiveT === null && s.sub != null) peakBeforeLive = Math.max(peakBeforeLive, s.sub);
    if (s.sub != null && s.sub >= 0.9 && paintedT === null) paintedT = s.t;
    if (paintedT !== null && droppedT === null && s.sub != null && s.sub <= 0.05) droppedT = s.t;
  }
  // janela em que o sub ficou VISÍVEL (>=0.9) antes de cair a <=0.05
  const flashWindowMs = paintedT !== null && droppedT !== null ? droppedT - paintedT : 0;
  const flashDetected = paintedT !== null && droppedT !== null && droppedT > paintedT;

  await context.close();
  const vids = fs.readdirSync(`${OUT}/video`).filter((f) => f.endsWith(".webm"));
  const latest = vids.map((f) => `${OUT}/video/${f}`).sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
  if (latest) fs.renameSync(latest, `${OUT}/video/hero-${label}.webm`);
  await browser.close();

  const res = { label, cpuRate, ...diag, peakSubBeforeGsapLive: Number(peakBeforeLive.toFixed(3)), firstGsapLiveT, paintedT, droppedT, flashWindowMs, flashDetected, sampleCount: samples.length };
  fs.writeFileSync(`${OUT}/hero-samples-${label}.json`, JSON.stringify({ res, samples }, null, 2));
  return res;
}

const A = await cell({ cpuRate: 1, label: "cpu1x" });
console.log("A (1x):", JSON.stringify(A));
const B = await cell({ cpuRate: 4, label: "cpu4x" });
console.log("B (4x):", JSON.stringify(B));
console.log("DONE");
