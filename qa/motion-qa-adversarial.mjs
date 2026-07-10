// ============================================================================
// QA de Motion ADVERSARIAL — XIA-72 (gate C→D · LP Xbarber Flagship)
// ----------------------------------------------------------------------------
// Chromium real (Playwright). Para CADA célula da matriz (A/B/C):
//   - grava VÍDEO desde o 1º frame + frames p000/p025/p050/p075/p100
//   - FPS p95 sob scroll real via page.mouse.wheel (passa pelo Lenis)
//   - LCP/CLS/INP medidos via PerformanceObserver (INP = pior interação real)
//   - trace de performance (screenshots)
// Passe REDUCE (obrigatório) + variante ?reduced=1.
// Bateria de sabotagem (5 ataques). Sem web-vitals no repo → vitals via PO nativo.
//
// Uso: QA_URL=http://localhost:3137 QA_OUT=/tmp/xiax-qa72 node qa/motion-qa-adversarial.mjs
// ============================================================================
import { chromium, devices } from "playwright";
import fs from "node:fs";

const URL = process.env.QA_URL || "http://localhost:3137";
const OUT = process.env.QA_OUT || "/tmp/xiax-qa72";
fs.mkdirSync(OUT, { recursive: true });

// --- Instrumentação injetada ANTES da navegação (mede o que o Chrome reporta) --
const VITALS_INIT = () => {
  window.__vitals = { LCP: 0, CLS: 0, INP: 0 };
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) window.__vitals.LCP = e.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries())
        if (!e.hadRecentInput) window.__vitals.CLS += e.value;
    }).observe({ type: "layout-shift", buffered: true });
    // INP ≈ pior latência de interação (event timing). first-input cobre o 1º toque.
    new PerformanceObserver((l) => {
      for (const e of l.getEntries())
        if (e.interactionId) window.__vitals.INP = Math.max(window.__vitals.INP, e.duration);
    }).observe({ type: "event", durationThreshold: 16, buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries())
        window.__vitals.INP = Math.max(window.__vitals.INP, e.processingEnd - e.startTime);
    }).observe({ type: "first-input", buffered: true });
  } catch (err) {
    window.__vitalsErr = String(err);
  }
};

