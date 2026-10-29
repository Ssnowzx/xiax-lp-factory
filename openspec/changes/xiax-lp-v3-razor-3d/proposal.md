# Proposal — Xiax LP v3 · Navalha 3D ("O corte")

## Why

A tesoura 3D deu vida à página, e o dono quer uma segunda peça de barbearia animada do
mesmo jeito: uma **navalha** modelada no Blender. A condição é que as duas não fiquem
amontoadas.

A primeira versão desta change colocou a navalha num trilho esquerdo, espelhando a tesoura.
O dono viu no navegador e recusou: "na lateral não ficou muito legal". Pequena (52 px) e
sempre na borda, ela lia como um palito disputando espaço com a tesoura. Entre três
propostas de um momento grande (o corte em "Como funciona", o acabamento no CTA final e a
vitrine na galeria), o dono escolheu **o corte**.

O título da seção é "Você corta. O resto anda sozinho." A navalha faz esse corte, e o
risco que ele deixa é o fio que liga os três passos.

## What Changes

- **Modelo 3D no Blender**, gerado por script versionado e determinístico como a tesoura:
  - lâmina de aço com hollow grind, lombada, bisel do fio e espiga com ranhuras;
  - talas do cabo com pinos de latão;
  - lâmina girando no pino.
  É exportado num GLB compactado (meshopt, ≤ 120 KB) e numa imagem parada. O modelo é
  refinado para ser visto de perto (~280 px), não mais a 52 px.
- **Um único momento, em "Como funciona":**
  - a tesoura sai do trilho pela direita e a navalha entra fechada pelo mesmo lado;
  - ela recua sobre a linha do fio enquanto abre e gira para pegar a luz (guiada pela rolagem);
  - no ponto de corte, corta da esquerda para a direita: a frente do fio de latão é desenhada
    exatamente sob a lâmina;
  - sai pela direita, e a tesoura volta ao trilho;
  - os passos 1 → 2 → 3 começam a se animar com o corte.
  Acontece a cada descida até a seção: subindo até o fio sair da tela, tudo volta ao início
  fora da vista e o corte se repete na próxima descida (pedido do dono, 2026-10-28). Voltar
  à seção vindo de baixo não repete o corte.
- **No celular**, o mesmo movimento, menor, sobre um fio horizontal novo, sob o título (o
  fio dos passos é vertical no celular).
- **Uma ferramenta por vez:** enquanto a navalha está em cena, a tesoura sai de cena.
- **Mesma cena 3D da tesoura:** mesma área de desenho, mesmo renderizador, mesmo laço. Sem
  segundo contexto WebGL.
- **Fallback:** com movimento reduzido ou sem WebGL, o fio aparece desenhado e a navalha
  fica parada, deitada na ponta direita dele, como quem acabou de cortar.

## Capabilities

### New Capabilities
- `razor-cut`: o corte da navalha em "Como funciona". Cobre:
  - aparência;
  - entrada, abertura e corte sincronizado com o fio;
  - uma vez a cada descida;
  - a troca com a tesoura;
  - o celular;
  - o fallback;
  - o orçamento de performance.

### Modified Capabilities
- Nenhuma spec principal arquivada. A tesoura (`xiax-lp-v3-scissors-3d`) ganha só um
  parâmetro de "dar a vez", que vale 0 sem a navalha. Os requisitos dela continuam valendo
  fora do momento do corte.

## Impact

- **Código:**
  - `lib/motion/razor-path.ts`: matemática pura do corte, testada;
  - `lib/motion/scissors-path.ts`: ganha o "dar a vez" (`giveWay`), testado;
  - `lib/three/scissors-scene.ts`: posa as duas peças na mesma cena;
  - `components/motion/scissors-stage.tsx` com `components/motion/razor-cut.ts`: medir o
    fio, ler a frente do desenho e controlar a saída;
  - `components/motion/motion-choreography.tsx`: o ponto de corte vira o gatilho do fio e
    das telas dos passos;
  - `components/sections/como-funciona.tsx`: fio do celular e imagem parada;
  - tokens `RAZOR` em `lib/motion/motion-tokens.ts`.
- **Assets:**
  - `assets/3d/razor/` (script e `.blend`);
  - `public/models/razor.glb` e `razor-still.webp`;
  - `scripts/optimize-v3-assets.mjs`.
- **Dependências:** nenhuma nova.
- **QA:**
  - `qa/v3-razor.mjs`, reescrito para o corte;
  - `qa/v3-scissors.mjs` e `qa/v3-depth.mjs` continuam verdes;
  - harness compartilhado em `qa/lib/stage-harness.mjs`.
- **Performance:** até +120 KB (GLB), carregado depois da tesoura e fora do caminho crítico.
  O custo por quadro continua o de um único render da cena.
- **Depende de** `xiax-lp-v3-scissors-3d` (cena e palco) e de `xiax-lp-v3-cards-25d` (seção
  "Como funciona" e o fio dos passos).
