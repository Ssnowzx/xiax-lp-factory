# Spec — landing-page

## ADDED Requirements

### Requirement: Scroll suave global
A LP SHALL usar Lenis para scroll suave global, sincronizado com GSAP ScrollTrigger
(`lenis.on('scroll', ScrollTrigger.update)` + `gsap.ticker`), sem travar o scroll.

#### Scenario: Scroll com inércia
- **WHEN** o usuário rola a página com roda/trackpad
- **THEN** o scroll é suavizado (lerp ~0.1) e as animações ligadas ao scroll acompanham
  sem jank

#### Scenario: Reduced motion desliga o smooth scroll
- **WHEN** `prefers-reduced-motion: reduce` está ativo
- **THEN** Lenis NÃO é instanciado e o scroll nativo é usado

### Requirement: Reveals on-scroll por seção
Cada seção SHALL revelar seu conteúdo ao entrar na viewport com fade/translate (e clip
quando aplicável), stagger e easing suave, disparando uma única vez.

#### Scenario: Reveal padrão
- **WHEN** o topo de uma seção atinge ~78% da viewport
- **THEN** seus elementos animam `opacity 0→1` + `y`→0 com `power3.out`, `once:true`,
  em stagger de 0.08–0.12

### Requirement: Hero encadeado com micro-parallax
O hero SHALL entrar em timeline encadeada (eyebrow → título por linha → subtítulo → CTA)
e ter micro-parallax de fundo ligado ao scroll.

#### Scenario: Entrada do hero
- **WHEN** a página carrega
- **THEN** os elementos do hero entram em sequência sobreposta (`power4.out`, 0.6–1.2s)
- **AND** o fundo tem parallax sutil (`yPercent` ~-10, `scrub:0.6`) ao rolar

### Requirement: Botões magnéticos e hover refinado
CTAs primários SHALL ter comportamento magnético (seguem o cursor) e estados de hover
suaves usando apenas `transform`.

#### Scenario: Botão magnético
- **WHEN** o cursor se aproxima de um CTA primário
- **THEN** o botão translada em direção ao cursor (fator ~0.3) e retorna suavemente ao sair

### Requirement: Contadores animados
A seção de métricas SHALL animar os números de 0 até o valor final ao entrar na viewport.

#### Scenario: Contadores
- **WHEN** a seção de métricas atinge ~85% da viewport
- **THEN** cada número anima de 0 ao alvo (`~1.4s`, `power2.out`, snap inteiro), `once:true`

### Requirement: Performance e acessibilidade de motion
As animações SHALL manter 60fps (apenas `transform`/`opacity`) e respeitar
`prefers-reduced-motion`.

#### Scenario: 60fps
- **WHEN** o usuário rola em desktop ou mobile
- **THEN** não há jank perceptível; nenhuma animação de layout properties

#### Scenario: Reduced motion
- **WHEN** `prefers-reduced-motion: reduce` está ativo
- **THEN** reveals aplicam o estado final imediatamente e parallax/scrub são desativados

### Requirement: Responsividade e qualidade Lighthouse
A LP SHALL ser responsiva (mobile impecável) e atingir Lighthouse Performance e
Best-Practices ≥ 90.

#### Scenario: Mobile
- **WHEN** aberta em viewport móvel
- **THEN** o layout se adapta sem overflow e o motion permanece fluido

### Requirement: Posicionamento e conteúdo
A copy SHALL comunicar "software e soluções de IA para empresas" (NÃO "feito com IA"),
herdando estrutura e conteúdo da v1.

#### Scenario: Headline
- **WHEN** o hero é exibido
- **THEN** apresenta "Criamos software e soluções de IA que geram resultado."
