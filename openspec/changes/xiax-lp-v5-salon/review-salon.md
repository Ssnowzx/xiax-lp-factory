# Página do salão — revisão do dono antes de publicar

Change `xiax-lp-v5-salon`, tarefa 10.4. Endereço: `/salao`. Primeiro os pontos que só você decide; depois, todos os
textos da página, gerados de `lib/content/salon.ts` (o que está aqui é o que aparece na tela).

## Pontos a confirmar

1. **Gênero.** O texto fala com "a cliente" e "a profissional", no feminino, como os textos de salão do app. Onde
   coube, ficou neutro ("quem marca", "quem tem salão"). Serve assim?
2. **Fotos da galeria e da imagem de compartilhamento.** As 5 fotos foram geradas por IA (Gemini), na direção de arte
   do Porcelana: luz quente, madeira clara, sem rosto, sem marca. Não mostram um salão real e nenhuma legenda diz que
   mostram. Pode usar fotos geradas, ou prefere fotos de um salão de verdade?
3. **Fotos do quadro de design.** A tela de início do salão (no celular do topo e em "A página do seu salão") usa as
   fotos do quadro aprovado, e a principal tem um rosto reconhecível. Elas parecem de banco de imagens: confirme que a
   licença permite usar na página de vendas.
4. **Telas do painel.** A agenda do dia, o quadro "Precisa de atenção hoje" e o gráfico do mês foram refeitos no
   visual claro do salão (você pediu em 28/10), com dados de salão inventados (nomes, horários, preços como escova a
   R$ 90). No app, o painel do salão é claro assim também? A agenda mostra o bloqueio de almoço, mas não o tempo de
   pausa da química, que ainda não existe.
5. **Preços.** Os mesmos da barbearia: Essencial R$ 99/mês (R$ 79/mês no anual, 1 profissional), Completo R$ 229/mês
   (até 5 profissionais; R$ 329 de 6 a 10), Signature R$ 990/mês por unidade, sob consulta. Salão paga o mesmo?
6. **"Já funciona no app".** "Escolha da profissional" e "Preço e duração por profissional" aparecem como prontos no
   app, mas são do Completo, que ainda não está à venda. A nota logo abaixo diz isso. Prefere outro selo, como "Pronto
   no Completo"?
7. **Estilo da página.** A página diz que o estilo de hoje é o Porcelana e que outros (Rosé, Sálvia, Noite de Gala)
   vêm em breve. Confirme que o Porcelana já está no ar para os salões.
8. **Vitrine.** No card do Essencial do salão tirei a "Vitrine de depoimentos e de produtos" que a barbearia lista,
   porque a página do salão não fala de depoimento. Quer a vitrine de produtos de volta?
9. **Endereço do site.** Antes do build na VPS, defina `NEXT_PUBLIC_SITE_URL` com o domínio final. Sem ele, o
   endereço canônico, a imagem de compartilhamento e o sitemap apontam para `localhost`.
10. **Fonte.** O app usa a Bodoni Moda nos títulos; na página ela ficou difícil de ler e foi trocada pela Fraunces. As
    telas do app mostradas na página ainda têm títulos na serifa do app.

## Textos da página

### Busca e compartilhamento

- **Título:** Sistema de Agendamento para Salão de Beleza | Xchair
- **Descrição:** Sistema de agendamento para salão de beleza: a cliente marca sozinha, recebe a confirmação e os lembretes no WhatsApp, e a vaga de quem desmarca vai para a lista de espera.

### Mensagens do WhatsApp

- **Saudação:** Olá! Tenho um salão de beleza e quero conhecer o Xchair.
- **Plano disponível:** Olá! Tenho um salão de beleza e quero conhecer o plano {plan} do Xchair para o meu salão.
- **Plano sob consulta:** Olá! Tenho um salão de beleza e quero saber mais sobre o plano {plan} do Xchair.
- **Plano em breve:** Olá! Tenho um salão de beleza e quero receber o aviso quando o plano {plan} do Xchair sair.

### Topo

