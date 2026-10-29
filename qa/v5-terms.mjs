// Forbidden words per page (change xiax-lp-v5-salon · task 9.1): everything a visitor, a search
// engine or a WhatsApp chat can read — the page text (each FAQ answer opened in turn), image alts,
// the head (title, description, social cards), the JSON-LD and the pre-typed WhatsApp messages —
// is scanned for the other vertical's words and for promises the product does not make
// (xiax-lp-v4-xchair honesty rule). Prints every hit with its context; exits 1 on any.
//
//   QA_URL=http://localhost:8811 node qa/v5-terms.mjs
import { chromium } from "playwright";

import { URL, eachFaqAnswer } from "./lib/page-walk.mjs";

/** Promises no page makes: no free trial, no "zero faltas", no absolute "never again". */
const PROMISES = /teste grátis|14 dias|sem cartão|zero falta|nunca mais/i;

const PAGES = [
  // The barbershop page never talks to salons.
  { path: "/", forbidden: [PROMISES, /sal[aã]o/i] },
  // The salon page has no barbershop words and no testimonials (there are none yet).
  { path: "/salao", forbidden: [PROMISES, /barbear|barbeir|\bbarbas?\b|navalha|depoimento/i] },
];

/** Every readable string of the page, labelled by where it comes from. */
async function readable(page) {
  return page.evaluate(() => {
    const out = [];
    const push = (where, text) => text && out.push({ where, text: text.replace(/\s+/g, " ").trim() });
    // text nodes only: the framework's own <script> payload repeats the page and is not read
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => (node.parentElement?.closest("script, style, noscript, template") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    const texts = [];
    while (walker.nextNode()) texts.push(walker.currentNode.textContent);
    push("texto", texts.join(""));
    document.querySelectorAll("img[alt]").forEach((img) => push("alt", img.getAttribute("alt")));
    push("title", document.title);
    document.querySelectorAll("meta[name], meta[property]").forEach((meta) => push(`meta ${meta.getAttribute("name") ?? meta.getAttribute("property")}`, meta.getAttribute("content")));
    document.querySelectorAll("script[type='application/ld+json']").forEach((s) => push("json-ld", s.textContent));
    document.querySelectorAll("a[href*='wa.me']").forEach((a) => push("whatsapp", decodeURIComponent(new URL(a.href).searchParams.get("text") ?? "")));
    return out;
  });
}

/** The forbidden matches in one string, each with a little context around it. */
function hits(text, pattern) {
  const global = new RegExp(pattern.source, `${pattern.flags.replace("g", "")}g`);
  return [...text.matchAll(global)].map((m) => text.slice(Math.max(0, m.index - 40), m.index + m[0].length + 40));
}

const browser = await chromium.launch({ channel: "chrome" });
let failures = 0;
for (const { path, forbidden } of PAGES) {
  const page = await browser.newPage();
  await page.goto(`${URL}${path}`, { waitUntil: "networkidle" });
  const strings = await readable(page);
  await eachFaqAnswer(page, async (i) => {
    const answer = await page.locator("#faq [role='region'][data-state='open']").first().textContent();
    strings.push({ where: `faq ${i + 1}`, text: answer ?? "" });
  });
  const found = strings.flatMap(({ where, text }) => forbidden.flatMap((pattern) => hits(text, pattern).map((context) => ({ where, context }))));
  failures += found.length;
  process.stdout.write(`${found.length ? "FAIL" : "PASS"} ${path} · ${found.length} ocorrência(s)\n`);
  for (const { where, context } of found) process.stdout.write(`  [${where}] …${context}…\n`);
  await page.close();
}
await browser.close();
process.exit(failures ? 1 : 0);
