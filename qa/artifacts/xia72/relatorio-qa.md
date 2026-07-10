# QA Report (Motion) — LP Xbarber Flagship — 2026-07-08 — commit 6ba34a7
Preview: `next start` local @ http://localhost:3151 (build de produção do commit `6ba34a7`) · Review Board round: — (pré-Board, gate C→D) · Technical Storyboard: `storyboard` @ XIA-61 (rev latest, autor `motion-engineer`)

## Veredito: **APROVADO (GO)**
Regra de ouro cumprida: **vídeo por célula + FPS p95 + LCP/CLS/INP + trace** anexados. Sem esses artefatos o veredito seria inválido — aqui todos existem.

2 achados **LOW / não-bloqueantes** (N1, N2) roteados ao `motion-engineer` como polimento OPCIONAL de fidelidade canônica. **Nenhum gate duro falha** → o GO não depende deles.

---

## Nota metodológica (por que os números da 1ª passada foram descartados)
A matriz inicial (`results.json`) intercala `page.screenshot()` e `waitForTimeout(70ms)` no MESMO fluxo de rAF que amostra os deltas de frame. O "pior 5%" capturou os *stalls de captura do harness*, não jank real — prova: a **célula A rodou a CPU 1x e ainda assim reportou fpsP95=20**, o que é impossível para animação só-`transform`/`opacity`. Por isso o **FPS p95 do gate vem de uma passada LIMPA** (`qa/fps-clean.mjs`): scroll contínuo dirigido DENTRO da página (dispatch de `wheel` → Lenis) no mesmo rAF, **sem screenshots nem round-trips por frame**. LCP/CLS/INP e o trace vêm da passada instrumentada; FPS vem da passada limpa; ambos convergem com o Lighthouse lab.

---

## Matriz de execução (uma linha por célula, cada uma com seu vídeo)
| Célula | Viewport | CPU | FPS p95 (limpo) | FPS p99 | %frames>18ms | LCP | CLS | INP | Vídeo | Trace | Frames p000..p100 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **A** ref | 1440×900 | 1x | **60** | 60 | 0% | 216 ms | 0.0343 | 104 ms | `video/A-desktop-1x.webm` | `trace-summary.json` | `frames/A-desktop-1x-p*.png` |
| **B** | 1440×900 | 4x | **60** | 60 | 0% | 400 ms | 0.0111 | 96 ms | `video/B-desktop-4x.webm` | `B-desktop-4x-trace.json.gz` | `frames/B-desktop-4x-p*.png` |
| **C** | 390×844 DPR3 touch | 4x | **60** | 60 | 0% | 400 ms | 0.0137 | 80 ms | `video/C-mobile-4x.webm` | `trace-summary.json` | `frames/C-mobile-4x-p*.png` |

**Gate:** FPS p95 ≥ 55 em B **e** C ✅ (60/60) · LCP < 2,5 s ✅ · CLS < 0,1 ✅ · INP < 200 ms ✅.
**Lighthouse CLI** (Chromium do Playwright, `--disable-dev-shm-usage`): **desktop Perf 100** (LCP 0.6 s · CLS 0 · TBT 0 ms) · **mobile Perf 95** (LCP 2.1 s · CLS 0 · TBT 210 ms). Relatórios: `lighthouse/lh-desktop.report.html` · `lighthouse/lh-mobile.report.html`.

> CLS **0 no lab** (desktop e mobile) confirma **zero shift induzido por motion** no caminho de carga. O CLS runtime (≤0.034) vem do scroll sintético + count-up e fica muito abaixo do gate 0.1.

## Trace — só `transform`/`opacity`/`clip-path` (gate de perf)
Análise dos 4 traces (`trace-summary.json`): a coreografia é **compositor-driven**. Razão característica por célula: **~150 `Layout` × ~5.000–6.000 `UpdateLayer`** (trabalho de compositor). Se houvesse animação de `width/height/top/left/margin/filter`, o `Layout` seria da ordem de milhares (1 por frame, casado com a contagem de frames) — não é o caso. Os ~150 "forced sync layouts" rastreiam ao PRÓPRIO harness (`page.screenshot()`, `getBoundingClientRect`), não a thrash por frame. **PASS.** Confirmado também por código (`ANIMATABLE = transform/opacity/clip-path` no `motion-tokens.ts`; toda call anima `autoAlpha`/`y`/`yPercent`/`scale`/`clipPath`).

## Hero sem JS / libs bloqueadas
- **SSR puro (`javaScriptEnabled: false`):** **PASS** — H1 "AGENDA CHEIA. FALTA ZERO." visível `opacity: 1`, 0 reveals presos. Causa: a base `.reveal { opacity: 1 }` só vira `opacity: 0` sob `html.anim-ready`, classe que um script só adiciona quando há JS. Sem JS → conteúdo 100% visível. (`sabotage/no-js.png`)
- **Libs de motion abortadas por rota (`gsap|lenis|ScrollTrigger`):** **INCONCLUSIVO por esse método** — GSAP/Lenis estão *bundled* em chunks Next hasheados (ex.: `117-*.js`), não em arquivos URL-nomeados `gsap`/`lenis`; o abort por URL não os pegou (`gsapLive` seguiu `true`). A prova honesta do fallback estático é o teste **SSR sem-JS acima (PASS)**. Ainda assim, a página se manteve legível e sem conteúdo preso. (`sabotage/libs-blocked.png`)

