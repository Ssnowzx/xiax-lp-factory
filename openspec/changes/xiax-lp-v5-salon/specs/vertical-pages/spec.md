# Spec Delta

## Purpose

O mesmo código serve mais de uma página de vendas do Xchair, uma por público (barbearia, salão de beleza). Cada página
tem endereço, conteúdo, tema, SEO e mensagem de WhatsApp próprios, e nenhuma fala do público da outra.

## ADDED Requirements

### Requirement: Um endereço por público
A página da barbearia SHALL responder em `/`, e a página do salão de beleza SHALL responder em `/salao`. Cada uma SHALL
ter título, descrição, endereço canônico, imagem de compartilhamento e dados estruturados próprios. O sitemap SHALL
listar as duas.

#### Scenario: Abrir a página do salão
- **WHEN** o visitante abre `/salao`
- **THEN** recebe a página do salão de beleza, com o título "Sistema de Agendamento para Salão de Beleza | Xchair" e o
  canônico apontando para `/salao`

#### Scenario: Sitemap
- **WHEN** um buscador lê o sitemap
- **THEN** encontra `/` e `/salao`

#### Scenario: Compartilhar no WhatsApp
- **WHEN** alguém cola o endereço `/salao` numa conversa
- **THEN** a prévia mostra a imagem de compartilhamento do salão, não a da barbearia

### Requirement: A página da barbearia não muda para o visitante
A separação do conteúdo SHALL manter na página `/` exatamente o mesmo texto visível, as mesmas imagens e a mesma ordem
de seções de antes da change.

#### Scenario: Comparação antes e depois
- **WHEN** o texto visível de `/` é extraído antes e depois da change, na mesma largura
- **THEN** os dois são idênticos

### Requirement: Cada página fala só com o seu público
A página da barbearia SHALL NOT citar salão de beleza, e a página do salão SHALL NOT citar barbearia, barbeiro, barba
nem navalha, em nenhum texto visível, texto alternativo, título, descrição ou mensagem de WhatsApp.

#### Scenario: Varredura da página do salão
- **WHEN** o texto visível, os textos alternativos e os metadados de `/salao` são varridos sem diferenciar acento nem
  maiúscula
- **THEN** não aparece "barbearia", "barbeiro", "barba" nem "navalha"

#### Scenario: Varredura da página da barbearia
- **WHEN** a mesma varredura roda em `/`
- **THEN** não aparece "salão de beleza" nem "salão"

### Requirement: WhatsApp de vendas com a mensagem da página
Todo botão de ação das duas páginas SHALL abrir a conversa com o mesmo número de vendas, com uma mensagem pronta que
cita o público da página. Os botões de plano SHALL citar também o plano.

#### Scenario: Botão do topo no salão
- **WHEN** o visitante toca em "Chamar no WhatsApp" no topo de `/salao`
- **THEN** o WhatsApp abre com a mensagem "Olá! Tenho um salão de beleza e quero conhecer o Xchair."

#### Scenario: Botão de plano no salão
- **WHEN** o visitante toca no botão do Completo em `/salao`
- **THEN** a mensagem pronta cita o salão de beleza e o plano Completo

### Requirement: Medição por página
Cada clique em botão de ação SHALL ser registrado com o lugar do botão e com a página de origem (barbearia ou salão).

#### Scenario: Clique no fechamento do salão
- **WHEN** o visitante toca no botão do fechamento de `/salao`
- **THEN** o evento registra o lugar "final" e a página "salão"

### Requirement: Tema e fontes por página
Cada página SHALL carregar só as fontes e o tema dela. A página da barbearia SHALL NOT baixar as fontes do salão, e
vice-versa.

#### Scenario: Fontes da barbearia
- **WHEN** `/` carrega
- **THEN** nenhuma requisição de fonte do tema do salão é feita
