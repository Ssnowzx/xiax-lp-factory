# QA Report (Motion) — LP Xbarber Flagship — Addendum **R2** — 2026-07-09 — commit `d2671d7`
Preview: `next start` prod @ http://localhost:3185 (build de produção do HEAD `d2671d7`) · Review Board round: **R2 (re-verificação)** · Technical Storyboard: `storyboard` @ XIA-61 · Baseline: **XIA-72 (GO, `6ba34a7`)**

> **Motivo do R2:** XIA-82 (`b1fb4d8`+`0793fc9`) mudou o *timing* de init — GSAP/Lenis agora inicializam **pós-LCP** via seam `useAfterPaint` (double rAF + `requestIdleCallback`, cap 200ms); `<DeferredMotionChoreography/>` só monta pós-paint. Efeito/tokens ditos inalterados. **Provei com vídeo, FPS p95, LCP/CLS/INP, trace e sampler por-frame.**

---

## Veredito R2: **REPROVADO (NO-GO)**
Regra de ouro cumprida (vídeo por célula + FPS p95 + LCP/CLS/INP + trace anexados ⇒ veredito VÁLIDO).

**1 blocker duro:** o adiamento do init introduziu um **flash perceptível do sub-headline do hero** — o `<p>` (LCP-region, **sem classe `.reveal`**) pinta em opacidade cheia, fica **visível 167 ms (CPU 1×) a 1.299 ms (CPU 4×)** e então o `heroTimeline` roda `fromTo(sub, {autoAlpha:0}, …)` com `immediateRender:true`, que o **corta para invisível** e só depois revela. Isso **falha o critério explícito do issue**: "hero anima ~1 frame após o paint **sem flash/salto perceptível**". Piora sob throttle. Owner: **motion-engineer** (com coordenação do **nextjs-arquiteto**).

Todo o resto **passou e casa com/supera o baseline XIA-72** (FPS 60/60/60, reveals/loop/parallax/count-up intactos, reduced/sabotagem/teardown verdes, Lighthouse desktop 100). O único gate que falha é o flash do hero — mas ele é suficiente para NO-GO.

---

## Matriz de execução (uma linha por célula, cada uma com seu vídeo)
FPS p95 vem de passada **LIMPA** (`qa/fps-clean.mjs`, scroll contínuo in-page dispatchando `wheel`→Lenis no mesmo rAF, sem screenshots poluindo o p95). LCP/CLS/INP e trace vêm da passada instrumentada (`qa/motion-qa-adversarial.mjs`).

| Célula | Viewport | CPU | FPS p95 (limpo) | FPS p99 | %frames>18ms | LCP | CLS | INP | Vídeo | Trace |
|---|---|---|---|---|---|---|---|---|---|---|
| **A** ref | 1440×900 | 1× | **60** | 60 | 0% | 228 ms | 0.0207 | 64 ms | `adversarial/A-desktop-1x.webm` | `adversarial/A-desktop-1x-trace.json` |
| **B** | 1440×900 | 4× | **60** | 60 | 0% | 352 ms | 0.0098 | 112 ms | `adversarial/B-desktop-4x.webm` | `adversarial/B-desktop-4x-trace.json` |
| **C** | 390×844 DPR3 touch | 4× | **60** | 60 | 0% | 520 ms | 0.0165 | 48 ms | `adversarial/C-mobile-4x.webm` | `adversarial/C-mobile-4x-trace.json` |

**Gate:** FPS p95 ≥ 55 em B **e** C ✅ (60/60, **=baseline XIA-72**) · LCP runtime < 2,5 s ✅ · CLS < 0,1 ✅ · INP < 200 ms ✅. Nenhuma regressão de FPS/vitals runtime pelo adiamento — ao contrário, o LCP runtime da célula C (mobile, motion ativo) = **520 ms**, provando que o motion **não** atrasa o LCP.

**Lighthouse CLI** (Chromium do Playwright, `--disable-dev-shm-usage`, mediana de 3):
- **Desktop: Perf 100** (runs 100/100/100 · LCP 585/639/641 ms · CLS 0 · TBT 25/31/47 ms). ✅ = baseline.
- **Mobile: Perf 96** (runs 84/97/96 · LCP 2757/2283/2652 ms · **mediana LCP 2.652 ms** · CLS 0 · TBT 463/125/107 ms). ⚠️ **LCP lab mobile mediana > 2,5 s** — porém é o **teto de hidratação conhecido, NÃO-motion**, já rastreado (Perf Report XIA-76 NO-GO → fixes XIA-81; carry-forward do **nextjs-arquiteto**). O CWV de **campo** é verde; o LCP **runtime** com motion ativo é 520 ms. **Não é regressão de motion** — se algo, o adiamento ajuda esse número. Reportado por transparência; fora do escopo do meu blocker de motion.

