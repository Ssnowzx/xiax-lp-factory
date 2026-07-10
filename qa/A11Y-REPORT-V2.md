# A11y Report — LP Xbarber V2 FLAGSHIP — 2026-07-08 — commit `f35c15e`
Preview: `next build && next start` em `localhost:3000` (produção) · Review Board (XIA-64) · Alvo: **WCAG 2.2 AA**
Harness: `@axe-core/playwright` + Chromium real (Playwright) · evidências em `qa/artifacts/a11y/`
Build: V2 FLAGSHIP (Fases B–C fechadas) — NOVO em V2: `#galeria`, tabela multi-plano (`planos-table.tsx`), camada de motion GSAP/Lenis.

## Veredito: **APPROVED**
Regra: axe `violations = []` em todo estado perceptível **E** passe manual limpo (teclado + leitor + zoom + não-cor).
**0 blocker · 0 important · 1 nit** (informativo, não bloqueia). As duas regressões conhecidas (contraste de CTA via twMerge · `inert` do sticky-cta) seguem **fechadas** no HEAD, provado ao vivo.

---

## Gate axe (@axe-core/playwright · tags wcag2a/2aa/21aa/22aa)
Axe só enxerga o DOM ATUAL. Os `.reveal-item` (assento de motion) nascem `opacity:0` sob `html.anim-ready` e só chegam a `opacity:1` quando revelados. Um scan em `networkidle` **sem rolar** lê o conteúdo abaixo da dobra em opacity parcial → o axe compõe a cor do texto com o fundo escuro e acusa **falso** contraste. A leitura válida é a do **DOM assentado** (o que o usuário vê após a revelação) — análogo à "passada limpa de FPS".

| Estado | Viewport | Violations | Max impact | Evidência |
|--------|----------|-----------:|------------|-----------|
| 02 FAQ aberto (Radix Accordion) | 1280 | **0** | — | `02-faq-open.json` |
| 04 mobile default (`.cta-bar`) | 375 | **0** | — | `04-mobile-default.json` |
| 05 **reduced-motion** (reveal desligado → tokens reais) | 1280 | **0** | — | `05-reduced-motion.json` |
| 06 **settled** desktop (reveal completo) | 1280 | **0** | — | `06-settled-desktop.json` |
| 07 **settled** + ciclo anual (cross-fade de preço) | 1280 | **0** | — | `07-settled-annual.json` |
| 08 **settled** mobile | 375 | **0** | — | `08-settled-mobile.json` |
| — sticky-cta estado OCULTO (inert) | 375 | **0** | — | `inert-probe.json` |

> **Artefato de captura documentado (NÃO é achado):** o scan ingênuo `01-default-desktop` / `03-form-invalid-submit` (`a11y-axe.mjs`, sem rolar) reporta `color-contrast` em `article[data-plan]` / features de plano / trust-strip. As cores de FG reportadas (`#2c2925`, `#6a655f`, `#7b7162`) são composições ESCURECIDAS dos tokens reais (`ink-muted #C4B6A2`, `ink-subtle #9C8F7C`) contra `base #14110E` — assinatura de opacity parcial no reveal. Discriminador: **reduced-motion e settled = 0**, com os MESMOS tokens/fundos. Não há defeito de token. Entregue `qa/a11y-axe-settled.mjs` (rola + força estado final antes do scan) como gate canônico para builds com reveal.

## Passe manual (o que o axe não pega)
| Passe | Resultado | Evidência |
|-------|-----------|-----------|
| Teclado — Tab topo→rodapé, skip-link 1º, foco sempre visível, sem trap | **OK** | `keyboard-walk.webm` · `manual-pass.json`: 22 paradas · 0 tabindex positivo · 0 parada sem anel de foco · ordem = leitura |
| Skip-link é o 1º focável (→ `#conteudo`), outline solid 2px | **OK** | `skiplink-focus.png` |
| **BillingToggle (radiogroup NOVO V2)** — setas/Home/End, roving tabindex, 1 selecionado, sem trap | **OK** | `toggle-probe.json`: singleSelected✓ rovingTabindex✓ arrowMovesSelection✓ End/Home✓ noTrap✓ · `aria-label="Ciclo de cobrança"` |
| FAQ (Radix Accordion) via teclado — Enter abre/fecha, foco não some | **OK** | `manual-pass.json` (aria-expanded true→false) |
| sticky-cta oculta — `inert` + `aria-hidden` + link não-focável (A11Y-02) | **OK** | `inert-probe.json`: `inertProp=true`, `linkFocusableWhenHidden=false`, axe oculto=0 |
| Leitor de tela — landmarks, 1 h1, ordem de headings, alt/label, nav rotuladas | **OK** | estrutura verificada (abaixo) |
| Zoom/reflow 400% (≈320px) sem scroll horizontal (1.4.10) | **OK** | `reflow-320.png` (overflowX=0) |
| Texto 200% sem clipping (1.4.4) | **OK** (via page-zoom) | coberto pelo reflow 400% (overflow 0) — ver NIT-1 |
| Não-cor (grayscale — status distinguível, 1.4.1) | **OK** | `grayscale-full.png`: nav ativo c/ hairline; erro é texto (`role=alert`); check é ícone+texto; plano popular tem selo+anel |

