# Tasks

## 0. Pré-requisito

- [x] 0.1 Escrever e validar os artefatos da change `xiax-lp-v4-xchair` (o que já está no código: Xchair, planos, WhatsApp, telas reais); verificar `openspec validate xiax-lp-v4-xchair --strict` sem erro

## 1. Linha de base da barbearia (antes de qualquer mudança)

- [x] 1.1 Escrever `qa/v5-text-baseline.mjs` (modo `record` e `compare`): texto visível, `alt`s e `href`s de `/` a 390 e 1440 px, com a animação assentada; rodar `record` contra a cópia de produção e verificar o arquivo de base em `qa/baselines/`
- [x] 1.2 Gravar as fotos de base de `/` a 390 e 1440 px (`qa/v5-shots.mjs --record`), com movimento reduzido para não depender da animação; verificar as imagens em `qa/baselines/`

## 2. Conteúdo fora das seções (barbearia)

- [x] 2.1 Escrever `lib/content/types.ts` (`PageContent` e os blocos por seção, D2) e `lib/content/shared.ts`; verificar `npx tsc --noEmit`
- [x] 2.2 Escrever os testes de `lib/content/barbershop.ts` e vê-los falhar. Os testes cobrem:
  - um bloco para cada seção da ordem do funil;
  - o `seo` com título, descrição e palavra-chave;
  - a saudação do WhatsApp citando barbearia;
  - nenhuma ocorrência de "salão".
- [x] 2.3 Mover os textos de `hero`, `dor` e `como-funciona` para `lib/content/barbershop.ts`, fazendo as seções receberem o bloco por prop; verificar `qa/v5-text-baseline.mjs compare` verde, `tsc` e `npm test`
- [x] 2.4 Mesmo passo para `numeros`, `lista-de-espera`, `caixa` e `galeria`; verificar comparação verde, `tsc` e `npm test`
- [x] 2.5 Mesmo passo para `modelos`, `planos`, `planos-table`, `faq` e `final`, incluindo `planCta` com as mensagens do conteúdo (D9). Os testes de `plans.test.ts` são atualizados antes; verificar comparação verde e `npm test` com `plans.ts` em 100%
- [x] 2.6 Criar `components/landing/landing-page.tsx`, que monta as seções pela ordem do conteúdo, e trocar `app/page.tsx` por ele; verificar comparação de texto e de foto verdes

## 3. Duas raízes e papéis do tema

- [x] 3.1 Mover a página para `app/(barbershop)/layout.tsx` e `page.tsx` (D1), com `metadata` e JSON-LD a partir de `content.seo`, e `not-found.tsx` no grupo; verificar comparação verde e `/` respondendo 200 na cópia de produção
- [x] 3.2 Criar `.type-display` (variáveis `--display-transform`, `--display-tracking` e `--display-weight`) e `.mark-accent` (grifo dourado no escuro, D3); trocar os 15 `uppercase tracking-display-upper` e `.mark-brass`; verificar comparação de texto e de foto verdes em `/`
- [x] 3.3 `app/sitemap.ts` com `/` e `/salao`, e `robots.ts` sem mudança de regra; verificar o XML do sitemap na cópia de produção

## 4. Tema Porcelana

- [x] 4.1 Escrever `lib/ui/contrast.test.ts` lendo o bloco `porcelain` de `styles/tokens.css` (pares do D3) e vê-lo falhar; implementar `lib/ui/contrast.ts` (puro) até passar com 100% de cobertura
- [x] 4.2 Adicionar `[data-theme="porcelain"]` em `styles/tokens.css`: cores, `--radius-control` em pílula, sombras quentes, papéis tipográficos e superfície sem couro; verificar `lib/ui/contrast.test.ts` verde
- [x] 4.3 Criar `app/(salon)/layout.tsx` com a serifa de títulos (Fraunces, depois da revisão do dono) e Manrope por `next/font`, `data-theme="porcelain"` e `metadata` do conteúdo do salão; verificar `/salao` respondendo 200 e, na aba de rede, `/` sem nenhuma fonte do salão
- [x] 4.4 Criar a moldura em arco (`ArchFrame`) para a foto principal e as de destaque; verificar foto a 390 e 1440 px

## 5. Conteúdo do salão

