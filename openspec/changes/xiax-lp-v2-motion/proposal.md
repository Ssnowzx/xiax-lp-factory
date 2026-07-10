# Proposal — Xiax LP v2 (camada de motion nível Atlas)

## Why

A v1 (https://web-ebon-omega-31.vercel.app) tem posicionamento e conteúdo bons, mas é
**estática**. A meta da v2 é uma landing page **nível estúdio**, com motion fluido no
padrão de [atlas.overlens.com.br](https://atlas.overlens.com.br): a página precisa
**nascer animada**. Este é o objetivo central da tarefa — o motion é a entrega, não um
detalhe.

## What changes

- Novo app **Next.js (App Router) + TypeScript + Tailwind**.
- Camada de motion: **Framer Motion + GSAP/ScrollTrigger + Lenis** (scroll suave global).
- **Reveals on-scroll por seção** (fade/translate/clip, stagger, easing suave), **hero
  encadeado com micro-parallax**, **botões magnéticos**, **transições entre seções** e
  **contadores animados**.
- Conteúdo/posicionamento herdados da v1: *"software e soluções de IA para empresas"*
  (NÃO "feito com IA").
- Deploy staging na Vercel.

## Motion tokens (base, extraídos do Atlas real)

| Token | Valor |
|-------|-------|
| `ease.reveal` | `power3.out` — `cubic-bezier(0.16,1,0.30,1)` |
| `ease.hero` | `power4.out` — `cubic-bezier(0.19,1,0.22,1)` |
| `ease.micro` | `power2.out` — `cubic-bezier(0.22,1,0.36,1)` |
| `dur.reveal` | 0.8s (blocos grandes 1.1s) |
| `dur.hero` | 1.0–1.2s por linha |
| `dur.micro` | 0.22s |
| `stagger` | 0.08–0.12 |
| `scrollTrigger.start` | `top 78%` (`once:true`) |
| `parallax.scrub` | 0.6 |
| Paleta | bg `#080808` · fg `#ece9e3` · muted `#8a877f` · accent (a definir) |

## Plano de motion — SEÇÃO POR SEÇÃO

> Timings em segundos, easings GSAP. Todos os reveals `once:true`, disparo `top 78%`,
> só `transform`/`opacity`, degradando com `prefers-reduced-motion`.

### 1. Nav
- Estado inicial visível; ao rolar > 40px ganha `backdrop-blur` + hairline inferior
  (transição 0.3s `power2.out`). Links com underline animado no hover (0.22s).

### 2. Hero (timeline encadeada, `ease: power4.out`)
- `eyebrow`: `autoAlpha 0→1`, `y 16→0`, 0.6s.
- `title` em 3 linhas (masked): `yPercent 120→0`, stagger 0.10, 1.0s (overlap `-=0.2`).
- `subtitle`: `autoAlpha 0→1`, `y 20→0`, 0.9s (`-=0.6`).
- `CTAs`: `autoAlpha 0→1`, `y 16→0`, 0.6s (`-=0.5`); botão primário **magnético**.
- Micro-parallax: blobs/gradiente de fundo com `yPercent -8..-12`, `scrub 0.6`.
- Copy: **"Criamos software e soluções de IA que geram resultado."**

### 3. Contexto ("Tecnologia devia acelerar o negócio — não travar.")
- Título reveal padrão (0.8s). Duas colunas (problema × solução) com stagger 0.10.

### 4. Serviços ("O que fazemos") — grid 6 cards
- Cards com reveal `autoAlpha 0→1` + `y 28→0`, **stagger 0.08** na ordem do grid.
- Hover: `y -6`, borda/accent glow, `scale 1.01` (0.25s `power2.out`).

### 5. Processo ("Como trabalhamos") — 4 passos numerados
- Reveal sequencial dos passos (stagger 0.12) + linha de progresso que "desenha"
  (`scaleX 0→1`, `transform-origin:left`, scrub leve conforme a seção passa).

### 6. Métricas ("Por que a Xiax") — contadores animados
- Números sobem de 0 ao valor (a **confirmar** com o dono): ex. `Nx` mais rápido,
  `N%` de economia, `100%` de propriedade do código, times de agentes `24/7`.
- `duration 1.4s`, `power2.out`, `snap` inteiro, dispara `top 85%`, `once:true`.

### 7. Depoimentos / Cases (se houver conteúdo)
- Carrossel/coluna com reveal por item (stagger 0.10). Opcional nesta fase.

### 8. CTA final ("Vamos construir")
- Bloco forte com título em reveal + **botão magnético** grande. Fundo com parallax sutil.

### 9. Footer
- Reveal simples (fade/`y`), hairline superior.

## Impact

- Specs afetadas: `landing-page` (nova capability).
- Código: novo projeto Next.js na raiz do repo; sem quebrar nada (repo estava vazio).
- Deploy: Vercel staging.

## Non-goals

- CMS/backend, i18n, formulário com envio real (link `mailto` como na v1).
- Blog/rotas extras além da LP única.

## Critérios de aceite

Ver a spec `landing-page` (requisitos verificáveis) e a skill `atlas-level-landing`.
Resumo: 60fps, `prefers-reduced-motion`, mobile impecável, Lighthouse Perf &
Best-Practices ≥ 90.

## Aberto para aprovação (decisões do dono)

1. **Accent color** da marca Xiax (default proposto: verde-limão `#e6ff5c` + roxo `#6b5bff`).
2. **Números reais das métricas** (a v1 mostra placeholders `0x/0%/0/7/100%`).
3. Incluir seção de **depoimentos** agora ou deixar para v2.1?
