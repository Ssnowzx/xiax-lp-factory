# Spec Delta

## Purpose

A seção de modelos mostra os estilos que o app já entrega para a página do cliente, para o dono saber que pode trocar,
sem oferecer escolha pelo site.

## MODIFIED Requirements

### Requirement: Modelos mostra a página real
A seção de modelos SHALL mostrar a página real de agendamento em cada um dos quatro estilos do segmento da página, cada
um num celular com nome e uma frase, e SHALL marcar com "Padrão" o estilo em que a página abre. A seção SHALL dizer que
o dono troca o estilo no painel. A seção MUST NOT oferecer seletor de estilo ou cor, botão para pedir um estilo, nem
estilo que o app não entrega.

#### Scenario: Seção modelos na barbearia
- **WHEN** a seção é exibida em `/`
- **THEN** aparecem Navalha (com "Padrão"), Velha Guarda, Poste e Oficina, cada um num celular, e nenhum seletor

#### Scenario: Troca pelo painel
- **WHEN** o dono lê a nota da seção
- **THEN** ela diz que a troca é feita no painel e que fotos, serviços e horários continuam no lugar

#### Scenario: Celular
- **WHEN** a seção é vista a 390 px de largura
- **THEN** os estilos ficam numa fileira que desliza para o lado, com o próximo aparecendo na borda, e a página não
  ganha rolagem lateral
