# Spec Delta

## Purpose

Mostra o app de verdade (capturas em 2x) em vez de mocks desenhados, deixando claro que os
dados são de exemplo.

## ADDED Requirements

### Requirement: Telas reais com aviso
As imagens de produto SHALL ser capturas reais do Xchair e a página SHALL informar
"Telas reais do Xchair · dados de exemplo"; os dados MUST ser fictícios e não apresentados como cliente real.

#### Scenario: Seção com tela
- **WHEN** uma seção exibe uma tela do app
- **THEN** a legenda indica que são dados de exemplo e a imagem tem texto alternativo descritivo

### Requirement: Nitidez sem ampliar
Cada tela SHALL ser entregue com o dobro dos pixels do tamanho exibido e MUST NOT ser ampliada além do tamanho do arquivo.

#### Scenario: Tela em celular retina
- **WHEN** uma tela é exibida
- **THEN** a largura do arquivo é pelo menos o dobro da largura exibida

### Requirement: Mensagens de WhatsApp fiéis
Os exemplos de mensagem exibidos SHALL seguir os modelos reais do app (lembrete de 24h e vaga liberada), com nomes e datas fictícios.

#### Scenario: Balão de lembrete
- **WHEN** o exemplo de lembrete é exibido
- **THEN** o nome da barbearia aparece em negrito na primeira linha, seguido do texto do modelo

### Requirement: Modelos mostra a página real
A seção de modelos SHALL mostrar a página real da barbearia dentro de um celular e MUST NOT oferecer escolha de estilos ou cores que o produto não tem.

#### Scenario: Seção modelos
- **WHEN** a seção é exibida
- **THEN** há uma única página de exemplo em moldura de celular e nenhum seletor de estilo
