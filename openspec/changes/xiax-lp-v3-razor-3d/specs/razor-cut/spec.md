# Spec Delta

## Purpose

Uma navalha 3D faz, a cada descida até a seção, o corte que dá título a "Como funciona" ("Você corta. O resto
anda sozinho."). O risco do corte é o fio que liga os três passos. A navalha divide a tela
com ninguém: a tesoura sai enquanto ela está em cena. Tudo é decorativo, sem custo de
acessibilidade ou de performance.

## ADDED Requirements

### Requirement: Navalha com aparência de objeto real
A navalha SHALL ser exibida como objeto 3D com:
- lâmina de aço que reflete a luz, com lombada e fio distintos;
- talas do cabo com pinos de latão.

A lâmina SHALL abrir girando em torno do pino, sem atravessar as talas em nenhum ângulo.

#### Scenario: Abrir
- **WHEN** a navalha passa de fechada para aberta
- **THEN** a lâmina gira em torno do pino e nunca atravessa as talas do cabo

### Requirement: Entrada e abertura guiadas pela rolagem
Quando "Como funciona" chega à tela, a navalha SHALL entrar fechada pela borda direita e
recuar pairando logo acima da linha do fio. Enquanto recua, ela SHALL abrir e girar até
ficar de frente. Esse movimento SHALL seguir a rolagem nos dois sentidos até o ponto de
corte. A navalha MUST NOT cobrir o título da seção nem o rótulo "Em três passos", e,
enquanto recua, MUST NOT cobrir os medalhões dos passos.

#### Scenario: Rolando até a seção
- **WHEN** a seção sobe na tela e o fio ainda está abaixo do ponto de corte
- **THEN** a navalha paira logo acima da linha do fio, mais aberta quanto mais perto do
  corte, e nenhum pixel dela cobre o título nem os medalhões

#### Scenario: Voltando antes do corte
- **WHEN** o usuário rola de volta para cima antes do ponto de corte
- **THEN** a navalha fecha e sai pela direita, no caminho inverso

#### Scenario: Pronta para cortar
- **WHEN** o fio chega ao ponto de corte
- **THEN** a navalha está aberta, de frente, pairando sobre o começo da linha, e pousa
  nela quando o corte começa

### Requirement: O corte desenha o fio
No ponto de corte, a navalha SHALL cortar da esquerda para a direita ao longo da linha, com
a frente do desenho do fio sob a lâmina durante todo o corte. Ao fim do corte, ela SHALL
seguir para fora da tela pela direita. Os passos SHALL começar a se animar com o corte, na
ordem 1 → 2 → 3.

#### Scenario: Corte no desktop
- **WHEN** o fio horizontal dos passos chega ao ponto de corte a 1440×900
- **THEN** a navalha corta ao longo do fio, o fio fica inteiro desenhado e a navalha sai
  pela direita

#### Scenario: Passos com o corte
- **WHEN** o corte começa no desktop
- **THEN** a tela do passo 1 começa a animar, seguida pela do 2 e pela do 3

### Requirement: Uma vez a cada descida
O corte SHALL acontecer no máximo uma vez a cada vez que o usuário desce até a seção. Depois
dele, o fio SHALL ficar desenhado enquanto o usuário estiver na seção ou abaixo dela, e,
voltando à seção de baixo para cima, a navalha MUST NOT aparecer.

#### Scenario: Voltar à seção vindo de baixo
- **WHEN** o corte já aconteceu, o usuário desce além da seção e volta subindo até ela
- **THEN** o fio continua desenhado e nenhuma navalha aparece

### Requirement: Recomeço fora da vista
Quando o usuário sobe até o fio sair da tela por baixo, o fio, as mini-telas dos passos e a
navalha SHALL voltar ao início, sem que isso seja visto, e o corte SHALL acontecer de novo
na descida seguinte, sem recarregar a página.

#### Scenario: Subir além da seção e descer de novo
- **WHEN** o corte já aconteceu e o usuário sobe até o fio sair da tela por baixo e desce de novo
- **THEN** a navalha volta, recua sobre o fio e corta de novo, e as mini-telas tocam de novo com o corte

#### Scenario: O recomeço não é visto
- **WHEN** o fio e as mini-telas voltam ao início
- **THEN** isso acontece com o fio abaixo da borda inferior da tela

### Requirement: Fio sem navalha pronta
Se a página carrega já abaixo do ponto de corte, ou se o fio começa a ser desenhado antes da
navalha estar pronta, o fio SHALL ser desenhado sem a navalha.

#### Scenario: Página aberta abaixo da seção
- **WHEN** a página é recarregada com a rolagem já depois de "Como funciona"
- **THEN** o fio está desenhado e nenhuma navalha aparece; subindo além da seção e descendo de novo, o corte acontece

### Requirement: Uma ferramenta por vez
Enquanto a navalha está em cena, a tesoura SHALL sair pela direita, com o rastro dela
apagado. Depois que a navalha sai, a tesoura SHALL voltar ao lugar e ao comportamento de
antes. A tesoura MUST NOT ser afetada quando a navalha não carrega.

#### Scenario: Troca no desktop
- **WHEN** a navalha está aberta sobre o fio
- **THEN** nenhum pixel da tesoura aparece no trilho direito

#### Scenario: Tesoura de volta
- **WHEN** a navalha termina o corte e sai
- **THEN** a tesoura volta ao trilho direito

### Requirement: Corte no celular
Abaixo de md, onde o fio dos passos é vertical, a navalha SHALL fazer o mesmo movimento,
menor, sobre um fio horizontal sob o título da seção. A tesoura sai do canto enquanto isso.

#### Scenario: Celular
- **WHEN** a seção é rolada num celular até o ponto de corte
- **THEN** a navalha corta o fio sob o título, cabe inteira na largura da tela durante o
  corte e a tesoura volta ao canto depois

### Requirement: Resposta ao ponteiro
Antes do corte, com ponteiro fino, a navalha SHALL inclinar levemente para o ponteiro
próximo, menos que a tesoura.

#### Scenario: Ponteiro perto
- **WHEN** o ponteiro está perto da navalha antes do corte
- **THEN** ela inclina na direção dele, até o limite dos tokens

### Requirement: Nunca bloqueia interação
A navalha MUST NOT capturar cliques, foco ou leitores de tela.

#### Scenario: Clique através da navalha
- **WHEN** o usuário clica sobre a área da navalha
- **THEN** o clique chega ao elemento da página por baixo

### Requirement: Fallback parado
Com movimento reduzido, `?reduced=1` ou sem WebGL, a navalha SHALL aparecer como imagem
parada, deitada e aberta, na ponta direita do fio já desenhado, acompanhando a página. Não
há animação nem download do modelo 3D nesses casos. Sem WebGL, a tela não mostra erro.

#### Scenario: Movimento reduzido
- **WHEN** a página carrega com movimento reduzido a 1440 px
- **THEN** o fio está desenhado, a imagem parada da navalha está na ponta direita dele, e
  `razor.glb` não é baixado

#### Scenario: Sem WebGL
- **WHEN** o navegador não oferece WebGL
- **THEN** a imagem parada aparece no mesmo lugar e a página funciona sem erro

### Requirement: Orçamento de performance
A navalha:
- SHALL usar o mesmo contexto WebGL e o mesmo laço da tesoura (um contexto na página);
- MUST NOT adicionar mais de 120 KB (GLB) nem atrasar o LCP em mais de 100 ms;
- MUST NOT causar deslocamento de layout (CLS 0);
- MUST NOT desenhar quadros com a aba oculta.

Se o modelo falhar, a tesoura e o fio seguem normalmente.

#### Scenario: Peso e contexto
- **WHEN** a página é medida no desktop
- **THEN** há um único contexto WebGL e `razor.glb` tem no máximo 120 KB

#### Scenario: Aba oculta
- **WHEN** a aba fica oculta
- **THEN** nenhum quadro é desenhado
