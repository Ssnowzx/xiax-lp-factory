# Design — Cards 2.5D + superfície de couro

## Context

- Seções são **Server Components**; o motion é aplicado por um controlador cliente que
  encontra alvos por `data-*` (`components/motion/motion-choreography.tsx`, montado via
  `deferred-motion-choreography.tsx`). Markup estável + `data-*` é o contrato com o motion.
- Reveals são CSS (`Reveal` → `.reveal` / `.reveal-group` sob `html.anim-ready`) e
  **resetam `transform`** do elemento revelado — por isso o "Mais popular" sobe por
  `margin`, não por `translate` (comentário em `planos-table.tsx`).
- Números de motion moram só em `lib/motion/motion-tokens.ts` (seats `DUR`, `EASE`,
  `SCRUB`, `PARALLAX`…). GSAP + ScrollTrigger + Lenis já estão instalados; `gsap.matchMedia`
  já faz o gate de reduced-motion e de breakpoint.
- Tema: o servidor fixa `data-theme="dark"`; o mapa light existe em `tokens.css` mas não
  é usado pela LP.
- Não há test runner; o QA é Playwright em `qa/*.mjs` (motion, a11y/axe, contraste, FPS).

Requisitos: ver `specs/depth-cards`, `specs/page-surface`, `specs/landing-page`.

## Goals / Non-Goals

**Goals:**
- Um único primitivo de profundidade, aplicado por atributos, reaproveitado em 4 seções.
- Zero dependência nova de runtime; zero CLS; reduced-motion = plano.
- Assets gerados de forma **reproduzível** (prompts versionados + script de otimização).

**Non-Goals:**
- WebGL nos cards (a única cena WebGL é a da tesoura, change `xiax-lp-v3-scissors-3d`).
- Giroscópio/DeviceOrientation (exige permissão no iOS).
- Tema light (não é servido pela LP hoje).
- Reescrever copy — o subtítulo da galeria fica como está até o dono decidir.

## Decisions

### D1. Atributos + um controlador, não um componente cliente por card
Markup fica server-rendered com `data-depth-card` (perspectiva), `data-depth-stage`
(dono da inclinação), `data-depth="1|2|3"` (camadas) e `data-depth-sheen` (reflexo).
Um controlador cliente único (`components/motion/depth-controller.tsx`) liga todos os
cards na montagem.
*Alternativa:* `<DepthCard>` cliente por card — mais hidratação e quebraria o padrão RSC
das seções. Rejeitada.

### D2. Dois donos de transform: reveal no externo, inclinação no palco
`[data-depth-card]` (externo) recebe o reveal e a `perspective`; `[data-depth-stage]`
(filho) recebe `rotateX/rotateY` via `gsap.quickTo` e tem `transform-style: preserve-3d`.
Camadas usam `translateZ(var(--depth-N))` estático em CSS — só o palco anima.
Isso elimina o conflito "reveal reseta transform".
**Regra estrutural:** nada entre o palco e as camadas pode ter `overflow: hidden`,
`opacity < 1` ou `filter` (achatam o 3D). Bordas arredondadas ficam no palco.

### D3. Matemática pura e testável
`lib/motion/depth.ts` exporta funções puras: `pointerTilt(point, rect, maxDeg)`,
`scrollTilt(progress, maxDeg)`, `sheenTransform(tilt)`. O controlador só conecta eventos
a essas funções. Cobertas por `vitest` (dev dependency nova), meta ≥ 80% no módulo.

### D4. Seat `DEPTH` nos tokens
Novo seat em `motion-tokens.ts`: `tiltDeg` (8), `touchTiltDeg` (4), `perspectivePx` (900),
`layerPx` ([10, 22, 36]), `popularLiftPx` (18), `sheenOpacity` (0.22). Retorno ao plano usa
`DUR.micro` + `EASE.standard`; montagem da agenda usa `DUR.reveal` + `STAGGER.base` +
`EASE.hero`; scroll-tilt usa `SCRUB.base`. Justificativa no próprio seat (precedente
`loop`/`pop`/`SCISSORS`).

### D5. Modo de entrada por media query
`gsap.matchMedia` com `(hover: hover) and (pointer: fine)` → ponteiro; caso contrário →
inclinação por scroll (ScrollTrigger scrub por card). Ponteiro só fica ativo para cards
na viewport (IntersectionObserver) para não ouvir `pointermove` de 15+ cards.

### D6. Galeria: profundidade por parallax, não por `translateZ`
A moldura 16:9 precisa de `overflow: hidden` (recorte), o que achata 3D. Então cada slot
tem duas imagens empilhadas (fundo limpo + pessoa recortada com alpha) que se movem em
velocidades diferentes no scroll, e a moldura inteira inclina como card. A moldura funciona
como janela: o fundo fica para trás 2,5% da altura (`DEPTH.galleryShiftPct`) e a pessoa, no
mesmo sentido, 0,45× isso (`DEPTH.gallerySubjectFactor`). Assim ela parece mais perto, e o
deslize entre as camadas (~12 px no master de 900 px) fica dentro dos 14 px aprovados no gate.
Revisado na implementação: a versão anterior (pessoa 1,6× no sentido oposto) deslizava
~58 px e mostraria o recorte. `GallerySlot` ganha `layers?: { plate, subject }`; sem
`layers`, cai no fallback (foto inteira com zoom/parallax interno).

### D7. Pipeline de imagens (AGY/Gemini) com gate
1. Prompts versionados em `assets/prompts/` (estilo único: barbearia escura, luz quente,
   latão, 16:9) → `agy -p` com o sub-agente gerador de imagem; saída em `assets/*-src/`.
