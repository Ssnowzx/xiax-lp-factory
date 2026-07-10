---
name: atlas-level-landing
description: >
  Receita para landing pages nível estúdio (dark premium + motion fluido estilo
  atlas.overlens.com.br). Use ao criar/evoluir LPs animadas: design system dark,
  padrões de motion GSAP/ScrollTrigger + Lenis, estrutura padrão de seções, stack
  Next.js e critérios de aceite (60fps, prefers-reduced-motion, Lighthouse ≥ 90).
---

# Atlas-Level Landing

Receita para construir landing pages **nível estúdio**: escuras, premium e — o mais
importante — **nascidas animadas**. A referência de motion é
[atlas.overlens.com.br](https://atlas.overlens.com.br). Uma LP bonita mas estática NÃO
passa nesta skill; o motion é o coração da entrega.

## Quando usar

- Criar uma LP nova que precisa parecer feita por um estúdio de motion.
- Evoluir uma LP estática ("v1 bonita mas parada") para uma versão animada ("v2").
- Sempre que o pedido citar: scroll suave, reveals on-scroll, parallax, hero encadeado,
  botões magnéticos, transições entre seções, contadores animados.

## Stack padrão

- **Next.js (App Router) + TypeScript**
- **Tailwind CSS** (design tokens dark via CSS variables)
- **Framer Motion** — reveals declarativos por componente, hover/tap states, layout.
- **GSAP + ScrollTrigger** — timelines encadeadas (hero), pin/scrub, parallax, contadores.
- **Lenis** — scroll suave global, sincronizado com o ScrollTrigger (`lenis.on('scroll', ScrollTrigger.update)` + `gsap.ticker`).
- Fontes: um display grotesk/serif premium + uma sans neutra para corpo.

> Regra de ouro: **anime `transform` e `opacity`** (compositáveis pela GPU). Evite animar
> `top/left/width/height/box-shadow` — causam layout/paint e derrubam os 60fps.

## Design system — dark premium

Paleta base (extraída do padrão Atlas — near-black + warm off-white):

```css
:root {
  --bg:        #080808; /* near-black, base */
  --bg-elev:   #0e0e0f; /* superfícies elevadas */
  --fg:        #ece9e3; /* warm off-white, texto principal */
  --fg-muted:  #8a877f; /* texto secundário */
  --line:      rgba(236,233,227,0.10); /* hairlines/borders */
  --accent:    #e6ff5c; /* acento vivo — ajuste à marca Xiax */
  --accent-2:  #6b5bff; /* acento secundário/gradiente */
}
```

- Fundo quase preto, tipografia off-white quente (não branco puro — evita "estourar").
- Muito espaço negativo, hierarquia por escala/peso, hairlines de baixa opacidade.
- Grão/noise sutil e gradientes radiais suaves para profundidade (baixo custo de paint).
- Contraste AA no texto de corpo; acento usado com parcimônia (CTAs e destaques).

## Padrões de motion REAIS (medidos no bundle do Atlas)

Atlas usa **GSAP + ScrollTrigger**. Estes são os valores reais observados — use-os como
defaults e crie tokens para não espalhar mágica pelo código.

### Easings (GSAP)
| Uso | Easing |
|-----|--------|
| Reveal padrão de seção | `power3.out` |
| Hero / movimentos fortes/longos | `power4.out` |
| Micro-interações (hover, botões) | `power2.out` / `power2.in` |
| Loops e toggles | `power2.inOut` / `power1.inOut` |

Equivalentes CSS/Framer (cubic-bezier):
```
power2.out  ≈ cubic-bezier(0.22, 1, 0.36, 1)
power3.out  ≈ cubic-bezier(0.16, 1, 0.30, 1)
power4.out  ≈ cubic-bezier(0.19, 1, 0.22, 1)
```

### Durations (segundos)
- Reveals de seção: **0.6 – 0.9** (blocos maiores até **1.1 – 1.2**).
- Hero encadeado: **0.8 – 1.2** por linha, sobrepostas.
- Micro-interações: **0.18 – 0.35** (hover ~0.22–0.25).

### Stagger
- Listas/grupos: **0.06 – 0.12** (mais dramático até **0.18**).

### Reveal on-scroll (o padrão-mãe)
```js
gsap.from(el, {
  autoAlpha: 0,      // opacity + visibility
  y: 24,             // 16–40px conforme o peso do elemento
  duration: 0.8,
  ease: "power3.out",
  scrollTrigger: {
    trigger: el,
    start: "top 78%", // dispara quando o topo do elemento chega a ~75–80% da viewport
    once: true,        // anima uma vez (não re-anima ao subir)
  },
});
```
`start` observados: `top 78%`, `top 72%`, `top 75–85%`. Para hero fold use `top bottom`.

### Parallax / scrub
```js
gsap.to(el, {
  yPercent: -12,       // deslocamento sutil
  ease: "none",
  scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: 0.6 },
});
```
`scrub: 0.6` dá a "inércia" suave característica (não use `scrub: true` cru — fica rígido).

### Hero encadeado (timeline)
```js
const tl = gsap.timeline({ defaults: { ease: "power4.out", duration: 1 } });
tl.from(".hero-eyebrow", { autoAlpha: 0, y: 16, duration: 0.6 })
  .from(".hero-title .line", { autoAlpha: 0, yPercent: 120, stagger: 0.1 }, "-=0.2")
  .from(".hero-sub", { autoAlpha: 0, y: 20 }, "-=0.6")
  .from(".hero-cta", { autoAlpha: 0, y: 16, duration: 0.6 }, "-=0.5");
```

### Botão magnético + hover
```js
// magnético: translada o botão em direção ao cursor com quickTo
const xTo = gsap.quickTo(btn, "x", { duration: 0.35, ease: "power3.out" });
const yTo = gsap.quickTo(btn, "y", { duration: 0.35, ease: "power3.out" });
// on mousemove: xTo(dx*0.3); yTo(dy*0.3)  | on leave: xTo(0); yTo(0)
```

### Contadores animados
```js
gsap.from(counter, {
  textContent: 0, duration: 1.4, ease: "power2.out", snap: { textContent: 1 },
  scrollTrigger: { trigger: counter, start: "top 85%", once: true },
});
```

## Estrutura padrão de LP

1. **Nav** minimalista (logo + CTA), fica sticky com blur ao rolar.
2. **Hero** — eyebrow + título em linhas (reveal por linha) + subtítulo + CTA + micro-parallax.
3. **Prova/logos** ou tagline de posicionamento.
4. **O que fazemos / Serviços** — grid com reveal em stagger.
5. **Como funciona / Processo** — passos numerados, reveal sequencial.
6. **Métricas** — contadores animados.
7. **Depoimentos / Cases**.
8. **CTA final** — bloco forte, botão magnético.
9. **Footer**.

## Integração Lenis + GSAP (obrigatória)

```js
const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
```

## prefers-reduced-motion (não negociável)

```js
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (reduce) {
  // não instanciar Lenis; ScrollTrigger sem parallax; reveals viram estado final (opacity:1)
}
```
Com Framer Motion, respeite `useReducedMotion()` e degrade reveals para `initial={false}`.

## Critérios de aceite

- [ ] Scroll suave global (Lenis) sincronizado com ScrollTrigger, sem travar.
- [ ] Toda seção tem reveal on-scroll com stagger e easing suave (`power3.out`, `once:true`).
- [ ] Hero com entrada encadeada (timeline) + micro-parallax.
- [ ] Botões magnéticos / hover states refinados.
- [ ] Transições entre seções + ao menos um bloco de contadores animados.
- [ ] **60fps** no scroll (só `transform`/`opacity`), sem jank em mobile.
- [ ] `prefers-reduced-motion` respeitado (motion desligado com graça).
- [ ] Responsivo, mobile impecável.
- [ ] **Lighthouse Perf & Best-Practices ≥ 90**.
- [ ] Copy de posicionamento: "software e soluções de IA para empresas" (NÃO "feito com IA").

## ⚠️ Regra de ouro dos reveals (aprendida do jeito difícil)

**NUNCA esconda o conteúdo por padrão dependendo de JS para revelar.** Se você usa
`initial={{opacity:0}}` (Framer `whileInView`) ou `gsap.from({autoAlpha:0})` como base, e a
revelação não dispara no build deployado (observer/Lenis/hidratação), a página abre **EM
BRANCO** — conteúdo no DOM mas invisível. Aconteceu na Xiax v2: hero (GSAP imperativo)
aparecia, mas todas as seções abaixo (Framer `whileInView`) ficavam presas em `opacity:0`.

**Padrão correto — progressive enhancement (o que consertou):**
1. CSS: conteúdo **visível por padrão** (`.reveal{opacity:1}`).
2. O estado escondido só existe sob `html.anim-ready`, uma classe que um **script pre-paint
   no topo do `<body>`** adiciona SOMENTE se há JS e `prefers-reduced-motion` está off.
3. Revelação via **IntersectionObserver nativo** setando `[data-revealed="true"]` (dispara
   inclusive para o que já está na viewport no load). Stagger por CSS `nth-child`.
4. Sem JS / com erro / reduced-motion → nunca vira `anim-ready` → tudo visível. Failsafe real.

Isso também remove a incerteza de `whileInView` + smooth-scroll (Lenis): não dependa de
detecção de viewport de lib de animação para *mostrar* conteúdo — só para *realçar*.

**E TESTE NA URL DEPLOYADA, não só `next build`.** Build passar não garante página
funcionando. QA visual real (Chrome) na URL pública, desktop E mobile, rolando até o fim.

## Anti-padrões

- **Conteúdo escondido por padrão (opacity:0) dependente de JS pra aparecer** → risco de
  página em branco. Use progressive enhancement (regra de ouro acima).
- Animar layout properties → jank. Só `transform`/`opacity`.
- `scrub: true` cru (rígido) — prefira `scrub: 0.5–0.8`.
- Reveals que re-disparam ao subir (esqueceu `once:true`).
- Motion sem `prefers-reduced-motion`.
- Branco puro `#fff` sobre preto puro `#000` — cansa a vista; use warm off-white.
- Esquecer `gsap.context()` / cleanup no unmount (Next.js re-render).

## Notas de implementação (aprendido na Xiax LP v2 — o que funcionou)

Padrões validados em produção (deploy Vercel, `next build` limpo, First Load ~172 kB):

- **Divisão de responsabilidades que funcionou bem:**
  - **Framer Motion** (`whileInView` + `variants`) para reveals declarativos por seção e
    stagger — menos código que ScrollTrigger e SSR-safe. `useReducedMotion()` para degradar.
  - **GSAP + ScrollTrigger** só onde precisa de timeline/scrub: hero encadeado, parallax
    (`scrub`), linha de progresso (`scaleX`) e contadores. Sempre em `useEffect` +
    `gsap.context(...)` com `return () => ctx.revert()`.
  - **Lenis** num provider client único no `layout`; registrar `ScrollTrigger` uma vez.
- **Contador robusto:** anime um objeto `{v:0}` com `snap:{v:1}` e escreva em
  `el.textContent` no `onUpdate` (não anime `textContent` direto — evita NaN/flicker).
- **Botão magnético:** só ativar em `(hover:hover) and (pointer:fine)` e fora de
  reduced-motion; `gsap.quickTo` para x/y, resetar para 0 no `mouseleave`.
- **Título mascarado por linha:** cada linha num `span` com `overflow:hidden` e um `span`
  interno; anime `yPercent:120→0` com stagger. Efeito "sobe de dentro" barato e limpo.

### Gotchas de build (Next 14 + Tailwind) que já custaram tempo — evite:
- **`NODE_ENV=production` faz o `npm install` PULAR devDependencies** (tailwind, typescript,
  postcss somem → build quebra com "Cannot find module 'tailwindcss'"). Instale com
  `npm install --include=dev` (ou `NODE_ENV=development`).
- **Opacity modifier em cor via `var()`** (`bg-bg/70`, `border-fg/40`) **não compila** se o
  token é `var(--x)` cru. Ou defina tokens como `rgb(var(--x-rgb) / <alpha-value>)`, ou use
  valor arbitrário (`bg-[rgba(8,8,8,0.72)]`). Simplest: evite o modifier nesses tokens.
- **Next 14.2.5 tem CVE** — use ≥ 14.2.35 (patched) na linha 14.2.x.
- `next/font/google` baixa a fonte no build → precisa de rede no ambiente de build.

### Deploy Vercel (headless, sem interação):
`npx vercel@latest deploy --yes --scope <team> --token $VERCEL_TOKEN`. Em modo não
interativo o CLI **exige `--scope <team>`** (não assume default). A URL de alias limpa
(`<projeto>.vercel.app`) sai pública; a URL com hash do time pode ficar atrás de SSO (302).

## Assinatura Atlas — hero pinned + decode dirigido pelo scroll (validado)

O efeito-âncora de uma LP nível Atlas: o título colossal fica **pinado** no centro e cada
caractere **decodifica de glifo-fantasma → texto real conforme o progresso do scroll**.

- `ScrollTrigger.create({ trigger, start:"top top", end:"+=140%", pin:true, pinSpacing:true,
  scrub:1, anticipatePin:1, invalidateOnRefresh:true, onUpdate: self => setProgress(self.progress) })`.
  **Nunca `scrub:true`** — use `scrub:1` (0.5–1.5) p/ suavizar.
- O decode não é timeline no tempo; é um `setProgress(0→1)` escrito pelo `onUpdate`. Exponha
  via `useImperativeHandle` (o hero escreve ~60x/s; não re-renderize React por frame).
- Cor por char: ghost `#242424` → `--fg` com `transition: color .18s` (o "acender" suave).
- Grade ASCII: **camada global fixa** (`position:fixed; inset:0; -z-10; pointer-events:none;
  aria-hidden`) montada 1x no layout, **opacity ~0.12** (0.05 é invisível), rAF ~24fps, DPR≤1.5.
- `document.fonts.ready.then(ScrollTrigger.refresh)` — a fonte gigante muda a altura do pin.

### Gotchas de reflow que causam overlap + CLS (custaram uma rodada)
- **Overlay do scramble deve HERDAR a fonte do heading** (`font-family: inherit`). Forçar
  monospace faz o overlay quebrar em mais linhas que o texto real → transborda a caixa e
  sobrepõe o conteúdo abaixo.
- **Cascata:** uma classe de componente `.scramble{display:inline-block}` pode vir **depois**
  do utilitário `.block` no CSS compilado e vencer (mesma especificidade) → as linhas fluem
  inline e se sobrepõem. Force com **inline-style** (`style={{display:"block"}}`), que vence classes.
- Dimensione o título p/ **caber na viewport** (`clamp` + `max-w-[16ch]`): hero centralizado
  que estoura 100vh sobrepõe subtítulo/CTA.

## QA de Motion — screenshots NÃO validam animação (obrigatório)

Use **Playwright + Chromium** com `reducedMotion:"no-preference"`, grave **vídeo** e capture
frames em **0/0.25/0.5/0.75/1** do scroll; meça **LCP/CLS**. Depois rode `reducedMotion:"reduce"`
só p/ validar o fallback. Sem vídeo/frames, **não aprove**. Harness de referência: `qa/motion-qa.mjs`.
- Ambientes de QA headless/extensão podem **forçar `prefers-reduced-motion`** — aí você só vê o
  fallback estático. Playwright deixa você escolher `no-preference` e ver o motion de verdade.
- CLS de hero pinado sobe com scroll sintético (o pin dispara); lab do Lighthouse não rola.
  Meça, mas separe o artefato do harness do CLS real.
- Servir local p/ QA: `next start -pNNNN` numa **porta nova a cada rebuild** (sem `pkill` no
  sandbox, servidores velhos servem HTML com hash de CSS antigo → página sem estilo). Confirme
  `curl <css-url>` = 200 antes de confiar nos frames.
