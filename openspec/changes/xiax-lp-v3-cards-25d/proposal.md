# Proposal — Xiax LP v3 · Cards 2.5D + superfície de couro

## Why

A v2 já tem reveals, rough-notation e o trilho da tesoura, mas o dono avaliou a página
como **"muito estática"**: as superfícies são planas (cards, painel da agenda, galeria) e
o fundo é uma cor chapada. A v3 dá **profundidade** (2.5D) às peças que vendem — agenda,
preço, galeria e modelos — sem trocar o funil nem o posicionamento.

## What Changes

- **Card com profundidade (primitivo único)**: camadas internas em alturas diferentes
  (`translateZ`) + inclinação (`rotateX/rotateY`) + reflexo de latão. Desktop segue o
  mouse; touch inclina pelo scroll; `prefers-reduced-motion` → plano e sem reflexo.
- **Hero · painel da agenda** vira o card mais profundo: estatísticas, horários e
  lembretes de WhatsApp em camadas; horários se "montam" vindo do fundo na abertura.
- **Preços**: os 4 planos e o bloco "Preço fixo" viram cards com profundidade; preço e
  ícone de latão do plano na camada mais alta; "Mais popular" sempre um nível acima.
- **Galeria em camadas**: 6 fotos novas geradas no Gemini (AGY), cada uma com pessoa e
  fundo em camadas separadas; o fundo anda mais devagar que a pessoa no scroll.
  **Gate de viabilidade**: 1 foto de teste antes das 6; se a separação não convencer,
  cai para foto inteira com zoom/parallax interno.
- **Modelos**: as 4 opções viram cards que inclinam; a prévia vira um **baralho**
  (demais modelos empilhados atrás) e a escolhida vem à frente com giro curto.
- **Fundo de couro**: textura de couro de cadeira de barbeiro, gerada no Gemini (2–3
  variações para o dono escolher vendo), aplicada bem apagada no fundo da página.
- **Ícones de latão por plano** (Gemini): tesoura (Corte), navalha (Corte + Barba),
  pente (Premium), coroa (VIP).
- **Remoção da seção "O que os donos falam"** (`#depoimentos`) até existirem relatos
  reais. O componente fica no repo para voltar quando houver conteúdo.

## Capabilities

### New Capabilities
- `depth-cards`: superfícies 2.5D da landing — o primitivo de card com profundidade e
  sua aplicação no painel da agenda, nos preços, na galeria em camadas e nos modelos.
- `page-surface`: o fundo texturizado da página (couro) e seus limites de peso/contraste.
- `landing-page`: composição da página — adiciona a regra de não renderizar prova social
  sem conteúdo real. A capability também é introduzida pela change `xiax-lp-v2-motion`
  (ainda não arquivada, sem spec principal em `openspec/specs/`); aqui só entra um
  requisito ADICIONADO.

### Modified Capabilities
- Nenhuma (não há specs principais arquivadas em `openspec/specs/`).

## Impact

- **Código**: `components/motion/` (novo primitivo + coreografia), `lib/motion/motion-tokens.ts`
  (novo seat `DEPTH`), `components/ui/agenda-mock.tsx`, `components/sections/{planos-table,preco-fixo,galeria,modelos}.tsx`,
  `components/modelos/*`, `app/page.tsx`, `app/globals.css`, `lib/data/{gallery,plans}.ts`.
- **Assets**: `assets/gallery-src/` (novos masters em camadas), `assets/textures-src/`,
  `assets/icons-src/`; otimizados para `public/` por script `sharp` (padrão de
  `scripts/optimize-gallery.mjs`).
- **Dependências**: nenhuma nova em runtime (usa GSAP já instalado). Dev: `vitest` para
  testar a matemática pura de inclinação/profundidade.
- **Ferramentas externas**: AGY CLI (sub-agente gerador de imagem do Gemini) para os
  assets. Imagens geradas são ilustrativas — a página já sinaliza o que é exemplo.
- **Risco**: separar pessoa/fundo nas fotos geradas (mitigado pelo gate de 1 foto).
