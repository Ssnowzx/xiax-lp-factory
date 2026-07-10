// Analisa um trace do Chrome (Playwright startTracing) e conta eventos de custo
// de renderização. Gate: coreografia deve ser transform/opacity/clip-path →
// esperamos Layout/Recalc BAIXOS no steady-state; Paint/Composite dominam.
import fs from "node:fs";

const path = process.argv[2];
const raw = JSON.parse(fs.readFileSync(path, "utf8"));
const events = Array.isArray(raw) ? raw : raw.traceEvents || [];

const counts = {};
let forcedLayouts = 0; // Layout com stackTrace = reflow síncrono forçado (red flag)
let layoutDurTotal = 0;
let recalcDurTotal = 0;
for (const e of events) {
  if (e.ph !== "X" && e.ph !== "B" && e.ph !== "I") continue;
  const n = e.name;
  if (!n) continue;
  if (["Layout", "UpdateLayoutTree", "Paint", "PrePaint", "Composite Layers", "UpdateLayer", "UpdateLayerTree", "ScrollLayer", "HitTest", "RecalculateStyles"].includes(n)) {
    counts[n] = (counts[n] || 0) + 1;
    if (n === "Layout") {
      layoutDurTotal += e.dur || 0;
      if (e.args && e.args.beginData && e.args.beginData.stackTrace) forcedLayouts++;
    }
    if (n === "UpdateLayoutTree" || n === "RecalculateStyles") recalcDurTotal += e.dur || 0;
  }
}
// LongTask / tarefas > 50ms
const longTasks = events.filter((e) => e.name === "RunTask" && (e.dur || 0) > 50000).length;

console.log(JSON.stringify({
  file: path.split("/").pop(),
  totalEvents: events.length,
  counts,
  forcedSyncLayouts: forcedLayouts,
  layoutMsTotal: Math.round(layoutDurTotal / 1000),
  recalcMsTotal: Math.round(recalcDurTotal / 1000),
  longTasks_gt50ms: longTasks,
}, null, 2));
