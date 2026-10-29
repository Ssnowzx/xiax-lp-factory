# Design

## Context

Ver `proposal.md` (Why). Estado atual que molda o desenho:

- **Uma página só.**
  - `app/layout.tsx` é a raiz: fontes Anton, Archivo e Space Mono, `data-theme="dark"`, metadados e JSON-LD do
    software.
  - `app/page.tsx` compõe 11 seções.
  - `app/sitemap.ts` lista um endereço.
- **Texto fixo nas seções.**
  - As 12 seções em `components/sections/` têm o texto escrito no JSX. Só `lib/data/` (planos, telas, galeria,
    modelos, mensagens) está separado.
  - 15 títulos usam `uppercase tracking-display-upper` direto na classe.
  - O destaque usa `.mark-brass`, um grifo dourado desenhado em `app/globals.css`.
- **Tema por variáveis.**
  - `styles/tokens.css` define as cores em canais RGB por `[data-theme]` (já há `dark` e `light`), e também os raios
    (`--radius-*`) e as sombras (`--shadow-*`).
  - `lib/ui/theme.ts` só aponta o Tailwind para essas variáveis.
  - O couro é um `background-image` no `body` (`app/globals.css`, D8 da v3).
- **3D.**
  - Uma cena three.js (`lib/three/scissors-scene.ts`) carrega a tesoura e a navalha, por import dinâmico.
  - `components/motion/razor-cut.ts` faz o corte na linha dos passos (`[data-step-thread]` no computador e
    `[data-cut-line]` no celular), guiado por `lib/motion/razor-path.ts`, que é puro e tem 100% de cobertura.
  - As imagens paradas (`public/models/*-still.webp`) têm alfa.
- **Coreografia.** `components/motion/motion-choreography.tsx` acha as seções pelo `id` (`#hero`, `#como-funciona`…),
  então funciona em qualquer página com os mesmos `id`s.
- **Telas.**
  - `scripts/capture-screens.mjs` fotografa os artboards do quadro de design em 2x.
  - `scripts/optimize-screens.mjs` recorta para `public/screens/`.
  - O quadro tem `SalonHome` (Porcelana, com 5 fotos no armazenamento do artefato). As outras telas são da barbearia
    (Navalha, "Barbearia Central").
- **O que o app entrega a um salão:** ver o mapa da proposta. A fonte é `docs/ROADMAP.md` e as changes
  `beauty-salon-support` (0/23) e `team-and-commissions` (23/33) do repositório do app. A `salon-scheduling` ainda não
  existe.
- **Regras da casa:**
  - nunca parar o servidor de desenvolvimento do dono em `:3000`;
  - o build de produção roda numa cópia;
  - os testes seguem o padrão AAA com nomes "should …";
  - nada de `console.*`;
  - funções com no máximo 50 linhas;
  - cobertura de no mínimo 80%;
  - código e comentários em inglês, texto da tela em português.

## Goals / Non-Goals

**Goals:**

- Uma segunda página com o mesmo acabamento da primeira, sem duplicar componentes.
- A página da barbearia continua idêntica para o visitante, provado por comparação de texto e de imagem.
- Lançar um recurso de salão é trocar um estado num só lugar.
- Cada página paga só pelo que usa (fontes, 3D, imagens).

**Non-Goals:**

- Um CMS ou conteúdo editável sem código. O conteúdo é TypeScript, revisado como código.
- Tema escolhido pelo visitante. O tema é da página, não do visitante.
- Internacionalização.
- Mudar o desenho das seções da barbearia além do necessário para receber conteúdo.

## Decisions

### D1. Duas raízes por grupos de rota

`app/(barbershop)/layout.tsx` com `page.tsx` em `/`, e `app/(salon)/layout.tsx` com `salao/page.tsx` em `/salao`.
Cada layout é uma raiz: `<html>` próprio, com `data-theme`, fontes, metadados e JSON-LD da página.

- O pedaço `salao` do endereço fica em português porque é endereço visível (como as rotas públicas do app).
- `app/sitemap.ts`, `app/robots.ts` e `app/favicon.ico` ficam na raiz de `app/`, compartilhados.
- O `not-found.tsx` fica no grupo da barbearia. Uma rota `[...missing]` no mesmo grupo leva todo endereço
  desconhecido para ele, porque sem layout na raiz de `app/` o Next mostraria a 404 dele, em inglês.

**Alternativas:**

