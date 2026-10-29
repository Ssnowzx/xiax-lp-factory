# Proposal — Xiax LP v4 · Xchair

## Why

A página falava de "Xbarber", prometia IA, teste grátis, "sem cartão", logos e depoimentos que
não existiam, e tinha números sem fonte. O produto real é o **Xchair** (da Xiax), só para
**barbearia**, com um plano que já pode ser comprado e dois que ainda estão sendo feitos. A v4
reescreve a página para **prometer só o que o sistema já faz**, mostrar o app de verdade e
mandar toda conversa para um único canal: o WhatsApp de vendas (decisão do dono, 2026-10-28:
nada de captura de e-mail).

## What Changes

- **Rebrand**: Xbarber → Xchair, feito pela Xiax; página só de barbearia (sem fala de salão).
  `SITE` em `lib/site.ts` vira a fonte única de nome, URL e checkout.
- **Honestidade**: saem IA, teste grátis, "sem cartão", planos antigos, logos e depoimentos
  falsos, "Entrar", promessas absolutas e números sem fonte. Fica **um** número, com fonte:
  25% menos faltas (Robotham et al., BMJ Open, 2016).
- **Planos**: Essencial R$ 99 (R$ 79 no anual, disponível), Completo R$ 229 / R$ 329 (em breve),
  Signature "a partir de R$ 990", sob consulta (em breve). "Cancele quando quiser" fica desligado.
- **WhatsApp de vendas como CTA único**: hero, cards de plano, fechamento (painel novo com 3
  passos do "o que acontece depois" e o preço do Essencial) e barra fixa do celular. O formulário
  de interesse por e-mail foi aposentado.
- **Telas reais do app** (2x) no lugar dos mocks desenhados à mão, com legenda "dados de exemplo".
- **Seções novas**: `#lista-de-espera` e `#caixa`; `#modelos` vira a página real da barbearia
  dentro de um celular.
- **#como-funciona**: passos empilhados abaixo de `lg` (imagem ao lado do texto em tablet), 3 colunas a partir de `lg`.
- **Analytics**: `cta_click` com `placement` (`hero`, `planos`, `final`, `sticky`).

## Capabilities

### New Capabilities
- `landing-page`: marca, escopo (só barbearia), regras de honestidade e composição da página.
- `pricing-plans`: três planos, preços, estado "em breve" e botão de cada plano.
- `sales-contact`: WhatsApp de vendas como único destino de conversão e o evento medido.
- `real-screens`: telas reais do app, molduras e exemplos de mensagem no lugar de mocks.

### Modified Capabilities
- Nenhuma (não há specs principais arquivadas em `openspec/specs/`; as changes v2/v3 ainda não
  foram arquivadas e esta substitui os trechos delas sobre marca, planos, preço fixo e modelos).

## Impact

- **Código**: `lib/site.ts`, `lib/data/{plans,screens,whatsapp-messages,modelos}.ts`,
  `lib/contact/whatsapp.ts`, `lib/analytics/events.ts`, `app/page.tsx`,
  `components/sections/{hero,como-funciona,numeros,lista-de-espera,caixa,modelos,planos-table,final}.tsx`,
  `components/layout/sticky-cta-bar.tsx`, `components/ui/{whatsapp-cta,device-frame,step-visuals,whatsapp-bubble}.tsx`.
- **Assets**: `scripts/capture-screens.mjs` e `scripts/optimize-screens.mjs` geram as telas em `public/screens/`.
- **Env**: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CHECKOUT_URL`, `NEXT_PUBLIC_SALES_WHATSAPP`.
- **Testes**: `lib/data/plans.test.ts`, `lib/contact/whatsapp.test.ts`.
- **Risco**: textos de preço e algumas telas dependem de confirmação do dono (ver `tasks.md` §7).
