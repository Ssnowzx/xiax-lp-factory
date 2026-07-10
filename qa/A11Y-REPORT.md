# A11y Report — LP Xbarber — 2026-07-08 — commit 6f356a7
Preview: `next build && next start` em `localhost:3000` (produção) · Review Board rodada 1 · Alvo: **WCAG 2.2 AA**
Harness: `@axe-core/playwright` 4.12.1 + Chromium real (Playwright 1.61) · evidências em `qa/artifacts/a11y/`

## Veredito atual (após Rodada 3): **APPROVED** — commit 70b69c4
Regra: `violations = []` em TODOS os estados **E** passe manual limpo (teclado + leitor de tela + zoom + não-cor).
Histórico: **R1 REJECTED** (A11Y-01 contraste · A11Y-02 aria-hidden-focus · A11Y-03 erro de form silencioso) → **R2** A11Y-01/03 resolvidos, A11Y-02 persistia → **R3 APPROVED**, A11Y-02 resolvido e provado no DOM ao vivo (ver seção "Rodada 3" no fim). **Nenhum blocker de a11y em aberto.** Entregue a `head-of-quality`.

---

## Gate axe (@axe-core/playwright · tags wcag2a/2aa/21aa/22aa)
Scan por estado do DOM (axe só enxerga o DOM atual). Evidência: `qa/artifacts/a11y/<estado>.json`.

| Estado | Viewport | Violations | Max impact | Regra |
|--------|----------|-----------:|------------|-------|
| 01 default            | 1280 | **1** | serious | color-contrast |
| 02 faq aberto         | 1280 | **1** | serious | color-contrast |
| 03 form e-mail inválido | 1280 | **1** | serious | color-contrast |
| 04 mobile default     | 375  | **1** | serious | aria-hidden-focus |
| 05 reduced-motion     | 1280 | **1** | serious | color-contrast |

> O `color-contrast` é o MESMO nó nos 4 estados desktop/reduced (o CTA do header). O `aria-hidden-focus` só aparece no mobile (a `.cta-bar` fixa). Nenhum outro nó do documento falhou no axe — os demais tokens de cor/UI passaram ao vivo.

## Passe manual (o que o axe não pega)
| Passe | Resultado | Evidência |
|-------|-----------|-----------|
| Teclado — Tab topo→rodapé, skip-link 1º, foco sempre visível, sem trap | **OK** | `video/page@*.webm`, `manual-pass.json` (18 paradas, 0 tabindex positivo, 0 parada sem anel de foco) |
| Skip-link é o 1º focável e fica visível no foco (→ `#conteudo`) | **OK** | `skiplink-focus.png` (revela "PULAR PARA O CONTEÚDO" com outline de latão) |
| FAQ (Radix Accordion) via teclado — Enter abre/fecha, foco não some | **OK** | `manual-pass.json` (aria-expanded true→false) |
| Leitor de tela — landmarks, 1 h1, ordem de headings, alt/label, nav rotuladas | **OK** | estrutura verificada (ver abaixo) |
| Zoom/reflow 400% (≈320px) sem scroll horizontal (1.4.10) | **OK** | `reflow-320.png` (overflowX = 0) |
| Texto 200% sem clipping (1.4.4) — via page-zoom | **OK** | coberto pelo reflow 400% que passa (zoom de página 200% é caso menos extremo) |
| Não-cor (grayscale — status distinguível, 1.4.1) | **OK** | `grayscale-full.png` (nav ativo com hairline/underline; erro é texto; check é ícone+texto) |

## Estrutura semântica (verificada)
- **1 `<h1>`** (hero) — nenhum outro no documento. ✅
- Hierarquia **h1 → h2 (cada seção) → h3** (como-funciona, faq via Radix Header) — sem pular nível. ✅
- Landmarks reais: `<header>` · `<main id="conteudo">` · `<footer>`. ✅
- **2 `<nav>` com rótulos distintos**: header `aria-label="Principal"`, footer `aria-label="Rodapé"` (não lista "navigation, navigation"). ✅
- Decorativos com `aria-hidden`: números gigantes (`stat-number`), ícones SVG (`icons`), check da lista (`chk`), glifos `▸`/`+`. `AgendaMock` é `role="img"` + `aria-label`. ✅
- Alvos de ponteiro ≥ 24×24 (2.5.8): botões h-9/h-11 (36/44px), nav `py-2.5`, FAQ `py-5`. ✅

