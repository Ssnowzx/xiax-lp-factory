# Perf Report — Xbarber LP V2 FLAGSHIP — 2026-07-08 — commit `f35c15e`

**Build auditado:** `next build && next start` (produção, porta 3847 dedicada — **NUNCA `next dev`**) · Next 14.2.35 · rota `/`
**Review Board:** rodada 1 · issue XIA-76 (Fase D, filha de XIA-64)
**Ambiente de medição:** sandbox 2 vCPU, `/dev/shm` 64 MB, Chromium Playwright 1228; Lighthouse 12.8.2 (`--disable-dev-shm-usage`), mediana de 3.

---

## Veredito: **REJECTED / NO-GO**

**Regra:** qualquer célula fora do alvo ⇒ REJECTED. Todo número é **medido**, nunca estimado.
Duas categorias Lighthouse abaixo de 100 na mediana de 3. **1 delas (Best Practices) é 100% determinística e reprodutível** (não é ruído de lab): token `.text-label` a 11,5 px reprova o audit *legible font sizes*. Perf 96 combina LCP de laboratório no limite + JS legado + forced reflow.

> **Contexto honesto de campo:** os **Core Web Vitals de campo** com interação real estão **TODOS VERDES** (CLS 0, INP 40 ms desktop / 104 ms mobile-4x, LCP de campo baixo). A reprovação é de **gate Lighthouse (score 100)**, não de vitais de campo. Ainda assim, o gate é 100 e há um achado determinístico → NO-GO até fechar.

---

## Scores & vitais (fonte anexada por linha)

### Lighthouse (mediana de 3 · `minScore:1`)
| Categoria | Alvo | run1 | run2 | run3 | **Mediana** | ✓/✗ |
|---|---|---|---|---|---|---|
| Performance    | 100 | 80 | 96 | 97 | **96** | ✗ |
| Accessibility  | 100 | 100 | 100 | 100 | **100** | ✓ |
| Best Practices | 100 | 96 | 96 | 96 | **96** | ✗ |
| SEO            | 100 | 100 | 100 | 100 | **100** | ✓ |

*run1 é outlier de contenção de CPU (TBT 651 ms) — servidores irmãos disputavam as 2 vCPU. runs 2–3 são a leitura limpa.*

### Métricas de laboratório (Lighthouse, slow-4G + 4× CPU)
| Métrica | Alvo | run1 | run2 | run3 | **Mediana** | ✓/✗ |
|---|---|---|---|---|---|---|
| LCP (lab) | < 2500 ms | 2787 | 2647 | 2507 | **2647** | ✗ (limite) |
| TBT (lab, proxy INP) | < 200 ms | 651 | 95 | 83 | **95** | ✓ |
| CLS (lab) | < 0,1 | 0,000 | 0,000 | 0,000 | **0,000** | ✓ |
| FCP | — | 946 | 921 | 935 | 935 | — |

### Core Web Vitals de CAMPO (`PerformanceObserver` + interação real — 196/156 eventos)
| Métrica | Alvo | desktop 1× | mobile Pixel7 4× | ✓/✗ |
|---|---|---|---|---|
| LCP (campo) | < 2500 ms | 164 ms | 244 ms | ✓ ¹ |
| CLS (campo) | < 0,1 (≈0) | **0,000** | **0,000** | ✓ |
| INP (campo, interação real) | < 200 ms | **40 ms** | **104 ms** | ✓ |

¹ LCP de campo medido em `localhost` (sem RTT de rede) → **otimista**. A leitura de rede honesta é a de lab (≈2,6 s). CLS e INP são independentes de rede — verdes de fato.

### Orçamentos de bytes (todos VERDES)
| Orçamento | Alvo | Medido | Fonte | ✓/✗ |
|---|---|---|---|---|
| First-load JS (`/`) | ≤ 300 KB gzip | **147 KB** | `next build` (gzip) | ✓ |
| JS total de navegação | ≤ 307200 B | **179 406 B** | `resource-summary:script` (@lhci) | ✓ |
| Transferência total | ≤ 1,5 MB | **264 KB** | `resource-summary:total` | ✓ |
| Third-party | 0 bloqueante | **0 req** | `resource-summary:third-party` | ✓ |
| Fonts | self-host | **66 KB, 4 preload** | `next/font` | ✓ |
| Imagens | — | **0 B** (galeria = placeholder honesto) | — | ✓ |

---