## Passe reduce (obrigatório)
- **Contexto `reducedMotion: 'reduce'` (gate do SO):** **PASS** — estado final estático e legível; `gsapLive:true` (posse assumida), **`invisibleReveals: 0`**, **CLS 0**, sem loop/parallax. Vídeo `video/reduce-os.webm`, frames `frames/reduce-os-p*.png`.
- **Flag explícita `?reduced=1`:** **PASS** — mesmo branch estático (hero visível, 0 preso, `gsapLive:true`). Ambos os caminhos (SO + flag) levam ao MESMO branch reduzido de `gsap.matchMedia()`.
- **Efeitos sem branch reduced explícito:** nenhum. O `matchMedia` retorna cedo no branch `reduce` (nenhuma timeline monta); count-ups ficam no valor final, loop/parallax/hover desligados.

## Bateria de sabotagem (5 ataques × critério de recuperação) — `sabotage.json`
1. **Scroll violento pré-hidratação** (`waitUntil:'commit'` + 10× `wheel(0,2000)`): **PASS** — após assentar, 0 reveals presos no topo e no fundo; hero legível.
2. **Resize em animação** (0.5 → 768px → 1680px): **PASS** — 0 conteúdo preso; sem pins (a coreografia não usa `pin`, então sem overlap/gap possível), reveals remedem.
3. **Back/forward + bfcache:** **N/A REPRODUZÍVEL** — a LP é single-route (App Router client-side); não há navegação cross-document no fluxo. O teardown SPA (`mm.revert()`) foi exercitado indiretamente por refresh/resize. Registrado como não reproduzível no ambiente, não como falha.
4. **Aba em background e volta** (6 s fora, loop `sine.inOut` ativo): **PASS** — sem estado quebrado ao retornar; 0 preso, hero alcançável. O pulse usa `toggleActions: play pause resume pause` (pausa fora da viewport) + ticker único com `lagSmoothing(0)`.
5. **Refresh a ~50%:** **PASS** — Chromium restaurou scroll (`scrollY ≈ 4115`), reveals acima do viewport visíveis (não presos no estado inicial), 0 conteúdo preso.

## Fidelidade contra o Technical Storyboard (item por item — §2, 10 seções)
| # | Seção | Efeito prometido | Presente? | Trigger certo? | Timing/caráter vs token | Veredito |
|---|---|---|---|---|---|---|
| 01 | Hero | H1 mask-in (clip-path, EASE.hero, DUR.hero) + underline draw + sub + checklist stagger + parallax mockup (scrub base) + chip loop | ✅ | load ✅; underline via CSS (N2) | H1 `clipPath hiddenUp→shown`+y, `power4.out`, 1.2s ✅; sub/checklist com offset levemente antecipado (mesma ordem) | **PASS** (N2) |
| 02 | Dor | count-up ~R$ 2.000 | ✅ | `top 85%` vs `75%` (N1) | `EASE.out`, `revealSlow` ✅ | PASS (N1) |
| 03 | Como funciona | trilho hair-draw + passos stagger | ✅ | `top 85%` vs `70%` (N1) | stagger `base`, `EASE.standard` ✅ | PASS (N1) |
| 04 | Números | stats stagger + count-up (3 alvos) | ✅ | `top 85%` vs `75%` (N1) | count-up assenta exato (55 mut/alvo), `EASE.out` ✅ | PASS (N1) |
| 05 | Galeria | header reveal + slots stagger + parallax `soft` (scrub loose) | ✅ | parallax `top bottom/bottom top` ✅ | `yPercent`, `SCRUB.loose` (1.5) numérico ✅ | **PASS** |
| 06 | Depoimentos | cards stagger sutil | ✅ | **`top 80%` = storyboard ✅** | `EASE.out`, stagger `base` ✅ | **PASS** |
| 07 | Preço fixo | count-up 280 | ✅ | `top 85%` vs `75%` (N1) | count-up ✅ | PASS (N1) |
| 08 | Planos | header + cards stagger + pop do "popular" + cross-fade preço | ✅ | `top 70%` (selo) ✅ | pop `scale .6→1` com **`EASE.pop` = back.out(2)** — desvio D1 **APROVADO** e canonizado (Fidelity XIA-71); cross-fade D2 fechado em 6ba34a7 | **PASS** |
| 09 | FAQ | `+` rotate + acordeão (ação do usuário) | ✅ | ação do usuário ✅ | Radix + CSS (fora da timeline GSAP, correto) ✅ | **PASS** |
| 10 | Final | H2 reveal + underline draw | ✅ | `top 85%` vs `80%` (N1) | underline via CSS (N2) | PASS (N1/N2) |

