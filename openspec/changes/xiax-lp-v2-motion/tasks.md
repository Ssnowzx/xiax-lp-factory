# Tasks — Xiax LP v2 motion

## 1. Fundação (feito neste setup)
- [x] 1.1 `openspec init` + skill `atlas-level-landing` commitada
- [x] 1.2 Estudo do Atlas (easings/durations/scroll/parallax extraídos do bundle real)
- [x] 1.3 Spec proposta (este change) — **aguardando aprovação do dono**

## 2. Scaffold do app (após aprovação)
- [x] 2.1 Next.js (App Router) + TS + Tailwind + tokens dark (CSS vars da skill)
- [x] 2.2 Deps: framer-motion, gsap, lenis; fontes premium (next/font)
- [x] 2.3 `SmoothScroll` provider (Lenis + `gsap.ticker` + `ScrollTrigger.update`)
- [x] 2.4 Utils de motion: tokens (easings/durations), `Reveal`/`RevealItem`, `MagneticButton`, `Counter`

## 3. Seções
- [x] 3.1 Nav (sticky + blur ao rolar)
- [x] 3.2 Hero (timeline encadeada + micro-parallax + CTA magnético)
- [x] 3.3 Contexto
- [x] 3.4 Serviços (grid 6, reveal em stagger + hover)
- [x] 3.5 Processo (4 passos + linha de progresso)
- [x] 3.6 Métricas (contadores animados)
- [x] 3.7 CTA final (magnético) + Footer

## 4. Qualidade
- [x] 4.1 `prefers-reduced-motion` em todas as seções (guards + CSS media query)
- [x] 4.2 Responsivo: CTA visível no mobile; grids stack (sm/lg). Sign-off visual mobile pendente
- [x] 4.3 60fps: só `transform`/`opacity`; reveals em CSS transition; parallax com will-change
- [ ] 4.4 Lighthouse Perf & Best-Practices ≥ 90 (não medível no env: sem Chrome; PSI 429)
- [x] 4.5 `next build` de produção passando + deploy Vercel
- [x] 4.6 **QA REAL na URL deployada (Chrome, desktop)**: todas as seções visíveis, 0 erros
      de console do app. Corrigido bug crítico de página em branco (reveals presos em opacity:0)

## 5. Entrega
- [ ] 5.1 Push para `xiax-lp-factory` — **bloqueado: falta credencial de push do GitHub**
- [x] 5.2 Deploy Vercel staging — **https://xiax-lp-factory.vercel.app** (público, READY)
- [x] 5.3 Atualizar skill `atlas-level-landing` com o que funcionou (notas de impl. + gotchas)

> 4.4 Lighthouse: não medível neste ambiente (sem Chrome; PSI API rate-limited 429).
> Medir no navegador (DevTools) ou retry PSI quando a cota reabrir.
