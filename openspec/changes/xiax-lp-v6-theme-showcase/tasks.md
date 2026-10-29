# Tasks

## 1. Telas

- [x] 1.1 Guardar as capturas do app em `assets/screens-src/themes/<id>@2x.png` com `themes.json`; verificar 780 × 1688 em todas
- [x] 1.2 Adicionar os recortes `theme-<id>` em `scripts/optimize-screens.mjs` e gerar `public/screens/theme-*.webp`; verificar o tamanho de cada arquivo
- [x] 1.3 Registrar as oito telas `theme*` em `lib/data/screens.ts` com texto alternativo; verificar que as do salão não citam barbearia

## 2. Conteúdo

- [x] 2.1 Trocar `style` e `screen` por `themes` em `ShowcaseContent` (`lib/content/types.ts`); verificar `tsc` sem erro
- [x] 2.2 Escrever os estilos, o padrão e a nota do painel em `barbershop.ts` e `salon.ts`; conferir no app que a troca é do dono, em Configurações, sem trava de plano
- [x] 2.3 Testes de conteúdo: quatro estilos na ordem, um padrão, uma tela por estilo, nota cita o painel; verificar `npm test` verde (212)

## 3. Seção

- [x] 3.1 Reescrever `components/sections/modelos.tsx` como vitrine (fileira abaixo de lg, quatro colunas a partir de lg, depth card por celular); verificar que não há seletor nem botão
- [x] 3.2 Fotografar `/` e `/salao` a 390, 1024 e 1440 px; verificar zero rolagem lateral da página, fileira rolando no celular e nenhum erro no console
