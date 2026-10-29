# Design — Tesoura 3D (Blender + tempo real)

## Context

- A tesoura atual vive dentro de `components/motion/motion-choreography.tsx` (seção 9,
  `scissorsRail`/`scissorsStatic` + markup SVG do rail, `hidden md:block`, `z-rail`=40).
  O rastro é um `div` de 1px revelado por `clip-path` acompanhando a tesoura; o curso é
  `rail.clientHeight - scissors.offsetHeight`, encurtado pela altura do footer.
- Seat `SCISSORS` em `motion-tokens.ts` (`snipDeg` 5, `snips` 16, `flipDeg` 180).
- Header sticky `z-nav`=50; barra de CTA mobile `z-sticky-cta`=60; `--header-h` 64px.
- Latão do DS: `--brass-400` `#D6A24E`. Fundo `--espresso-950` `#14110E`.
- Blender 5.2.2 instalado (`/Applications/Blender.app`), acessível em background pelo MCP
  (`execute_blender_code_for_cli`) ou pela CLI.
- README registra que libs WebGL foram removidas e só voltam "quando a fase WebGL for de
  fato ativada" — esta change é essa ativação.

Requisitos: ver `specs/scroll-scissors`.

## Goals / Non-Goals

**Goals:**
- Modelo reproduzível por script (não um .blend editado à mão sem rastro).
- Uma única cena WebGL, carregada sob demanda, que obedece aos mesmos gates de
  reduced-motion e breakpoint do resto do motion.
- Posição/escala/rotação calculadas por **função pura** testável a partir do scroll e do
  layout medido.

**Non-Goals:**
- React Three Fiber / drei (peso e camada React desnecessários para 1 objeto).
- Física, sombras projetadas na página, pós-processamento.
- Tesoura animada no modo reduced-motion.

## Decisions

### D1. Modelo gerado por script Blender
`assets/3d/scissors/build-scissors.py` monta a cena do zero (rodado com
`Blender --background --factory-startup --python build-scissors.py`) e salva
`assets/3d/scissors/scissors.blend` (fonte), `public/models/scissors.glb` e
`public/models/scissors-still.png` (render da pose de repouso, depois otimizado).
**Contrato do GLB** (o código web depende disso):
- Nós: `Scissors` (raiz) › `BladeL`, `BladeR`, `Rivet`.
- Origem de `BladeL`/`BladeR` no centro do rebite; lâminas no plano XY, pontas para −Y,
  anéis para +Y; abrir = girar `BladeL` em +Z e `BladeR` em −Z.
- Comprimento total normalizado = 1.0 unidade.
- Materiais PBR sem textura: `Brass` (base `#D6A24E`, metallic 1, roughness ~0.35) e
  `Steel` (metallic 1, roughness ~0.18). Reflexo vem do ambiente na web.
- ≤ 15 mil triângulos; compactação meshopt via `npx @gltf-transform/cli optimize`;
  GLB final ≤ 120 KB.
*Alternativas:* modelar à mão no Blender (sem reprodutibilidade); Spline (fora do pedido).

### D2. three.js puro, chunk sob demanda
`lib/three/scissors-scene.ts` cria renderer (alpha, `antialias`, DPR limitado por token),
cena, câmera em perspectiva com FOV baixo posicionada de modo que 1 unidade no plano z=0
= 1 px CSS (posicionar por pixels medidos no DOM), `RoomEnvironment` + PMREM para
reflexo (sem baixar HDR), `GLTFLoader` + `MeshoptDecoder`. Importado por `import()`
dinâmico após `load` + `requestIdleCallback` (fallback `setTimeout`).
*Alternativa:* R3F — rejeitada (peso, hidratação, um único objeto).

### D3. Um canvas fixo em tela cheia
`components/motion/scissors-stage.tsx` monta um `<canvas>` `position: fixed; inset: 0`,
`pointer-events: none`, `aria-hidden`, `z-rail` (abaixo do header e da barra de CTA).
Tamanho em tela cheia simplifica a transição hero→trilho (sem redimensionar canvas). A
imagem parada é exibida no lugar enquanto o 3D não carrega e faz crossfade (opacidade)
quando o primeiro quadro 3D sai.
*Alternativa:* canvas do tamanho da tesoura seguindo por transform — exige
redimensionar no meio da transição. Rejeitada.