- **Sobretítulo:** Sistema de agendamento para salão de beleza
- **Título:** Menos falta. *Agenda cheia*.
- **Frase:** A cliente marca sozinha na página do seu salão e recebe a confirmação e os lembretes no WhatsApp. Se alguém desmarca, a vaga vai para a próxima da lista de espera — sem você digitar nada.
- **Item 1:** Confirmação e lembretes no WhatsApp, sem ninguém digitar
- **Item 2:** Lista de espera que oferece a vaga de quem desmarcou
- **Item 3:** Página de agendamento com as fotos do seu salão

### Dor

- **Número:** ~R$ 2.000
- **Sobretítulo:** O que a falta custa
- **Título:** O horário que fica vazio custa caro.
- **Texto:** Um exemplo: num salão que fatura R$ 8.000, uma cliente em cada quatro que não aparece leva **~R$ 2.000 por mês**. Faça a conta com a sua agenda. Caderno e WhatsApp na mão não lembram ninguém, e a cadeira fica vazia.

### Como funciona

- **Título:** Você atende. O resto anda sozinho.
- **Passo 1:** **A cliente marca sozinha** na página do seu salão, a qualquer hora — sem te chamar no WhatsApp.
- **Passo 2:** **Cai direto na agenda do dia** — com o encaixe, a hora atual marcada e o horário livre em destaque.
- **Passo 3:** **Confirmação e lembretes saem sozinhos** no WhatsApp: na hora de marcar, na véspera e cerca de 2h antes.
- **Nota:** Cada serviço com o preço e a duração que você define: escova, corte, coloração, manicure, do jeito que você já trabalha.

### Números

- **Título:** Lembrete funciona. Mais de um, melhor ainda.
- **25%:** menos faltas em clínicas quando o paciente recebe lembrete digital
- **até 3:** mensagens no WhatsApp por horário: confirmação, véspera e cerca de 2h antes
- **~R$ 2.000:** a menos no mês se 1 cliente em cada 4 falta num salão de R$ 8.000
- **Fonte:** Fonte do 25%: Robotham et al., BMJ Open, 2016, revisão de estudos em clínicas; mais de um lembrete funcionou melhor que um só. R$ 2.000 é um exemplo: 1 cliente em cada 4 faltando num salão de R$ 8.000.

### Lista de espera

- **Título:** Desmarcou? A vaga já tem dona.
- **Texto:** Quem quer um horário que está lotado entra na lista de espera. Quando alguém desmarca, o Xchair oferece a vaga sozinho — ninguém do salão precisa mandar mensagem.
- **Passo 1:** A cliente desmarca pelo link que recebeu — sem te ligar.
- **Passo 2:** A vaga vira uma oferta no WhatsApp para a próxima da fila, com prazo para aceitar.
- **Passo 3:** Ela aceita pelo site e a vaga é dela. Passou o prazo, a oferta vai para a seguinte.
- **Mensagem de exemplo:** Olá, Renata! Abriu uma vaga na agenda: 28/10 às 16:00. Ela está guardada para você até as 14:50 — depois disso passa para o próximo da lista de espera. Para confirmar, acesse: …/agendar/oferta/…

### Feito para salão

