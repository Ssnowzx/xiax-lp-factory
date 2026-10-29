# Proposal — Xiax LP v5 · Página do salão (Porcelana)

## Why

O Xchair atende barbearia e salão de beleza, mas a única página de vendas fala só com barbearia. O dono pediu, em
28/10/2026, a página de vendas para salão de beleza, "no mesmo nível de entrega profissional, com os detalhes do app
de salão". Ele escolheu:

- o visual **Porcelana**, o mesmo tema que o app já usa para salão: marfim, terracota, títulos em serifa e fotos em arco;
- a página **completa**, com os botões levando ao WhatsApp como na barbearia. Ele mesmo publica no servidor depois;
- os **três planos**, com foco no Completo.

O ponto delicado é a honestidade. Hoje o app já entrega a um salão:

- a página de agendamento;
- a escolha da profissional;
- o preço e a duração por profissional;
- os lembretes no WhatsApp;
- a lista de espera;
- a fidelidade;
- a área da cliente.

O que faz um salão de verdade ainda não existe:

- o tempo de pausa da química;
- várias profissionais na mesma visita;
- salas e equipamentos;
- a ficha técnica com alergia e fórmula da coloração;
- os pacotes de sessões;
- a anamnese;
- a comissão e o relatório do salão-parceiro.

O roadmap do app diz que o Xchair não é divulgado como sistema completo para salão antes disso. Por isso a página
vende o que existe e mostra o resto com o selo **"Em breve"**. Cada recurso tem uma chave de estado, e o lançamento
de cada um é uma linha de código.

Também é a hora de tornar o projeto de fato uma fábrica. Hoje os textos da barbearia estão escritos dentro de 12
seções. Uma segunda página copiada dobraria cada correção.

## What Changes

**Base para várias páginas (vale para as duas)**

- Cada página tem o seu endereço: a barbearia continua em `/` e o salão vai para `/salao`. Cada uma tem o seu
  layout, que define:
  - fontes;
  - tema;
  - título e descrição;
  - imagem de compartilhamento;
  - dados estruturados (JSON-LD).
- O sitemap lista as duas.
- **O conteúdo sai dos componentes.** Textos, telas, mensagens, perguntas e planos de cada página moram num arquivo de
  conteúdo tipado. As seções recebem o conteúdo e não têm mais texto fixo. A página da barbearia continua com
  exatamente o mesmo texto visível, e uma comparação antes e depois garante isso.
- **Tema por página:**
  - as cores, os raios, as sombras e a textura vêm do tema;
  - o título em caixa-alta e o grifo dourado da barbearia viram papéis do tema;
  - no Porcelana, o título é em caixa normal e a palavra de destaque fica em itálico terracota.
- **Botão do WhatsApp por página:** o mesmo número de vendas, com a mensagem pronta falando de barbearia ou de salão.
- **A medição de cliques sabe de qual página veio o clique.**

**A página do salão**

- **Visual Porcelana:**
  - fundo marfim `#F6F1EA`, texto `#1C1714` e acento terracota `#7B4A3C`;
  - títulos em Fraunces com o itálico de destaque e texto em Manrope (a Bodoni Moda do app ficou difícil de ler);
  - fotos em arco, botões em pílula, uma textura de papel sutil e sombras quentes e leves;
  - todo par de cor passa no contraste AA, e um teste confere.
- **As mesmas seções, reescritas para salão:**
  - topo, dor, como funciona, números, lista de espera, caixa, galeria, a página do seu salão, planos, dúvidas e
    fechamento;
  - uma seção nova, **"Feito para salão"**, com cada recurso de salão e o seu estado (disponível ou "Em breve").
- **Telas reais do app em 2x:**
  - a tela de início do salão (Porcelana), tirada do quadro de design aprovado pelo dono;
  - as telas de agendamento, confirmação e agenda, com dados de exemplo de salão e marcadas como exemplo.
  - Recurso que ainda não existe não ganha tela inventada.
- **Fotos de ambiente de salão** na galeria (cabelo, unhas, coloração, escova), marcadas como ilustração.
- **3D:**
  - a tesoura continua, com luz ajustada para o fundo claro;
  - a navalha é de barbearia e sai. No lugar dela entra uma **escova redonda**, modelada no Blender, que passa
    girando pela linha dos três passos, como numa escova.
  - Valem as mesmas regras de peso e de movimento reduzido.
