# Spec Delta

## Purpose

Define a marca Xchair, o escopo (só barbearia), as regras de honestidade e a composição da
landing: a página só promete o que o sistema já faz e só mostra números com fonte.

## ADDED Requirements

### Requirement: Marca Xchair, só para barbearia
A página SHALL se apresentar como Xchair, feito pela Xiax, voltado a barbearias, e MUST NOT
exibir o nome "Xbarber" nem falar de salão de beleza em texto visível, título ou metadados.

#### Scenario: Página renderizada
- **WHEN** a página é renderizada
- **THEN** o nome, o título e a descrição usam "Xchair" e nenhum texto visível contém "Xbarber" ou "salão"

### Requirement: Sem promessas que o produto não cumpre
A página MUST NOT exibir IA como recurso disponível, teste grátis, "sem cartão", logos de
clientes, depoimentos, link "Entrar" nem promessas absolutas. Recursos de planos futuros SHALL
aparecer somente sob a etiqueta "Em breve".

#### Scenario: Busca por termos proibidos
- **WHEN** o texto visível da página é inspecionado
- **THEN** não há "teste grátis", "sem cartão", "Entrar", logos de clientes nem depoimentos, e IA só aparece no plano em breve

### Requirement: Números só com fonte
A página MUST NOT exibir estatística sem fonte citada. O único número permitido SHALL ser
"25% menos faltas", acompanhado da fonte (Robotham et al., BMJ Open, 2016).

#### Scenario: Seção de números
- **WHEN** a seção de números é exibida
- **THEN** mostra 25% com a citação da fonte e nenhum outro valor estatístico sem fonte

### Requirement: Identidade e domínio vêm da configuração
Nome, URL e checkout SHALL vir de uma fonte única de configuração; a URL MUST vir de variável de
ambiente e a página MUST NOT inventar um domínio quando ela não existe.

#### Scenario: Sem variáveis definidas
- **WHEN** a página é construída sem URL do site e sem URL de checkout
- **THEN** o endereço usa o valor local de desenvolvimento e o checkout é tratado como ausente

### Requirement: Ordem do funil
A página SHALL apresentar as seções nesta ordem: hero, dor, como funciona, números, lista de
espera, caixa, galeria, modelos, planos, FAQ e fechamento.

#### Scenario: Navegação pelas âncoras
- **WHEN** o visitante segue `#lista-de-espera` ou `#caixa`
- **THEN** cai na seção correspondente, entre os números e a galeria, e nenhuma âncora aponta para seção removida

### Requirement: Como funciona responsivo
Os passos de "como funciona" SHALL empilhar abaixo de `lg`, com a imagem ao lado do texto em
tablets, e SHALL ficar em três colunas a partir de `lg`.

#### Scenario: Larguras diferentes
- **WHEN** a página é aberta em celular, tablet e desktop
- **THEN** o celular empilha, o tablet empilha com imagem ao lado do texto e o desktop mostra três colunas
