// Motion QA harness (spec do cliente): Chromium real, reducedMotion:'no-preference',
// grava vídeo + captura frames em 0/0.25/0.5/0.75/1 do scroll, mede LCP/CLS.
// Segundo passe: reducedMotion:'reduce' só para validar o fallback (conteúdo visível).
import { chromium } from "playwright";
import fs from "node:fs";

const URL = process.env.QA_URL || "http://localhost:3100";
const OUT = process.env.QA_OUT || "/tmp/xiax-qa";
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(`${OUT}/video`, { recursive: true });

const VIEWPORT = { width: 1440, height: 900 };

async function slowScrollTo(page, targetY) {
  await page.evaluate(async (y) => {
    const start = window.scrollY;
    const steps = 30;
    for (let i = 1; i <= steps; i++) {
      window.scrollTo(0, start + ((y - start) * i) / steps);
      await new Promise((r) => setTimeout(r, 16));
    }
  }, targetY);
}

async function run(reducedMotion, tag) {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    reducedMotion,
    recordVideo: { dir: `${OUT}/video`, size: VIEWPORT },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  // instrumentação de perf (LCP + CLS)
  await page.addInitScript(() => {
    window.__lcp = 0;
    window.__cls = 0;
    try {
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) window.__lcp = e.startTime;
      }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
      }).observe({ type: "layout-shift", buffered: true });
    } catch {}
  });

  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);

  const scrollH = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);

  const frames = [0, 0.25, 0.5, 0.75, 1];
  for (const p of frames) {
    await slowScrollTo(page, Math.round(scrollH * p));
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/${tag}_p${String(p).replace(".", "")}.png` });
  }

  // diagnóstico: canvas presente? pin ativo? texto real no DOM?
  const diag = await page.evaluate(() => ({
    reducedMotionMatches: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    animReady: document.documentElement.classList.contains("anim-ready"),
    canvases: document.querySelectorAll("canvas").length,
    heroH1Text: document.querySelector("h1")?.innerText?.slice(0, 80) || "",
    pinSpacer: document.querySelectorAll(".pin-spacer").length,
    lcp: Math.round(window.__lcp),
    cls: Number((window.__cls || 0).toFixed(4)),
  }));

  await page.waitForTimeout(400);
  await context.close();
  const vids = fs.readdirSync(`${OUT}/video`).filter((f) => f.endsWith(".webm"));
  const latest = vids.map((f) => `${OUT}/video/${f}`).sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
  if (latest) fs.renameSync(latest, `${OUT}/${tag}.webm`);
  await browser.close();
  return diag;
}

const motion = await run("no-preference", "motion");
console.log("MOTION (no-preference):", JSON.stringify(motion, null, 2));
const reduced = await run("reduce", "reduced");
console.log("REDUCED (reduce):", JSON.stringify(reduced, null, 2));
console.log("ARTIFACTS_DIR", OUT);