- *Um layout só, com um `<div data-theme>` envolvendo a página do salão.* Descartada:
  - o `<body>` e o `<html>` ficariam com o fundo e o `color-scheme` escuros (rolagem elástica e barra do navegador
    pretas sobre a página marfim);
  - as fontes das duas páginas carregariam juntas.
- *Projeto separado.* Descartado em conversa com o dono: dobraria cada correção.
- *Subdomínio por `middleware`.* Fica para quando houver domínio. As duas raízes já permitem isso sem mudar
  componente.

### D2. Conteúdo tipado por página

`lib/content/types.ts` define `PageContent`, com um bloco por seção:

- `hero`, `pain`, `steps`, `numbers`, `waitlist`, `salonFeatures?`, `cash`, `gallery`, `showcase`, `plans`, `faq`,
  `final`;
- `seo` (título, descrição, palavra-chave, OG);
- `whatsapp` (saudação e mensagens de plano);
- as telas e as mensagens de WhatsApp de exemplo ficam dentro do bloco da seção que as usa, para cada bloco trazer
  tudo o que a seção desenha.

`lib/content/barbershop.ts` e `lib/content/salon.ts` exportam um `PageContent` cada. Cada seção recebe o seu bloco por
prop e continua RSC. As ilhas cliente (WhatsApp, planos, FAQ) recebem só dados serializáveis.

- `components/landing/landing-page.tsx` monta as seções na ordem dada pelo conteúdo. É a mesma ordem do funil, e a do
  salão inclui `salonFeatures`.
- O texto de interface fixo e comum (por exemplo "Telas reais do Xchair · dados de exemplo") fica num
  `lib/content/shared.ts`.
- **Prova de que nada mudou:** antes de tocar em qualquer seção, `qa/v5-text-baseline.mjs` grava o texto visível,
  os `alt`s e os `href`s de `/` a 390 e a 1440 px. Depois da extração, o mesmo script compara e falha na primeira
  diferença. As fotos de `/` em 390 e 1440 px também são comparadas pixel a pixel, com tolerância só para a animação.

**Alternativas:**

- *Copiar as seções para `components/salon/`.* Descartada: é o problema que a fábrica resolve.
- *JSON em vez de TS.* Descartado: perde os tipos, e partes do conteúdo referenciam dados (planos, recursos, telas).

### D3. Papéis do tema em vez de classes fixas

O tema `porcelain` entra em `styles/tokens.css` como `[data-theme="porcelain"]`.

- **Cores** (as da receita Porcelana do app, `docs/DESIGN-SYSTEM.md` §3):
  - base `#F6F1EA`, surface `#FDFAF5`, surface-raised `#EFE8DE`;
  - ink `#1C1714`, ink-muted `#6E625A`, ink-subtle `#6E625A`;
  - line `#E3D9CC`, line-strong `#8F8377` (a borda de campo do app, 3,0 a 3,6:1; o `#C9BBA9` do rascunho ficava
    em 1,6:1 e não passava nos 3:1 da spec);
  - accent `#7B4A3C`, accent-ink `#FBF7F1`, accent-quiet (o acento, usado com alfa).
- **Raios:** `--radius-control: 9999px` (pílula); campo 16 px, card 20 px e painel 28 px, como no app.
- **Sombras:** tingidas pela cor do texto (`rgb(28 23 20 / α)`), com α de 0,04 a 0,12, como no app.
- **Couro:** sai, porque o couro é regra do `body` só no tema escuro.

Os papéis tipográficos viram variáveis do tema:

- `--display-transform` (`uppercase` no escuro, `none` no Porcelana);
- `--display-tracking` (o espaçamento do Anton no escuro, `-0.01em` no Porcelana);
- `--display-weight`.

Uma classe `.type-display` aplica os três e substitui `uppercase tracking-display-upper` nos 15 títulos. O destaque
`.mark-brass` passa a se chamar `.mark-accent`:

- no escuro, continua o grifo dourado animado;
- no Porcelana, é `font-style: italic` na cor do acento, sem grifo, porque o itálico da serifa é o destaque do tema no
  app.

As fontes ficam em cada layout:

- **barbearia:** Anton, Archivo e Space Mono, como hoje;
- **salão:** Fraunces 500 (com `opsz` e itálico) em `--font-display`, e Manrope 500 em `--font-sans` e em `--font-mono`.
  O app usa Bodoni Moda; na página ela ficou fina demais e o dono pediu outra fonte (2026-10-28). As perguntas do FAQ
  saem na serifa, em caixa normal, e o texto secundário do salão é `#544A43`, um tom mais escuro que o do app.

