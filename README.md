# xiax-lp-factory

Landing pages nível estúdio para a **Xiax** — **nascidas animadas**
(motion no padrão de [atlas.overlens.com.br](https://atlas.overlens.com.br)).

## As duas páginas

| Endereço | Para quem | Tema | Conteúdo |
|---|---|---|---|
| `/` | barbearia | escuro (Anton, latão, couro) | `lib/content/barbershop.ts` |
| `/salao` | salão de beleza | Porcelana (marfim, terracota, Fraunces) | `lib/content/salon.ts` |

As duas usam as mesmas seções (`components/sections/`), montadas por `components/landing/landing-page.tsx` na
ordem que o conteúdo dá. Cada página é a sua própria raiz (`app/(barbershop)/` e `app/(salon)/`), com fontes, tema,
metadados, imagem de compartilhamento e 404 próprios. Todo texto que o visitante lê está no arquivo de conteúdo
da página; as cores e formas de cada tema estão em `styles/tokens.css`.

**Lançar um recurso de salão.** Os recursos de salão e o estado de cada um ficam em
`lib/content/salon-features.ts`. Quem ainda está em construção tem `status: "coming"` e aparece com o selo
"Em breve" em todo lugar que o texto cita (`{ feature: "<id>" }`). Quando o recurso ficar pronto no app, troque
para `status: "available"` e todos os selos somem de uma vez. O teste `lib/content/salon.test.ts` impede citar um
recurso em construção sem passar pelo registro.

- **Processo:** spec-driven via [OpenSpec](https://github.com/Fission-AI/OpenSpec).
  Mudanças em `openspec/changes/`; specs em `openspec/specs/`.
- **Receita de motion/design:** `.claude/skills/atlas-level-landing/SKILL.md`.
- **Stack:** Next.js 14 (App Router) + TS strict + Tailwind.
- **Motion:** GSAP + ScrollTrigger + Lenis, montados depois do primeiro paint; tokens em
  `lib/motion/motion-tokens.ts`. Com `prefers-reduced-motion` (ou `?reduced=1`) tudo fica parado.
- **Fase WebGL (ativa):** a tesoura 3D do trilho é uma cena three.js
  (`lib/three/scissors-scene.ts`) carregada por import dinâmico quando a página fica ociosa —
  o three.js não entra no JS da primeira carga. Sem WebGL ou com movimento reduzido, aparece
  a imagem parada do mesmo modelo.

## Rodar

```bash
npm install
npm run dev                      # http://localhost:3000
```

Não há variáveis de ambiente obrigatórias para rodar localmente. Para publicar:

| Variável | Para quê | Padrão |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | domínio final: endereço canônico, sitemap, imagem de compartilhamento. Na Vercel, sem ela, vale o endereço de produção do projeto; defina na VPS | `http://localhost:3000` |
| `NEXT_PUBLIC_SALES_WHATSAPP` | número do WhatsApp de vendas (só dígitos, com 55) | `5549991613378` |
| `NEXT_PUBLIC_CHECKOUT_URL` | checkout do Essencial; sem ele, o botão do plano abre o WhatsApp | — |

As três entram no build (`NEXT_PUBLIC_`): defina antes de `npm run build`.

## Testes e QA

```bash
npm test                         # vitest (funções puras de motion)
npm run test:coverage            # cobertura ≥ 80% em lib/motion/depth.ts e scissors-path.ts
npx tsc --noEmit

# QA no navegador (Chrome do sistema), contra o build de produção:
npm run build && npx next start -p 8811
QA_URL=http://localhost:8811 node qa/v3-depth.mjs      # cards 2.5D, galeria, CLS
QA_URL=http://localhost:8811 node qa/v3-scissors.mjs   # tesoura 3D: fases, celular, peso, LCP
node qa/contrast-check.mjs                             # pares de contraste AA

# As duas páginas (v5):
QA_URL=http://localhost:8811 node qa/v5-text-baseline.mjs compare   # texto de / igual à linha de base
QA_URL=http://localhost:8811 node qa/v5-shots.mjs                   # foto de / igual, pixel a pixel
QA_URL=http://localhost:8811 node qa/v5-terms.mjs                   # palavras proibidas por página
QA_URL=http://localhost:8811 node qa/v5-coming-soon.mjs             # selo "Em breve" em todo recurso em construção
QA_URL=http://localhost:8811 node qa/v5-sharpness.mjs /salao        # nenhuma tela do app ampliada
QA_URL=http://localhost:8811 node qa/v5-brush.mjs                   # escova 3D do salão: passada, celular, imagem parada
```

## Assets da v3

**Tesoura 3D** — modelada por script no Blender (determinística: mesma saída a cada execução):

```bash
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup \
  --python assets/3d/scissors/build-scissors.py --
npm run assets:v3
```

O primeiro comando gera `assets/3d/scissors/scissors.blend`, `public/models/scissors.glb`
(meshopt, ≤ 120 KB) e a imagem parada `assets/3d/scissors/scissors-still.png`, e falha se o
modelo quebrar o contrato (nós `Scissors › BladeL, BladeR, Rivet`, comprimento 1.0). Precisa de
`npx` no PATH. `--review-dir <pasta>` também salva renders de revisão.

**Navalha 3D** — mesmo fluxo. Ela aparece a cada descida até "Como funciona": a tesoura sai
de cena, a navalha recua aberta sobre o fio dos passos e, no meio da tela, corta o fio da
esquerda para a direita; os passos começam com o corte, ela sai pela direita e a tesoura volta.
No celular ela corta um fio fino sob o título. Subindo até o fio sair da tela, o fio e as
mini-telas voltam ao início fora da vista e o corte se repete na próxima descida; voltando de
baixo, nada se repete. Com movimento reduzido ou sem WebGL, fica a imagem parada deitada na
ponta do fio.

```bash
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup \
  --python assets/3d/razor/build-razor.py --
npm run assets:v3
```

Gera `assets/3d/razor/razor.blend`, `public/models/razor.glb` (meshopt, ≤ 120 KB) e
`assets/3d/razor/razor-still.png` (960 px por unidade); falha se o contrato quebrar (nós
`Razor › Handle, Blade, Pivot`, comprimento 1.0 aberta) ou se a lâmina tocar o cabo ao fechar.
`--tone dark-horn|ebony|ivory` troca o tom do cabo; `--review-dir <pasta>` salva renders de
revisão. O `.glb` sai idêntico a cada execução; a imagem parada varia no ruído do render.
A coreografia fica em `lib/motion/razor-path.ts` (tokens `RAZOR` em
`lib/motion/motion-tokens.ts`) e o palco em `components/motion/line-sweep.ts`; QA em
`qa/v3-razor.mjs` (contra `next start`, `QA_URL=http://localhost:8811`).

**Escova 3D (salão)** — em `/salao` a navalha dá lugar a uma escova redonda, no mesmo palco
(`line-sweep.ts`): ela entra pela borda, rola sobre o fio dos passos desenhando a linha e sai pela
direita, a cada descida. Cada página baixa só a sua ferramenta (`lib/motion/sweep-tool.ts`, escolhida
por `sweepTool` no conteúdo) e a luz da cena segue o tema (`lib/three/lighting.ts`: no marfim, menos
exposição e luz mais quente).

```bash
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup \
  --python assets/3d/brush/build-brush.py --
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup \
  --python scripts/v3-assets/brush-still.py
npm run assets:v3
```

Gera `public/models/brush.glb` (meshopt, ≤ 120 KB; nós `Brush › Handle, Barrel, Bristles`,
comprimento 1.0) e `assets/3d/brush/brush-still.png`, que vira `public/models/brush-still.webp`.
A coreografia fica em `lib/motion/brush-path.ts` (tokens `BRUSH`); QA em `qa/v5-brush.mjs`.

**Imagens** — `npm run assets:v3` (`scripts/optimize-v3-assets.mjs`) converte as imagens paradas
da tesoura, da navalha e da escova e as fotos da galeria em `assets/gallery-src/v3/` para `public/`. Ícones dos planos
e texturas de couro têm geradores próprios em `scripts/v3-assets/`; prompts e comandos em
`assets/prompts/`.

## Telas e fotos do salão (v5)

**Telas do app** — fotografadas do quadro de design em 2x (o painel do salão também em 3x, para o quadro
"Precisa de atenção hoje"). Precisa de um servidor que sirva `/project/<arquivo>` (primeiro
`assets/screens-src/canvas-salon/`, depois o quadro) e `/_blob/<id>` (fotos em `assets/screens-src/blobs/`):

```bash
node scripts/capture-screens.mjs <url-do-quadro> assets/screens-src [nome…]   # ex.: salon-home, salon-day-agenda@3x
node scripts/optimize-screens.mjs [recorte…]                                   # recortes em public/screens/
```

**Estilos da seção de modelos** — a tela de início em cada receita de tema, capturada no próprio app em 2x, fica em
`assets/screens-src/themes/<id>@2x.png` (nomes e descrições em `themes.json`). Os recortes se chamam `theme-<id>`:
`node scripts/optimize-screens.mjs theme-navalha theme-rose …`. Os textos de cada estilo ficam no conteúdo da página
(`showcase.themes`).

**Fotos da galeria** — geradas com a direção de arte do Porcelana (prompts em `assets/prompts/gallery-salon.md`),
originais em `assets/gallery-src/salon/`:

```bash
node scripts/optimize-gallery.mjs --salon-only   # só as fotos do salão em public/gallery/salon/
```

**Imagem de compartilhamento** — `app/(salon)/salao/opengraph-image.tsx`, com as fontes TTF de
`assets/fonts/` (licença OFL) e o recorte `assets/og/salon-arch.jpg`.

## Estado atual

- `openspec/changes/xiax-lp-v3-cards-25d/` — cards 2.5D, galeria em camadas, fundo de couro.
- `openspec/changes/xiax-lp-v3-scissors-3d/` — tesoura 3D no hero e no trilho.
- `openspec/changes/xiax-lp-v3-razor-3d/` — navalha 3D que corta o fio de "Como funciona".
- `openspec/changes/xiax-lp-v4-xchair/` — marca Xchair, telas reais, texto honesto, CTA só no WhatsApp.
- `openspec/changes/xiax-lp-v5-salon/` — página do salão (`/salao`) no tema Porcelana; revisão do dono em
  `openspec/changes/xiax-lp-v5-salon/review-salon.md`.
- `openspec/changes/xiax-lp-v6-theme-showcase/` — `#modelos` mostra os quatro estilos de cada página (vitrine, sem
  seletor); o dono troca o estilo no painel do app.
