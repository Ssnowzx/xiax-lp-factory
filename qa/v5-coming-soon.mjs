// "Em breve" badges on the salon page (change xiax-lp-v5-salon · design D4 · task 9.2): every
// place that names a salon feature (`[data-feature]`) carries the registry's state; each `coming`
// one must show a visible "Em breve" badge inside it, and no `available` one may. Also checks that
// the page names every feature still being built at least once. Exits 1 on any failure.
//
//   QA_URL=http://localhost:8811 node qa/v5-coming-soon.mjs
import { chromium } from "playwright";

import { URL, WIDTHS, eachFaqAnswer, openAt } from "./lib/page-walk.mjs";

/** Features being built (lib/content/salon-features.ts): each must appear on the page. */
const COMING = ["pauseTime", "multiProfessionalVisit", "roomsAndEquipment", "technicalRecord", "sessionPackages", "anamnesis", "commissionAndPartner", "salonCatalog"];

async function audit(page, selector = "[data-feature]") {
  return page.$$eval(selector, (nodes) =>
    nodes.map((node) => {
      const badge = node.querySelector("[data-coming-soon]");
      const box = badge?.getBoundingClientRect();
      const style = badge && getComputedStyle(badge);
      const visible = Boolean(box && box.width > 0 && box.height > 0 && style.visibility !== "hidden" && Number(style.opacity) > 0);
      return { id: node.dataset.feature, status: node.dataset.featureStatus, badge: Boolean(badge), visible, where: node.closest("section")?.id ?? "?" };
    }),
  );
}

const browser = await chromium.launch({ channel: "chrome" });
let failures = 0;
for (const width of WIDTHS) {
  const { context, page } = await openAt(browser, "/salao", width, { reducedMotion: "reduce" });
  const mentions = await audit(page, "[data-feature]:not(#faq *)");
  // FAQ answers mount only while open: audit each one open
  await eachFaqAnswer(page, async () => mentions.push(...(await audit(page, "#faq [data-feature]"))));
  const wrong = mentions.filter((m) => (m.status === "coming" ? !m.visible : m.badge));
  const missing = COMING.filter((id) => !mentions.some((m) => m.id === id));
  failures += wrong.length + missing.length;
  process.stdout.write(`${wrong.length || missing.length ? "FAIL" : "PASS"} ${width}px · ${mentions.length} menções, ${mentions.filter((m) => m.status === "coming").length} em construção\n`);
  for (const m of wrong) process.stdout.write(`  ${m.id} (${m.status}) em #${m.where}: selo ${m.badge ? "invisível" : "ausente"}${m.status === "available" ? " — não devia ter selo" : ""}\n`);
  for (const id of missing) process.stdout.write(`  ${id}: não aparece na página (${URL}/salao)\n`);
  await context.close();
}
await browser.close();
process.exit(failures ? 1 : 0);