## Estrutura semântica (verificada)
- **1 `<h1>`** (hero) — nenhum outro. ✅  Hierarquia `h1 → h2` (cada seção, incl. `#galeria`, `#planos`) `→ h3` (passos, FAQ/Radix, cards de plano) — **sem pular nível**. ✅
- Landmarks: `<header>` · `<main id="conteudo">` · `<footer>`. **2 `<nav>` rotuladas distintas** (Principal/Rodapé). ✅
- Decorativos com `aria-hidden`: números gigantes, glifo de abertura da galeria (`ApertureGlyph`), ícones, glifos `▸`/`★`/`+`. Galeria = **placeholder honesto** (0 imagem, sem `alt` inventado). ✅
- Alvos de ponteiro ≥ 24×24 (2.5.8): botões h-9/h-11, radios do toggle `px-4 py-2`, FAQ `py-5`. ✅

## Contraste (calculado — tema dark ativo; escopo light definido mas não renderizado na LP)
Números por luminância relativa WCAG (`qa/contrast-check.mjs` + prova em `styles/tokens.css`), validados AO VIVO pelo axe no DOM assentado (compõe o fundo real, incl. `bg-accent/[0.06]` do card popular).

| Par fg/bg | Escopo | Ratio | Piso | OK? |
|-----------|--------|------:|-----:|-----|
| ink `#F3ECE0` / base `#14110E` | .page | 16.2 | 4.5 | ✅ |
| ink-muted `#C4B6A2` / base | .page | 9.5 | 4.5 | ✅ |
| ink-subtle `#9C8F7C` / base | .page | 5.9 | 4.5 | ✅ |
| accent-ink `#14110E` / accent `#D6A24E` (texto no fill do CTA) | .page | 8.2 | 4.5 | ✅ |
| **CTA header "Começar teste grátis" (renderizado)** | .page | **8.2** | 4.5 | ✅ (twMerge OK) |
| foco accent `#D6A24E` / base | .page | 8.2 | 3.0 | ✅ |
| **V2** ink / surface-raised (card de plano/moldura galeria) | .page | 13.9 | 4.5 | ✅ |
| **V2** ink-muted / surface-raised (tagline, features) | .page | 8.2 | 4.5 | ✅ |
| **V2** ink-subtle / surface-raised (label 16:9, "/mês") | .page | 5.2 | 4.5 | ✅ |
| **V2** accent / surface-raised (check dourado, anel "mais popular") | .page | 7.1 | 3.0 | ✅ |
| **V2** line-strong / surface-raised (borda média) | .page | 3.1 | 3.0 | ✅ |

## Regressões conhecidas — status no HEAD
- **A11Y-01 (twMerge · 1.4.3):** `lib/ui/cn.ts` usa `extendTailwindMerge` registrando os 7 fontSize custom do DS (`display-2xl…label`) — todos os do `theme.ts` cobertos. O CTA do header herda `accent` (`text-accent-ink`) e o `text-accent-ink` **sobrevive** ao merge. Renderiza 8.2:1. **FECHADA.**
- **A11Y-02 (`inert` sticky-cta · 4.1.2):** `sticky-cta-bar.tsx` seta `HTMLElement.inert` via propriedade DOM (React 18.3.1 não serializa o boolean `inert`). Provado ao vivo: oculta → `inert=true` + `aria-hidden=true` + link não-focável; visível → tudo revertido, link focável. **FECHADA.**
- **A11Y-03 (erro de form silencioso · 3.3.1):** `trial-form.tsx` no caminho com JS popula `clientEmailError` que renderiza o MESMO `FormStatus role="alert"` + `aria-invalid`/`aria-describedby`, foca o campo e limpa no `onChange`. `aria-invalid` condicional (nunca hardcoded `false`). **FECHADA.**

## Fronteira delegada (perf-a11y-motion — NÃO é meu gate, roteado)
- reduced-motion / foco preso por pin / decorativo animado `aria-hidden` / flashing → dono: `motion-engineer` | `creative-technologist`.
- Nota: `layout.tsx` só adiciona `anim-ready` sob `prefers-reduced-motion: no-preference`; reduced-motion mantém `.reveal-item` em `opacity:1` (baseline) → conteúdo sempre legível. O estado FINAL do reveal = `opacity:1` (idêntico ao reduced-motion). A validação de vídeo do motion pertence a `qa-motion-adversarial` (XIA-76).

## Achados
- **[NIT] NIT-1 — 1.4.4 (informativo, não bloqueia)** — zoom SÓ-de-texto a 200% gera overflow horizontal (~95px @1280). NÃO conta contra o veredito: 1.4.4 é atendido por zoom-de-página, coberto pelo reflow 400% (1.4.10) que passa com overflow 0. Alguns tamanhos em `px`/`vw` não acompanham o zoom-só-de-texto (interpretação estrita/opcional). Dono eventual: `ui-engineer`, baixa prioridade.

## Nota de processo (harness, não é achado de produto)
O gate axe canônico deve escanear o **DOM assentado** em builds com reveal (`qa/a11y-axe-settled.mjs`): rolar a página e forçar o estado final de `.reveal-item` antes do scan. O harness ingênuo `qa/a11y-axe.mjs` produz falsos positivos de contraste ao ler reveal-items em opacity parcial — foi o que aconteceu nos estados 01/03. Recomendo adotar o settled como gate de referência do Review Board.

## Decisão
**APPROVED** → entregue a `head-of-quality` (XIA-64) para o GO/NO-GO consolidado. Sem findings roteados a donos (NIT-1 é opcional). Nenhuma frente vermelha de a11y.
