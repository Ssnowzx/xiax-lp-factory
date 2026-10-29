# Tasks

## 1. Modelo no Blender

- [x] 1.1 Escrever `assets/3d/scissors/build-scissors.py` (lâminas+anéis+rebite, materiais Brass/Steel, contrato de nós/origens do D1) e rodar em background; verificar no relatório do script: nós `Scissors/BladeL/BladeR/Rivet`, origem das lâminas no rebite, comprimento 1.0, ≤ 15 mil triângulos
- [x] 1.2 Renderizar 3 ângulos de revisão + a imagem parada da pose de repouso; verificar visualmente metal crível, anéis sem interpenetração com as lâminas abertas no `snipDeg` máximo
- [x] 1.3 Exportar GLB e compactar com `npx @gltf-transform/cli meshopt --level medium --quantize-normal 12` (o `optimize` achata os nós-pivô e o nível `high` reduz as normais a 8 bits, o que estraga o reflexo do metal); verificar `gltf-transform inspect` sem erros e arquivo ≤ 120 KB em `public/models/scissors.glb` — 72 KB, 11.042 triângulos

## 2. Matemática e tokens

- [x] 2.1 Ampliar o seat `SCISSORS` em `lib/motion/motion-tokens.ts` (D5) com justificativa; verificar `npx tsc --noEmit`
- [x] 2.2 Escrever testes de `lib/motion/scissors-path.ts` (fase hero, transição em 0/0.5/1, trilho topo/meio/fim, flip por direção, snip, mobile acima da barra de CTA) e vê-los falhar; verificar `npm test` vermelho pelos motivos certos
- [x] 2.3 Implementar `lib/motion/scissors-path.ts` até passar; verificar `npm test` verde e cobertura ≥ 80% no módulo

## 3. Cena three.js

- [x] 3.1 Adicionar `three` e `@types/three`; verificar instalação e que `three` só aparece num chunk dinâmico no `npm run build` (não no first-load JS da rota `/`)
- [x] 3.2 Implementar `lib/three/scissors-scene.ts` (renderer com DPR limitado, câmera px-para-unidade, RoomEnvironment, GLTFLoader+Meshopt, `setPose`, render sob demanda, `dispose`); verificar numa página de teste local que a tesoura renderiza com reflexo e as lâminas abrem por `setPose`

## 4. Stage e coreografia

- [x] 4.1 Adicionar a âncora `[data-scissors-anchor]` na borda do painel da agenda em `components/sections/hero.tsx`; verificar que não altera o layout (screenshot igual)
- [x] 4.2 Implementar `components/motion/scissors-stage.tsx` (canvas fixo, import após idle, imagem parada com crossfade, ScrollTrigger + função pura, ponteiro, rAF só no hero, pausa em aba oculta) e extrair a seção 9 de `motion-choreography.tsx` mantendo o rastro; verificar no navegador as fases hero → transição → trilho → parada no footer, ida e volta
- [x] 4.3 Ramo mobile (< md: canto inferior direito acima da barra de CTA); verificar a 390×844 que a tesoura não cobre a barra e abre/fecha com o scroll
- [x] 4.4 Ramos estáticos (reduced, `?reduced=1`, sem WebGL); verificar imagem parada no topo do trilho com rastro inteiro no desktop e nada no mobile

## 5. Integração e verificação

- [x] 5.1 Escrever `qa/v3-scissors.mjs` (checks do D9) e rodar contra `next start`; verificar todos verdes, incluindo peso ≤ 300 KB e LCP ≤ +100 ms
- [x] 5.2 Atualizar o README (fase WebGL ativada, como regenerar o modelo); verificar que o comando documentado de regeneração roda como escrito
- [ ] 5.3 Rodar `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build`, `qa/a11y-axe.mjs` e `qa/fps-clean.mjs`; verificar tudo verde e sem `console.log` novo
  - tsc, test, build, axe (0 violações) e fps-clean (p95 60 fps em todas as células) verdes. `npm run lint` não roda: o projeto não tem ESLint configurado.

## Workflow follow-up

- Dono revisa ângulo de abertura e tamanho no hero antes de publicar.
- Arquivar a change após aprovação (`/opsx:archive`).