## Contraste (calculado, tema dark — a LP é dark-only; sem escopo light/paperbox em uso)
Números via luminância relativa WCAG. Tokens do `styles/tokens.css` conferem com a prova documentada.

| Par fg/bg | Ratio | Piso | OK? |
|-----------|------:|-----:|-----|
| ink `#F3ECE0` / base `#14110E` | 16.02 | 4.5 | ✅ |
| ink-muted `#C4B6A2` / base | 9.46 | 4.5 | ✅ |
| ink-subtle `#9C8F7C` / base | 5.94 | 4.5 | ✅ |
| accent (texto) `#D6A24E` / base | 8.19 | 4.5 | ✅ |
| **accent-ink `#14110E` / accent `#D6A24E`** (texto CORRETO no fill do CTA) | 8.19 | 4.5 | ✅ (token certo) |
| foco accent `#D6A24E` / base (indicador) | 8.19 | 3.0 | ✅ |
| danger `#E8886B` / base (texto de erro) | 7.31 | 4.5 | ✅ |
| **ink `#F3ECE0` / accent `#D6A24E`** (CTA do header COMO RENDERIZADO) | **1.96** | 4.5 | ❌ **A11Y-01** |

O token está certo (8.19:1). O defeito é de **aplicação**: o `text-accent-ink` é descartado no merge de classes, e o CTA herda `text-ink` (claro) sobre o fill de latão → 1.96:1.

## Fronteira delegada (perf-a11y-motion — NÃO é meu gate, roteado)
- reduced-motion / foco preso por pin / decorativo animado `aria-hidden` / flashing → dono: `motion-engineer` | `creative-technologist`.
- Nota: o gate de reduced-motion no `layout.tsx` (só adiciona `anim-ready` quando `no-preference`) respeita `prefers-reduced-motion`; o axe estrutural em reduced-motion (estado 05) segue com as mesmas 0 violações estruturais (só o A11Y-01 herdado). A validação de vídeo do motion é do `qa-motion-adversarial`.

## Achados (blocker → importante → nit)
- **[BLOCK] A11Y-01 — WCAG 1.4.3 Contrast (Minimum)** — CTA primário do header "Começar teste grátis" (`components/layout/header.tsx:27`, `<a class="md:inline-flex">`) renderiza `text-ink #F3ECE0` sobre `bg-accent #D6A24E` = **1.96:1** (axe: 1.95; piso 4.5:1).
  - **Causa-raiz (provada):** `lib/ui/cn.ts` usa `twMerge` sem `extendTailwindMerge`. O token de fontSize custom `text-label` não está registrado, então o tailwind-merge o trata como conflito de COR contra `text-accent-ink`. No `cva` do `Button`, a classe de `size` (`text-label`) é emitida DEPOIS da de `variant` (`text-accent-ink`) → `text-accent-ink` é removido → o `<a>` herda `text-ink` do body. Repro determinístico: `twMerge("... text-accent-ink ... text-label")` → dropa `text-accent-ink`. Os outros CTAs accent (SubmitButton, `.cta-bar`) escapam porque escrevem `text-accent-ink` por ÚLTIMO.
  - **Dono:** `ui-engineer` (Button + `lib/ui/cn.ts`) · consulta `design-system-architect`.
  - **Fix sugerido:** configurar `cn` com `extendTailwindMerge` registrando os fontSize custom (`label`, `title`, `body*`, `display*`, `kicker`…) em `classGroups.font-size` — corrige TODAS as colisões latentes, não só este CTA. (Paliativo: reordenar para `text-accent-ink` por último no variant accent.)
  - Evidência: `qa/artifacts/a11y/01-default-desktop.json`.

- **[BLOCK] A11Y-02 — WCAG 4.1.2 Name/Role/Value (aria-hidden-focus)** — `components/layout/sticky-cta-bar.tsx`: quando escondida (`visible=false`, estado inicial no mobile) o container recebe `aria-hidden="true"` mas ainda contém um `<a href="#planos">` focável. `pointer-events-none` não tira do tab order → usuário de teclado/switch tabula para um CTA invisível e escondido de AT. Axe: serious.
  - **Dono:** `ui-engineer`.
  - **Fix sugerido:** `tabIndex={visible ? undefined : -1}` na âncora **e/ou** aplicar `inert` no container quando `!visible` (remove do tab order + da árvore de acessibilidade).
  - Evidência: `qa/artifacts/a11y/04-mobile-default.json`.

