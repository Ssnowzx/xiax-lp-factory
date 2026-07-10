// lp-cost.mjs — Ledger de custo em $ por LP (XIA-50, gate da Onda 2).
//
// CONTEXTO: o control plane (adapter claude_local) JÁ instrumenta a captura de
// custo por run em `runs.usageJson` — { costUsd, inputTokens, outputTokens,
// billingType }, associado a runId + issueId + agentId. O que faltava era a
// AGREGAÇÃO por árvore de issues (parent + descendentes) → $ por LP. Este script
// é essa camada de agregação (não há endpoint nativo: /companies/{id}/usage,
// /issues/{id}/cost etc. retornam 404).
//
// MÉTODO: resolve a árvore a partir de uma issue raiz, coleta os runs de cada
// issue via GET /api/issues/{id}/runs, DEDUPLICA por runId (o endpoint devolve
// linhas sobrepostas — um mesmo run aparece atribuído a parent e child; somar
// sem dedup superestima ~50%) e soma usageJson.costUsd + tokens.
//
// NOTA DE PRECIFICAÇÃO: billingType="subscription_included" → o costUsd é o
// VALOR-EQUIVALENTE em rate-card da API (custo marginal / piso de precificação),
// não desembolso de caixa (a assinatura é flat). Para precificar uma LP ao
// cliente, este valor-equivalente é exatamente a base de custo correta.
//
// Uso:  node ops/lp-cost.mjs XIA-29
//       node ops/lp-cost.mjs XIA-29 --json
// Env:  PAPERCLIP_API_URL (ou PAPERCLIP_RUNTIME_API_URL), PAPERCLIP_API_KEY,
//       PAPERCLIP_COMPANY_ID.

const RAW_API = process.env.PAPERCLIP_API_URL || process.env.PAPERCLIP_RUNTIME_API_URL;
const API = (RAW_API || "").replace(/^http:/, "https:").replace(/\/$/, "");
const KEY = process.env.PAPERCLIP_API_KEY;
const COMPANY = process.env.PAPERCLIP_COMPANY_ID;

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const root = args.find((a) => !a.startsWith("--"));

if (!API || !KEY || !COMPANY) {
  console.error("Faltam env: PAPERCLIP_API_URL / PAPERCLIP_API_KEY / PAPERCLIP_COMPANY_ID");
  process.exit(2);
}
if (!root) {
  console.error("Uso: node ops/lp-cost.mjs <ISSUE_IDENTIFIER|UUID> [--json]");
  process.exit(2);
}

const get = async (path) => {
  const r = await fetch(`${API}/api/${path}`, { headers: { Authorization: `Bearer ${KEY}` } });
  if (!r.ok) throw new Error(`${path} -> HTTP ${r.status}`);
  return r.json();
};

// 1) carrega todas as issues da empresa e localiza a raiz
const listed = await get(`companies/${COMPANY}/issues?limit=500`);
const issues = Array.isArray(listed) ? listed : listed.items || listed.issues || [];
const rootIssue = issues.find((i) => i.identifier === root || i.id === root);
if (!rootIssue) {
  console.error(`Issue raiz não encontrada: ${root}`);
  process.exit(1);
}

// 2) monta a árvore (raiz + todos os descendentes)
const childrenOf = (id) => issues.filter((i) => i.parentId === id);
const tree = [];
(function walk(id) {
  const i = issues.find((x) => x.id === id);
  if (!i) return;
  tree.push(i);
  childrenOf(id).forEach((c) => walk(c.id));
})(rootIssue.id);

// 3) coleta runs de cada issue e DEDUPLICA por runId
const byRun = new Map();
for (const iss of tree) {
  let runs = [];
  try {
    runs = await get(`issues/${iss.id}/runs`);
  } catch {
    /* issue sem runs */
  }
  for (const rn of Array.isArray(runs) ? runs : []) {
    if (!byRun.has(rn.runId)) {
      // atribui o run à issue que o retornou primeiro (dono), com fallback ao snapshot
      rn._issueId = rn.contextSnapshot?.issueId || iss.id;
      byRun.set(rn.runId, rn);
    }
  }
}

// 4) agrega
let costUsd = 0, inTok = 0, outTok = 0, billed = 0, unpriced = 0;
const perIssue = new Map();
const perAgent = new Map();
for (const rn of byRun.values()) {
  const u = rn.usageJson;
  if (!u || u.costUsd == null) { unpriced++; continue; }
  billed++;
  costUsd += u.costUsd;
  inTok += u.inputTokens || 0;
  outTok += u.outputTokens || 0;
  const ik = rn._issueId || "?";
  const ak = rn.agentId || "?";
  perIssue.set(ik, (perIssue.get(ik) || 0) + u.costUsd);
  perAgent.set(ak, (perAgent.get(ak) || 0) + u.costUsd);
}

const idOf = (uuid) => (issues.find((i) => i.id === uuid) || {}).identifier || uuid.slice(0, 8);
const report = {
  lp: rootIssue.identifier,
  title: rootIssue.title,
  issuesInTree: tree.length,
  uniqueRuns: byRun.size,
  billedRuns: billed,
  unpricedRuns: unpriced,
  costUsd: +costUsd.toFixed(4),
  inputTokens: inTok,
  outputTokens: outTok,
  billingBasis: "subscription_included (valor-equivalente rate-card API)",
  perIssueTopUsd: [...perIssue.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => ({ issue: idOf(k), usd: +v.toFixed(2) })),
  perAgentTopUsd: [...perAgent.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => ({ agent: k.slice(0, 8), usd: +v.toFixed(2) })),
};

if (asJson) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`\n═══ CUSTO POR LP · ${report.lp} ═══`);
  console.log(`  ${report.title}`);
  console.log(`  Issues na árvore : ${report.issuesInTree}`);
  console.log(`  Runs únicos      : ${report.uniqueRuns}  (faturados ${report.billedRuns} · sem preço ${report.unpricedRuns})`);
  console.log(`  Tokens           : ${report.inputTokens.toLocaleString()} in · ${report.outputTokens.toLocaleString()} out`);
  console.log(`  Base de custo     : ${report.billingBasis}`);
  console.log(`\n  ▸ CUSTO TOTAL DA LP: $${report.costUsd.toFixed(2)}\n`);
  console.log("  Top issues por custo:");
  report.perIssueTopUsd.forEach((r) => console.log(`    ${r.issue.padEnd(8)} $${r.usd.toFixed(2)}`));
}
