# Spec Delta

## Purpose

Na página do salão, uma escova redonda 3D faz em "Como funciona" o papel que a navalha faz na barbearia: a cada descida
até a seção, ela passa girando pela linha que liga os três passos, como numa escova de cabelo. É decorativa e não custa
acessibilidade nem desempenho.

## ADDED Requirements

### Requirement: Escova com aparência de objeto real
A escova SHALL ser exibida como objeto 3D com:

- cilindro de cerdas com volume;
- corpo ventilado;
- cabo com acabamento que reflete a luz.

As cerdas SHALL ficar em fileiras regulares em volta do cilindro.

#### Scenario: Visto de perto
- **WHEN** a escova está na maior escala da animação
- **THEN** as fileiras de cerdas e o cabo aparecem distintos, sem faces quebradas

### Requirement: Passada guiada pela rolagem
Quando "Como funciona" chega à tela, a escova SHALL entrar pela borda, pousar sobre o início da linha dos passos e
percorrê-la girando em torno do próprio eixo. A linha SHALL se revelar atrás dela. O movimento SHALL seguir a rolagem nos
dois sentidos. A escova MUST NOT cobrir o título da seção nem os números dos passos.

#### Scenario: Rolando até a seção
- **WHEN** o visitante desce até "Como funciona"
- **THEN** a escova entra, percorre a linha girando e a linha aparece atrás dela

#### Scenario: Voltando para cima
- **WHEN** o visitante sobe de novo antes do fim da passada
- **THEN** a escova volta pelo mesmo caminho

#### Scenario: Descendo de novo
- **WHEN** o visitante sai da seção por cima e desce de novo
- **THEN** a passada acontece outra vez

### Requirement: Convivência com a tesoura
A escova e a tesoura SHALL NOT aparecer juntas na mesma área: enquanto a escova está em cena, a tesoura sai.

#### Scenario: Escova em cena
- **WHEN** a escova está sobre a linha dos passos
- **THEN** a tesoura não aparece

### Requirement: Sem WebGL ou com movimento reduzido
Sem WebGL, ou com movimento reduzido, a escova SHALL aparecer parada, em imagem com fundo transparente, no fim da linha
dos passos, e a linha SHALL aparecer inteira.

#### Scenario: Movimento reduzido
- **WHEN** o visitante usa movimento reduzido
- **THEN** a escova aparece parada no fim da linha, sem animação

### Requirement: Orçamento
O modelo da escova SHALL ter no máximo 120 KB e SHALL ser carregado depois do primeiro desenho da página, na mesma cena
3D da tesoura. A escova SHALL NOT piorar o LCP da página em mais de 100 ms nem causar deslocamento de layout.

#### Scenario: Peso
- **WHEN** o modelo é gerado
- **THEN** o arquivo tem no máximo 120 KB

#### Scenario: Carregamento
- **WHEN** a página do salão é medida com e sem a escova
- **THEN** a diferença de LCP é de no máximo 100 ms e o CLS é 0

### Requirement: Telefone
No celular, a passada SHALL acontecer na linha fina sob o título, como a navalha na barbearia, sem cobrir o conteúdo.

#### Scenario: Celular
- **WHEN** a página é vista a 390 px e o visitante chega a "Como funciona"
- **THEN** a escova percorre a linha sob o título e nenhum texto fica coberto
