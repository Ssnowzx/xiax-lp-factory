# Proposal — Xiax LP v3 · Tesoura 3D (Blender + tempo real)

## Why

A tesoura ligada ao scroll é a assinatura visual pedida pelo cliente (últimas 5 mudanças
da v2 foram ajustes nela), mas hoje é um SVG de traço fino de ~28px na borda — passa
despercebida e reforça a sensação de página "estática". A v3 transforma a tesoura num
**objeto de metal real**, modelado no Blender, que abre a página no hero e depois corta
a página pela lateral.

## What Changes

- **Modelo 3D no Blender**, gerado por script versionado (reproduzível): duas lâminas com
  anéis + rebite, lâminas girando no pivô; anéis em latão escovado, lâminas em aço polido.
  Exporta um GLB compactado e uma imagem parada do mesmo modelo.
- **Renderização em tempo real** (three.js, sem React Three Fiber) numa única área de
  desenho transparente, carregada **depois** da primeira tela.
- **Coreografia em 3 momentos**: (1) hero — grande, sobre a borda do painel da agenda,
  girando devagar e inclinando para o mouse; (2) transição — encolhe e desliza até o
  trilho ao sair do hero; (3) trilho — mantém o comportamento atual (desce cortando,
  rastro à frente, abre/fecha, vira ao subir, para no topo do rodapé).
- **Celular**: tesoura pequena no canto inferior direito, acima da barra fixa de CTA,
  abrindo e fechando com o scroll.
- **Fallback**: reduced-motion ou sem WebGL → imagem parada (trilho com a linha inteira,
  como hoje).
- **Remoção** do SVG atual da tesoura (a linha do rastro continua).

## Capabilities

### New Capabilities
- `scroll-scissors`: a tesoura decorativa ligada ao scroll — aparência, coreografia
  hero→trilho, resposta ao ponteiro, comportamento no celular, fallback e orçamento de
  performance.

### Modified Capabilities
- Nenhuma (não há specs principais arquivadas; a tesoura da v2 não tinha requisito em spec).

## Impact

- **Código**: novo `components/motion/scissors-stage.tsx`, `lib/motion/scissors-path.ts`
  (matemática pura), `lib/three/scissors-scene.ts`; extração da lógica de tesoura de
  `components/motion/motion-choreography.tsx`; seat `SCISSORS` ampliado em
  `lib/motion/motion-tokens.ts`; âncora no hero (`components/sections/hero.tsx`).
- **Assets**: `assets/3d/scissors/` (script Blender + .blend fonte), `public/models/`
  (GLB + imagem parada).
- **Dependências**: `three` (runtime, em chunk carregado sob demanda) e `@types/three`
  (dev). Reativa a "fase WebGL" prevista no README — README é atualizado.
- **Ferramentas**: Blender 5.2 em modo background (CLI/MCP); `@gltf-transform/cli` via
  `npx` para compactar o GLB (não vira dependência do projeto).
- **Performance**: +~300 KB transferidos no máximo, todos fora do caminho crítico.
- **Depende de** `xiax-lp-v3-cards-25d` só no posicionamento: a âncora do hero fica na
  borda do painel da agenda (que vira card com profundidade). Pode ser implementada em
  paralelo.
