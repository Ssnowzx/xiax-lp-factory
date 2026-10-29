# Design

## Context

A tesoura 3D (`xiax-lp-v3-scissors-3d`) roda num **canvas fixo em tela cheia**:
- three.js carregado depois da primeira tela;
- render sob demanda;
- pose calculada por função pura (`scissorsPose`).

A seção "Como funciona" (`xiax-lp-v3-cards-25d` · D12) tem:
- título "Você corta. O resto anda sozinho." à esquerda e o rótulo "Em três passos" à direita;
- três cards com medalhões numerados;
- um fio de latão (`data-step-thread`) que a coreografia desenha com `scaleX` da esquerda
  para a direita (≥ md). No celular os cards empilham e o fio é vertical.

Medidas em 1440×900:
- título termina em y ≈ 1706 (página), à esquerda de x ≈ 847;
- rótulo em x 1190–1320;
- fio de x 144 a 1320, em y ≈ 1800;
- topo dos cards em y ≈ 1844.

## Histórico

1. **Trilho esquerdo (recusado).** A primeira versão desta change pôs a navalha num trilho
   esquerdo com 52 px, em contraponto à tesoura. O dono viu no navegador e recusou: "na
   lateral não ficou muito legal". Os artefatos dessa versão estão fora do repo (scratchpad
   da sessão de 2026-10-28). O que sobrou dela e continua aqui:
   - o modelo e o contrato do GLB (D5);
   - a cena com duas peças (D2);
   - o harness de QA;
   - a correção de largura de `placeStill`.
2. **Escolha do momento.** O dono escolheu "o corte" entre três momentos grandes: o corte em
   "Como funciona", o acabamento no CTA final e a vitrine na galeria.

## Goals / Non-Goals

**Goals:**
- Um momento único e legível: o texto "Você corta" acontecendo na tela.
- Nunca as duas ferramentas na tela ao mesmo tempo.
- Zero custo novo de contexto gráfico; peso extra ≤ 120 KB, fora do caminho crítico.
- Coreografia em matemática pura, testada.

**Non-Goals:**
- Repetir o corte na mesma visita.
- Navalha em outras seções.
- Interação própria (clique, arrastar).
- Mudar a tesoura fora do momento do corte.

## Decisions

### D1. O corte em quatro tempos

| Tempo | Guia | O que acontece |
|---|---|---|
| Troca | rolagem | a tesoura sai pela direita (D9); a navalha, fechada, entra pela borda direita |
| Recuo | rolagem | ela recua pairando logo acima do fio até o começo dele, abrindo (`closedFoldDeg` → 0) e girando de 3/4 para frente (`turnDeg` → 0) |
| Corte | o desenho do fio | ela pousa no fio (`dropBy`) e corta da esquerda para a direita, com o talão sobre a frente do desenho |
| Saída | tempo (`exitS`) | ela segue para fora pela direita, levantando o cabo que vai à frente (`exitLiftDeg`), e a tesoura volta |

- **Recuo.** O progresso `a` vai de 0 a 1 enquanto a linha do fio sobe de
  `approachFromVh` a `cutAtVh` da altura da tela. Ele segue a rolagem nos dois sentidos,
  então voltar antes do corte desfaz o movimento.
- **Orientação.** A navalha fica deitada, com a ponta para a esquerda e o fio para baixo
  (`rotY` 0, `rotZ` 90 na convenção das poses). Indo para a direita, ela corta com o cabo à
  frente, como num golpe puxado: a lâmina vem atrás, sobre a linha, e o fio desenhado sai
  de baixo dela. (Com a ponta para a direita, o fio aparecia saindo de baixo do cabo.)
  - Ao abrir, a lâmina gira para o lado do fio, ou seja, para baixo, longe do título.
  - No corte, o fio da lâmina fica sobre a linha (`edgeFromPin`).
- **Pairar.** No recuo ela fica acima da linha: `liftFrac` do comprimento, e nunca menos que
  a folga que a linha pede (`clearPx`). O fio dos passos pede `threadClearPx` (36 px:
  medalhões de 48 px mais 12 px de ar); o fio do celular não tem nada em cima e não pede
  nada. No começo do corte ela pousa na linha ao longo de `dropBy` do desenho.
