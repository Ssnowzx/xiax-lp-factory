# xiax-lp-factory

Landing pages nível estúdio para a **Xiax** — dark premium, **nascidas animadas**
(motion no padrão de [atlas.overlens.com.br](https://atlas.overlens.com.br)).

- **Processo:** spec-driven via [OpenSpec](https://github.com/Fission-AI/OpenSpec).
  Mudanças em `openspec/changes/`; specs em `openspec/specs/`.
- **Receita de motion/design:** `.claude/skills/atlas-level-landing/SKILL.md`.
- **Stack:** Next.js (App Router) + TS strict + Tailwind.
- **Motion:** atualmente **CSS-only** (reveals via classe `anim-ready`, `prefers-reduced-motion`
  respeitado no servidor). As libs de JS-motion/WebGL (`framer-motion`, `gsap`, `lenis`, `ogl`)
  **não estão instaladas** — removidas por serem resíduo do shader v3 (zero imports, XIA-42).
  Reintroduzir só quando a fase WebGL for de fato ativada.

## Estado atual

`openspec/changes/xiax-lp-v2-motion/` — proposta da v2 (plano de motion seção por seção).
Aguardando aprovação do dono antes do scaffold/implementação.