No salão, os rótulos "mono" saem em Manrope caixa-alta espaçada, sem mono, como no app.

**Contraste provado em teste.** `lib/ui/contrast.ts` (puro) calcula a razão WCAG. `lib/ui/contrast.test.ts` lê os
tokens `porcelain` de `styles/tokens.css` e confere cada par usado: ink, ink-muted e ink-subtle sobre base, surface e
surface-raised, e accent-ink sobre accent.

**Alternativa:** variantes por página nas seções (`isSalon ? … : …`). Descartada porque espalha a decisão de tema por
12 arquivos.

### D4. Um registro de recursos de salão com estado

`lib/content/salon-features.ts` exporta `SALON_FEATURES`, indexado por id: `pauseTime`, `multiProfessionalVisit`,
`roomsAndEquipment`, `technicalRecord`, `sessionPackages`, `anamnesis`, `commissionAndPartner`, `salonCatalog`,
`professionalChoice`, `pricePerProfessional`. Cada recurso tem:

- `title`;
- `pain` (a frase da dor);
- `status`: `available` ou `coming`;
- `plan`: `essencial` ou `completo`.

Qualquer texto que cita um recurso o referencia pelo id (`{ feature: "pauseTime" }`) dentro das partes do texto. O
componente `FeatureMention` desenha o nome e, se `status === "coming"`, o selo `ComingSoon` ("Em breve"), com
`data-feature-status` para a QA. Isso vale para a seção "Feito para salão", para o card do Completo e para as respostas
do FAQ. Lançar um recurso é trocar o `status`. O teste garante:

- todo `coming` sai com o selo em todo lugar;
- os ids citados no conteúdo existem;
- nenhum `available` está na lista de recursos que o app ainda não tem. Essa lista é copiada do mapa e datada.

**Alternativa:** marcar "Em breve" à mão em cada texto. Descartada porque a troca no lançamento esqueceria algum
lugar.

### D5. Telas do salão: o quadro de design e cópias de salão das outras telas

- **`SalonHome`:** entra como artboard em `capture-screens.mjs`. Antes, as 5 fotos dela são baixadas do armazenamento
  do artefato para `assets/screens-src/blobs/`.
- **Agendamento, confirmação e agenda do dia:** são telas da barbearia. Ganham cópias de salão em
  `assets/screens-src/canvas-salon/`, com a mesma interface e só os dados de exemplo trocados:
  - salão "Salão Aurora";
  - serviços "Escova modelada · 50 min", "Corte feminino · 60 min", "Manicure · 45 min" e "Coloração raiz ·
    90 min";
  - profissionais Camila, Bianca e Lívia;
  - nas telas da cliente, os tokens do Porcelana, porque o app aplica o tema da casa no site público.
- **Honestidade:** a agenda de exemplo não mostra bloco de pausa, porque ainda não existe.
- **Caixa:** usa o recorte do gráfico do mês sem o quadro "Com o que já está agendado, o mês fecha em". A previsão
  ainda não existe no app (ver `owner-insights`).
- A nota "Telas reais do Xchair · dados de exemplo" acompanha cada área com telas.

**Alternativa:** fotografar o app rodando com um salão de exemplo. Descartada por agora: o banco visual do app é de
barbearia, as categorias de salão não existem e outra sessão está trabalhando no app. Volta a ser a melhor opção quando
a `beauty-salon-support` sair.

### D6. Fotos de ambiente

A galeria usa:

- as fotos de categoria do `SalonHome` (cabelo, unhas, escova, coloração), que são do quadro aprovado pelo dono;
- até 2 fotos geradas com a mesma direção de arte: luz quente, marfim e madeira clara, sem rosto reconhecível, sem
  marca e sem logo.

Tudo passa por `scripts/optimize-gallery.mjs` (16:9, AVIF/WebP), com `alt` em português, e nenhuma legenda sugere
cliente real.

### D7. 3D: tesoura no claro e escova redonda

- **Tesoura.** A cena recebe um `lightingPreset` por tema (`dark`, `porcelain`), com exposição, intensidade do
  ambiente e cor da luz principal. O preset `porcelain` baixa a exposição e esquenta a luz para o metal não estourar
  no marfim. As imagens paradas atuais têm alfa e servem nos dois temas. Se a revisão mostrar halo escuro na borda, a
  imagem é gerada de novo sobre fundo neutro.
