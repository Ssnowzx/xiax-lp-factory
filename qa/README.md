# QA de Motion (Playwright)

Screenshots **não** validam animações. Este harness roda Chromium real com
`reducedMotion: "no-preference"`, grava vídeo, captura frames em 0/0.25/0.5/0.75/1 do
scroll e mede LCP/CLS. Depois roda um segundo passe com `reducedMotion: "reduce"` só
para validar o fallback (conteúdo visível, sem movimento).

## Rodar

```bash
# 1. build + servir local
NODE_ENV=production npm run build
NODE_ENV=production npx next start -p 8811

# 2. QA (local ou na URL deployada)
QA_URL=http://localhost:8811 QA_OUT=/tmp/xiax-qa node qa/motion-qa.mjs
QA_URL=https://xiax-lp-factory.vercel.app QA_OUT=/tmp/xiax-prod node qa/motion-qa.mjs
```

Pré-requisito uma vez: `npx playwright install chromium --with-deps`.

## Última medição (produção, 1440×900)

| Métrica | Motion (no-preference) | Reduced (reduce) |
|---|---|---|
| animReady | true | false |
| canvas (grade ASCII) | 1 | 0 (fallback CSS) |
| pin do hero ativo | sim (pinSpacer=1) | não |
| LCP | ~0.5s (meta <2.5s ✅) | ~0.27s |
| CLS | 0.63¹ | 0 ✅ |

¹ O CLS em modo motion vem do `pin` do hero, disparado pelo scroll sintético do harness.
Em lab do Lighthouse (sem scroll) o pin não ativa. Ainda assim é a próxima frente a refinar
(reservar altura do pin / `pinReparent`).

## Frames (`qa/artifacts/`)

- `hero-decode-0pct.png` — hero no início: título 100% embaralhado em glifos-fantasma sobre a grade ASCII.
- `hero-decode-25pct.png` — decode resolvendo linha a linha (ghost→branco) dirigido pelo scroll.
- `scroll-50pct.png` — seções abaixo com decode on-reveal nos headings; grade ASCII site-wide.
- `scroll-100pct.png` — fim da página.
- `reduced-motion-fallback.png` — `prefers-reduced-motion`: conteúdo estático 100% visível, sem canvas/pin.