Relatórios: `lighthouse/lh-desktop-{1,2,3}.json` · `lighthouse/lh-mobile-{1,2,3}.json`. Consolidado: `SUMMARY.json`.

---

## 🔴 BLOCKER — Flash do sub-headline do hero (regressão do adiamento)
**Prova por-frame** (`qa/xia85-hero-flash.mjs` → `hero-samples-cpu1x.json`), sampler rAF injetado ANTES da navegação lendo `getComputedStyle(sub).opacity` em TODO frame:

```
CPU 1×  (LCP element medido = H1.text-balance @ 196 ms — o SUB não é o LCP)
 t=  76 ms  sub=1.000  live=0   ← sub-headline PINTADO, plenamente visível (CSS nunca o esconde: sem .reveal)
 t=  98 ms  sub=1.000  live=0   ← visível por múltiplos frames (não é artefato de mesmo-frame)
 t= 243 ms  sub=0.000  live=1   ← gsap-live LIGA → immediateRender aplica autoAlpha:0 → CORTE p/ invisível
 t=243–460  sub=0.000           ← mantido invisível ~350 ms (timeline pos 0.35s)
 t= 607 ms  sub=0.045  live=1   ← só AGORA começa a reaparecer (fade-in DUR.reveal)
```
`flashWindowMs` (visível-antes-de-sumir): **167 ms @ CPU 1×** · **1.299 ms @ CPU 4×** (`hero-samples-cpu4x.json`). Sob throttle o usuário LÊ o sub-headline por até ~1,3 s e ele então **pisca para fora** e refaz a entrada. `flashDetected:true` nas duas células. **CLS = 0** (sem shift — `autoAlpha` mexe em opacity/visibility, não em layout), mas o gate falho é o **flash**, não CLS.

**Evidência visual:** `video/hero-cpu1x.webm`, `video/hero-cpu4x.webm` (gravam os pixels reais do flash); stills `flash-frames/` (`DROP-a-visible-prelive.png` = sub visível pré-gsap-live; `DROP-c-revealed-final.png` = final).

**Causa-raiz:** o `<p>` do hero (`components/sections/hero.tsx`) é o ÚNICO alvo de entrada do hero **sem** classe `.reveal` — então o tier CSS `html.anim-ready:not(.gsap-live) .reveal{opacity:0}` **não** o pré-esconde; ele pinta cheio. Quando a coreografia monta pós-paint, `heroTimeline` (`components/motion/motion-choreography.tsx:135`) faz `fromTo(sub,{autoAlpha:0,y:12},…,0.35)` com `immediateRender` default `true` → arranca o elemento já-pintado para 0. Antes do XIA-82 o init acontecia na hidratação (janela de visível ≈ 0); o adiamento **alarga** essa janela e torna o flash perceptível/reprodutível.

**Fix recomendado (barato, sem custo de LCP — o LCP é o H1, não o sub):**
- Opção A (preferida): dar ao `<p>` do hero o tratamento de reveal do tier CSS (classe `.reveal` ou pré-hide equivalente sob `html.anim-ready:not(.gsap-live)`), assim ele começa oculto como todo reveal e o GSAP assume sem corte. Zero impacto no LCP (H1 é o LCP).
- Opção B: quando montar pós-paint, animar o sub a partir do estado ATUAL (`immediateRender:false` / `.from` guardado / `fromTo` sem yank) para nunca piscar.
Ambos precisam manter H1 (autoAlpha:1, sem flash — OK hoje) e o `y` de entrada.

---

## Hero sem JS / libs bloqueadas (`qa/sabotage.mjs`)
- **SSR puro (`javaScriptEnabled:false`):** **PASS** — H1 visível `opacity:1`, 0 reveals presos (`noJS.verdict=PASS`).
- **Libs de motion abortadas por rota:** **PASS** — página legível, sem conteúdo preso (prova honesta do fallback é o SSR sem-JS; libs estão em chunks Next hasheados).