**Nenhum efeito ausente. Nenhuma substituição de tipo** (H1 é clip-path real, não fade chapado; nenhum reveal virou fade onde se pedia máscara; nenhum stagger com `from` errado; hair-draw e mark-brass DESENHAM — confirmado nos frames). `scrub` sempre numérico (0.5/1/1.5), nunca `true`. Ease `"none"` só em contexto de scrub (exceção sancionada pelo Storyboard §0). Ticker único Lenis+GSAP (assento `SmoothScrollProvider`).

## Achados (severidade × dono × evidência)
- **[LOW · não-bloqueante] N1 — start de trigger quase-uniforme.** Dono: `motion-engineer`. Reveals genéricos usam `ENTER = "top 85%"` onde o Storyboard §2 lista starts por seção (75%/70%/80%). Afeta §02/03/04/07/10; depoimentos (80%) já casa. **Ordem, hierarquia, tipo, ease e duração de TODOS preservados** — muda só o offset de cadência de entrada. Efeito presente e fiel → não dispara o gate 8 (substituição/ausência). **Arbitragem:** polimento opcional; se a barra de release quiser fidelidade canônica ao Storyboard, alinhar os 3 valores é trivial (o `motion-engineer` já se ofereceu). **Não bloqueia o GO.** Evidência: `video/A-desktop-1x.webm`, `frames/*-p025..p075.png`.
- **[LOW · não-bloqueante] N2 — underline `.mark-brass::after` é CSS-owned** (`animation-delay 0.28s`) em vez de dentro da timeline GSAP do H1 (Storyboard 0.4→0.65). Dono: `motion-engineer`. **Restrição real e legítima:** é pseudo-elemento; GSAP não alcança `::after` direto. Visualmente fiel (draw brass, ease dramatic) e já **aprovado no Fidelity Sign-off (XIA-71)**. Efeito presente → não dispara o gate 8. **Arbitragem:** se quiser acoplamento fino H1↔underline, migrar para var CSS dirigida por GSAP; opcional. **Não bloqueia o GO.** Evidência: `frames/A-desktop-1x-p000.png`.

## Gates duros — checagem final
| Gate | Resultado |
|---|---|
| Vídeo + FPS + LCP/CLS/INP + trace anexados | ✅ (4 vídeos, matriz completa, trace) |
| FPS p95 ≥ 55 em B **e** C (CPU 4x) | ✅ 60 / 60 |
| LCP < 2,5 s (todas as células) | ✅ 216/400/400 ms · LH mobile 2.1 s |
| CLS < 0,1 (todas as células) | ✅ ≤0.034 runtime · **0 no lab** |
| INP < 200 ms (interação real) | ✅ 104/96/80 ms |
| Hero legível sem JS / libs | ✅ SSR PASS |
| Passe reduce (SO + `?reduced=1`) | ✅ estático, CLS 0, 0 preso |
| Fidelidade (efeito ausente/diferente) | ✅ nenhum ausente/substituído |
| `scrub` numérico · só transform/opacity/clip-path | ✅ trace + código |
| Sabotagem sem estado quebrado | ✅ 5/5 (bfcache N/A no ambiente) |
| Sem resíduo de dev (markers/console/GSDevTools/canvas/leak WebGL) | ✅ markers 0 · canvas 0 · nenhum `console.log` de engine (só framework Next: "REFRESH FAILED"/"[HMR] connected") · WebGL default zero |

## Anexos obrigatórios (`qa/artifacts/xia72/`)
Vídeos por célula (`video/*.webm`) · frames p000/p025/p050/p075/p100 por célula (`frames/`) · trace da célula-gate B (`B-desktop-4x-trace.json.gz`) + sumários dos 4 (`trace-summary.json`) · Lighthouse CLI desktop+mobile (`lighthouse/`) · resultado do reduce (frames + vídeo `reduce-os`) · resultado da sabotagem (`sabotage.json` + `sabotage/*.png`) · tabela de fidelidade (acima) · FPS limpo (`fps-clean.json`) · matriz bruta (`results.json`).
> GIF de resumo: **não gerado** — o ffmpeg do sandbox (Playwright) é um build stripped sem muxer `gif`/`apng`/`mp4`, e não há ImageMagick/sharp. Substituído pelos **frames p000..p100 por célula** (mesma função de resumo scannável) + os **webm autoritativos** por célula.

## Destino
Entregue ao `head-of-quality` (Review Board). **Veredito APROVADO** → sem blocker de motion para o Readiness Report. Os 2 achados LOW (N1/N2) ficam roteados ao `motion-engineer` como polimento opcional — não travam a release. Só o Producer declara "pronto", no Release Checklist. O gate C→D de motion está **VERDE**.
