// Text baseline for the v5 refactor (change xiax-lp-v5-salon · design D2 · task 1.1): moving the
// barbershop's copy out of the sections must not change one visible word. `record` saves what a
// visitor reads at 390 and 1440 px — visible text per block, image alts, links and the <head>
// tags — with every animation settled; `compare` reads it again and prints each difference.
// Exits 1 on any difference.
//
//   QA_URL=http://localhost:8811 node qa/v5-text-baseline.mjs record [/path]
//   QA_URL=http://localhost:8811 node qa/v5-text-baseline.mjs compare [/path]
import { chromium } from "playwright";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { WIDTHS, openAt, slugOf, walkDown } from "./lib/page-walk.mjs";

const [mode, pagePath = "/"] = process.argv.slice(2);
const BASELINE = path.join(path.dirname(new URL(import.meta.url).pathname), "baselines", `text-${slugOf(pagePath)}.json`);

/** Everything a visitor (or a crawler) reads, in the browser, after the page has settled. */
function readPage() {
  const lines = (text) =>
    text
      .split("\n")
      .map((line) => line.replace(/\s+/g, " ").trim())
      .filter(Boolean);
  // Keyed by id, else by tag and its count among blocks without an id, so a wrapper added
  // around the sections does not rename every block.
  const seen = {};
  const keyOf = (el) => {
    if (el.id) return `#${el.id}`;
    const tag = el.tagName.toLowerCase();
    seen[tag] = (seen[tag] ?? 0) + 1;
    return seen[tag] > 1 ? `${tag}[${seen[tag]}]` : tag;
  };
  const blocks = {};
  const roots = [...document.body.children].flatMap((el) => (el.tagName === "MAIN" ? [...el.children] : [el]));
  for (const el of roots) {
    if (["SCRIPT", "STYLE", "NEXT-ROUTE-ANNOUNCER"].includes(el.tagName)) continue;
    const text = lines(el.innerText ?? "");
    if (text.length) blocks[keyOf(el)] = text;
  }
  const alts = [...document.querySelectorAll("img[alt], [role='img'][aria-label]")].map(
    (el) => el.getAttribute("alt") ?? `[role=img] ${el.getAttribute("aria-label")}`,
  );
  const links = [...document.querySelectorAll("a[href]")].map((a) => {
    const target = a.getAttribute("target") ? ` (${a.getAttribute("target")})` : "";
    return `${lines(a.innerText).join(" ") || a.getAttribute("aria-label") || "(sem texto)"} → ${a.getAttribute("href")}${target}`;
  });
  // Next names a metadata image by its route group and content hash (/opengraph-image-<hash>?<hash>);
  // the address is kept without them, so moving the image into a group is not a change.
  const metaImage = (value) => (value ? value.replace(/\/opengraph-image(?:-\w+)?(?:\?\w+)?/, "/opengraph-image") : value);
  const meta = [...document.head.querySelectorAll("title, meta[name], meta[property], link[rel='canonical']")].map((el) =>
    el.tagName === "TITLE"
      ? `title: ${el.textContent}`
      : el.tagName === "LINK"
        ? `canonical: ${el.getAttribute("href")}`
        : `${el.getAttribute("name") ?? el.getAttribute("property")}: ${metaImage(el.getAttribute("content"))}`,
  );
  const jsonLd = [...document.querySelectorAll("script[type='application/ld+json']")].map((el) => el.textContent);
  return { blocks, alts, links, head: { meta, jsonLd } };
}

async function capture(browser) {
  const result = {};
  for (const width of WIDTHS) {
    const { context, page } = await openAt(browser, pagePath, width);
    await walkDown(page);
    result[width] = await page.evaluate(readPage);
    await context.close();
  }
  return result;
}

/** Line diff (longest common subsequence): "- " was in the baseline, "+ " is new. */
function diffLines(before, after) {
  const table = Array.from({ length: before.length + 1 }, () => new Array(after.length + 1).fill(0));
  for (let i = before.length - 1; i >= 0; i -= 1)
    for (let j = after.length - 1; j >= 0; j -= 1)
      table[i][j] = before[i] === after[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
  const out = [];
  let [i, j] = [0, 0];
  while (i < before.length || j < after.length) {
    if (i < before.length && j < after.length && before[i] === after[j]) [i, j] = [i + 1, j + 1];
    else if (j < after.length && (i === before.length || table[i][j + 1] >= table[i + 1][j])) out.push(`+ ${after[j++]}`);
    else out.push(`- ${before[i++]}`);
  }
  return out;
}

/** Flattens one width's capture into named lists of lines, so every part diffs the same way. */
function partsOf(capture) {
  const parts = {};
  for (const [key, text] of Object.entries(capture.blocks)) parts[`texto ${key}`] = text;
  parts.alts = capture.alts;
  parts.links = capture.links;
  parts["head meta"] = capture.head.meta;
  parts["head json-ld"] = capture.head.jsonLd;
  return parts;
}

function compare(baseline, current) {
  let differences = 0;
  for (const width of WIDTHS) {
    const [before, after] = [partsOf(baseline[width]), partsOf(current[width])];
    for (const name of new Set([...Object.keys(before), ...Object.keys(after)])) {
      const diff = diffLines(before[name] ?? [], after[name] ?? []);
      if (!diff.length) continue;
      differences += diff.length;
      process.stdout.write(`\n[${width}px] ${name}\n${diff.map((line) => `  ${line}`).join("\n")}\n`);
    }
  }
  return differences;
}

if (!["record", "compare"].includes(mode)) {
  process.stderr.write("uso: node qa/v5-text-baseline.mjs record|compare [/caminho]\n");
  process.exit(2);
}
const browser = await chromium.launch({ channel: "chrome" });
const current = await capture(browser);
await browser.close();
if (mode === "record") {
  await mkdir(path.dirname(BASELINE), { recursive: true });
  await writeFile(BASELINE, `${JSON.stringify(current, null, 2)}\n`);
  const counts = WIDTHS.map((w) => `${w}px: ${Object.keys(current[w].blocks).length} blocos, ${current[w].alts.length} alts, ${current[w].links.length} links`);
  process.stdout.write(`gravado ${path.relative(process.cwd(), BASELINE)} · ${counts.join(" · ")}\n`);
} else {
  const differences = compare(JSON.parse(await readFile(BASELINE, "utf8")), current);
  process.stdout.write(differences ? `\nFAIL ${differences} linha(s) diferente(s) de ${pagePath}\n` : `PASS texto de ${pagePath} igual à linha de base\n`);
  process.exit(differences ? 1 : 0);
}