- [x] 5.1 Escrever os testes de `lib/content/salon-features.ts` e vê-los falhar. Os testes cobrem:
  - os ids citados no conteúdo existem;
  - nenhum recurso da lista datada "ainda não existe no app" está `available`;
  - pausa, várias profissionais, salas, ficha técnica, pacotes, anamnese, comissão e catálogo estão `coming`.
- [x] 5.2 Implementar `SALON_FEATURES` (D4) e os componentes `FeatureMention` e `ComingSoon` com `data-feature-status`; verificar os testes verdes e 100% de cobertura do registro
- [x] 5.3 Escrever os testes de `lib/content/salon.ts` e vê-los falhar. Os testes cobrem:
  - a ordem das 12 seções (spec `salon-landing`);
  - nenhum "barbearia", "barbeiro", "barba" nem "navalha" em texto, `alt`, `seo` e mensagens;
  - a saudação "Olá! Tenho um salão de beleza e quero conhecer o Xchair.";
  - o Completo em destaque;
  - as 8 perguntas do FAQ;
  - nenhuma promessa proibida.
- [x] 5.4 Escrever `lib/content/salon.ts` com a linha de texto do D11 e verificar os testes verdes
- [x] 5.5 Criar a seção `components/sections/feito-para-salao.tsx`: cards por recurso, com a dor, o estado e sem tela de app nos recursos `coming`; verificar fotos a 390, 820 e 1440 px
- [x] 5.6 Criar `app/(salon)/salao/page.tsx` com `LandingPage` e o conteúdo do salão; verificar a página inteira a 390, 820 e 1440 px, sem rolagem lateral e sem erro no console

## 6. Telas e fotos

- [x] 6.1 Baixar as 5 fotos do `SalonHome` do armazenamento do artefato para `assets/screens-src/blobs/` e adicionar o artboard a `scripts/capture-screens.mjs`; verificar `assets/screens-src/salon-home@2x.png` a 780 × 1688
- [x] 6.2 Criar as cópias de salão de `TimeChoice`, `Confirmed` e `AdminAgenda` em `assets/screens-src/canvas-salon/` (dados do D5, tokens do Porcelana nas telas da cliente, sem bloco de pausa) e fotografar em 2x; verificar as imagens
- [x] 6.3 Adicionar os recortes do salão a `scripts/optimize-screens.mjs` (topo, três passos quadrados, atenção de hoje, gráfico do mês sem a previsão) e as entradas com `alt` em português em `lib/content/salon.ts`; verificar `v5-sharpness.mjs` sem imagem ampliada
- [x] 6.4 Fotos da galeria: as fotos de categoria do quadro e até 2 geradas com a direção de arte do D6. Se o dono não liberar as fotos do quadro, todas as 4 a 6 são geradas. Passar tudo por `scripts/optimize-gallery.mjs`; verificar 16:9, AVIF/WebP e `alt` em português

## 7. 3D

- [x] 7.1 Adicionar `lightingPreset` por tema à cena (`dark` e `porcelain`) e ajustar a tesoura no marfim; verificar fotos do topo e do trilho em `/salao` sem halo e `/` idêntico à linha de base
- [x] 7.2 Escrever `assets/3d/brush/build-brush.py` (D7: nós `Handle`, `Barrel` e `Bristles`, origem no centro do cilindro, até 12 mil triângulos) e rodar em background; verificar o relatório de nós e de triângulos e a renderização de revisão
- [x] 7.3 Exportar com meshopt para `public/models/brush.glb`; verificar `gltf-transform validate` sem erro e o arquivo com no máximo 120 KB
- [x] 7.4 Escrever os testes de `lib/motion/brush-path.ts` e vê-los falhar. Os testes cobrem:
  - nada antes da entrada;
  - entrada pela borda;
  - pouso no início da linha;
  - giro igual a distância/raio durante a passada;
  - nada coberto no título nem nos números;
  - saída e sumiço;
  - `presence` para a tesoura;
  - a pose parada no fim da linha;
  - o celular na linha fina.
