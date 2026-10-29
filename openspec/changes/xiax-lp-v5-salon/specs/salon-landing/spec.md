# Spec Delta

## Purpose

A página de vendas do Xchair para salão de beleza: vende o que o app já faz por um salão, mostra os recursos de salão
que ainda estão em construção com o selo "Em breve" e leva toda ação para o WhatsApp de vendas.

## ADDED Requirements

### Requirement: Seções da página do salão
A página `/salao` SHALL ter, nesta ordem:

1. topo;
2. dor;
3. como funciona;
4. números;
5. lista de espera;
6. feito para salão;
7. caixa;
8. galeria;
9. a página do seu salão;
10. planos;
11. dúvidas;
12. fechamento.

Cada seção SHALL ter um título que fala com a dona ou o dono de salão.

#### Scenario: Ordem das seções
- **WHEN** a página carrega
- **THEN** as seções aparecem na ordem acima, cada uma com o seu título

### Requirement: Só promete o que existe
Um recurso SHALL aparecer como disponível só quando o app já o entrega a um salão. Todo recurso ainda em construção
SHALL aparecer com o selo "Em breve", em qualquer seção ou pergunta onde ele for citado.

#### Scenario: Recurso em construção
- **WHEN** a página cita o tempo de pausa da química
- **THEN** o selo "Em breve" aparece junto

#### Scenario: Recursos em construção na data da change
- **WHEN** a página cita qualquer um destes: tempo de pausa da química, várias profissionais na mesma visita, salas e
  equipamentos, ficha técnica com alergia e fórmula da coloração, pacotes de sessões, anamnese, comissão e relatório
  do salão-parceiro, categorias e catálogo inicial de salão
- **THEN** o selo "Em breve" aparece junto

### Requirement: Um estado por recurso
Cada recurso SHALL ter um único estado, e a troca de "Em breve" para disponível SHALL valer para a página inteira de uma
vez.

#### Scenario: Lançamento de um recurso
- **WHEN** o estado da ficha técnica passa para disponível
- **THEN** o selo some em todas as seções onde ela aparece, e nenhum outro recurso muda de estado

#### Scenario: Recursos que já existem
- **WHEN** a página cita a página de agendamento, a escolha da profissional, os lembretes no WhatsApp, a lista de
  espera, a fidelidade, a área da cliente ou o caixa simples
- **THEN** eles aparecem como disponíveis, sem selo

### Requirement: Seção "Feito para salão"
A seção SHALL apresentar os recursos de salão, cada um com uma frase sobre a dor que resolve e o seu estado. Recurso em
construção SHALL NOT ter tela do app nem imagem que pareça tela do app.

#### Scenario: Pausa da química
- **WHEN** a seção mostra o tempo de pausa
- **THEN** explica que a profissional atende outra cliente enquanto a química age, traz o selo "Em breve" e é ilustrada
  sem tela de app

### Requirement: Telas reais com dados de exemplo
As imagens do sistema SHALL ser telas do Xchair no tema Porcelana, nítidas numa tela 2x, com texto alternativo em
português. Toda área com telas SHALL trazer a nota "Telas reais do Xchair · dados de exemplo". Os dados das telas SHALL
ser de um salão de exemplo e SHALL NOT ser apresentados como cliente real.

#### Scenario: Topo
- **WHEN** o topo carrega
- **THEN** mostra a tela de início do salão num celular e a agenda do dia num computador, com a nota de dados de
  exemplo

#### Scenario: Nitidez
- **WHEN** a página é vista numa tela 2x a 1440 px de largura
- **THEN** nenhuma tela do sistema é ampliada além do tamanho do arquivo

### Requirement: Galeria de ambiente
A galeria SHALL mostrar fotos de ambiente de salão de beleza (por exemplo cabelo, unhas, coloração e escova), com
texto alternativo, sem apresentar as fotos como trabalho de cliente do Xchair.

#### Scenario: Fotos da galeria
- **WHEN** a galeria aparece
- **THEN** nenhuma foto traz nome, logo ou legenda de salão real

### Requirement: Planos com foco no Completo
A página SHALL mostrar os planos Essencial, Completo e Signature, com os mesmos preços da página da barbearia, e SHALL:

- destacar o Completo como "O plano do salão", com o selo "Em breve";
- apresentar o Essencial como o plano de quem atende sozinha, disponível hoje;
- listar, no Completo, os recursos de salão com o mesmo estado da seção "Feito para salão".

Cada botão de plano SHALL abrir o WhatsApp de vendas com a mensagem do plano.

#### Scenario: Card do Completo
- **WHEN** os planos aparecem
- **THEN** o Completo está em destaque, com "O plano do salão" e "Em breve"

#### Scenario: Card do Essencial
- **WHEN** o visitante lê o Essencial
- **THEN** vê que ele é para 1 profissional e está disponível hoje

### Requirement: Dúvidas do salão
As dúvidas SHALL responder, no mínimo:

- se funciona para salão com várias profissionais;
- como fica a pausa da química;
- se serve para unha, cílios, sobrancelha e estética;
- "já me viro no WhatsApp";
- se é caro;
- se é complicado configurar;
- se a cliente vai ver salão concorrente;
- se funciona no celular.

Toda resposta que cita recurso em construção SHALL dizer que ele vem em breve.

#### Scenario: Várias profissionais
- **WHEN** o visitante abre "Funciona para salão com várias profissionais?"
- **THEN** a resposta diz que equipe e recursos de salão vêm no Completo, em breve, e que o Essencial atende 1
  profissional hoje

### Requirement: Nada inventado
A página SHALL NOT trazer depoimento, logo de cliente, número sem fonte, promessa absoluta ("zero falta", "nunca mais"),
teste grátis nem IA como recurso disponível. Número com fonte SHALL citar a fonte na própria página.

#### Scenario: Varredura de promessas
- **WHEN** o texto visível de `/salao` é varrido
- **THEN** não aparece "teste grátis", "14 dias", "sem cartão", "zero falta" nem "depoimento"

### Requirement: Fechamento no WhatsApp
O fechamento SHALL repetir a ação principal ("Chamar no WhatsApp"), dizer o que o toque faz, mostrar os passos depois do
toque com a mensagem pronta do salão e trazer o preço do Essencial.

#### Scenario: Fechamento
- **WHEN** o visitante chega ao fim da página
- **THEN** vê o botão do WhatsApp, a frase "Abre o WhatsApp com a mensagem pronta. É só enviar." e a mensagem
  "Olá! Tenho um salão de beleza e quero conhecer o Xchair."

### Requirement: Primeira tela no celular
No celular (390 × 844), a primeira tela SHALL mostrar o título, a frase de apoio e o botão do WhatsApp sem rolar.

#### Scenario: Celular
- **WHEN** a página abre a 390 × 844
- **THEN** o botão "Chamar no WhatsApp" está inteiro na primeira tela
