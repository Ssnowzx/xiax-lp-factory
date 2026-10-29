## Why

Na v4 a seção `#modelos` passou a mostrar uma página só (Navalha), porque o seletor antigo de estilos e cores vendia o
que o Xchair não tinha. Na v5 o salão ganhou o mesmo tratamento (Porcelana) e os outros temas viraram "mais estilos em
breve".

Agora o app entrega as oito receitas de tema (`APPbarbearia/docs/THEMES.md`), e o dono troca a receita sozinho no
painel, em Configurações › Aparência, em qualquer plano. O dono da Xiax pediu (2026-10-29) que a seção volte a mostrar
os estilos, **só para o cliente saber que pode mudar**: sem seletor e sem pedir a cor pelo site.

## What Changes

- `#modelos` mostra os quatro estilos do segmento da página, lado a lado, cada um num celular com nome e uma frase:
  - barbearia: Navalha (padrão), Velha Guarda, Poste e Oficina;
  - salão: Porcelana (padrão), Rosé, Sálvia e Noite de Gala.
- O estilo em que a página abre leva o selo "Padrão".
- Uma nota diz que a troca é feita no painel, em Configurações, e que fotos, serviços e horários continuam no lugar.
- Sai o "Mais estilos em breve".
- Continua proibido: seletor de estilo ou cor, botão de pedir um estilo, mensagem de WhatsApp com o estilo escolhido.
- No celular, os estilos ficam numa fileira que desliza para o lado; a partir de 1024 px, quatro colunas.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `real-screens` (change `xiax-lp-v4-xchair`): "Modelos mostra a página real" passa a mostrar os quatro estilos do
  segmento, mantendo a proibição de seletor.
- `salon-landing` (change `xiax-lp-v5-salon`): "Telas reais com dados de exemplo" abre exceção para a vitrine de
  estilos, onde cada tela está no seu próprio tema.

## Impact

- **Código:**
  - `components/sections/modelos.tsx`: vitrine de estilos (RSC, sem ilha cliente);
  - `lib/content/types.ts`: `ShowcaseContent.themes` no lugar de `style` e `screen`;
  - `lib/content/barbershop.ts` e `lib/content/salon.ts`: os estilos de cada página;
  - `lib/data/screens.ts`: oito telas `theme*`;
  - `scripts/optimize-screens.mjs`: recortes `theme-<id>`.
- **Imagens:** originais do app em `assets/screens-src/themes/` (com `themes.json`), saída em
  `public/screens/theme-*.webp` (85–107 KB cada, carregadas sob demanda).
- **Testes:** `barbershop.test.ts` e `salon.test.ts` conferem os quatro estilos, o padrão, uma tela por estilo e a nota
  do painel.
- **Sem mudança:** ordem das seções, CTA, medição, SEO.
- **Arquivamento:** depois de `xiax-lp-v4-xchair` e `xiax-lp-v5-salon`, que criam as specs que este delta modifica.