const FRAME_PROBE = () => {
  window.__frameDeltas = [];
  let last = performance.now();
  const tick = (now) => {
    window.__frameDeltas.push(now - last);
    last = now;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

async function measureCell({ tag, viewport, cpuRate, deviceOpts = {}, reducedMotion = "no-preference" }) {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport,
    reducedMotion,
    recordVideo: { dir: `${OUT}/video`, size: viewport },
    ...deviceOpts,
  });
  const page = await context.newPage();
  await page.addInitScript(VITALS_INIT);
  await page.addInitScript(FRAME_PROBE);

  const cdp = await context.newCDPSession(page);
  if (cpuRate && cpuRate > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: cpuRate });
  const tracePath = `${OUT}/${tag}-trace.json`;
  await browser.startTracing(page, { path: tracePath, screenshots: true });

  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(800); // deixa o hero timeline abrir

  const scrollH = await page.evaluate(
    () => document.documentElement.scrollHeight - window.innerHeight,
  );
  fs.mkdirSync(`${OUT}/frames`, { recursive: true });
  await page.screenshot({ path: `${OUT}/frames/${tag}-p000.png` });

  // scroll REAL via wheel (passa pelo Lenis) — 60 passos, marcos a cada 15
  const steps = 60;
  const perStep = Math.max(120, Math.round((scrollH / steps) * 1.05));
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, perStep);
    await page.waitForTimeout(70);
    if ((i + 1) % 15 === 0) {
      const pct = String(((i + 1) / 15) * 25).padStart(3, "0");
      await page.screenshot({ path: `${OUT}/frames/${tag}-p${pct}.png` });
    }
  }

  // interação REAL → INP existe. Foca âncora de planos e navega por teclado.
  try {
    const link = page.locator('a[href="#planos"], a[href="#precos"]').first();
    if (await link.count()) await link.click({ timeout: 2000 }).catch(() => {});
  } catch {}
  await page.keyboard.press("Tab").catch(() => {});
  await page.keyboard.press("Enter").catch(() => {});
  await page.waitForTimeout(500);

  const fpsP95 = await page.evaluate(() => {
    const d = [...window.__frameDeltas].filter((x) => x > 0).sort((a, b) => a - b);
    if (!d.length) return null;
    const worst = d[Math.floor(d.length * 0.95)]; // pior 5% (delta grande = fps baixo)
    return Math.round(1000 / worst);
  });
  const fpsMedian = await page.evaluate(() => {
    const d = [...window.__frameDeltas].filter((x) => x > 0).sort((a, b) => a - b);
    if (!d.length) return null;
    return Math.round(1000 / d[Math.floor(d.length * 0.5)]);
  });

  const vitals = await page.evaluate(() => window.__vitals);
  const diag = await page.evaluate(() => ({
    reducedMatches: matchMedia("(prefers-reduced-motion: reduce)").matches,
    gsapLive: document.documentElement.classList.contains("gsap-live"),
    canvases: document.querySelectorAll("canvas").length,
    markers: document.querySelectorAll('[class*="gsap-marker"]').length,
    pinSpacers: document.querySelectorAll(".pin-spacer").length,
    heroH1: document.querySelector("h1")?.innerText?.slice(0, 60) || "",
    invisibleReveals: Array.from(document.querySelectorAll(".reveal, .reveal-item"))
      .filter((el) => getComputedStyle(el).opacity === "0" || getComputedStyle(el).visibility === "hidden").length,
  }));

  await browser.stopTracing();
  await page.waitForTimeout(300);
  await context.close();

  // renomeia o vídeo
  let video = null;
  const vids = fs.readdirSync(`${OUT}/video`).filter((f) => f.endsWith(".webm"));
  const latest = vids
    .map((f) => `${OUT}/video/${f}`)
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
  if (latest) {
    video = `${OUT}/${tag}.webm`;
    fs.renameSync(latest, video);
  }
  await browser.close();

  const traceKB = fs.existsSync(tracePath) ? Math.round(fs.statSync(tracePath).size / 1024) : 0;
  return {
    tag,
    viewport,
    cpuRate: cpuRate || 1,
    fpsP95,
    fpsMedian,
    LCP: Math.round(vitals.LCP),
    CLS: Number((vitals.CLS || 0).toFixed(4)),
    INP: Math.round(vitals.INP || 0),
    diag,
    video,
    trace: `${tracePath} (${traceKB}KB)`,
  };
}

// ---------------------------------------------------------------- matriz A/B/C
const results = {};
console.log("=== CÉLULA A — desktop 1440×900 CPU 1x (referência) ===");
results.A = await measureCell({ tag: "A-desktop-1x", viewport: { width: 1440, height: 900 }, cpuRate: 1 });
console.log(JSON.stringify(results.A, null, 2));

console.log("=== CÉLULA B — desktop 1440×900 CPU 4x (laptop mediano) ===");
results.B = await measureCell({ tag: "B-desktop-4x", viewport: { width: 1440, height: 900 }, cpuRate: 4 });
console.log(JSON.stringify(results.B, null, 2));

console.log("=== CÉLULA C — mobile 390×844 DPR3 touch CPU 4x ===");
results.C = await measureCell({
  tag: "C-mobile-4x",
  viewport: { width: 390, height: 844 },
  cpuRate: 4,
  deviceOpts: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 },
});
console.log(JSON.stringify(results.C, null, 2));

// ------------------------------------------------------------------ reduce pass
console.log("=== REDUCE — OS gate (reducedMotion: reduce) ===");
results.reduceOS = await measureCell({
  tag: "reduce-os",
  viewport: { width: 1440, height: 900 },
  cpuRate: 1,
  reducedMotion: "reduce",
});
console.log(JSON.stringify(results.reduceOS, null, 2));

fs.writeFileSync(`${OUT}/results.json`, JSON.stringify(results, null, 2));
console.log("\nARTIFACTS_DIR", OUT);
console.log("DONE");
