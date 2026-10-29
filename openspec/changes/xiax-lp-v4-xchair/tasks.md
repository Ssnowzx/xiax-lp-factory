# Tasks

## 1. Marca e honestidade

- [x] 1.1 Criar `lib/site.ts` (`SITE`: nome Xchair, maker Xiax, url por env, checkoutUrl por env ou null); verificar que metadados usam `SITE`
- [x] 1.2 Trocar Xbarber por Xchair e remover fala de salão, IA, teste grátis, "sem cartão", logos, depoimentos falsos, "Entrar" e promessas absolutas; verificar por busca no texto visível
- [x] 1.3 Manter só 25% menos faltas com fonte (Robotham et al., BMJ Open, 2016) em `components/sections/numeros.tsx`; verificar a citação visível

## 2. Planos

- [x] 2.1 Escrever `lib/data/plans.ts` (Essencial, Completo, Signature, `SHOW_CANCEL_ANYTIME=false`, `planCta`) com testes em `plans.test.ts`; verificar `npm test` verde
- [x] 2.2 Ligar os cards em `components/sections/planos-table.tsx` com a etiqueta "Em breve"; verificar que só o Essencial vende

## 3. WhatsApp como CTA único

- [x] 3.1 Criar `lib/contact/whatsapp.ts` com teste e `components/ui/whatsapp-cta.tsx`; verificar link `wa.me` com mensagem
- [x] 3.2 Usar o CTA no hero, nos planos, no fechamento e em `components/layout/sticky-cta-bar.tsx`; verificar os quatro destinos
- [x] 3.3 Redesenhar `components/sections/final.tsx` (3 passos "o que acontece depois" + preço do Essencial) e aposentar o formulário de e-mail; verificar que não há campo de e-mail
- [x] 3.4 Tipar `cta_click` com `placement` em `lib/analytics/events.ts`; verificar que os quatro pontos disparam

## 4. Telas reais

- [x] 4.1 Criar `scripts/capture-screens.mjs` e `scripts/optimize-screens.mjs`; verificar webp em 2x em `public/screens/`
- [x] 4.2 Criar `lib/data/screens.ts` (`SCREENS`, `SCREENS_NOTE`) e `components/ui/device-frame.tsx`; verificar `alt` e legenda de dados de exemplo
- [x] 4.3 Refazer `components/ui/step-visuals.tsx` com cartões quadrados de tela cheia (primeiro corte "não encaixou bem"); verificar visualmente com o dono
- [x] 4.4 Criar `components/ui/whatsapp-bubble.tsx` e `lib/data/whatsapp-messages.ts` com os modelos reais; verificar o texto contra o app

## 5. Seções

- [x] 5.1 Criar `lista-de-espera.tsx` e `caixa.tsx` e encaixá-las em `app/page.tsx` após `numeros`; verificar ordem e âncoras
- [x] 5.2 Reescrever `modelos.tsx` / `lib/data/modelos.ts` como a página real em um celular; verificar que não há seletor de estilos
- [x] 5.3 Ajustar `como-funciona.tsx` (empilha abaixo de `lg`, imagem ao lado do texto em tablet, 3 colunas em `lg`); verificar em 390, 768 e 1280 px

## 6. QA e documentação (pendente)

- [ ] 6.1 Rerodar o QA no build de produção: `qa/v3-razor.mjs`, `qa/v3-scissors.mjs` (LCP Δ328 ms vs orçamento de 100 ms visto em build antigo), `qa/v3-depth.mjs` e axe
- [ ] 6.2 Atualizar os scripts de QA desatualizados: `qa/xia92-gate.mjs`, `qa/a11y-toggle-probe.mjs`, etapa de formulário de `qa/a11y-axe.mjs`, `qa/xia80-verify.mjs`
- [ ] 6.3 Atualizar o README (Xchair, variáveis de ambiente, scripts)

## 7. Revisão do dono (pendente)

- [ ] 7.1 Dono revisar a lista de textos alterados e os pontos `[CONFIRMAR]`: preços, "cancele quando quiser", colunas por barbeiro visíveis na imagem da agenda do dia, e previsão no recorte de resultados do mês que o app ainda não tem
