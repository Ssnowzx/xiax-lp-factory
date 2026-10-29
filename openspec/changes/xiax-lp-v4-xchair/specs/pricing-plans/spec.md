# Spec Delta

## Purpose

Define os três planos do Xchair, o que cada um mostra e para onde vai o botão de cada card,
sem prometer como disponível o que ainda está sendo construído.

## ADDED Requirements

### Requirement: Três planos com estado
A página SHALL listar Essencial (R$ 99/mês, R$ 79/mês no anual, disponível), Completo (R$ 229
até 5 profissionais, R$ 329 de 6 a 10, em breve) e Signature ("a partir de R$ 990" por unidade,
sob consulta, em breve).

#### Scenario: Cards de planos
- **WHEN** a seção de planos é exibida
- **THEN** só o Essencial aparece como disponível e os outros dois levam a etiqueta "Em breve" com seus preços

### Requirement: Funções futuras nunca como incluídas
As funções do Completo e do Signature SHALL ser exibidas sob "Em breve" e MUST NOT ser
apresentadas como incluídas hoje; o Essencial MUST listar apenas o que o sistema já faz.

#### Scenario: Plano em breve
- **WHEN** o visitante lê o card do Completo ou do Signature
- **THEN** a etiqueta "Em breve" está visível junto das funções e nenhum botão diz "Assinar"

### Requirement: Botão do plano
O botão do Essencial SHALL levar ao checkout quando a URL de checkout existir e, sem ela, ao
WhatsApp de vendas com mensagem que nomeia o plano. Os planos em breve SHALL sempre levar ao WhatsApp, também com o nome do plano.

#### Scenario: Sem checkout configurado
- **WHEN** não há URL de checkout e o visitante toca no botão do Essencial
- **THEN** abre o WhatsApp de vendas com a mensagem "…quero conhecer o plano Essencial do Xchair."

#### Scenario: Checkout configurado
- **WHEN** a URL de checkout existe
- **THEN** o botão do Essencial diz "Assinar o Essencial" e abre o checkout

### Requirement: Cancelamento só se confirmado
A frase "Cancele quando quiser, sem multa" MUST NOT aparecer enquanto o dono não confirmar a
regra; a tranquilidade exibida SHALL dizer apenas que a página fica pronta quando o pagamento é confirmado.

#### Scenario: Configuração padrão
- **WHEN** a página é renderizada com a opção de cancelamento desligada
- **THEN** só a frase sobre a página pronta após o pagamento aparece ao lado dos botões de compra