- **Respiro.** A partir de md, os passos ficam a 80 px fixos do título (`md:mt-20`), no lugar
  do respiro proporcional à altura da tela (`--space-block`, 46 px em 1366×768). Assim a
  navalha pairando cabe entre os dois: ≈ 30 px do título e 12 px do medalhão em 1280, 1366
  e 1440.
- **Corte.** A navalha não tem relógio próprio. A cada quadro, o palco lê o quanto o fio já
  foi desenhado (o `scaleX` do tween da coreografia) e posa a navalha com o talão sobre essa
  frente. Corte e fio ficam sincronizados por construção, sem acoplar os dois módulos.
  - Enquanto a frente ainda está sob a lâmina, a navalha espera no ponto de partida.
  - O ponto de partida mantém a lâmina inteira na tela (`marginPx` entre a ponta e a borda
    esquerda).

### D2. Uma cena, dois modelos

A navalha entra no **mesmo** `WebGLRenderer`, `Scene` e câmera da tesoura:
- `lib/three/scissors-scene.ts` carrega `razor.glb` logo depois de `scissors.glb`, de forma
  independente. Se a navalha falhar, a tesoura e o fio seguem normalmente.
- A cena expõe `setRazorPose(pose | null)`; `null` esconde o nó.
- O "só desenha se algo mudou" considera as duas poses.

Um segundo canvas seria o dobro de contexto e de memória de GPU, por um objeto.

### D3. Matemática pura em `razor-path.ts`

`razorPose(input)`:
- **Entrada:**
  - rolagem e viewport;
  - a linha do corte em px de página (`left`, `right`, `y` e a folga opcional `clearPx`);
  - `cut` (0..1, quanto do fio está desenhado);
  - `exit` (0..1);
  - o ponteiro.
- **Saída:** `RazorPose | null`, com posição do pino, comprimento, rotações, dobra e
  `presence` (0..1).

Funções de apoio:
- `razorLength(lineWidth)`: o comprimento é `lengthFrac` da largura da linha, limitado a
  [`minLengthPx`, `maxLengthPx`]. Dá ≈ 294 px em 1440 e 160 px no celular.
- `razorRestPose(line)`: a pose parada do fallback, na ponta direita da linha, com o fim do
  cabo onde a linha termina.

`presence` também é quanto a tesoura deve dar a vez (D9):
- sobe até 1 em `giveWayBy` do recuo;
- fica em 1 no corte;
- desce a 0 na saída.

### D4. Estado do corte no palco

O palco (`components/motion/razor-cut.ts`) guarda um estado:

```text
waiting ──(fio começa e a navalha está pronta)──▶ cutting ──(fio completo)──▶ exiting ──▶ done
   └──────(fio começa sem a navalha pronta)──────────────────────────────────────────────▶ done
   ◀──────(fio volta a zero, de qualquer estado)─────────────────────────────────────────┘
```

"Pronta" quer dizer modelo carregado e `a ≥ 1`. As transições que dependem do fio são uma
função pura, `nextCutState` (`lib/motion/cut-state.ts`, com testes); `exiting → done` é do
relógio da saída. Em `done` a navalha não volta enquanto o fio estiver desenhado. Isso cobre
três casos: página aberta abaixo da seção, rolagem muito rápida antes do modelo carregar e
voltar à seção vindo de baixo.