- **Escova.**
  - **Modelo:** `assets/3d/brush/build-brush.py` (Blender por script, determinístico, como a navalha), com os nós
    `Handle`, `Barrel` e `Bristles`. O eixo de giro é o eixo do cilindro, e a origem fica no centro do cilindro.
  - **Cerdas:** fileiras de cones baixos, instanciadas e unidas, com orçamento de 12 mil triângulos.
  - **Arquivo:** exportado com meshopt para `public/models/brush.glb`, com no máximo 120 KB.
  - **Caminho:** `lib/motion/brush-path.ts` é puro e segue a mesma forma de `razor-path.ts`:
    - entrada pela borda, pouso no início da linha, passada e saída;
    - o giro é igual à distância percorrida dividida pelo raio, então a escova "rola" sem escorregar;
    - `presence` diz à tesoura quando sair.
  - **Tokens:** `BRUSH` em `lib/motion/motion-tokens.ts`.
- **Palco.** `razor-cut.ts` vira `line-sweep.ts`, um palco que percorre a linha dos passos com uma ferramenta: `razor`
  na barbearia, `brush` no salão. As linhas-alvo continuam as mesmas. O conteúdo da página diz qual ferramenta usar.
- **Imagem parada:** `public/models/brush-still.webp`, com alfa, gerada pelo `npm run assets:v3`.

**Alternativas:**

- *Só a tesoura no salão.* Mais barato, mas tira da página do salão o momento de destaque que a barbearia tem.
- *Secador.* Grande demais para a linha e lido como eletrodoméstico.
- *Esmalte.* Fala só com unha.

A escova redonda é o objeto mais reconhecível de salão e combina com o movimento de rolar.

### D8. SEO por página

- Cada layout exporta `metadata` a partir de `content.seo`.
- `lib/seo/json-ld.ts` recebe o conteúdo: `SoftwareApplication` com nome, descrição, público ("Salões de beleza") e
  as ofertas disponíveis (só o Essencial).
- A imagem de compartilhamento do salão é `app/(salon)/salao/opengraph-image.tsx`, com fundo marfim, título em Fraunces
  e a fonte embutida no repositório (`assets/fonts/`) para o `next/og` não depender da rede no build.

### D9. WhatsApp e medição por página

- `lib/contact/whatsapp.ts` continua com o número e `salesLink(text)`.
- A saudação e as mensagens de plano vêm de `content.whatsapp`. Exemplo do salão: "Olá! Tenho um salão de beleza e
  quero conhecer o Xchair.", e "…quero conhecer o plano Essencial do Xchair para o meu salão."
- `planCta(plan, checkoutUrl, messages)` recebe as mensagens.
- O evento `cta_click` ganha `page: "barbershop" | "salon"`, passado pelo conteúdo ao `WhatsAppCta` e ao card de plano.

### D10. Planos por página

- Preços e estados ficam em `lib/data/plans.ts`, a fonte única.
- O conteúdo de cada página escolhe:
  - a frase de cada plano;
  - a lista de recursos de cada plano (no salão, o Completo lista recursos de `SALON_FEATURES`);
  - o plano em destaque.
- **No salão:** o Completo fica com o anel de destaque e o selo "O plano do salão · Em breve". O Essencial mantém
  "Disponível agora" e a frase "Para quem atende sozinha".
- O selo de compra ("Sua página fica pronta…") continua só no plano que dá para assinar.

### D11. Linha de texto do salão

- **Tom:** segunda pessoa, como na barbearia; frases curtas.
- **Gênero:** "a profissional" e "a cliente", no feminino genérico, como os textos de salão do app. Neutro quando
  couber: "quem marca" e "a sua clientela".
- **Nada de jargão técnico.**
- **Rascunho dos títulos**, para revisão antes da implementação:
  - **topo:** "Menos falta. *Agenda cheia.*", e a frase de apoio "A cliente marca sozinha na página do seu salão e
    recebe a confirmação e os lembretes no WhatsApp. Se alguém desmarca, a vaga vai para a próxima da lista de
    espera.";
  - **dor:** "O horário que fica vazio custa caro.";
  - **como funciona:** "Você atende. O resto anda sozinho.";
  - **feito para salão:** "Feito para a rotina do salão.";
  - **a página do seu salão:** "É isso que a sua cliente vê.";
  - **planos:** "Comece hoje. Cresça com o Completo.";
  - **fechamento:** "Comece hoje. Feche o mês *com menos falta*."
