## Context

O app guarda a receita de tema por estabelecimento e a aplica na página pública e no painel. A troca é do dono
(`/admin/configuracoes`, bloco "Aparência", rota `PUT /api/admin/config/theme`), sem trava de plano. As capturas vêm
do próprio app, em 2x (780 × 1688), com os dados de exemplo de sempre (Barbearia Central, Salão Aurora).

## Decisions

### D1. Vitrine, não seletor
Os quatro estilos aparecem juntos e parados. Nada na seção é clicável. Escolher um estilo pelo site criaria um pedido
que o produto não tem (o dono escolhe no painel, depois de entrar) e repetiria o erro que a v4 removeu.

### D2. Só o segmento da página
A barbearia mostra os quatro estilos de barbearia; o salão, os quatro de salão. O app deixa qualquer estabelecimento
usar qualquer receita, mas cada página continua sem falar do público da outra (spec `vertical-pages`).

### D3. Fileira no celular, colunas no computador
Abaixo de 1024 px os celulares ficam numa fileira com rolagem lateral e encaixe (`snap`), cada um com 64vw (máx. 280 px),
e o próximo aparece na borda. A fileira sangra até a borda da tela e tem `py-6 -my-6` para a sombra do celular não ser
cortada. É uma região rotulada e focável (teclado), com `data-lenis-prevent-horizontal` para o gesto lateral ser
nativo. A partir de 1024 px, grade de quatro colunas sem rolagem.

### D4. Cada celular é um depth card
Mesmo tratamento do celular anterior da seção: o ponteiro fino inclina a moldura; com movimento reduzido fica plano.

## Risks / Trade-offs

- A região focável continua na ordem do teclado no computador, onde não rola. Custo pequeno frente a deixar a fileira
  inalcançável por teclado no tablet.
- Quatro imagens a mais por página, todas abaixo da dobra e sob demanda; o `next/image` serve no máximo 280 px de
  largura (2x).