2. **Gate (1 foto):** gerar foto → pedir ao Gemini a mesma cena **sem pessoas** (fundo
   limpo) → obter a máscara da pessoa (máscara do Gemini alinhada; se desalinhar,
   segmentação local num venv temporário fora do repo) → compor recorte com alpha.
   Critério: sem halo visível a 2× e sem buraco revelado no deslocamento máximo.
3. Só com o gate aprovado gerar as outras 5; senão, galeria usa o fallback.
4. Ícones de latão: mesmo método de recorte; alternativa aprovada no gate = fundo preto
   puro convertido em alpha por luminância.
5. `scripts/optimize-v3-assets.mjs` (sharp, mesmo padrão de `optimize-gallery.mjs`) gera
   os masters em `public/` (AVIF/WebP com alpha onde precisa).

### D8. Couro como imagem do fundo, pré-escurecida
Textura 1024² seamless, **escurecida no próprio arquivo** até a cor `--base` (sem camada
extra de opacidade), servida como `background-image` repetida no `body` com `image-set`
(AVIF/WebP), `background-size` ~512px. Rola com o conteúdo (sem `background-attachment:
fixed`, que repinta no scroll). Seções com fundo sólido próprio continuam cobrindo.
2–3 variações geradas; o dono escolhe vendo na página.

### D9. Modelos como baralho leve
Cartas de trás são "versos" leves (moldura + nome + barra de acento), `aria-hidden`,
empilhadas com deslocamento fixo em CSS. A troca roda uma timeline curta (carta ativa
gira e desce para a pilha, a escolhida sobe à frente; < `DUR.revealSlow`). O radiogroup,
o `aria-live` e o `role="img"` da prévia ativa ficam intactos. Reduced-motion → troca
instantânea.

### D10. Remoção de `#depoimentos`
Sai de `app/page.tsx` e o bloco de coreografia correspondente sai de
`motion-choreography.tsx`. O componente e a microcopy ficam no repo (voltam com relatos
reais). Comentários que citam a ordem com `#depoimentos` são atualizados.

### D11. QA
- `vitest` para `lib/motion/depth.ts`.
- `qa/v3-depth.mjs` (Playwright, Chrome do sistema via `channel: "chrome"`): hover aplica
  transform não-identidade no palco; reduced-motion deixa identidade; CLS = 0; ausência de
  `#depoimentos`; frames de scroll da galeria para revisão visual.
- Reuso de `qa/a11y-axe.mjs` e `qa/contrast-check.mjs` com a textura ligada.

### D12. Como funciona: três cards com mini-tela (2026-10-28)

O dono achou a seção fora do tema (faixa lisa cortando o couro, marcações à mão
desalinhadas). Os três passos viram cards com profundidade sobre o couro, ligados por um fio
de latão que passa por medalhões numerados. Cada card mostra o passo numa mini-tela feita só
com tokens (página de agendamento → coluna do barbeiro → lembrete no WhatsApp), decorativa
(`aria-hidden`; o `<h3>` carrega o sentido). O HTML estático é o quadro final da história, então
sem JS ou com movimento reduzido o passo aparece inteiro; a coreografia toca uma vez ao entrar
(itens sobem → elemento-chave salta ou cai → "digitando…" → desfecho). Lado a lado, os cards
tocam em sequência (`storyDelays`, puro e testado); empilhados no celular, cada um toca ao
aparecer. Os nós animados ficam dentro das camadas, nunca nelas, para o tween não brigar com o
`translateZ`. Tokens no seat `STEPS`. A marcação à mão (rough-notation) sai do projeto: era
o único uso.

### D13. Preço sem promessa de barbeiro ilimitado (2026-10-28)

Os planos vão mudar e o preço pode depender do número de profissionais; os números novos
chegam com a pesquisa de mercado. Até lá a página não promete "barbeiros ilimitados" nem
"preço fixo" e não compara com concorrentes: sai `#preco-fixo` (o contraste R$ 280+), o chip
dos cards de plano, a linha do hero, o FAQ e o JSON-LD. Os preços da tabela continuam como
dados em `lib/data/plans.ts`. O `qa/v3-depth.mjs` falha se essas promessas voltarem.

## Risks / Trade-offs

- [3D achatado por `overflow`/`opacity` herdados] → regra estrutural do D2 + checagem no
  QA (camada com `translateZ` precisa ter matriz 3D computada).
- [Muitos ouvintes de ponteiro] → só cards visíveis ficam ativos (D5); `quickTo` já
  agrupa por frame.
- [Halo/buraco nos recortes da galeria] → gate de 1 foto (D7) + fallback por slot.
- [Fotos geradas com aparência artificial ou inconsistente] → um estilo único nos prompts,
  foto de referência entre gerações, aprovação do dono antes de publicar.
- [Textura derrubando contraste] → escurecer no arquivo + `contrast-check` (spec
  `page-surface`).
- [Flicker 3D no Safari iOS] → `backface-visibility: hidden` nas camadas; `will-change`
  só enquanto o card está ativo.

## Migration Plan

Mudança aditiva, em commits pequenos (primitivo → agenda → preços → modelos → galeria →
couro → remoção de depoimentos). Rollback = reverter o commit da seção. Deploy segue o
fluxo atual (Vercel).

## Open Questions

- Qual das 2–3 variações de couro (decisão visual do dono; não muda specs nem tarefas).
- Ajuste do subtítulo da galeria após as fotos novas (decisão de copy do dono).