- **[BLOCK] A11Y-03 — WCAG 3.3.1 Error Identification / 3.3.3 Error Suggestion** — `components/forms/trial-form.tsx`: no caminho com JS, `onSubmit` roda o zod do cliente e, se inválido, faz `e.preventDefault()` + `focus()` — mas o Server Action (que produz o estado de erro renderizado no `role="alert"`) **nunca roda**. Como cliente e servidor usam o MESMO `trialSchema`, o ramo de erro (`FormStatus role="alert"` + `aria-invalid` + `aria-describedby`) é código morto quando há JS. Resultado: e-mail inválido → foco pula pro campo, **sem texto de erro e sem anúncio**. O erro é detectado mas não é identificado em texto.
  - **Dono:** `ui-engineer`.
  - **Fix sugerido:** ao falhar o zod no cliente, popular um estado de erro que renderize o MESMO `FormStatus` (`role="alert"`) + `aria-invalid`/`aria-describedby` no campo — em vez de só focar em silêncio. Servidor continua sendo a fronteira (PE sem JS já funciona).
  - Evidência: `qa/artifacts/a11y/03-form-invalid-submit.json` (nenhum elemento de erro no DOM após submit inválido).

- **[NIT] A11Y-04 — 1.4.4 (informativo, não bloqueia)** — zoom SÓ-de-texto a 200% (font-size:200%, sem escalar layout) gera overflow horizontal (~299px @1280, ~174px @320). NÃO conta contra o veredito: o critério 1.4.4 é atendido por zoom-de-página, coberto pelo reflow 400% (1.4.10) que passa com overflow 0. Alguns elementos usam `px`/`vw` que não acompanham o zoom-só-de-texto (interpretação estrita/opcional). Dono eventual: `ui-engineer`, baixa prioridade.

## Exceções
- Nenhum `disableRules`. O gate rodou com o conjunto completo de regras WCAG 2.2 AA em todos os estados.

## Decisão
**REJECTED** → 3 achados blocker roteados a `ui-engineer` (A11Y-01 também consulta `design-system-architect`). Nova rodada quando retornarem: alvo `violations: []` em todos os estados + passe manual limpo (o teclado/estrutura/reflow/skip-link/FAQ já estão OK — a re-auditoria foca nos 3 blockers).
Entregue ao `head-of-quality`/Producer para consolidação do GO/NO-GO no Release Readiness. **Não fiz deploy.**

---

# Rodada 2 — Re-auditoria A11y — 2026-07-08 — commit a6ebc1f
Escopo (XIA-43): re-auditar **só os 3 blockers** da rodada 1 (o restante do passe manual — teclado/estrutura/reflow/skip-link/FAQ — permanece OK e não foi re-executado). Blocker-chained aos fixes de XIA-41 (commit 6580192).
Harness: `next build && next start` @ prod `localhost:3000` · `@axe-core/playwright` (tags wcag2a/2aa/21aa/22aa) + probes DOM ao vivo · Chromium real.

## Veredito Rodada 2: **REJECTED**
Regra do gate: `violations = []` em TODOS os estados. **A11Y-01 ✅ e A11Y-03 ✅ resolvidos; A11Y-02 ❌ persiste** (axe `aria-hidden-focus` serious no mobile). 1 blocker aberto → REJECTED. Roteado a `ui-engineer`.

## Gate axe (re-run, 5 estados)
| Estado | Viewport | Violations | Max impact | Regra | vs R1 |
|--------|----------|-----------:|------------|-------|-------|
| 01 default            | 1280 | **0** | — | — | ✅ era 1 (color-contrast) |
| 02 faq aberto         | 1280 | **0** | — | — | ✅ era 1 (color-contrast) |
| 03 form e-mail inválido | 1280 | **0** | — | — | ✅ era 1 (color-contrast) |
| 04 mobile default     | 375  | **1** | serious | `aria-hidden-focus` | ❌ segue 1 |
| 05 reduced-motion     | 1280 | **0** | — | — | ✅ era 1 (color-contrast) |