- **Título:** Feito para a rotina do salão.
- **Texto:** Cada profissional com a sua agenda, a química com o tempo dela, cabelo e unha na mesma visita. É isso que o Xchair está ganhando para o salão.
- **Escolha da profissional [Já funciona no app]:** A cliente marca com quem ela prefere, e cada profissional tem a sua agenda.
- **Preço e duração por profissional [Já funciona no app]:** A escova de uma profissional pode durar e custar diferente da escova de outra.
- **Tempo de pausa da química [Em breve]:** Enquanto a química age, a profissional atende outra cliente, e a agenda sabe que ela está livre.
- **Várias profissionais na mesma visita [Em breve]:** Cabelo com uma, unha com outra, no mesmo horário: a cliente marca tudo de uma vez.
- **Salas e equipamentos [Em breve]:** A cabine e o lavatório entram na agenda, e ninguém marca dois atendimentos no mesmo lugar.
- **Ficha técnica com alergia e fórmula da coloração [Em breve]:** A fórmula da última coloração e as alergias da cliente ficam guardadas, à mão de quem atende.
- **Pacotes de sessões [Em breve]:** Você vende o pacote de sessões e a agenda desconta cada uma, sem caderno.
- **Anamnese [Em breve]:** A ficha de saúde antes do procedimento de estética, preenchida pela cliente e guardada.
- **Comissão e relatório do salão-parceiro [Em breve]:** A parte de cada profissional sai calculada, com o relatório da Lei do Salão-Parceiro (13.352/2016).
- **Categorias e catálogo de salão [Em breve]:** Cabelo, unhas, cílios, sobrancelha e estética já vêm prontos para você só ajustar preço e duração.
- **Nota:** Estes recursos são do plano Completo, que está em construção; os marcados com “Em breve” ainda não estão no app. Hoje, o Essencial atende 1 profissional, com agenda, WhatsApp automático, lista de espera e caixa.

### Caixa

- **Título:** Quanto entrou no mês. Sem caderno.
- **Texto:** Nada de fazer conta no fim do dia: o caixa do Xchair mostra o que entrou de verdade, já sem a taxa do cartão.
- **Item 1:** Cada atendimento entra com a taxa da maquininha já descontada
- **Item 2:** Meta do mês e o resultado andando todo dia
- **Item 3:** Extrato em CSV para o contador

### Galeria

- **Título:** Salão de verdade. Agenda à altura.
- **Texto:** Enquanto você atende, a cliente marca pelo celular e a confirmação e os lembretes saem sozinhos no WhatsApp. Ninguém larga a escova pra responder mensagem.
- **Foto salon-01:** Profissional faz uma escova modelada com escova redonda e secador no cabelo de uma cliente, de costas, no salão
- **Foto salon-02:** Mão de uma cliente marcando um horário pelo celular, apoiada na bancada de madeira clara da recepção
- **Foto salon-03:** Unhas recém-feitas em esmalte terracota, com a mão apoiada numa toalha de linho na mesa da manicure
- **Foto salon-04:** Interior do salão com espelhos em arco, cadeiras marfim e luz quente
- **Foto salon-05:** Tigela e pincel de coloração sobre a bancada de madeira clara, ao lado de toalhas dobradas

### A página do seu salão

- **Título:** É isso que a sua cliente vê.
- **Texto:** Uma página só do seu salão, com as suas fotos, os seus serviços e o próximo horário livre logo na capa. Sem salão concorrente do lado.
- **Item 1:** Fotos do seu salão, enviadas pelo painel
- **Item 2:** Serviços com preço e duração
- **Item 3:** O próximo horário livre na capa
- **Item 4:** Área da cliente com o próximo horário, o histórico e “repetir o último serviço”
- **Item 5:** Cartão fidelidade digital: a cada tantas visitas, um benefício
- **Estilo:** Estilo Porcelana — Marfim, detalhes em terracota e títulos em serifa. (Mais estilos em breve)

### Planos

- **Título:** Comece hoje. Cresça com o Completo.
- **Texto:** O Essencial já está no ar: agenda, WhatsApp automático, lista de espera e caixa, para 1 profissional. O Completo traz a equipe e a rotina do salão; ele e o Signature usam o mesmo sistema e estão em construção.
- **essencial · frase:** Para quem atende sozinha
  - WhatsApp automático: confirmação na hora, lembrete na véspera e outro 2h antes
  - Lista de espera: a vaga de quem desmarca vira oferta para a próxima da fila
  - Sua página de agendamento, com suas fotos, serviços, preços e o próximo horário livre
  - Agenda do dia com encaixe e o painel “Precisa de atenção hoje”
  - Área da cliente, ficha com histórico e cartão fidelidade
  - Caixa com a taxa da maquininha já descontada, meta e resultado do mês, extrato em CSV
  - No navegador do celular e do computador
