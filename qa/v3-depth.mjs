// QA for the 2.5D depth cards (change xiax-lp-v3-cards-25d · task 9.1).
// Runs system Chrome (`channel: "chrome"`) against a production server and prints one
// PASS/FAIL line per check; exits 1 if any check fails. Gallery scroll frames go to QA_OUT.
//
//   NODE_ENV=production npm run build && npx next start -p 8811
//   QA_URL=http://localhost:8811 QA_OUT=/tmp/xiax-v3 node qa/v3-depth.mjs
import { chromium } from "playwright";
import fs from "node:fs";

import { checklist, trackCls } from "./lib/stage-harness.mjs";

const URL = process.env.QA_URL || "http://localhost:8811";
const OUT = process.env.QA_OUT || "/tmp/xiax-v3";
const VIEWPORT = { width: 1440, height: 900 };
const SETTLE_MS = 2500;
/** One depth card per surface that has them. */
const SURFACES = ["#hero", "#como-funciona", "#galeria", "#modelos", "#planos"];

const { check, finish } = checklist();

async function open(browser, reducedMotion) {
  const context = await browser.newContext({ viewport: VIEWPORT, reducedMotion, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.addInitScript(trackCls);
  await page.goto(URL, { waitUntil: "load" });
  await page.waitForTimeout(SETTLE_MS);
  return { context, page };
}

const IDENTITY = new Set(["none", "matrix(1, 0, 0, 1, 0, 0)", "matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)"]);

/** Hovers the top-right corner of the surface's first depth card; returns its stage transform. */
async function hoverStage(page, surface) {
  const card = page.locator(`${surface} [data-depth-card]`).first();
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  const box = await card.boundingBox();
  await page.mouse.move(box.x + box.width * 0.85, box.y + box.height * 0.2, { steps: 8 });
  await page.waitForTimeout(600);
  const transform = await card.locator("[data-depth-stage]").first().evaluate((el) => getComputedStyle(el).transform);
  await page.mouse.move(2, 2);
  return transform;
}

async function motionPass(browser) {
  const { context, page } = await open(browser, "no-preference");
  for (const surface of SURFACES) {
    const transform = await hoverStage(page, surface);
    check(`hover tilts the card in ${surface}`, !IDENTITY.has(transform), transform.slice(0, 48));
  }
  await galleryFrames(page);
  await slowScroll(page);
  const { cls, shifts } = await page.evaluate(() => ({ cls: window.__cls, shifts: window.__shifts }));
  check("CLS = 0 over load and a full scroll", cls === 0, `${cls.toFixed(4)} ${shifts.slice(0, 4).join(", ")}`);
  await context.close();
}

async function reducedPass(browser) {
  const { context, page } = await open(browser, "reduce");
  for (const surface of SURFACES) {
    const transform = await hoverStage(page, surface);
    check(`reduced motion keeps ${surface} flat`, IDENTITY.has(transform), transform.slice(0, 48));
  }
  await context.close();
}

async function slowScroll(page) {
  await page.evaluate(async () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    for (let y = 0; y <= max; y += 120) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 24));
    }
  });
  await page.waitForTimeout(800);
}

/** Gallery: 16:9 frames, layers that move with the scroll, and frames saved for review. */
async function galleryFrames(page) {
  const ratios = await page.$$eval("#galeria .media-frame", (els) => els.map((el) => el.clientWidth / el.clientHeight));
  check("gallery frames keep 16:9", ratios.length > 0 && ratios.every((r) => Math.abs(r - 16 / 9) < 0.01), ratios.map((r) => r.toFixed(3)).join(" "));

  const top = await page.$eval("#galeria", (el) => el.getBoundingClientRect().top + scrollY);
  const layerTransforms = [];
  for (const [i, offset] of [-600, 0, 600].entries()) {
    await page.evaluate((y) => window.scrollTo(0, y), top + offset);
    await page.waitForTimeout(1500);
    layerTransforms.push(await page.$eval("#galeria [data-gallery-layer]", (el) => getComputedStyle(el).transform));
    await page.screenshot({ path: `${OUT}/v3-gallery-${i}.png` });
  }
  check("gallery layers move with the scroll", new Set(layerTransforms).size === layerTransforms.length, layerTransforms.join(" | "));
}

async function noTestimonials(browser) {
  const { context, page } = await open(browser, "no-preference");
  const found = await page.evaluate(() => ({
    section: Boolean(document.getElementById("depoimentos")),
    links: document.querySelectorAll('a[href*="#depoimentos"]').length,
  }));
  check("no #depoimentos section or links", !found.section && found.links === 0, JSON.stringify(found));
  // Pricing is being redone: the page must not promise unlimited barbers or a fixed price.
  const claims = await page.evaluate(() => ({
    section: Boolean(document.getElementById("preco-fixo")),
    text: (document.body.innerText.match(/barbeiros? ilimitad\w*|pre[cç]o fixo|booksy|trinks/gi) ?? []).join(", "),
  }));
  check("no #preco-fixo nor unlimited / fixed-price claims", !claims.section && !claims.text, JSON.stringify(claims));
  await context.close();
}

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
try {
  await motionPass(browser);
  await reducedPass(browser);
  await noTestimonials(browser);
} finally {
  await browser.close();
}
finish();
