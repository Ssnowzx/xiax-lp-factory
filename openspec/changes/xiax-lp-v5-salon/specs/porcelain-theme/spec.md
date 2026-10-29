# Spec Delta

## Purpose

O visual Porcelana da página do salão é o mesmo tema que o app usa para salão de beleza (marfim, terracota, serifa,
fotos em arco), para a dona ver na página de vendas o que o salão dela vai receber.

## ADDED Requirements

### Requirement: Cores do Porcelana com contraste AA
A página do salão SHALL usar o fundo `#F6F1EA`, o texto `#1C1714`, o texto secundário `#6E625A`, o acento `#7B4A3C` e
o texto sobre o acento `#FBF7F1`. Todo par de texto e fundo da página SHALL ter contraste de pelo menos 4,5:1. Texto
grande (24 px ou mais, ou 19 px em negrito) e contornos de controle SHALL ter pelo menos 3:1.

#### Scenario: Texto secundário
- **WHEN** o texto secundário aparece sobre o fundo marfim
- **THEN** o contraste é de pelo menos 4,5:1

#### Scenario: Botão principal
- **WHEN** o botão "Chamar no WhatsApp" aparece
- **THEN** o texto marfim sobre a terracota tem contraste de pelo menos 4,5:1

### Requirement: Tipografia do Porcelana
Os títulos SHALL usar Fraunces (peso 500), em caixa normal, com a palavra ou frase de destaque em itálico terracota.
O app usa Bodoni Moda, mas na página ela ficou fina demais para ler (dono, 2026-10-28). O texto corrido SHALL usar
Manrope 500. Os rótulos pequenos (kicker, selos, botões) SHALL ser em caixa-alta espaçada, em Manrope. Frases inteiras,
como as perguntas do FAQ, SHALL NOT ficar em caixa-alta espaçada.

#### Scenario: Título do topo
- **WHEN** o topo carrega
- **THEN** o título está em Fraunces, sem caixa-alta, com o destaque em itálico terracota

#### Scenario: Sem troca de layout ao carregar a fonte
- **WHEN** as fontes terminam de carregar
- **THEN** a página não se desloca (CLS 0)

### Requirement: Formas do Porcelana
Os botões SHALL ter forma de pílula. A foto principal da página do salão e as fotos de destaque SHALL usar moldura em
arco. As sombras SHALL ser quentes e leves. Nenhuma sombra preta pesada SHALL aparecer sobre o marfim.

#### Scenario: Botão
- **WHEN** qualquer botão de ação aparece
- **THEN** ele tem as pontas totalmente arredondadas

### Requirement: Superfície clara
O fundo SHALL ser marfim com uma textura de papel ou linho sutil, mas visível (o dono pediu textura, 2026-10-28), que
não reduz o contraste do texto abaixo de AA. A textura de couro da barbearia SHALL NOT aparecer na página do salão.

#### Scenario: Fundo
- **WHEN** a página do salão é vista em qualquer largura
- **THEN** não há couro, e o texto mantém o contraste AA sobre o fundo

#### Scenario: Setores separados
- **WHEN** o visitante rola a página do salão
- **THEN** os setores se alternam entre o marfim e uma faixa areia com a mesma textura, separada por filetes (o dono
  pediu, 2026-10-28: "separar mais os setores")
- **AND** o texto mantém o contraste AA também sobre a trama mais escura da faixa

### Requirement: 3D no fundo claro
A tesoura 3D da página do salão SHALL ser iluminada para o fundo claro: o metal mantém brilho e volume, sem halo escuro
nem sombra recortada. Sem WebGL ou com movimento reduzido, a imagem parada da tesoura SHALL aparecer sem fundo escuro.

#### Scenario: Movimento reduzido
- **WHEN** o visitante usa movimento reduzido
- **THEN** a tesoura aparece parada, com o fundo transparente sobre o marfim

### Requirement: Movimento igual ao da barbearia
O movimento da página do salão SHALL seguir as mesmas regras da barbearia:

- animar só posição, escala, rotação e opacidade;
- rever as animações de destaque a cada descida;
- parar tudo com movimento reduzido;
- manter os cartões com profundidade 2.5D.

#### Scenario: Movimento reduzido
- **WHEN** o visitante usa movimento reduzido
- **THEN** todo o conteúdo aparece no lugar final, sem animação