- A régua de honestidade da v4 vale igual: nada de "zero falta", "nunca mais", teste grátis ou IA como pronta.

### D12. QA

Scripts novos em `qa/`, todos rodando contra a cópia de produção na porta 8811:

- **`v5-text-baseline.mjs`:** D2.
- **`v5-terms.mjs`:** a varredura de termos de cada página (spec `vertical-pages`) e a de promessas (spec
  `salon-landing`).
- **`v5-coming-soon.mjs`:** todo `[data-feature-status="coming"]` tem o selo visível, e nenhum recurso da lista "ainda
  não existe" aparece sem selo.
- **`v5-shots.mjs`:** fotos de `/` e `/salao` a 390, 820 e 1440 px.
- **`v5-sharpness.mjs`:** em cada `img` de tela, o tamanho mostrado × DPR é no máximo o tamanho natural.
- **axe, depois da animação assentar, nas duas páginas:** 0 problema sério ou crítico.
- **LCP e CLS por página:** o 3D custa no máximo 100 ms de LCP, e o CLS fica em 0.
- **A navalha (`v3-razor`)** e a escova (`v5-brush`, no padrão de `v3-razor`) são testadas cada uma na sua página.

## Risks / Trade-offs

- **[Extrair o conteúdo quebra a barbearia sem ninguém ver]** → A linha de base de texto e de imagem é gravada antes
  da primeira mudança, e a comparação é o gate de cada passo da extração.
- **[Duas raízes causam recarga completa entre `/` e `/salao`]** → Não há link entre as páginas (fora de escopo), e
  cada página é uma entrada independente de anúncio. Aceito.
- **[A Fraunces tem óptica variável e pode pesar]** → `next/font` com `subsets: ["latin"]`, eixos só `opsz` e o
  itálico, e `display: "swap"`. O peso das fontes entra na medição de LCP.
- **[As cerdas estouram os 120 KB]** → O orçamento é de 12 mil triângulos. Se passar: menos fileiras ou cerdas como
  faixas com textura de normal. A medição está na tarefa do modelo.
- **[O texto da página fica desatualizado quando o app lança um recurso]** → Um registro único com data e um item no
  README ("ao lançar um recurso de salão no app, trocar o estado em `salon-features.ts`").
- **[As telas de salão copiadas divergem do app real]** → Elas saem do mesmo quadro aprovado, mudando só os dados. O
  dono confere na revisão. Quando a `beauty-salon-support` sair, voltam a ser fotografadas do app.
- **[As fotos geradas parecem genéricas]** → Direção de arte escrita (D6), no máximo 2 geradas, e as do quadro do
  dono têm prioridade.
- **[A previsão do mês segue na tela de caixa da barbearia]** → Fica registrado como divergência da v4 a resolver na
  revisão dela. O salão já nasce sem.

## Migration Plan

1. **Pré-requisito:** os artefatos da `xiax-lp-v4-xchair` escritos e validados.
2. A linha de base de `/` gravada (texto e imagem).
3. **Extração do conteúdo da barbearia, seção por seção.** A cada seção: comparação verde, `tsc`, testes.
4. Grupos de rota, papéis do tema (`.type-display`, `.mark-accent`) e fontes por layout. Comparação verde de novo.
5. Tema `porcelain`, contraste testado.
6. Conteúdo do salão, registro de recursos e seção "Feito para salão".
7. Telas e fotos.
8. 3D: luz por tema, escova e palco `line-sweep`.
9. SEO e imagem de compartilhamento.
10. QA completa nas duas páginas, README e revisão de textos com o dono.

**Reversão:** remover `app/(salon)/` e `lib/content/salon.ts` tira a página do salão sem tocar em `/`. A extração do
conteúdo é neutra para o visitante, então não precisa ser revertida.

## Open Questions

- **Gênero:** o feminino genérico ("a cliente", "a profissional") é o tom que o dono quer, ou prefere neutro sempre? Só
  muda texto em `lib/content/salon.ts`.
- **Telas do painel:** respondida pelo dono (2026-10-28): no salão, as telas do painel são claras, no Porcelana; as
  escuras pareciam da barbearia. A agenda, o quadro de atenção e o gráfico do mês foram refeitos claros (D5).
- **Fotos do quadro:** as fotos do quadro de design podem ir para a página pública, ou são só de referência? Só muda a
  origem das fotos (D6).
