# Tasks

## 1. Base: testes e tokens

- [x] 1.1 Adicionar `vitest` como devDependency e script `test` no `package.json`; verificar que `npm test` roda (0 testes, saída verde)
- [x] 1.2 Adicionar o seat `DEPTH` em `lib/motion/motion-tokens.ts` com justificativa (D4); verificar `npx tsc --noEmit` sem erros

## 2. Primitivo de profundidade

- [x] 2.1 Escrever testes de `lib/motion/depth.ts` (`pointerTilt` nos 4 cantos/centro/clamp, `scrollTilt` em 0/0.5/1, `sheenTransform`) e vê-los falhar; verificar `npm test` vermelho pelos motivos certos
- [x] 2.2 Implementar `lib/motion/depth.ts` até os testes passarem; verificar `npm test` verde e cobertura ≥ 80% no módulo
- [x] 2.3 Adicionar CSS do primitivo (`[data-depth-card]` perspectiva, `[data-depth-stage]` preserve-3d, `[data-depth="1|2|3"]` translateZ, `[data-depth-sheen]`, `backface-visibility`) em `app/globals.css`; verificar build sem erro
- [x] 2.4 Implementar `components/motion/depth-controller.tsx` (gsap.matchMedia: ponteiro × touch × reduced; ativação por IntersectionObserver) e montá-lo junto da coreografia diferida; verificar no navegador que um card de teste inclina com o mouse e fica plano com `?reduced=1`

## 3. Painel da agenda (hero)

- [x] 3.1 Marcar `components/ui/agenda-mock.tsx` com palco e camadas (estatísticas=1, horários=2, lembretes=3) sem mudar layout; verificar screenshot desktop igual ao atual com motion desligado
- [x] 3.2 Adicionar a montagem dos horários vindo do fundo (uma vez, na abertura) na coreografia; verificar no vídeo do `qa/motion-qa.mjs` a cascata e o estado final plano

## 4. Preços

- [x] 4.1 Gerar os 4 ícones de latão (tesoura, navalha, pente, coroa) via AGY com prompts em `assets/prompts/plan-icons.md`, recortar com alpha e otimizar para `public/icons/plans/`; verificar 4 arquivos com canal alpha e ≤ 25 KB cada
- [x] 4.2 Ligar ícone por plano em `lib/data/plans.ts` e marcar `planos-table.tsx` e `preco-fixo.tsx` com palco/camadas (preço+ícone na camada 3; "Mais popular" com `popularLiftPx`); verificar visualmente o "Mais popular" elevado sem interação e `alt=""` nos ícones

## 5. Modelos (baralho)

- [x] 5.1 Marcar as 4 opções do picker como cards com profundidade; verificar inclinação no hover e navegação por setas intacta
- [x] 5.2 Implementar o baralho na prévia (versos `aria-hidden` empilhados + timeline de troca < `DUR.revealSlow`; reduced = troca instantânea); verificar com teclado e leitor de tela (axe sem violações novas) que só a carta ativa é exposta

## 6. Galeria em camadas

- [x] 6.1 Gate: gerar 1 foto (prompt em `assets/prompts/gallery.md`), o fundo limpo e o recorte da pessoa; verificar no deslocamento máximo a 2× que não há halo nem buraco e registrar o resultado (aprovado/reprovado) neste arquivo
  - **Resultado (2026-10-28): aprovado com ressalvas.** Foto 04 sem halo nem buraco a 2× com a pessoa deslizando até ±14 px sobre o fundo (a ±28 px a lâmpada espelhada borra). O fundo é um preenchimento local, não a edição do Gemini (cota esgotada); refazer com o Gemini e o prompt variante B (sem espelhos) quando a cota voltar. Por isso o parallax da galeria limita o deslize a ~12 px (`DEPTH.gallerySubjectFactor`). Evidências em `assets/prompts/gallery.md`.
