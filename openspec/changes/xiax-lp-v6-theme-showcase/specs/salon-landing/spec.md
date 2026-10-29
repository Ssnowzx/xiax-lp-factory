# Spec Delta

## Purpose

A vitrine de estilos do salão mostra cada estilo no seu próprio tema; as demais telas continuam no Porcelana.

## MODIFIED Requirements

### Requirement: Telas reais com dados de exemplo
As imagens do sistema SHALL ser telas do Xchair no tema Porcelana, nítidas numa tela 2x, com texto alternativo em
português, exceto na seção de modelos, onde cada tela SHALL estar no estilo que ela apresenta (Porcelana, Rosé, Sálvia
ou Noite de Gala). Toda área com telas SHALL trazer a nota "Telas reais do Xchair · dados de exemplo". Os dados das telas
SHALL ser de um salão de exemplo e SHALL NOT ser apresentados como cliente real.

#### Scenario: Topo
- **WHEN** o topo carrega
- **THEN** mostra a tela de início do salão num celular e a agenda do dia num computador, com a nota de dados de
  exemplo

#### Scenario: Estilos do salão
- **WHEN** a seção de modelos é exibida em `/salao`
- **THEN** aparecem Porcelana (com "Padrão"), Rosé, Sálvia e Noite de Gala, cada tela no seu tema, com a nota de dados
  de exemplo

#### Scenario: Nitidez
- **WHEN** a página é vista numa tela 2x a 1440 px de largura
- **THEN** nenhuma tela do sistema é ampliada além do tamanho do arquivo
