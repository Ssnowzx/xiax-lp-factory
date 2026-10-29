# Spec Delta

## Purpose

Tesoura decorativa ligada ao scroll que "corta a página": um objeto 3D de metal que abre
a landing no hero e depois acompanha a leitura pela lateral, sem atrapalhar conversão,
acessibilidade nem performance.

## ADDED Requirements

### Requirement: Tesoura com aparência de objeto real
A tesoura SHALL ser exibida como objeto 3D com anéis em latão e lâminas em aço que
refletem luz, e suas duas lâminas SHALL abrir e fechar girando em torno do rebite
central, sem que os anéis se atravessem.

#### Scenario: Abrir e fechar
- **WHEN** a tesoura executa um ciclo de abrir e fechar
- **THEN** cada lâmina gira em torno do rebite e os anéis nunca se sobrepõem

### Requirement: Abertura no hero
Em telas ≥ md com motion permitido, ao carregar a página a tesoura SHALL aparecer grande
no hero, parcialmente sobre a borda do painel da agenda, girando devagar, e MUST NOT
cobrir o título, o subtítulo nem o formulário de e-mail do hero.

#### Scenario: Primeira tela no desktop
- **WHEN** a página carrega a 1440×900 com motion permitido
- **THEN** depois do carregamento a tesoura aparece grande na borda do painel da agenda, girando, sem sobrepor título, subtítulo ou formulário

### Requirement: Transição do hero para o trilho
Ao rolar para fora do hero, a tesoura SHALL encolher e deslizar continuamente da posição
do hero até o topo do trilho lateral direito, e o movimento SHALL reverter ao rolar de
volta.

#### Scenario: Saindo do hero
- **WHEN** o usuário rola do topo até o fim do hero
- **THEN** a tesoura reduz de tamanho e chega ao topo do trilho sem saltos

#### Scenario: Voltando ao hero
- **WHEN** o usuário rola de volta ao topo
- **THEN** a tesoura volta a crescer e retorna à posição do hero

### Requirement: Corte pelo trilho lateral
No trilho, a tesoura SHALL descer acompanhando o scroll, abrir e fechar em ritmo
contínuo, manter o rastro sempre à frente na direção do movimento, girar 180° ao
inverter o scroll e parar no topo do rodapé.

#### Scenario: Descendo
- **WHEN** o usuário rola para baixo pelo meio da página
- **THEN** a tesoura desce, abre e fecha, com a ponta das lâminas para baixo e o rastro à frente

#### Scenario: Invertendo o scroll
- **WHEN** o usuário passa a rolar para cima
- **THEN** a tesoura gira 180° e as lâminas passam a apontar para cima

#### Scenario: Fim da página
- **WHEN** o usuário chega ao rodapé
- **THEN** a tesoura para no topo do rodapé e não o invade

### Requirement: Resposta ao ponteiro
Em dispositivos com ponteiro fino, a tesoura SHALL inclinar levemente na direção do
cursor, até um ângulo máximo definido nos tokens de motion, e voltar suavemente quando o
cursor se afasta.

#### Scenario: Cursor perto da tesoura
- **WHEN** o cursor se move ao redor da tesoura
- **THEN** ela inclina na direção do cursor sem ultrapassar o ângulo máximo

### Requirement: Comportamento no celular
Em telas < md com motion permitido, a tesoura SHALL aparecer pequena no canto inferior
direito, acima da barra fixa de CTA, abrindo e fechando conforme o scroll, e MUST NOT
cobrir a barra de CTA. Ela SHALL ficar dentro da margem lateral direita da página (7vw), fora
da coluna de conteúdo (pedido do dono, 2026-10-28: "menor e mais no canto").

#### Scenario: Rolando no celular
- **WHEN** o usuário rola a página a 390×844
- **THEN** a tesoura aparece pequena no canto inferior direito, acima da barra de CTA, abrindo e fechando com o scroll

#### Scenario: Fora do conteúdo no celular
- **WHEN** a página é vista em celulares de 360 a 430 px de largura
- **THEN** a tesoura cabe na margem direita e não cobre texto nem cards

### Requirement: Tesoura é puramente decorativa
A tesoura MUST NOT interceptar cliques ou toques, MUST NOT receber foco e SHALL ser
ignorada por leitores de tela.

#### Scenario: Clique através da tesoura
- **WHEN** o usuário clica num elemento que está sob a tesoura
- **THEN** o clique chega ao elemento normalmente

#### Scenario: Leitor de tela
- **WHEN** um leitor de tela percorre a página
- **THEN** nada relativo à tesoura é anunciado

### Requirement: Carregamento fora da primeira tela
O 3D da tesoura SHALL ser carregado somente depois da primeira renderização da página;
o total transferido por ele MUST ser ≤ 300 KB e o LCP MUST NOT piorar mais que 100 ms em
relação à página sem a tesoura 3D.

#### Scenario: Medição de LCP e peso
- **WHEN** a página carrega a 1440×900
- **THEN** os arquivos da tesoura começam a baixar após a primeira renderização, somam ≤ 300 KB e o LCP fica dentro de +100 ms

### Requirement: Fallback estático
Com `prefers-reduced-motion: reduce` (ou `?reduced=1`) ou sem suporte a WebGL, a tesoura
SHALL ser exibida como imagem parada do mesmo modelo no topo do trilho, com o rastro
inteiro desenhado; em telas < md nesse modo nenhuma tesoura é exibida.

#### Scenario: Movimento reduzido no desktop
- **WHEN** a página carrega com `prefers-reduced-motion: reduce` a 1440×900
- **THEN** a imagem parada aparece no topo do trilho, o rastro está inteiro e nada se move

#### Scenario: Sem WebGL
- **WHEN** o navegador não oferece WebGL
- **THEN** a página mostra a imagem parada no lugar do 3D, sem erro visível

### Requirement: Economia de processamento
A tesoura SHALL pausar toda renderização quando a aba estiver oculta e, fora do hero,
SHALL redesenhar apenas quando houver scroll ou movimento do ponteiro.

#### Scenario: Aba em segundo plano
- **WHEN** o usuário troca de aba
- **THEN** a tesoura não consome quadros de animação até a aba voltar

#### Scenario: Página parada no meio
- **WHEN** o usuário para de rolar no meio da página e não move o mouse
- **THEN** nenhum novo quadro da tesoura é desenhado