- [x] 7.5 Implementar `brush-path.ts` e o seat `BRUSH` nos tokens até passar; verificar `npm test` verde e `brush-path.ts` com 100% de cobertura
- [x] 7.6 Generalizar `razor-cut.ts` em `line-sweep.ts`, com a ferramenta escolhida pelo conteúdo, e carregar a escova na mesma cena; verificar `/` com a navalha igual (QA `v3-razor` verde) e `/salao` com a escova
- [x] 7.7 Gerar `public/models/brush-still.webp` com alfa e ligar o ramo parado; verificar `/salao?reduced=1` com a escova parada no fim da linha e a linha inteira

## 8. SEO e medição

- [x] 8.1 `lib/seo/json-ld.ts` a partir do conteúdo, com o público e só as ofertas disponíveis; verificar o JSON-LD de `/` igual ao de antes e o de `/salao` válido no validador do schema.org
- [x] 8.2 `app/(salon)/salao/opengraph-image.tsx` (marfim, Fraunces embutida em `assets/fonts/`); verificar a imagem em `/salao/opengraph-image` a 1200 × 630
- [x] 8.3 Escrever o teste do evento com `page` e vê-lo falhar; passar `page` do conteúdo ao `WhatsAppCta` e ao card de plano; verificar `npm test` verde e o evento com `page: "salon"` no clique do fechamento de `/salao`

## 9. QA

- [x] 9.1 Escrever e rodar `qa/v5-terms.mjs` (termos proibidos por página e promessas); verificar 0 ocorrência nas duas
- [x] 9.2 Escrever e rodar `qa/v5-coming-soon.mjs`; verificar todo recurso `coming` com selo visível e nenhum sem selo
- [x] 9.3 Escrever `qa/v5-brush.mjs` no padrão de `qa/v3-razor.mjs`. A QA confere:
  - entrada e passada;
  - nada coberto;
  - a tesoura fora de cena;
  - o celular;
  - a reversão e a repetição a cada descida;
  - GLB com no máximo 120 KB;
  - LCP com no máximo 100 ms de diferença;
  - CLS 0.

  Rodar e verificar tudo verde.
- [x] 9.4 Rodar o axe com a animação assentada em `/` e `/salao`; verificar 0 problema sério ou crítico
- [x] 9.5 Rodar `v3-razor`, `v3-scissors` e `v3-depth` em `/`, e a comparação de texto e foto final; verificar tudo verde ou cada falha anotada com causa
  - Build de produção de 2026-10-28: `v3-razor` 60/60, `v3-depth` 15/15, texto de `/` igual, foto 0 pixel mudado a 390 e 1440.
  - `v3-scissors` 19/20. Falha antiga, já anotada na v4 (6.1): "LCP com a tesoura" Δ 332 ms. Causa: o caso "sem tesoura" desliga `requestIdleCallback`, o que também segura a coreografia inteira (`useAfterPaint`). A tela do hero nunca aparece e o LCP fica no título (72 ms). Com a coreografia, o LCP é a tela do hero (~460 ms). O `v3-razor`, que só tira o 3D, mede 460 contra 492 ms, então o 3D não pesa. O teste precisa isolar só o import do three.js; não foi mexido aqui.
- [x] 9.6 Primeira tela do celular em `/salao` (390 × 844); verificar título, frase de apoio e "Chamar no WhatsApp" inteiros sem rolar

## 10. Gates e entrega

- [x] 10.1 Rodar `npm test` com cobertura (≥ 80%, módulos novos puros em 100%) e `npx tsc --noEmit`; verificar tudo verde e nenhum `console.*` nem import morto
- [x] 10.2 Rodar `next build` na cópia de produção (nunca na pasta do projeto, nunca parando o `:3000`); verificar o build sem erro e as duas rotas estáticas
- [x] 10.3 Atualizar o README:
  - as duas páginas;
  - como lançar um recurso de salão (`salon-features.ts`);
  - `NEXT_PUBLIC_SALES_WHATSAPP`;
  - os scripts de telas, fotos e 3D.

  Verificar a leitura.
- [x] 10.4 Gerar a lista de textos do salão e os pontos a confirmar (gênero, fotos do quadro, telas do painel, preços) para o dono revisar antes de publicar; verificar o arquivo entregue

## Workflow follow-up

- Depois da revisão do dono, arquivar a change com `/opsx:archive`.
- Quando o app lançar um recurso de salão, trocar o estado em `lib/content/salon-features.ts` e rodar `qa/v5-coming-soon.mjs`.
