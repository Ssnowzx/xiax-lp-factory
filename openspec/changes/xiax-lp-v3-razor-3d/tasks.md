# Tasks

## 1. Modelo no Blender (em paralelo com 2–3)

- [x] 1.1 Escrever `assets/3d/razor/build-razor.py` com o contrato do D5 e rodar em background; verificar no relatório os nós, a origem de `Blade` no pino, comprimento 1.0 e zero colisão entre lâmina e talas de 0° a 180°
- [x] 1.2 Exportar e compactar com `npx @gltf-transform/cli meshopt --level medium --quantize-normal 12`; verificar `gltf-transform validate` sem erros, `public/models/razor.glb` ≤ 120 KB e o mesmo md5 em duas execuções
- [x] 1.3 Refinar o modelo para ser visto de perto (D5: hollow grind, lombada, bisel, talas afuniladas com cunha, proporção de navalha) e renderizar a revisão v2 (aberta, dobrada 90° e 150°, deitada a 280 px sobre #14110E, tons do cabo); verificar contrato, colisão, md5 estável, ≤ 120 KB e ≤ ~16k triângulos
- [x] 1.4 Gerar a imagem parada a 960 px por unidade e rodar `npm run assets:v3`; verificar `public/models/razor-still.webp` com alfa e as constantes de enquadramento batendo com a imagem

## 2. Matemática e tokens

- [x] 2.1 Reescrever o seat `RAZOR` em `lib/motion/motion-tokens.ts` com os tokens do D6; verificar `npx tsc --noEmit`
- [x] 2.2 Escrever os testes de `lib/motion/razor-path.ts` para o corte e vê-los falhar. Os testes cobrem:
  - nada antes do recuo;
  - entrada fechada pela direita;
  - abrindo e girando conforme o recuo;
  - pronta, aberta, de frente e deitada no ponto de partida, com a lâmina na tela;
  - o talão sobre a frente do fio durante o corte, esperando enquanto a frente está sob a lâmina;
  - o fio da lâmina sobre a linha;
  - sem inclinação no corte;
  - saída pela direita e sumiço no fim;
  - `presence` para a tesoura;
  - o comprimento limitado;
  - a pose parada na ponta direita.
- [x] 2.3 Implementar até passar; verificar `npm test` verde e `razor-path.ts` com 100% de cobertura
- [x] 2.4 Testes e implementação do `giveWay` em `scissors-path.ts` (D9): sem efeito em 0; fora da tela pela direita em 1; rastro apagado; verificar `npm test` verde e cobertura mantida

## 3. Cena, palco e coreografia

- [x] 3.1 Carregar `razor.glb` na mesma cena de `lib/three/scissors-scene.ts`, de forma independente, com `setRazorPose(pose | null)` e render só quando alguma pose muda
- [x] 3.2 Trocar o trilho esquerdo pelo corte em `components/motion/scissors-stage.tsx` + `components/motion/razor-cut.ts`:
  - medir a linha do corte;
  - máquina de estados do D4;
  - leitura da frente do fio;
  - saída por tempo;
  - `giveWay` na tesoura;
  - carga da navalha logo depois da tesoura.

  Verificar no navegador, a 1440×900: a troca, o recuo, o corte sincronizado, a saída e a volta da tesoura, nos dois sentidos de rolagem antes do corte
- [x] 3.3 Coreografia (D7): o fio cortado dispara em `cutAtVh`; o fio do celular (`data-cut-line`) entra em "Como funciona"; com os cards lado a lado, as telas disparam com o fio; verificar no navegador os passos 1 → 2 → 3 começando com o corte e o celular sem regressão
- [x] 3.4 Fallback parado (D8): imagem parada na ponta direita do fio, dentro da seção, reposicionada no refresh; verificar com screenshots com movimento reduzido, `?reduced=1`, sem WebGL e no celular

## 4. Verificação

- [x] 4.1 Reescrever `qa/v3-razor.mjs` para o D10 e rodar contra `next start` de uma cópia do build (sem parar o servidor de desenvolvimento); verificar todos os checks verdes
- [x] 4.2 Rodar `npx tsc --noEmit`, `npm test`, `qa/v3-scissors.mjs`, `qa/v3-depth.mjs` e o axe no mesmo build; verificar tudo verde e sem `console.log` novo
- [x] 4.3 Atualizar o README (seção "Assets da v3") para o corte; verificar que o comando documentado gera os mesmos arquivos

## 5. Repetir a cada descida (pedido do dono, 2026-10-28)

- [x] 5.1 Transições do corte como função pura `nextCutState` em `lib/motion/cut-state.ts`, com testes AAA (fio de volta a zero rearma de qualquer estado); `cutRun` passa a usá-la
- [x] 5.2 Coreografia: rebobinar o fio, o fio do celular e as mini-telas quando o fio sai da tela por baixo (`rewindWhenLeftBelow`); verificar que vindo de baixo nada se repete
- [x] 5.3 QA: trocar "nunca volta" por repetição na descida, nada vindo de baixo, recarregar abaixo e depois descer, e repetição no celular; rodar navalha, tesoura, profundidade, `tsc` e `npm test` no mesmo build
- [x] 5.4 Atualizar spec, design, proposta e README

## Workflow follow-up

- Dono revisa os renders e escolhe o tom das talas (chifre escuro, ébano ou marfim) antes de publicar.
- Arquivar a change depois da aprovação do dono (`/opsx:archive`).