### D4. Coreografia como função pura do scroll
`lib/motion/scissors-path.ts` recebe `{ scrollY, viewport, heroRect, anchorRect, railRect,
footerTop, direction, pointer }` e devolve `{ x, y, scale, rotX, rotY, rotZ, snipDeg }`.
Fases: `hero` (âncora `[data-scissors-anchor]` na borda do painel da agenda; escala
`heroLengthPx`), `transition` (interpolação com `EASE.standard` entre âncora e topo do
trilho, de `transitionStart` a `transitionEnd` do hero), `rail` (mesmo curso/ritmo da v2:
`snip = sin²(progress·snips·π)·snipDeg`, flip de `flipDeg` por direção, parada no topo do
footer), `mobile` (canto inferior direito acima da barra de CTA, `mobileLengthPx`).
O componente só mede o DOM em `refresh` do ScrollTrigger e chama a função por quadro.
Coberta por `vitest`.

### D5. Seat `SCISSORS` ampliado
Mantém `snipDeg`/`snips`/`flipDeg` e adiciona: `heroLengthPx` (220), `railLengthPx` (64),
`mobileLengthPx` (34, era 44; `mobileMarginPx` 8 e `mobileHalfWidthFrac` 0.18 a mantêm na
margem direita de 7vw, fora do conteúdo — pedido do dono, 2026-10-28), `heroSpinDegPerSec` (18), `pointerTiltDeg` (10),
`transitionStart`/`transitionEnd` (0.55/1.0 do hero), `maxDpr` (1.75). `snipDeg` no 3D
pode subir após revisão visual (anéis 3D não se cruzam como no SVG) — decisão do dono.

### D6. Render sob demanda + giro contínuo só no hero
Loop rAF **só** enquanto a fase é `hero` e a aba está visível (giro ambiente). Nas
demais fases, um quadro é pedido apenas em scroll (`ScrollTrigger` update) ou
`pointermove`. `visibilitychange` pausa tudo. Recursos são descartados (`dispose`) no
unmount.

### D7. Extração da tesoura da coreografia geral
A seção 9 de `motion-choreography.tsx` (funções + markup do SVG) sai para
`scissors-stage.tsx`; o rastro (`[data-scissors-line]` + clip) é mantido e passa a ser
dirigido pela mesma função pura (`y` da tesoura). Reduz o arquivo de coreografia (~536
linhas) e dá à tesoura um dono só.

### D8. Gates
`gsap.matchMedia` com `reduce`/`ok` × `isDesktop`: reduced → imagem parada no topo do
trilho + rastro inteiro (desktop) / nada (mobile). Sem WebGL (falha ao criar contexto) →
mesmo ramo estático. `?reduced=1` continua forçando o ramo estático.

### D9. QA
- `vitest` para `scissors-path.ts` (cada fase, limites, reversão, flip, snip).
- `qa/v3-scissors.mjs` (Playwright, `channel: "chrome"`): canvas existe após idle no
  desktop; pixels opacos ao redor da âncora no topo; tesoura no trilho a 50% do scroll;
  parada acima do footer; reduced → sem canvas e imagem parada visível; 390×844 → canto
  inferior direito acima da barra; clique atravessa; aba oculta → 0 quadros; peso dos
  requests da tesoura ≤ 300 KB; LCP comparado com a página sem a tesoura.
- Renders de revisão do modelo (3 ângulos) anexados ao PR.

## Risks / Trade-offs

- [Peso do three.js] → chunk dinâmico após idle; orçamento de 300 KB verificado no QA.
- [Canvas em tela cheia custa memória de GPU] → DPR limitado (`maxDpr`), `alpha` sem
  `preserveDrawingBuffer`, render sob demanda.
- [Tesoura grande cobrindo conteúdo do hero] → âncora posicionada na borda externa do
  painel; requisito de não cobrir título/subtítulo/formulário verificado no QA.
- [Modelo procedural parecer "de brinquedo"] → revisão visual em 3 ângulos antes de
  integrar; bevel nas arestas e roughness diferente entre latão e aço.
- [Divergência entre imagem parada e 3D no crossfade] → a imagem é renderizada do mesmo
  modelo, na mesma pose e câmera da fase inicial.
- [Celular fraco] → mesmo orçamento; se o primeiro quadro demorar > 1 s, mantém a imagem.

## Migration Plan

Commits: modelo (assets) → tokens + função pura + testes → cena three → stage + extração
da coreografia → mobile → fallback → QA. Rollback = reverter o commit do stage (a v2
volta a ter o SVG). README atualizado sobre a "fase WebGL".

## Open Questions

- Ângulo final de abertura (`snipDeg`) no 3D — ajuste visual com o dono, não muda specs.