- **completo · frase:** Para o salão com equipe, da agenda à comissão
  - Escolha da profissional e preço e duração por profissional
  - Tempo de pausa da química [Em breve]
  - Várias profissionais na mesma visita [Em breve]
  - Salas e equipamentos [Em breve]
  - Ficha técnica com alergia e fórmula da coloração [Em breve]
  - Pacotes de sessões [Em breve] e anamnese [Em breve]
  - Comissão e relatório do salão-parceiro [Em breve]
  - Categorias e catálogo de salão [Em breve]
  - Comanda com pagamento dividido, caixa do dia com fechamento conferido e contas a pagar e a receber
  - Estoque com custo, permissões por função e metas por profissional
- **signature · frase:** Para o salão que quer o sistema trabalhando pelo faturamento
  - Recepcionista de WhatsApp com IA, que confirma e remarca
  - Convite de retorno automático
  - Várias unidades com visão de rede
  - App nas lojas com a marca do salão
  - Migração feita pela equipe do Xchair e gerente de sucesso

### Dúvidas

- **Título:** Pergunta de quem tem salão, resposta direta.
- **Meu salão tem várias profissionais. Serve?:** Hoje, o Essencial atende 1 profissional: a sua agenda, o WhatsApp automático, a lista de espera e o caixa. Para a equipe, o plano é o **Completo**, que chega em breve: a cliente escolhe a profissional, com preço e duração por profissional e a comissão de cada uma calculada [Em breve]. Chame no WhatsApp e a gente avisa quando ele sair.
- **A agenda entende o tempo de pausa da química?:** Ainda não. O tempo de pausa da química [Em breve] está em construção para o Completo: enquanto a química age, a agenda deixa a profissional livre para outra cliente. Hoje, cada serviço tem a duração que você define, e a agenda reserva esse tempo inteiro.
- **Dá para cadastrar os serviços do meu salão?:** Sim. Você cadastra cada serviço com o preço e a duração que quiser: escova, corte, coloração, manicure, sobrancelha. Um catálogo de salão já pronto [Em breve] vem com o Completo: cabelo, unhas, cílios, sobrancelha e estética, para você só ajustar preço e duração.
- **Já me viro no WhatsApp:** Até a cliente esquecer. O WhatsApp na mão não lembra ninguém sozinho e não enche a vaga de quem desmarcou. No Xchair, a confirmação sai na hora do agendamento e os lembretes saem na véspera e cerca de 2h antes, sem ninguém digitar. E quando alguém desmarca, a vaga vira uma oferta no WhatsApp para a próxima da lista de espera: ela aceita pelo site e o horário não fica vazio.
- **É caro?:** Compare com o horário vazio: num salão que fatura R$ 8.000, se 1 cliente em cada 4 falta, são cerca de R$ 2.000 a menos no mês. O Essencial custa R$ 99 por mês e já traz a página de agendamento do seu salão, a confirmação e os lembretes no WhatsApp e a lista de espera.
- **É complicado configurar?:** Você assina, escolhe o endereço da sua página e ela fica pronta assim que o pagamento é confirmado. Depois cadastra os serviços com preço e duração e já começa a agendar.
- **Minha cliente vai ver salão concorrente?:** Não. O Xchair não é marketplace: sua página mostra só o seu salão, e a base de clientes é sua. Você conquista a cliente uma vez e ela volta pra você, não pra plataforma.
- **Funciona no celular?:** Sim. A página do seu salão e o seu painel abrem no navegador do celular e do computador, sem instalar nada. O app para instalar no celular vem em breve.

### Fechamento

- **Título:** Comece hoje. Feche o mês *com menos falta*.
- **Texto:** Chame no WhatsApp e veja o Xchair funcionando: a cliente marca sozinha, o WhatsApp lembra por você e a vaga de quem desmarca vai para a próxima da lista de espera.
- **Você chama no WhatsApp:** A conversa já abre com esta mensagem:
- **A gente mostra o Xchair:** A página de agendamento, os lembretes e a lista de espera, funcionando.
- **Seu salão entra no ar:** Com o seu nome, as suas fotos e os seus serviços, assim que o pagamento é confirmado.
