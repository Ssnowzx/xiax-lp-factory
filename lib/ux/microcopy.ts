/**
 * Dicionário de microcopy UX (dono: UX/IA, `ux-ia` §7). i18n-ready.
 * SEPARADO da copy de conversão (CTA "Começar teste grátis" e o redutor
 * "Sem cartão" vêm do Message Map — não vivem aqui). Nunca culpa o usuário.
 */
export const MICROCOPY = {
  form: {
    labelEmail: "E-mail",
    placeholderEmail: "nome@dominio.com",
    enviando: "Enviando…",
    reenviar: "Reenviar",
    erroEmail: "Digite um e-mail válido, ex.: nome@dominio.com",
    erroRede: "Não deu para enviar. Tente de novo.",
  },
  estado: {
    carregandoDepo: "Carregando depoimentos…",
    vazioDepo: "Ainda sem depoimentos por aqui.",
    erroDepo: "Não deu para carregar os depoimentos. Tente de novo.",
    sucessoTrial: "Pronto! Enviamos o link de acesso ao seu e-mail.",
    sucessoTrialSpam: "Não chegou? Confira o spam ou reenviar.",
  },
  nav: { skip: "Pular para o conteúdo", entrar: "Entrar" },
} as const;
