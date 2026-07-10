// FPS p95 LIMPO — sem screenshots nem round-trips por frame.
// O scroll é dirigido DENTRO da página (dispatch de WheelEvent → Lenis) no mesmo
// rAF que coleta os deltas. Assim o p95 reflete jank REAL da coreografia, não
// stalls de captura do harness. Roda por célula (CPU 1x/4x, desktop/mobile).
import { chromium, devices } from "playwright";

const URL = process.env.QA_URL || "http://localhost:3151";

async function cell({ viewport, cpuRate, deviceOpts = {}, reducedMotion = "no-preference", label }) {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport, reducedMotion, ...deviceOpts });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  if (cpuRate > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: cpuRate });
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // scroll contínuo + probe rAF, TUDO dentro da página por ~5s de subida e descida
  const res = await page.evaluate(async () => {
    const deltas = [];
    let last = performance.now();
    let running = true;
    const tick = (now) => {
      deltas.push(now - last);
      last = now;
      if (running) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    const fire = (dy) =>
      window.dispatchEvent(new WheelEvent("wheel", { deltaY: dy, bubbles: true, cancelable: true }));
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    const maxY = document.documentElement.scrollHeight - window.innerHeight;
    // descida contínua ~4s
    const t0 = performance.now();
    while (performance.now() - t0 < 4000 && window.scrollY < maxY - 4) {
      fire(90);
      await sleep(16);
    }
    // subida contínua ~2s (estressa reverse dos toggleActions)
    const t1 = performance.now();
    while (performance.now() - t1 < 2000 && window.scrollY > 4) {
      fire(-140);
      await sleep(16);
    }
    running = false;
    await sleep(50);

    const clean = deltas.filter((d) => d > 1 && d < 1000).sort((a, b) => a - b);
    const q = (p) => clean[Math.min(clean.length - 1, Math.floor(clean.length * p))];
    const fps = (d) => Math.round(1000 / d);
    // conta frames "longos" (>1/55s ≈ 18.2ms) como proxy de jank
    const longFrames = clean.filter((d) => d > 18.2).length;
    return {
      frames: clean.length,
      fpsMedian: fps(q(0.5)),
      fpsP95: fps(q(0.95)), // pior 5% (delta grande)
      fpsP99: fps(q(0.99)),
      worstMs: Math.round(clean[clean.length - 1]),
      pctLongFrames: Number(((longFrames / clean.length) * 100).toFixed(1)),
      reachedBottom: window.scrollY,
      maxY,
    };
  });

  // após assentar, rola ao fundo absoluto e reconta reveals invisíveis
  await page.evaluate(async () => {
    window.scrollTo(0, document.documentElement.scrollHeight);
    await new Promise((r) => setTimeout(r, 1200));
  });
  const stuck = await page.evaluate(() =>
    Array.from(document.querySelectorAll(".reveal, .reveal-item, #depoimentos li")).filter((el) => {
      const r = el.getBoundingClientRect();
      const above = r.top < window.innerHeight && r.bottom > 0; // no viewport ou já passou
      return getComputedStyle(el).opacity === "0" && r.top < window.innerHeight;
    }).length,
  );

  await context.close();
  await browser.close();
  return { label, viewport, cpuRate, ...res, stuckRevealsInViewportAtBottom: stuck };
}

const A = await cell({ label: "A desktop 1x", viewport: { width: 1440, height: 900 }, cpuRate: 1 });
console.log(JSON.stringify(A));
const B = await cell({ label: "B desktop 4x", viewport: { width: 1440, height: 900 }, cpuRate: 4 });
console.log(JSON.stringify(B));
const C = await cell({
  label: "C mobile 4x",
  viewport: { width: 390, height: 844 },
  cpuRate: 4,
  deviceOpts: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 },
});
console.log(JSON.stringify(C));
console.log("DONE");