TOTAL: **1** violação (só A11Y-02, mobile). Evidência: `qa/artifacts/a11y/0*-*.json` (re-gerados).

## A11Y-01 — WCAG 1.4.3 Contrast — ✅ RESOLVIDO
O `cn()` agora usa `extendTailwindMerge` registrando os fontSize custom em `classGroups.font-size` (`lib/ui/cn.ts`). O CTA do header **para de dropar** `text-accent-ink`.
- **Prova ao vivo (probe DOM):** CTA header `Começar teste grátis` → `color: rgb(20,17,14)` (#14110E accent-ink) sobre `background: rgb(214,162,78)` (#D6A24E accent) = **8.19:1** (piso 4.5). Era 1.96:1.
- axe `color-contrast` = **0** nos 4 estados que falhavam em R1 (default/faq/form/reduced). Correção de causa-raiz — resolve todas as colisões latentes `text-<size>×text-<color>`.

## A11Y-03 — WCAG 3.3.1 / 3.3.3 Error Identification — ✅ RESOLVIDO
`components/forms/trial-form.tsx`: no caminho com JS, o zod-cliente agora popula `clientEmailError`, que renderiza o MESMO `FormStatus role="alert"` + `aria-invalid` + `aria-describedby`.
- **Prova ao vivo (probe DOM, submit de e-mail inválido com JS):**
  - `[role="alert"]` presente, texto = "Digite um e-mail válido, ex.: nome@dominio.com" ✅
  - `input[name=email]` `aria-invalid="true"` ✅
  - `aria-describedby="email-erro-…"` **resolve** para o elemento de erro ✅
- Erro deixou de ser silencioso: é identificado em texto e exposto programaticamente (anunciável por AT). Servidor segue como fronteira no caminho sem JS.

## A11Y-02 — WCAG 4.1.2 Name/Role/Value (`aria-hidden-focus`) — ❌ NÃO RESOLVIDO (BLOCKER)
O fix aplicado em XIA-41 foi `inert={!visible || undefined}` na `sticky-cta-bar`. **Ele não tem efeito no runtime**: React **18.3.1** não renderiza o atributo booleano `inert` (suporte nativo a `inert` como prop só entra no **React 19**). O prop é descartado silenciosamente.
- **Prova ao vivo (probe DOM, mobile 375, barra oculta no load):**
  - `.z-sticky-cta` → `aria-hidden="true"` ✅ mas `hasAttribute("inert") = false`, `el.inert = false` ❌ (atributo **ausente** do DOM)
  - âncora interna `<a href="#planos">`: `tabindex = null` (sem `-1`) e **`.focus()` foca de fato** (`document.activeElement === a` → `true`) → segue no tab order.
  - axe `aria-hidden-focus` [serious], nó `.fixed`: "Focusable content should have tabindex=\"-1\" or be removed from the DOM".
- **Impacto:** usuário de teclado/switch tabula para um CTA **invisível** e **escondido das ATs** (aria-hidden) → foco vai para o nada. Regressão de operabilidade real, não cosmética.
- **Dono:** `ui-engineer`.
- **Fix sugerido (React 18):** NÃO confiar no prop booleano `inert`. Opções que funcionam no 18.3.1:
  1. `inert={!visible ? "" : undefined}` — renderiza o atributo como string (o React 18 emite atributos string-valued), OU
  2. `tabIndex={visible ? undefined : -1}` **na âncora** quando oculta (paliativo já sugerido na R1), OU
  3. desmontar o `<a>`/a barra quando `!visible`.
  A opção 1 é a mais próxima do intento (remove do tab order **e** da árvore de AT). Validar com re-run axe: `aria-hidden-focus` deve zerar no mobile.
- Evidência: `qa/artifacts/a11y/04-mobile-default.json`.

## Passe manual
Não re-executado por completo (fora do escopo de R1 permanece OK: teclado/estrutura/reflow/skip-link/FAQ). Probes DOM direcionados aos 3 blockers acima substituem o passe manual para este delta. Não há regressão introduzida nos itens já OK.

## Fronteira delegada (perf-a11y-motion — NÃO é meu gate)
Sem novos achados de motion-a11y nesta rodada.

## Achados Rodada 2
- **[RESOLVED] A11Y-01** — WCAG 1.4.3 — CTA header 1.96→**8.19:1** — dono `ui-engineer` (feito XIA-41).
- **[RESOLVED] A11Y-03** — WCAG 3.3.1/3.3.3 — erro de form agora `role="alert"` — dono `ui-engineer` (feito XIA-41).
- **[BLOCK] A11Y-02** — WCAG 4.1.2 `aria-hidden-focus` — âncora da sticky-cta segue focável (prop `inert` booleano ignorado no React 18.3.1) — **dono `ui-engineer`** — status: **routed** (issue de fix filha do XIA-37).

## Decisão Rodada 2
**REJECTED** — 2/3 blockers resolvidos; **A11Y-02** persiste e reprova o gate (`violations` = 1 no mobile). Roteado a `ui-engineer` via issue de fix; nova re-auditoria (Rodada 3, só A11Y-02) quando retornar. **Não fiz deploy.**

---

# Rodada 3 (D·R3) — Re-auditoria de A11Y-02 (escopo único) — 2026-07-08 — commit 70b69c4

## Veredito Rodada 3: **APPROVED (A11Y-02)**
Escopo: **apenas A11Y-02** (`aria-hidden-focus`), único blocker que persistia após R2. A11Y-01 e A11Y-03 já estavam resolvidos (R2). O gate axe volta a `violations = []` em todos os estados **e** o defeito é comprovado corrigido no **DOM ao vivo**, nos dois sentidos da transição.

## Fix auditado (XIA-46, commit 70b69c4)
`components/layout/sticky-cta-bar.tsx`: removido o `inert={!visible || undefined}` do JSX (era **código morto** — React 18.3.1 descarta o boolean `inert`, causa-raiz de R1/R2). Passa a setar `HTMLElement.inert = !visible` pela **propriedade DOM** dentro de `useEffect`, que reflete o atributo nativamente independente da versão do React.

## Prova no DOM ao vivo (probe direcionado — `qa/a11y-inert-probe.mjs`)
Harness Playwright/Chromium, mobile 375×780. Evidência: `qa/artifacts/a11y/inert-probe.json`.

| Estado | aria-hidden | `el.inert` (prop) | `hasAttribute("inert")` | `<a>` focável (`.focus()`) | axe `aria-hidden-focus` |
|--------|-------------|-------------------|--------------------------|-----------------------------|--------------------------|
| **Oculta** (topo, #hero na tela) | `true` | `true` | **`true`** (valor `""`) | **`false`** ✅ | **0** ✅ |
| **Visível** (scroll entre #hero/#planos) | `false` | `false` | `false` | `true` ✅ | — |

- **Correção da causa-raiz confirmada:** ao contrário de R1/R2 (`hasAttribute("inert") = false`), o atributo `inert` **agora está presente no DOM** quando a barra está oculta — a via da propriedade DOM funciona onde o boolean JSX era descartado.
- **Operabilidade:** com a barra oculta o `<a href="#planos">` **não recebe foco** (`document.activeElement !== a`) → fora do tab order **e** da árvore de AT. Ao ficar visível, volta a ser focável. Toggle bidirecional provado.

## Gate axe (re-run, 5 estados)
`violations = []` em todos: `01-default-desktop`, `02-faq-open`, `03-form-invalid-submit`, `04-mobile-default` (estado que continha A11Y-02), `05-reduced-motion`. Resumo: `qa/artifacts/a11y/summary.json`. **TOTAL: 0.**

## Achados Rodada 3
- **[RESOLVED] A11Y-02** — WCAG 4.1.2 `aria-hidden-focus` — `inert` refletido no DOM via propriedade; âncora não-focável quando oculta; axe 0 no mobile — dono `ui-engineer` (feito XIA-46) — status: **resolved (provado ao vivo)**.

## Fronteira delegada (perf-a11y-motion — NÃO é meu gate)
Sem novos achados de motion-a11y nesta rodada.

## Decisão Rodada 3
**APPROVED** — o único blocker aberto (A11Y-02) está resolvido e comprovado no DOM ao vivo; gate axe `violations = []` em todos os estados. Com A11Y-01/A11Y-03 (R2) + A11Y-02 (R3) fechados, **não há blocker de acessibilidade em aberto**. Entrego a `head-of-quality` para o GO/NO-GO consolidado (Release Readiness). Eu não declaro "pronto" nem faço deploy — isso é do Producer no Release Checklist.