- [ ] 6.2 Se o gate aprovar: gerar as outras 5 fotos em camadas; se reprovar: pular para 6.3 usando fotos inteiras novas; verificar 6 slots com assets em `assets/gallery-src/v3/`
  - Pendente (2026-10-28): cota de imagem do Gemini esgotada (429). Só a foto 04 tem camadas; as outras 4 seguem inteiras com o fallback.
- [x] 6.3 Estender `GallerySlot` com `layers?` e `scripts/optimize-v3-assets.mjs`; renderizar fundo+pessoa com parallax diferencial (ou fallback) e inclinação da moldura; verificar caixa 16:9 intacta (CLS 0) e frames de scroll no `qa/v3-depth.mjs`

## 7. Superfície de couro

- [ ] 7.1 Gerar 2–3 variações de couro seamless via AGY (`assets/prompts/leather.md`), escurecer até `--base` e otimizar (AVIF/WebP ≤ 80 KB); verificar emendas invisíveis num mosaico 3×3
  - Parcial: v1 via AGY e v2 procedural (cota esgotada), ambas ≤ 80 KB e sem emenda no mosaico. Falta a v3 e a v2 via AGY.
- [ ] 7.2 Aplicar a variação escolhida pelo dono no `body` (image-set, repetida, rolando com o conteúdo); verificar `qa/contrast-check.mjs` AA e LCP sem piora > 100 ms
  - v2 aplicada como provisória (AA no pixel mais claro e LCP igual com e sem couro). Falta a escolha do dono.

## 8. Remoção de depoimentos

- [x] 8.1 Remover `<Depoimentos />` de `app/page.tsx` e o bloco de coreografia de `#depoimentos`; atualizar comentários de ordem; verificar `grep -rn "#depoimentos" app components` sem links e Modelos seguido de Preço fixo na página

## 9. Integração e verificação

- [x] 9.1 Escrever `qa/v3-depth.mjs` (hover → palco com transform não-identidade; reduced → identidade; CLS = 0; sem `#depoimentos`; frames da galeria) e rodar contra `next start`; verificar todos os checks verdes
- [ ] 9.2 Rodar `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` e `qa/a11y-axe.mjs`; verificar tudo verde e sem `console.log` novo
  - tsc, test, build e axe verdes (0 violações). `npm run lint` não roda: o projeto não tem ESLint instalado nem configurado (o comando abre o assistente interativo).

## 10. Como funciona e preço (2026-10-28, pedido do dono)

- [x] 10.1 Escrever testes de `storyDelays` (`lib/motion/steps.ts`) e vê-los falhar; implementar até passar; verificar `npm test` verde e o módulo na cobertura
- [x] 10.2 Reconstruir `#como-funciona` como três cards com mini-tela (`components/ui/step-screens.tsx`), fio de latão e seat `STEPS`; tirar a marcação à mão do projeto; verificar no navegador desktop (sequência 1→2→3), celular (empilhado) e movimento reduzido (estado final)
- [x] 10.3 Remover `#preco-fixo` e toda promessa de barbeiro ilimitado / preço fixo (hero, planos, FAQ, JSON-LD); verificar `qa/v3-depth.mjs` com o check novo
- [x] 10.4 Reescrever os textos da página com o tom novo, sem número ou promessa nova; verificar `tsc`, `npm test`, `qa/v3-depth.mjs` 15/15, `qa/v3-scissors.mjs` 20/20 e axe 0 violações no build de produção
  - Pendentes do dono: fonte dos 70% e 98%/20%; selo "Com IA" no passo 3 (a IA só aparece no VIP); "Mais popular" sem dado de venda; "Unidades ilimitadas" no VIP; faixa de logos com texto de placeholder visível.

## Workflow follow-up

- Dono escolhe a variação de couro e revisa as fotos geradas antes de publicar.
- Arquivar a change depois da aprovação do dono (`/opsx:archive`).
