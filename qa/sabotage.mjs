// Bateria de sabotagem + no-JS + libs bloqueadas + ?reduced=1 (flag explícita).
// Cada cenário retorna PASS/FAIL com o critério de recuperação.
import { chromium } from "playwright";
import fs from "node:fs";
const URL = process.env.QA_URL || "http://localhost:3151";
const OUT = process.env.QA_OUT || "/tmp/xiax-qa72";
fs.mkdirSync(`${OUT}/sabotage`, { recursive: true });

const heroVisible = (page) =>
  page.evaluate(() => {
    const h1 = document.querySelector("h1");
    if (!h1) return { ok: false, why: "sem h1" };
    const r = h1.getBoundingClientRect();
    const cs = getComputedStyle(h1);
    return {
      ok: r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && parseFloat(cs.opacity) > 0.5,
      text: h1.innerText.slice(0, 40),
      opacity: cs.opacity,
    };
  });

// contagem de reveals visíveis no viewport que ficaram opacity:0 (conteúdo preso)
const stuckInView = (page) =>
  page.evaluate(() =>
    Array.from(document.querySelectorAll(".reveal, .reveal-item, #depoimentos li, h2, h3, p")).filter((el) => {
      const r = el.getBoundingClientRect();
      const inView = r.top < innerHeight && r.bottom > 0 && r.height > 0;
      return inView && parseFloat(getComputedStyle(el).opacity) === 0;
    }).length,
  );

const out = {};

// ---- 1. No-JS puro (SSR) ---------------------------------------------------
{
  const b = await chromium.launch();
  const ctx = await b.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(URL, { waitUntil: "load" });
  const hero = await heroVisible(p);
  const stuck = await stuckInView(p);
  await p.screenshot({ path: `${OUT}/sabotage/no-js.png`, fullPage: false });
  out.noJS = { hero, stuckInView: stuck, verdict: hero.ok && stuck === 0 ? "PASS" : "FAIL" };
  await ctx.close(); await b.close();
}

// ---- 2. Libs de motion bloqueadas (gsap/lenis abortados) -------------------
{
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.route(/.*\.(js)(\?.*)?$/, (route) => {
    const u = route.request().url();
    if (/gsap|lenis|ScrollTrigger/i.test(u)) return route.abort();
    return route.continue();
  });
  await p.goto(URL, { waitUntil: "domcontentloaded" }).catch(() => {});
  await p.waitForTimeout(1500);
  const hero = await heroVisible(p);
  const cls = await p.evaluate(() => ({
    gsapLive: document.documentElement.classList.contains("gsap-live"),
    animReady: document.documentElement.classList.contains("anim-ready"),
  }));
  const stuck = await stuckInView(p);
  await p.screenshot({ path: `${OUT}/sabotage/libs-blocked.png` });
  out.libsBlocked = { hero, cls, stuckInView: stuck, verdict: hero.ok ? "PASS" : "FAIL" };
  await ctx.close(); await b.close();
}

// ---- 3. ?reduced=1 flag explícita ------------------------------------------
{
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, recordVideo: { dir: `${OUT}/sabotage/video`, size: { width: 1440, height: 900 } } });
  const p = await ctx.newPage();
  await p.goto(`${URL}/?reduced=1`, { waitUntil: "networkidle" });
  await p.waitForTimeout(800);
  // rola tudo e confere estado estático final
  await p.evaluate(async () => { window.scrollTo(0, document.body.scrollHeight); await new Promise(r=>setTimeout(r,800)); window.scrollTo(0,0); await new Promise(r=>setTimeout(r,400)); });
  const hero = await heroVisible(p);
  const stuck = await stuckInView(p);
  const gsapLive = await p.evaluate(() => document.documentElement.classList.contains("gsap-live"));
  out.reducedFlag = { hero, stuckInView: stuck, gsapLive, verdict: hero.ok && stuck === 0 ? "PASS" : "FAIL" };
  await ctx.close(); await b.close();
}

// ---- 4. Scroll violento PRÉ-HIDRATAÇÃO -------------------------------------
{
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(URL, { waitUntil: "commit" }).catch(() => {});
  for (let i = 0; i < 10; i++) { await p.mouse.wheel(0, 2000); }
  await p.waitForTimeout(2500); // deixa hidratar e assentar
  await p.evaluate(async () => { window.scrollTo(0, document.body.scrollHeight); await new Promise(r=>setTimeout(r,600)); });
  const stuckBottom = await stuckInView(p);
  await p.evaluate(async () => { window.scrollTo(0, 0); await new Promise(r=>setTimeout(r,600)); });
  const hero = await heroVisible(p);
  const stuckTop = await stuckInView(p);
  await p.screenshot({ path: `${OUT}/sabotage/pre-hydration.png` });
  out.preHydrationScroll = { hero, stuckAtBottom: stuckBottom, stuckAtTop: stuckTop, verdict: hero.ok && stuckBottom === 0 && stuckTop === 0 ? "PASS" : "FAIL" };
  await ctx.close(); await b.close();
}

// ---- 5. Resize mid-scroll (remede reveals/parallax) ------------------------
{
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(URL, { waitUntil: "networkidle" });
  await p.evaluate(async () => { window.scrollTo(0, document.body.scrollHeight * 0.5); await new Promise(r=>setTimeout(r,500)); });
  await p.setViewportSize({ width: 768, height: 900 });
  await p.waitForTimeout(400);
  await p.setViewportSize({ width: 1680, height: 900 });
  await p.waitForTimeout(600);
  const stuck = await stuckInView(p);
  const overlap = await p.evaluate(() => document.querySelectorAll(".pin-spacer").length); // sem pins → 0 esperado
  await p.screenshot({ path: `${OUT}/sabotage/resize.png` });
  out.resizeMidScroll = { stuckInView: stuck, pinSpacers: overlap, verdict: stuck === 0 ? "PASS" : "FAIL" };
  await ctx.close(); await b.close();
}

// ---- 6. Background tab e volta (loop pulse) --------------------------------
{
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(URL, { waitUntil: "networkidle" });
  await p.evaluate(async () => { window.scrollTo(0, document.body.scrollHeight * 0.35); await new Promise(r=>setTimeout(r,400)); });
  const p2 = await ctx.newPage();
  await p2.goto("about:blank");
  await p2.bringToFront();
  await p.waitForTimeout(6000);
  await p.bringToFront();
  await p.waitForTimeout(1000);
  const stuck = await stuckInView(p);
  const hero = await heroVisible(p);
  out.backgroundTab = { stuckInView: stuck, heroReachable: hero.text?.length > 0, verdict: stuck === 0 ? "PASS" : "FAIL" };
  await ctx.close(); await b.close();
}

// ---- 7. Refresh a ~50% -----------------------------------------------------
{
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(URL, { waitUntil: "networkidle" });
  await p.evaluate(async () => { window.scrollTo(0, document.body.scrollHeight * 0.5); await new Promise(r=>setTimeout(r,500)); });
  await p.reload({ waitUntil: "networkidle" });
  await p.waitForTimeout(1500);
  const stuck = await stuckInView(p);
  const scrollY = await p.evaluate(() => window.scrollY);
  await p.screenshot({ path: `${OUT}/sabotage/refresh-50.png` });
  out.refreshMidPage = { stuckInView: stuck, restoredScrollY: Math.round(scrollY), verdict: stuck === 0 ? "PASS" : "FAIL" };
  await ctx.close(); await b.close();
}

fs.writeFileSync(`${OUT}/sabotage.json`, JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
console.log("DONE");
