# Design — Xiax LP v4 · Xchair

## Context

- Next.js (App Router); seções são Server Components em `components/sections/`, compostas em
  `app/page.tsx`. Motion por atributos `data-*` herdado das changes v3 (`xiax-lp-v3-razor-3d`,
  `xiax-lp-v3-cards-25d`), sem mudança aqui.
- A página era do "Xbarber" e vendia o que o produto não faz. O app real (APPbarbearia) existe
  e tem modelos de mensagem próprios. Motivação em `proposal.md`.
- Dono avalia no celular; decisões dele: WhatsApp como único CTA (2026-10-28), preços ainda
  hipótese a validar com donos de barbearia.
- Requisitos: `specs/landing-page`, `specs/pricing-plans`, `specs/sales-contact`, `specs/real-screens`.

## Goals / Non-Goals

**Goals:**
- Fonte única de marca, planos e contato; a página só promete o que o sistema faz.
- Telas reais nítidas sem peso desnecessário, com aviso de dados de exemplo.
- Um destino de conversão, medido por origem.

**Non-Goals:**
- Domínio definitivo e checkout ativo (dependem do dono; ficam em variáveis de ambiente).
- Mexer no motion das v3 (apenas reaproveitado).
- Captura de e-mail, CRM ou chat próprio.

## Decisions

### D1. `SITE` como fonte única (`lib/site.ts`)
`SITE` guarda nome, maker, URL (`NEXT_PUBLIC_SITE_URL`, padrão local) e `checkoutUrl`
(`NEXT_PUBLIC_CHECKOUT_URL` ou `null`). Nenhum domínio inventado.
*Alternativa:* nome espalhado nos componentes — rejeitada: o rebrand já mostrou o custo.

### D2. Telas reais capturadas por script, em 2x
`scripts/capture-screens.mjs` captura o app; `scripts/optimize-screens.mjs` converte para webp em
`public/screens/`. `lib/data/screens.ts` guarda `src`, largura/altura reais e `alt`, mais
`SCREENS_NOTE` ("Telas reais do Xchair · dados de exemplo"). Molduras em
`components/ui/device-frame.tsx` (`PhoneFrame`, `BrowserFrame`, `ScreenCrop`).
*Alternativas:* manter mocks em HTML (rejeitada: mostravam o que não existe); imagens geradas
(rejeitada: não são o produto).

### D3. Cartões dos passos com tela cheia, quadrados
`components/ui/step-visuals.tsx` usa imagem quadrada, sangrando até a borda. O primeiro corte do
dono "não encaixou bem", então foi refeito nesse formato.
*Alternativa:* mini-telas desenhadas dentro do card (primeiro corte) — rejeitada pelo dono.

### D4. Mensagens de WhatsApp reais como dados
`lib/data/whatsapp-messages.ts` copia os modelos do app (`reminder24h`, `slotFreed`), renderizados
por `components/ui/whatsapp-bubble.tsx`. Nomes/datas fictícios; endereço da loja fica "…".
*Alternativa:* texto inventado — rejeitada: divergiria do que o cliente recebe.

### D5. Modelos vira a página real
`components/sections/modelos.tsx` + `lib/data/modelos.ts` mostram a única página (Navalha) num
celular. O seletor de quatro estilos e cores vendia o que não existe.
*Alternativa:* manter o seletor com um item só — rejeitada: dava a impressão de escolha.

### D6. Duas seções novas no meio do funil
`lista-de-espera.tsx` (`#lista-de-espera`, o diferencial mais forte) e `caixa.tsx` (`#caixa`)
vêm logo após `numeros.tsx` em `app/page.tsx`: vendem o que o Essencial já faz.
*Alternativa:* só citar no FAQ — rejeitada: ficaria sem prova visual.

### D7. Planos como dados, botão por função pura
`lib/data/plans.ts` define `PLANS`, `status` (`available`/`soon`) e `planCta()`: checkout só se o
plano está disponível e `checkoutUrl` existe; senão WhatsApp com mensagem que nomeia o plano.
`SHOW_CANCEL_ANYTIME = false` até o dono confirmar. Sem alternância mensal/anual (só o Essencial
tem anual). Testes em `lib/data/plans.test.ts`.
*Alternativa:* botão decidido no componente — rejeitada: não testável.

### D8. WhatsApp único destino (`lib/contact/whatsapp.ts`)
`whatsappLink`/`salesLink` montam `wa.me` com a mensagem pronta; número em
`NEXT_PUBLIC_SALES_WHATSAPP` (padrão 5549991613378). `components/ui/whatsapp-cta.tsx` é usado em
`hero.tsx`, `planos-table.tsx`, `final.tsx` e `components/layout/sticky-cta-bar.tsx`. O
formulário de e-mail foi aposentado. O fechamento (`final.tsx`) ganhou painel com três passos e o
preço do Essencial. Testes em `lib/contact/whatsapp.test.ts`.
*Alternativa:* manter formulário + WhatsApp — rejeitada pelo dono (2026-10-28).

### D9. Número com fonte, em um lugar
`components/sections/numeros.tsx` guarda o único número (25% menos faltas, Robotham et al., BMJ
Open, 2016) com a citação ao lado.
*Alternativa:* manter números de marketing — rejeitada: sem fonte.

### D10. Como funciona responsivo
`components/sections/como-funciona.tsx`: coluna única abaixo de `lg` (a partir de `md`, imagem
ao lado do texto), `lg:grid-cols-3` acima. O fio de conexão gira de vertical para horizontal em `lg`.

### D11. Analytics tipado
`lib/analytics/events.ts`: `cta_click` com `CtaPlacement` = `hero | planos | final | sticky`;
`PLAN_CTA_PLACEMENT` em `plans.ts` usa `satisfies` para travar o valor.

## Risks / Trade-offs

- [Preços são hipótese] → marcados `[CONFIRMAR]` em `plans.ts`; revisão do dono (tasks §7).
- [Tela mostra o que o app ainda não tem: colunas por barbeiro na agenda do dia; previsão no recorte de resultados do mês] → lista de confirmação ao dono; recortar ou refazer a captura.
- [Conversa fora da página: só o clique é medido] → `cta_click` por origem; aceito.
- [LCP medido acima do orçamento (Δ328 ms vs 100 ms) em build antigo] → rerodar QA no build de produção.
- [Resíduos de nomes antigos no repo (`xbarberTheme`, comentários de `button.tsx`)] → não visíveis ao visitante; limpeza futura.
- [Scripts de QA desatualizados dão falso vermelho] → atualizar (tasks §6).

## Migration Plan

Reescrita em commits por tema (marca/honestidade → planos → WhatsApp → telas → seções → QA).
Antes de publicar: definir `NEXT_PUBLIC_SITE_URL`; `NEXT_PUBLIC_CHECKOUT_URL` quando houver.
Rollback: reverter o commit do tema; `depoimentos.tsx` permanece no repo, fora da página.

## Open Questions

- Preços e a frase de cancelamento (dono).
- Domínio e URL de checkout do Essencial.
- Recortar ou refazer as telas com colunas por barbeiro e previsão do mês.