- **Planos:**
  - os três, com os mesmos preços da página da barbearia;
  - o Completo aparece como "O plano do salão" (equipe e recursos de salão, "Em breve");
  - o Essencial aparece como o plano de quem atende sozinha, disponível hoje.
- **Botões:** todos abrem o WhatsApp com a mensagem pronta, como na barbearia.

**Fora de escopo**

- **Domínio e publicação no servidor:** o dono faz depois.
- **Link cruzado entre as páginas:** a página da barbearia continua sem falar de salão, e a do salão sem falar de
  barbearia.
- **Os temas Rosé, Sálvia e Noite de Gala:** só são citados como "mais estilos em breve".
- **Depoimentos, logos de clientes e números sem fonte:** continuam proibidos.
- **Construir no app** qualquer recurso de salão.

## Capabilities

### New Capabilities

- `vertical-pages`: várias páginas de vendas no mesmo código. Cobre:
  - endereço próprio;
  - conteúdo tipado por página;
  - tema por página;
  - SEO por página;
  - mensagem do WhatsApp e medição por página;
  - nenhuma página falando do público da outra;
  - a página da barbearia sem mudança visível de texto.
- `salon-landing`: o conteúdo da página do salão e a régua de honestidade. Cobre:
  - as seções;
  - "Feito para salão" com o estado de cada recurso;
  - as telas reais com dados de exemplo;
  - os planos com foco no Completo;
  - as dúvidas;
  - o fechamento no WhatsApp.
- `porcelain-theme`: o visual Porcelana. Cobre:
  - tokens com contraste AA;
  - Fraunces e Manrope;
  - título em caixa normal com itálico de destaque;
  - pílulas, arcos, textura clara e sombras;
  - a tesoura iluminada para o fundo claro.
- `brush-sweep`: a escova redonda 3D que passa pela linha de "Como funciona" na página do salão. Cobre:
  - o modelo;
  - o caminho puro e testado;
  - a convivência com a tesoura;
  - a imagem parada sem WebGL ou com movimento reduzido;
  - o orçamento de peso e de LCP.

### Modified Capabilities

- Nenhuma em `openspec/specs/`: ainda não há spec arquivada. As capacidades das changes em andamento (`landing-page`,
  `depth-cards`, `page-surface`, `razor-cut`, `scroll-scissors`) continuam valendo para a barbearia. Esta change não
  muda requisito delas, só faz o conteúdo e o tema virem da página.

## Impact

- **Pré-requisito:** registrar a change `xiax-lp-v4-xchair` (Xchair, planos, WhatsApp, telas reais), que já está no
  código mas ainda não tem os artefatos. Esta change parte do estado dela.
- **Código:**
  - novos: `lib/content/` (tipos e conteúdo de cada página), `app/(barbershop)/` e `app/(salon)/salao/` (layout e
    página de cada uma);
  - alterados:
    - as 12 seções: recebem o conteúdo;
    - `styles/tokens.css`: tema `porcelain`;
    - `lib/ui/theme.ts`: papéis tipográficos do tema;
    - `lib/contact/whatsapp.ts`: mensagem por página;
    - `lib/analytics/events.ts`: página no evento;
    - `lib/seo/json-ld.ts` e `app/sitemap.ts`.
  - novos no 3D: o modelo e o caminho da escova (`assets/3d/brush/`, `lib/motion/brush-path.ts`,
    `public/models/brush.glb`);
  - ajustado no 3D: a luz da tesoura por tema.
- **Imagens:**
  - a tela de início do salão (quadro de design, com as 5 fotos dele);
  - versões de salão das telas de agendamento, confirmação e agenda, com os dados de exemplo trocados e a mesma
    interface;
  - de 4 a 6 fotos de ambiente.
  - Tudo em `next/image` com AVIF/WebP e nítido em tela 2x.
- **Fontes:** Fraunces e Manrope, por `next/font`, carregadas só na página do salão. A barbearia não paga por
  elas.
- **Desempenho:** a mesma régua da barbearia:
  - Lighthouse ≥ 90;
  - CLS 0;
  - LCP da página com o 3D no máximo 100 ms acima da página sem o 3D;
  - a escova com no máximo 120 KB.
- **Rotas públicas:** `/salao` (nova). `/` não muda para o visitante.
- **Integrações:** só o link do WhatsApp de vendas.
