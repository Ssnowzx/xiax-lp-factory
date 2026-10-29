# Spec Delta

## Purpose

Define o fundo texturizado da landing (couro de cadeira de barbeiro) que dá matéria à
página escura, com limites de peso, contraste e estabilidade de layout.

## ADDED Requirements

### Requirement: Fundo com textura de couro
A página SHALL exibir, atrás de todo o conteúdo, uma textura de couro escuro repetível
sem emendas visíveis, com intensidade baixa o bastante para não competir com o texto.

#### Scenario: Página carregada no tema escuro
- **WHEN** a página carrega
- **THEN** o fundo mostra a textura de couro sem costuras visíveis entre as repetições

### Requirement: Textura preserva contraste do texto
A textura MUST NOT reduzir o contraste de nenhum texto de corpo abaixo de AA (4.5:1)
nem de rótulos grandes abaixo de 3:1, medido sobre o pixel mais claro da textura.

#### Scenario: Checagem de contraste
- **WHEN** o script de contraste do QA roda sobre a página com a textura
- **THEN** todos os pares texto/fundo passam no mínimo AA

### Requirement: Textura é leve e estática
A textura SHALL pesar no máximo 80 KB transferidos, SHALL carregar sem bloquear a
primeira pintura e MUST NOT animar nem causar repintura durante o scroll.

#### Scenario: Peso e carregamento
- **WHEN** a página carrega em rede 4G simulada
- **THEN** a textura transfere até 80 KB e o LCP do hero não piora mais que 100 ms em relação à versão sem textura

#### Scenario: Scroll
- **WHEN** o usuário rola a página
- **THEN** a textura rola junto com o conteúdo (não fica presa à tela) e não gera repintura contínua
