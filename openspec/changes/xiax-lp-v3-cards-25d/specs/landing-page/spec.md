# Spec Delta

## Purpose

Landing page da Xbarber: composição do funil de conversão, conteúdo e regras de
qualidade da página como um todo.

## ADDED Requirements

### Requirement: Prova social só com conteúdo real
A página MUST NOT renderizar a seção de depoimentos ("O que os donos falam") enquanto
não houver relatos reais aprovados; a ordem das demais seções do funil SHALL permanecer
a mesma, e nenhum link ou âncora da página SHALL apontar para a seção removida.

#### Scenario: Sem relatos reais
- **WHEN** a página é renderizada sem relatos reais cadastrados
- **THEN** a seção "O que os donos falam" não aparece e "Modelos" é seguida diretamente por "Planos"

#### Scenario: Nenhum link quebrado
- **WHEN** qualquer link interno da página é seguido
- **THEN** nenhum aponta para `#depoimentos`

### Requirement: Preço sem promessa de barbeiro ilimitado
Enquanto os planos novos não forem definidos, a página MUST NOT prometer barbeiros
ilimitados, preço fixo nem comparar preço com concorrentes; os preços SHALL vir apenas da
tabela de planos.

#### Scenario: Página renderizada
- **WHEN** a página é renderizada
- **THEN** não existe a seção "Preço fixo" e nenhum texto visível contém "barbeiros ilimitados", "preço fixo", "Booksy" ou "Trinks"