## Passe reduce (obrigatório) (`qa/motion-qa-adversarial.mjs` + `qa/sabotage.mjs`)
- **Contexto `reducedMotion:'reduce'` (gate do SO):** **PASS** — estado final estático/legível, **`invisibleReveals:0`**, **CLS 0**, sem loop/parallax; sem init de motion (branch `reduce` do `matchMedia` retorna cedo). Vídeo `adversarial/reduce-os.webm`.
- **Flag explícita `?reduced=1`:** **PASS** — mesmo branch estático (hero visível, 0 preso).
- **Efeitos sem branch reduced explícito:** nenhum.

## Bateria de sabotagem (5 ataques × critério de recuperação) — `sabotage/` + `qa/sabotage.mjs`
1. **Scroll violento pré-hidratação:** **PASS** (0 preso topo/fundo, hero legível).
2. **Resize em animação:** **PASS** (0 preso, 0 pin-spacer — coreografia não usa pin).
3. **Back/forward + bfcache:** **N/A reproduzível** — LP single-route (App Router client-side); teardown exercitado por refresh/resize/toggle. Registrado como não reproduzível, não como falha.
4. **Aba em background e volta:** **PASS** (sem estado quebrado, hero alcançável; loop pausa fora da viewport via `toggleActions` + ticker único `lagSmoothing(0)`).
5. **Refresh a ~50%:** **PASS** (`restoredScrollY≈4235`, reveals acima do viewport visíveis, 0 preso).

## Teardown SPA-safe (`qa/xia85-teardown.mjs`) — **PASS**
5 ciclos de flip `reduce↔no-preference` (exercita `stop()/start()` do Lenis + `mm.revert()` da coreografia): pin-spacers **sempre 0**, markers **sempre 0**, scroll funcional após ciclos, **0 reveal preso**. Sem leak de ticker/ScrollTrigger observável. (`ScrollTrigger.getAll()` não exposto em `window` — bundled; usei invariantes de DOM, consistente com o método do baseline.)

## Efeitos "inalterados" — verificados intactos pós-adiamento (`qa/`)
| Efeito | Prova | Status |
|---|---|---|
| Reveals de bloco/grupo | fps-clean `stuckAtBottom:0` nas 3 células; scroll completo 0 preso | ✅ intacto |
| Loop "vivo" (`[data-agenda-pulse]`) | 7 transforms distintos in-view (scale ~1.07 oscilando via ticker GSAP); `--dur-loop=2.4s` | ✅ animando |
| Parallax mockup + galeria | 6 `.media-frame` com transform ativo (scrub) | ✅ intacto |
| Count-up (5 alvos) | valores finais `2.000 / 70 / 98 / 2.000 / 280` assentados | ✅ intacto |
| H1 mask-in | `autoAlpha:1` no from → **sem flash** (só o sub flasha) | ✅ intacto |

## Higiene de produção
Sem `markers` (`.gsap-marker-*`=0 em todas as passadas), sem GSDevTools, sem canvas/WebGL leak (0 canvases). ✅

---

## Achados (severidade × owner × evidência)
- **[REJECT · BLOCKER]** Hero — flash do sub-headline pós-adiamento — owner: **motion-engineer** (coord. **nextjs-arquiteto**) — evidência: `hero-samples-cpu1x.json` (1.000→0.000 em `gsap-live`), `hero-samples-cpu4x.json` (janela 1.299 ms), `video/hero-cpu{1,4}x.webm`. Fix: pré-hide do `<p>` do hero via tier CSS reveal OU `immediateRender:false`.
- **[INFO · não-motion, carry-forward]** LCP lab mobile mediana 2.652 ms > 2,5 s — owner: **nextjs-arquiteto** (já rastreado em XIA-76/81; campo verde; LCP runtime motion-ativo=520 ms). NÃO é regressão de motion; fora do meu blocker.

## Anexos obrigatórios
Vídeos por célula (`adversarial/*.webm`) + vídeos do hero (`video/hero-*.webm`) · frames `adversarial/frames/` + stills do flash `flash-frames/` · traces `adversarial/*-trace.json` · Lighthouse desktop+mobile (`lighthouse/`) · reduce (`adversarial/reduce-os.webm`) · sabotagem (`sabotage/` + log) · teardown · sampler por-frame do hero (`hero-samples-*.json`) · consolidado `SUMMARY.json`. *(GIF de resumo não gerável: ffmpeg do sandbox é stripped sem encoder gif — webm+frames cobrem a evidência visual, idem baseline XIA-72.)*

## Destino
Entregue ao **head-of-quality** (Review Board R2). REPROVADO → **blocker** no Readiness Report; fix roteado a **motion-engineer** (issue-filha com blocker). Só o Producer declara "pronto", no Release Checklist — entrego evidência, não a release.
