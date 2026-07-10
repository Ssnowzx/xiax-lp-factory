# Art Direction Spec — Camada de personalidade barber (SVG premium · LP v2)

> **Escopo:** camada **decorativa/atmosférica ADITIVA** sobre a LP v2 LIVE (`7845503`). **Paleta e estrutura/proporções CONGELADAS** — nada de cor nova, nada de layout novo. Esta Spec dirige um **sistema de motivos do universo barber** que veste a página por cima, consumindo **só tokens do DS vigente**. Fonte de verdade = doc `brief` da [XIA-134](/XIA/issues/XIA-134). Consumidores: `ui-engineer` (inline + posicionamento), `motion-engineer` (subconjunto animado), Review Board (Fase D).
>
> **Regra-mãe:** a decoração **valoriza a ONE primary action (agendar + WhatsApp)**; nunca compete. Se um motivo brigar com H1, preço, foto de prova ou CTA — ele sai, não o conteúdo.

---

## 0. Fundação visual (global — herdada, NÃO re-decidida)

Grid, escala tipográfica, ritmo de espaçamento e aplicação de cor **já estão congelados** no DS (`styles/tokens.css`) e na LP v2. Esta Spec **não os toca**; apenas ancora a camada de motivos neles:

- **Cor da camada:** `currentColor` herdando **`--accent` (latão #D6A24E)** para motivos-assinatura/divisores, e **`--line` / `--ink-subtle`** (neutros quentes) para detalhes de canto discretos. **Zero hex fora do DS.** Um accent por dobra — o motivo latão é o único accent decorativo; onde a seção já tem um accent de conteúdo (ex.: o `70%` em #numeros, o anel "mais popular" em #planos), o motivo cai para neutro `--line`.
- **Raio/sombra/tipografia:** intocados. Os SVG não têm caixa própria com raio — vivem `position:absolute` dentro de caixas **já reservadas** → **CLS 0** (não somam altura, não empurram nada).
- **Vocabulário existente reaproveitado (não duplicar):** a listra do poste já existe como textura de divisor (`.poste-hair` / `.poste-hair--brass`, globals.css §2.5) e como trilho conector em #como-funciona. Os motivos **complementam** essa gramática; o barber-pole SVG é o emblema, a `.poste-hair` é a régua.

---

## 1. Inventário FINAL de motivos (8) — curadoria

Fechei **8** dos 13 candidatos. Critério: **canônico do universo barber**, **traço único coerente** (stroke 2 em viewBox 48, cantos/junções redondos), **legível de 22px a 360px**, e **papel distinto** (nenhum redundante). Descartados por baixa leitura em tamanho pequeno ou redundância: **toalha** (lê como retângulo genérico), **borrifador** (colide com clippers/bottle), **barbeador elétrico** (redundante com clippers), **espuma** (informe sem contexto), **barba** (redundante com bigode; bigode lê melhor tiny), **pente-de-cauda vs pente** (mantido 1 pente de dois passos de dente).

| # | Arquivo | Motivo | Papel visual | Tinta padrão |
|---|---|---|---|---|
| 1 | `barber-pole.svg` | Poste de barbeiro | **Assinatura** (hero · final · emblema de divisor) | `--accent` |
| 2 | `razor.svg` | Navalha aberta | Divisor · perto-de-CTA · atrás-de-título | `--accent` |
| 3 | `scissors.svg` | Tesoura | Atrás-de-título · canto #galeria · final | `--accent` |
| 4 | `comb.svg` | Pente (2 densidades de dente) | Canto (#como-funciona · #planos) | `--line` |
| 5 | `clippers.svg` | Máquina/clipper | Canto/spot utilitário | `--line` |
| 6 | `brush.svg` | Pincel de barbear | Canto (#modelos) | `--line` |
| 7 | `mustache.svg` | Bigode handlebar (silhueta cheia) | Canto (#depoimentos · footer) — lê tiny | `--line` |
| 8 | `blade.svg` | Lâmina dupla (DE) | Ponto de divisor · canto · atrás-de-título (#preco-fixo) | `--accent`/`--line` |

**Coerência de traço** (verificada em contact sheet renderizado, `qa/motifs-contact-sheet.png`, latão sobre espresso, tamanhos 120/40/22px): stroke 2 uniforme, caps/joins redondos, sem fill exceto silhueta do bigode e miolos de rebite/furo. **Todos legíveis a 22px.** A **navalha** foi redesenhada (v2) para ter **massa de lâmina tapered + rebite + cabo deslocado** — a v1 lia como chevron e foi **rejeitada por mim** antes da entrega.

---

## 2. Mapa de aplicação por seção (densidade · opacidade · posição · tamanho)

Ordem do funil (congelada): hero → dor → como-funciona → numeros → galeria → modelos → depoimentos → preco-fixo → planos → faq → final.

> **Notação:** `op` = opacidade; tamanhos em px de renderização (o SVG escala por CSS width/height, viewBox fixo). Toda peça é `aria-hidden`, `position:absolute`, dentro de caixa já reservada (CLS 0).

| Seção (âncora) | Motivo | Papel | Posição | Tamanho | Opacidade | Tinta |
|---|---|---|---|---|---|---|
| **#hero** | `barber-pole` | **Assinatura** | Integrado ao fundo, no **sangramento direito** atrás/abaixo do `AgendaMock` (col 6–12), fora da coluna de texto (col 1–5) | clamp 180–320px | **0.05** | `--accent` |
| divisor hero↔dor | `.poste-hair` + `razor` | Transição | Régua full-width + emblema centralizado | 24px | régua 0.9 (token) · emblema 0.14 | `--accent` |
| **#dor** | `blade` | Detalhe de canto | Topo-direito da seção, fora do texto da dor | 40px | 0.08 | `--line` |
| **#como-funciona** | `comb` | Canto | Inferior-direito da seção (o trilho-poste já é a decisão forte) | 40px | 0.08 | `--line` |
| divisor c-f↔numeros | `.poste-hair` + `scissors` | Transição | Régua + emblema central | 24px | 0.14 | `--accent` |
| **#numeros** | `scissors` | **Atrás do título** | Sangrando na **borda direita** atrás do H2, longe do `70%` | clamp 200–360px | **0.05** | `--accent` |
| **#galeria** | `razor` | Emblema de seção | Topo-direito do **bloco do H2** (NÃO nas tiles de foto) | 48px | 0.10 | `--accent` |
| divisor galeria↔modelos | `.poste-hair` + `blade` | Transição | Régua + 3 lâminas-ponto | 20px | 0.14 | `--accent` |
| **#modelos** | `brush` | Canto | Topo-esquerdo do **frame externo** da seção (NUNCA dentro de `[data-modelo-preview]`) | 36px | 0.08 | `--line` |
| **#depoimentos** | `mustache` | Canto de card | Topo-direito de cada card de depoimento, dentro do clip do card | 28px | 0.08 | `--line` |
| **#preco-fixo** | `blade` | **Atrás do título** | Borda direita atrás do H2, longe das cifras de preço | clamp 200–340px | **0.05** | `--accent` |
| divisor preco↔faq | `.poste-hair` + `razor` | Transição | Régua + emblema central | 24px | 0.14 | `--accent` |
| **#planos** | `comb` (card popular) + `razor` (perto do form) | Canto + perto-de-CTA | Comb no topo-direito do card "mais popular"; razor **ao lado** (não sobre) do botão do #planos-form | 32px / 32px | 0.10 / 0.10 | `--accent` |
| **#faq** | `barber-pole` | **Atrás do título** | Borda (esq ou dir) atrás do H2 | clamp 200–340px | **0.05** | `--line` |
| **#final** | `scissors` (ou `barber-pole`) | **Assinatura reprise** (bookend do hero) | Flutua **ao lado** do CTA final, nunca sobre | clamp 120–200px | 0.08 | `--accent` |
| **#footer** | `mustache` | Sign-off discreto | Junto ao wordmark/rodapé | 24px | 0.06 | `--ink-subtle` |
| #header · sticky WhatsApp CTA | — | **SEM motivo** | Chrome e ação primária ficam limpos | — | — | — |

---

## 3. Regra de não-poluição (gate de densidade e contraste)

1. **Máx. 1 motivo "assinatura/atrás-de-título" por dobra.** Nunca dois motivos grandes competindo no mesmo viewport. Cantos pequenos (≤40px, op ≤0.10) não contam como "competição", mas **no máx. 1 emblema de seção + 1 canto** por seção. **Uma decisão decorativa nomeável por seção.**
2. **Tetos de opacidade** (piso de disciplina):
   - Atrás de texto / integrado ao fundo: **≤ 0.06** (accent) — e a peça é **deslocada/sangrada para a borda**, de modo que o título cruze no máximo *hairlines*, nunca a massa densa do motivo.
   - Divisor (emblema na régua): 0.12–0.16.
   - Canto de card / detalhe: 0.08–0.12, tinta `--line` preferida (accent só onde a seção não tem accent de conteúdo).
   - Perto de CTA: 0.10–0.14, com **folga mínima ~16px** do botão.
3. **Onde NÃO colocar:** nunca **sobre/sob o botão de CTA** nem na **barra fixa de WhatsApp**; nunca **sobre as fotos** da #galeria (a foto é a prova); nunca **dentro de `[data-modelo-preview]`** (protege o **CLS 0** e o radiogroup de cor P5); nunca sobre **campos de formulário**; nunca entre o olho e o rótulo de um CTA.
4. **Garantia de contraste (AA):** todo texto que cruze um motivo mantém **≥ 4,5:1**. Motivo ≤0.06 de alpha sobre o base espresso (#14110E) eleva a luminância de forma desprezível; com `--ink` a 16,2:1, o pior caso permanece ≳15:1. **Design QA verifica o pior pixel** (texto sobre a parte mais densa do motivo) nos 2 temas.
5. **CLS 0 obrigatório:** toda peça é `position:absolute` dentro de caixa já reservada (a própria `<section>` com `overflow-clip`, ou o card). **Nenhum motivo adiciona altura.** Nada de `layout shift`.
6. **LCP intocado:** o hero é **texto** (0 imagem prioritária) — mantido. O barber-pole do hero é **SVG inline decorativo**, não recebe `priority`, não é o elemento LCP; entra depois da pintura do texto (fade), sem regredir o LCP vs `7845503`.

---

## 4. Subconjunto com motion (intenção — parâmetros são do motion-engineer)

Só `transform` + `opacity`; reveal via `clip-path`/`mask`; `prefers-reduced-motion` → estado estático final limpo; 60fps p95 ≥ 55; **nunca distrair da conversão**. Tokens de motion = seat do Producer (`lib/motion/motion-tokens.ts`).

**ANIMA (subconjunto):**
- **#hero `barber-pole`** — *brilho suave* (pulso de opacidade 0.04↔0.07 em `--dur-loop`) + **parallax leve** no scroll (translateY ≤ 12px). Gesto: "vivo, mas ao fundo".
- **Atrás-de-título** (#numeros `scissors`, #preco-fixo `blade`, #faq `barber-pole`) — **parallax leve** no scroll (translateY ≤ 12px, sem rotação). Sensação de profundidade, não de movimento chamativo.
- **#final `scissors`/`barber-pole`** — **floating** sutil (translateY ≤ 6px, loop lento). Bookend do hero.
- **Emblemas de divisor** — **fade + scale-in** discreto (0.96→1) no reveal da régua; sem loop.

**NÃO ANIMA (estático, só entra com o reveal do próprio bloco):** todos os **cantos de card** (`comb`, `mustache`, `brush`, `clippers`, `blade` de canto). Detalhe perto de conteúdo = zero loop perpétuo (evita distração). No máximo herdam o fade do card.

---

## 5. Contrato de a11y do asset (nasce decorativo — lição BLOCK-01/[XIA-103](/XIA/issues/XIA-103))

Já embutido em **cada arquivo SVG** entregue:
- `aria-hidden="true"` + `focusable="false"` + `role="presentation"` no `<svg>` raiz;
- **sem `<title>` e sem `<desc>`** (sem nome acessível); sem `id` que gere nome; **não focável** (sem `tabindex`);
- `pointer-events: none` na aplicação (o texto/CTA por baixo segue clicável — mesma lição do `.rough-annotation`);
- `currentColor` para a tinta (herda `--accent`/neutro via `text-*`).

**Instrução ao `ui-engineer` (Fase C):** **INLINE** os SVG (import SVGR / `?raw`), **não** `<img src>` — só inline permite `currentColor`, o `aria-hidden` interno e o motion por `transform` nas partes. Recomendo um wrapper fino `components/decor/motif.tsx` (`<Motif name pos op tint>`), que aplica `aria-hidden` no wrapper (cinto-e-suspensório), a classe de tinta (`text-accent`/`text-line`) e o posicionamento absoluto. **O código do wrapper é do `ui-engineer`; a arte e as regras são minhas.**

---

## 6. Asset Package (entregue)

- **Local acordado:** `public/motifs/` (loja de assets bruta, otimizada). 8 arquivos, **3,6 KB brutos** somados — inline + gzip = desprezível vs baseline ~219 KB gz (não estoura o budget).
- Arquivos: `barber-pole.svg` · `razor.svg` · `scissors.svg` · `comb.svg` · `clippers.svg` · `brush.svg` · `mustache.svg` · `blade.svg`.
- Cada um: viewBox `0 0 48 48`, `stroke="currentColor"` (fill em bigode/miolos), stroke 2, caps/joins redondos, **sem cor hardcoded**, **sem `<title>/<desc>`**, `aria-hidden`. Otimizados (sem metadados de editor).
- **Evidência visual:** `qa/motifs-contact-sheet.png` (contact sheet renderizado, 120/40/22px + prova atrás-de-título low-op mostrando texto legível por cima).

---

## 7. SOTD bar (autoavaliação escrita)

1. **Toda seção tem uma decisão visual nomeável?** ✅ Cada seção do funil tem 1 decisão de motivo (ou "sem motivo" justificado no header/CTA). *(eliminatória 1)*
2. Escala/gesto ousado, não tímido? ✅ Assinatura barber-pole no hero + reprise no final (bookend), atrás-de-título em 3 seções — não é polvilhar ícone genérico.
3. **Tudo em token do DS, zero cor solta?** ✅ `currentColor` → `--accent`/`--line`/`--ink-subtle`. Nenhum hex novo. *(eliminatória 3)*
4. Premium, não "gerado automaticamente"? ✅ Line-art coerente desenhada à mão, navalha redesenhada por leitura; sem clipart/emoji/ícone de biblioteca.
5. Contraste/a11y embutidos? ✅ ≤0.06 atrás de texto (AA preservado ≳15:1), `aria-hidden` de nascença, `pointer-events:none`.
6. CLS 0 / LCP intocado / peso no budget? ✅ Absolute em caixa reservada, hero segue texto, 3,6 KB.
7. **Nenhuma seção intercambiável?** ✅ Papel distinto por seção (assinatura vs atrás-de-título vs canto vs divisor); motivos não se repetem sem razão. *(eliminatória 8)*
8. A decoração valoriza o CTA sem competir? ✅ Regra de não-poluição §3: nada sobre CTA/WhatsApp/fotos/preview; folga perto de CTA.

**Resultado: 8/8 · eliminatórias (1,3,8): OK · veredito: APROVADO** para handoff da Fase C.

---

## 8. Handoff Fase C (o que cada dono consome)

- **`ui-engineer` + `design-system-architect`** — inline dos 8 SVG via `components/decor/motif.tsx`; aplica o **mapa §2** (posição/tamanho/opacidade/tinta) e a **regra §3**; garante `overflow-clip` nas seções que recebem atrás-de-título; **não** cria token de cor novo (tinta é `--accent`/`--line` existentes).
- **`motion-engineer`** — anima **só o subconjunto §4** com os tokens de motion; `transform`+`opacity`; `prefers-reduced-motion` estático; 60fps.
- **Eu (`diretor-de-arte`)** — **Fidelity Sign-off ESCRITO** (gate C→D) contra esta Spec: fidelidade do traço, opacidades/tetos respeitados, nada sobre CTA/fotos/preview, CLS 0, contraste AA do texto por cima.

**Não implemento motion nem declaro "pronto" — isso é Fase C/E (Producer).**
