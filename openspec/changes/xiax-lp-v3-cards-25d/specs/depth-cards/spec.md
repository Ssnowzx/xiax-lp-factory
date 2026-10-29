# Spec Delta

## Purpose

Dá profundidade (2.5D) às superfícies que vendem na landing — painel da agenda, preços,
galeria, modelos e como funciona — com camadas que se separam ao inclinar, sem custo de layout nem
perda de acessibilidade.

## ADDED Requirements

### Requirement: Card com profundidade responde ao ponteiro
Em dispositivos com ponteiro fino e hover, um card com profundidade SHALL inclinar na
direção do cursor enquanto ele está sobre o card, limitado a um ângulo máximo definido
nos tokens de motion, e SHALL voltar suavemente à posição plana quando o cursor sai.

#### Scenario: Cursor no canto superior direito
- **WHEN** o cursor está no canto superior direito de um card com profundidade
- **THEN** o card inclina em direção a esse canto sem ultrapassar o ângulo máximo do token

#### Scenario: Cursor sai do card
- **WHEN** o cursor deixa o card
- **THEN** o card retorna à posição plana com easing (sem salto)

### Requirement: Card com profundidade responde ao scroll em touch
Em dispositivos sem hover (touch), um card com profundidade SHALL inclinar levemente
conforme atravessa a viewport no scroll, com ângulo menor que o de ponteiro, e MUST NOT
pedir permissão de sensores do aparelho.

#### Scenario: Card atravessando a tela no celular
- **WHEN** o usuário rola e o card passa da parte de baixo para a de cima da viewport
- **THEN** a inclinação varia continuamente dentro do limite de touch e nenhum prompt de permissão aparece

### Requirement: Camadas internas se separam em profundidade
Os elementos marcados como camadas dentro de um card com profundidade SHALL ficar em
alturas diferentes, de modo que, quando o card inclina, as camadas mais altas se
deslocam mais que as mais baixas.

#### Scenario: Preço flutua acima do card
- **WHEN** um card de plano inclina
- **THEN** o preço e o ícone do plano se deslocam mais que o fundo do card

### Requirement: Reflexo de latão acompanha a inclinação
Um card com profundidade SHALL exibir um reflexo de latão translúcido que se move com a
inclinação, e o reflexo MUST NOT reduzir o contraste do texto abaixo do mínimo AA.

#### Scenario: Reflexo sobre texto
- **WHEN** o reflexo passa por cima do texto de um card
- **THEN** o texto continua com contraste AA

### Requirement: Movimento reduzido desliga a inclinação
Com `prefers-reduced-motion: reduce` (ou `?reduced=1`), cards com profundidade SHALL
ficar planos, sem reflexo e sem animação de montagem, mantendo todo o conteúdo visível.

#### Scenario: Usuário com movimento reduzido
- **WHEN** a página carrega com `prefers-reduced-motion: reduce`
- **THEN** nenhum card inclina, nenhum reflexo aparece e todo o conteúdo está visível

### Requirement: Profundidade não causa deslocamento de layout
A profundidade SHALL ser aplicada apenas com transformações e opacidade, e MUST NOT
alterar o tamanho ou a posição de layout dos cards (CLS atribuível igual a 0).

#### Scenario: Medição de CLS
- **WHEN** a página carrega e o usuário interage com os cards
- **THEN** nenhum layout shift é atribuído aos cards com profundidade

### Requirement: Painel da agenda em camadas
O painel da agenda no hero SHALL ser um card com profundidade em que as estatísticas,
os horários e os lembretes de WhatsApp ficam em camadas crescentes, e os horários SHALL
se montar vindo do fundo, em cascata, uma única vez na abertura da página.

#### Scenario: Abertura da página
- **WHEN** a página carrega com motion permitido
- **THEN** os horários do painel entram do fundo em cascata e terminam planos e legíveis

#### Scenario: Lembretes flutuam mais alto
- **WHEN** o painel inclina
- **THEN** os lembretes de WhatsApp se deslocam mais que os horários

### Requirement: Planos com profundidade
Os quatro cards de plano SHALL ser cards com profundidade; o preço e o ícone de latão do
plano SHALL ficar na camada mais alta; o plano "Mais popular" SHALL ficar permanentemente um
nível acima dos demais, com reflexo mais intenso.

#### Scenario: Mais popular em destaque
- **WHEN** os quatro planos estão visíveis
- **THEN** o "Mais popular" aparece mais elevado que os outros, mesmo sem interação

#### Scenario: Ícone por plano
- **WHEN** os planos são renderizados
- **THEN** cada plano exibe seu ícone de latão: tesoura (Corte), navalha (Corte + Barba), pente (Premium), coroa (VIP), com texto alternativo vazio por serem decorativos

### Requirement: Como funciona em cards com mini-tela
Os três passos de "Como funciona" SHALL ser cards com profundidade sobre o fundo da página,
cada um com uma mini-tela decorativa do passo (agendamento, agenda do barbeiro, lembrete no
WhatsApp) que toca uma vez ao entrar na tela (e de novo a cada descida até a seção, junto
com o corte da navalha — change `xiax-lp-v3-razor-3d`). Lado a lado, os cards SHALL tocar em
sequência (1, depois 2, depois 3). Sem JS ou com movimento reduzido, cada mini-tela SHALL
mostrar o estado final do passo, parada.

#### Scenario: Seção entra na tela no desktop
- **WHEN** a seção entra na tela com motion permitido e os três cards lado a lado
- **THEN** a mini-tela 1 toca, depois a 2, depois a 3, e cada uma termina no estado final

#### Scenario: Movimento reduzido
- **WHEN** a página carrega com movimento reduzido
- **THEN** as três mini-telas aparecem já no estado final, sem animação, e os cards ficam planos

#### Scenario: Leitor de tela
- **WHEN** um leitor de tela percorre a seção
- **THEN** lê o título de cada passo e ignora o conteúdo das mini-telas

### Requirement: Galeria em camadas
Cada foto da galeria SHALL ter pessoa e fundo em camadas separadas; durante o scroll o
fundo SHALL se mover mais devagar que a pessoa, sem revelar buracos ou bordas do
recorte, e cada foto MUST manter a caixa 16:9 reservada (sem CLS).

#### Scenario: Scroll pela galeria
- **WHEN** o usuário rola pela galeria
- **THEN** a pessoa e o fundo de cada foto se deslocam em velocidades diferentes e nenhuma borda de recorte fica visível

#### Scenario: Fallback sem camadas
- **WHEN** uma foto não tem camadas aprovadas
- **THEN** ela é exibida inteira, com zoom e deslocamento interno, na mesma caixa 16:9

### Requirement: Modelos como baralho
A prévia de modelos SHALL mostrar os demais modelos empilhados atrás do modelo ativo;
ao escolher outro modelo, ele SHALL vir à frente com um giro curto (menor que 1 s), e a
seleção por teclado e o anúncio para leitor de tela MUST continuar funcionando.

#### Scenario: Trocar de modelo com o mouse
- **WHEN** o usuário escolhe "Urbana" estando em "Clássica"
- **THEN** a carta de "Urbana" vem à frente com giro curto e "Clássica" volta para a pilha

#### Scenario: Trocar de modelo pelo teclado
- **WHEN** o usuário navega entre os modelos com as setas do teclado
- **THEN** a carta ativa muda junto e o leitor de tela anuncia o modelo selecionado

#### Scenario: Cartas de trás não são lidas
- **WHEN** um leitor de tela percorre a prévia
- **THEN** apenas a carta ativa é exposta; as cartas empilhadas são decorativas
