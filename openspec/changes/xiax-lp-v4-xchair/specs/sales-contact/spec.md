# Spec Delta

## Purpose

Faz do WhatsApp de vendas o único destino de conversão da página (decisão do dono em
2026-10-28), sem captura de e-mail, e mede o clique.

## ADDED Requirements

### Requirement: WhatsApp de vendas é o CTA único
Hero, cards de plano, fechamento e barra fixa do celular SHALL levar ao WhatsApp de vendas
(+55 49 99161-3378 por padrão, trocável por variável de ambiente), abrindo a conversa com a
mensagem já digitada. A página MUST NOT ter formulário de e-mail.

#### Scenario: Clique no hero
- **WHEN** o visitante toca no CTA do hero
- **THEN** abre `wa.me` com o número de vendas e a saudação "Olá! Tenho uma barbearia e quero conhecer o Xchair."

#### Scenario: Busca por formulário
- **WHEN** a página é inspecionada
- **THEN** não há campo de e-mail nem formulário de interesse

### Requirement: Fechamento explica o depois
O fechamento SHALL mostrar três passos de "o que acontece depois" do clique e o preço do plano
Essencial, junto do CTA.

#### Scenario: Seção final
- **WHEN** o visitante chega ao fechamento
- **THEN** vê os três passos, o preço do Essencial e o botão de WhatsApp

### Requirement: Clique medido por origem
Cada clique em CTA SHALL gerar o evento `cta_click` com a origem `hero`, `planos`, `final` ou `sticky`.

#### Scenario: Clique na barra fixa
- **WHEN** o visitante toca no CTA da barra fixa do celular
- **THEN** é registrado `cta_click` com placement `sticky`