## LCP delivery
**Elemento LCP:** `section#hero > div > div.md:col-span-6 > p.mt-6` (sub-headline de TEXTO — não é imagem).
- Sem imagem LCP → gate de `priority`/`fetchpriority` **não se aplica** (não há raster; `AgendaMock` é SVG/CSS, `#galeria` é placeholder 0-byte com reserva 16:9).
- Hero é **HTML de servidor**, legível sem JS. ✓
- Fase decisiva: **Render Delay 2044 ms (82% do LCP)** vs TTFB 462 ms (18%), Load Delay/Time 0. O texto pinta tarde sob throttle — font-swap + main-thread ocupada por hydration/init de motion. Alvo de otimização (ver findings).

## Fonts (CLS) · Arquitetura (first-load)
- `next/font` (Anton × Archivo × Space Mono), self-host, `display:swap`, **4 `<link rel=preload as=font>`**. Zero `<link>`/`@import` externo. **CLS 0,000** confirmado (lab + campo). ✓
- `app/layout.tsx` e `app/page.tsx`: **RSC puro** (sem `"use client"`). ✓
- Sem `dynamic(ssr:false)` em Server Component. ✓
- Motion (GSAP/Lenis) montado só no client via provider, children RSC por prop → HTML de conversão sai antes do JS. ✓

## First-load JS treemap (gzip real por chunk)
Maiores: `fd9d1056` 53,6 KB · `framework` 44,8 KB · **`polyfills` 39,5 KB** · `main` 34,1 KB · `117` (vendor/motion) 31,7 KB · `835` 25,3 KB · `38` 25,0 KB.
Nada acima de 300 KB. Sem barrel `export *` detectado. **Nota:** chunk `polyfills` (39,5 KB) + padrão legado (`Array.prototype.flat`) no chunk `117` são serviço de JS legado a browsers modernos — ver finding IMPORTANT.

---

## Findings (blocker → important → nit)

- **[BLOCKER]** Best Practices travado em 96 — audit *legible font sizes* score 0 (**50,9% de texto legível**). Token **`.text-label` a 11,504 px** (<12 px, cobre 47% do texto); secundários `.text-[0.6rem]` 9,6 px e `.skip-link` 11,5 px. — **owner: `ui-engineer`** (design-system) — evidência: `qa/artifacts/xia76/lh-3.json` audit `font-size`. **Fix:** subir `.text-label` para ≥12 px (0,75 rem) sem tocar tokens de identidade (cor/família invioláveis).

- **[IMPORTANT]** Performance 96 — **LCP de lab ~2,6 s** (Render Delay 2044 ms) impede o score 100 mesmo em run limpo. Elemento LCP é texto; pinta tarde sob throttle. — **owner: `nextjs-arquiteto`** (ordering de hydration/streaming; garantir hero fora de qualquer boundary de JS — já está) **+ cross-ref `motion-engineer`** (adiar init de GSAP/Lenis para depois do LCP; hoje o init disputa a main-thread na janela do LCP). Vitais de campo verdes ⇒ é otimização de score, redesenhar (não remover) o timing do init. Evidência: `lh-3.json` audit `largest-contentful-paint-element`.

- **[IMPORTANT]** JS legado a browsers modernos — **11,2 KiB** desperdiçados (`Array.prototype.flat` no chunk `117`) + chunk `polyfills` 39,5 KB. — **owner: `nextjs-arquiteto`** — evidência: `lh-3.json` audit `legacy-javascript`. **Fix:** apertar `browserslist`/target de build para dropar transpilação/polyfill legado.

- **[NIT]** Forced reflow ~35 ms no chunk `117` (leitura de geometria após mutação de DOM). — **owner: `motion-engineer`** (cross-ref, provável init de Lenis/reveal) — evidência: `lh-3.json` audit `forced-reflow-insight`. **Fix:** agrupar leituras antes das escritas (measure→mutate).

---

## Fronteira de responsabilidade
- **Meu (web-performance):** score dos 4, first-load/JS total, LCP delivery, font/CLS, third-party, cache, orçamento de bytes. Reprovo aqui.
- **Roteado:** conteúdo A11y/SEO tem dono (score 100 nas duas — nada a rotear); FPS/`will-change`/DPR são `motion-engineer` (fora deste report); peso de asset é `art-producer-assets` (galeria ainda é placeholder → 0 byte, sem achado).

## Anexos (em `qa/artifacts/xia76/`)
- `lh-1.json`, `lh-2.json`, `lh-3.json` — Lighthouse 12.8.2 completos (mediana de 3).
- `web-vitals-field.txt` — dump CWV de campo (LCP/CLS/INP, interação real).
- Harness reprodutível: `qa/web-vitals-field.mjs`.

**Fechamento:** findings voltam aos donos, ≤3 rodadas. Re-mede-se só a frente afetada quando o fix voltar. NO-GO no consolidado enquanto BP<100.