**Repetir a cada descida** (pedido do dono, 2026-10-28: "a navalha só aparece uma vez, pra
vir de novo tem que atualizar a página"). A coreografia rebobina o fio, o fio do celular e
as mini-telas dos passos (`pause(0)`) quando o fio cruza `approachFromVh` subindo, ou seja,
já fora da tela por baixo (`rewindWhenLeftBelow`). A navalha não precisa de aviso: ela lê o
fio e, com o fio de volta a zero, volta a `waiting`. Na descida seguinte o recuo e o corte se
repetem. Vindo de baixo nada é rebobinado: o fio cruza o ponto de corte já desenhado.
Rebobinar no próprio ponto de corte (`toggleActions … reset`) foi descartado: o fio e as
telas sumiriam à vista.

### D5. Modelo por script Blender, refinado para ser visto de perto

`assets/3d/razor/build-razor.py` roda no Blender em background e é determinístico.

- **Contrato:**
  - nós `Razor › Handle, Blade, Pivot`, cada pivô com identidade no pino e filho
    `<nome>_Mesh`;
  - comprimento 1.0 aberta, com y de −0.48 (ponta) a +0.52 (fim do cabo);
  - fio em +X;
  - a dobra é `Blade.rotation.z` positiva.
- **Refino para ~300 px:**
  - hollow grind, lombada acetinada, bisel do fio que pega a luz;
  - talas afuniladas com cunha e pinos com arruela;
  - lâmina mais larga em relação ao cabo, para não ler como canivete.
- **Orçamento:** ≤ ~16k triângulos e GLB ≤ 120 KB (meshopt medium, `--quantize-normal 12`).
- **Imagem parada:** 960 px por unidade, para ficar nítida em tela 2x.
- **Falha** (exit ≠ 0) se o contrato quebrar ou se a lâmina tocar as talas entre 0° e 180°.

### D6. Tokens `RAZOR`

Ficam em `lib/motion/motion-tokens.ts`:

| Token | Valor | O que controla |
|---|---|---|
| `lengthFrac` | 0.25 | comprimento na tela em relação à largura da linha |
| `minLengthPx` / `maxLengthPx` | 160 / 320 | limites do comprimento |
| `approachFromVh` | 1.05 | altura da linha (fração da tela) em que o recuo começa |
| `cutAtVh` | 0.6 | ponto de corte; também é o gatilho do fio e das telas na coreografia |
| `closedFoldDeg` | 165 | dobra ao entrar (180 = fechada) |
| `openBy` | 0.33 | fração do recuo em que a lâmina já está toda aberta: ela abre para baixo, então precisa estar aberta antes de passar sobre os medalhões (a ponta chega ao medalhão 3 em ≈ 0.37 do recuo em 1280) |
| `turnDeg` / `faceBy` | 40 / 0.85 | giro de 3/4 e quando ela fica de frente |
| `giveWayBy` | 0.2 | fração do recuo em que a tesoura já saiu |
| `liftFrac` | 0.085 | quanto ela paira acima da linha no recuo (fração do comprimento) |
| `threadClearPx` | 36 | altura mínima do pairar sobre o fio dos passos (medalhões + ar) |
| `dropBy` | 0.12 | fração do corte em que ela pousa na linha |
| `cutS` / `cutEase` | 1.1 / `power2.inOut` | duração e curva do desenho do fio, e portanto do corte |
| `heelFromPin` / `edgeFromPin` | 0.135 / 0.067 | geometria da lâmina: onde o fio começa (depois da espiga), e quanto ele fica abaixo do pino (fração do comprimento) |
| `marginPx` | 8 | folga entre a ponta da lâmina e a borda esquerda no ponto de partida |
| `exitS` / `exitLiftDeg` | 0.45 / 8 | duração da saída e quanto o cabo levanta |
| `pointerTiltDeg` | 6 | inclinação para o ponteiro antes do corte (≤ os 10 da tesoura) |

`heelFromPin` e `edgeFromPin` são medidas da imagem parada v2 (alfa, 960 px por unidade):
o fio fica a 0.067 do eixo do pino, e a lâmina chega à largura cheia a 0.135–0.147 do pino,
depois da espiga e do apoio do dedo.

### D7. Fio do celular e telas dos passos

- **Fio do celular.** No celular, um fio horizontal novo (`data-cut-line`, só abaixo de md)
  fica 48 px (`mt-12`) sob o título. A coreografia o desenha como o fio dos passos, e o palco usa como linha
  do corte o fio que estiver horizontal na tela.
- **Gatilho.** O fio que a navalha corta passa a disparar em `top cutAtVh` (antes era
  `top 85%`), para o corte acontecer no meio da tela, e é desenhado em `cutS` com `cutEase`
  (antes 0,9 s `power3.out`, rápido demais para acompanhar a navalha). O fio vertical do
  celular continua como está.
- **Telas.** Com os cards lado a lado, as telas dos passos disparam junto com o fio, com os
  atrasos de `storyDelays`, e começam com o corte. Com os cards empilhados, cada tela
  continua disparando ao entrar.

### D8. Fallback parado

Com movimento reduzido, `?reduced=1` ou sem WebGL, o fio aparece desenhado e a imagem
parada da navalha (`razor-still.webp`) fica deitada e aberta na ponta direita dele.

- A imagem fica dentro da seção, em `position: absolute`, então acompanha a página sem
  laço.
- O render frontal só é girado no CSS (`rotZ` 90) para casar com a orientação do D1; não
  precisa de espelho.
- É reposicionada no `refresh` do ScrollTrigger (resize).

`razor.glb` não é baixado nesses casos.

### D9. A tesoura dá a vez

`scissorsPose` ganha `giveWay` (0..1, padrão 0), que o palco preenche com a `presence` da
navalha. Com `giveWay = 1`:
- a tesoura desliza para fora pela direita (`x += giveWay · (largura − x + comprimento)`);
- o rastro some (`railPresence · (1 − giveWay)`).

Com 0, a pose é idêntica à de antes, e os 20 checks de `qa/v3-scissors.mjs` seguem valendo
(eles bloqueiam a navalha).

### D10. QA

`qa/v3-razor.mjs` roda no Chrome do sistema, contra `next start` de uma **cópia** do build.
O servidor de desenvolvimento do dono nunca é parado. A navalha é lida por pixels (harness
compartilhado).

- **Recuo** (amostras de `a`, em 1440, 1366 e 1280):
  - a navalha fica abaixo do título e do rótulo e acima do medalhão 1;
  - nenhum pixel da tesoura no trilho direito.
- **Ponto de partida:** a navalha aberta (caixa larga) perto do começo do fio.
- **Depois do corte:**
  - fio inteiro;
  - nenhuma navalha;
  - tesoura de volta ao trilho.
- **Repetição (1440):**
  - subindo até o fio sair da tela, o fio e as mini-telas voltam ao início;
  - descendo de novo, a navalha volta sobre o fio, sem tesoura no trilho, e corta de novo;
  - voltando de baixo, o fio continua desenhado e nenhuma navalha aparece.
- **Recarregar abaixo da seção:** nenhuma navalha; subindo além da seção e descendo de novo,
  ela corta.
- **Celular:** a navalha sobre o fio sob o título, dentro da largura da tela; depois do
  corte, a tesoura volta ao canto; subindo além da seção e descendo de novo, ela volta.
- **Movimento reduzido, `?reduced=1` e sem WebGL:**
  - imagem parada na ponta direita do fio, acompanhando a página;
  - sem `razor.glb`;
  - sem erros de console.
- **Custos:**
  - `razor.glb` ≤ 120 KB;
  - um contexto WebGL;
  - LCP Δ ≤ 100 ms, com a navalha bloqueada como linha de base;
  - CLS 0;
  - aba oculta sem quadros;
  - clique atravessa a navalha.

A sincronia exata do corte com o fio fica provada nos testes unitários (o talão sobre a
frente), porque screenshots não acompanham 1,1 s com precisão.

## Risks / Trade-offs

- **[O recuo passar perto demais do título em larguras intermediárias].** Aconteceu:
  com o respiro proporcional à altura da tela, em 1366×768 sobravam ≈ 10 px para o título e
  2 px para o medalhão. Resolvido com o respiro fixo de md (D1) e o pairar mínimo
  (`threadClearPx`). O QA mede a caixa pintada contra o título em 1440, 1366 e 1280.
- **[O corte rápido demais para ser visto].** Aconteceu com 0,9 s `power3.out`; o fio agora
  usa `cutS`/`cutEase` (D7), com ou sem navalha.
- **[A lâmina passar sobre os medalhões 2 e 3 durante o corte].** Aceito: ela corta sobre a
  linha onde eles estão, por um instante cada, e não há texto ali.
- **[A lâmina, abrindo, descer sobre o canto do card 3].** Ela abre para baixo, então no
  começo do recuo (até `openBy`) a lâmina passa por baixo da linha, na ponta direita.
  Aceito: é rápido, guiado pela rolagem, e não há texto ali. Com `openBy` 0.6 ela ainda
  estava abrindo ao passar sobre os medalhões (≈ 99 px abaixo da altura de espera em 1440);
  com 0.33 ela chega aberta, o que o teste unitário e o QA em 1440, 1366 e 1280 conferem.
- **[O modelo atrasar].** A navalha só entra se estiver pronta antes do ponto de corte (D4).
  Se não estiver, o fio é desenhado sozinho, como hoje.

## Migration Plan

Mudança aditiva. Rollback:
1. remover a chamada `setRazorPose` e o estado do corte do palco;
2. voltar o gatilho do fio para `ENTER`;
3. remover o fio do celular e a imagem parada da seção.

Deploy segue o fluxo atual (Vercel).

## Open Questions

- Cor final das talas do cabo (chifre escuro, ébano ou marfim). É escolha visual do dono
  nos renders e não muda specs nem tarefas.
