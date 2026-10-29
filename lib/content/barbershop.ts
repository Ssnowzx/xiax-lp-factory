/**
 * The barbershop page (`/`) — change xiax-lp-v5-salon · design D2. Copy moved out of the sections
 * word for word (qa/v5-text-baseline.mjs proves nothing visible changed); its rules come from
 * xiax-lp-v4-xchair: only what the Essencial does today is sold as live, every number is cited,
 * a product fact or a labelled example, and no promise is absolute.
 */
import type { PageContent } from "@/lib/content/types";

import { GALLERY_SLOTS } from "@/lib/data/gallery";
import { SCREENS } from "@/lib/data/screens";
import { REMINDER_DAY_BEFORE, SLOT_FREED } from "@/lib/data/whatsapp-messages";

const KEYWORD = "sistema de agendamento para barbearia";
const GREETING = "Olá! Tenho uma barbearia e quero conhecer o Xchair.";

export const BARBERSHOP: PageContent = {
  page: "barbershop",
  order: ["hero", "pain", "steps", "numbers", "waitlist", "cash", "gallery", "showcase", "plans", "faq", "final"],
  seo: {
    path: "/",
    title: "Sistema de Agendamento para Barbearia | Xchair",
    description:
      "Sistema de agendamento para barbearia: o cliente marca sozinho, recebe a confirmação e os lembretes no WhatsApp, e a vaga de quem desmarca vai para a lista de espera.",
    keyword: KEYWORD,
    keywords: [KEYWORD, "agenda barbearia", "lembrete WhatsApp barbearia", "lista de espera barbearia", "reduzir falta barbearia"],
    audience: "Donos de barbearia",
  },
  whatsapp: {
    greeting: GREETING,
    plan: {
      available: "Olá! Tenho uma barbearia e quero conhecer o plano {plan} do Xchair.",
      consult: "Olá! Quero saber mais sobre o plano {plan} do Xchair.",
      notify: "Olá! Quero ser avisado quando o plano {plan} do Xchair sair.",
    },
  },

  hero: {
    kicker: "Sistema de agendamento para barbearia",
    title: ["Menos falta. ", { mark: "Cadeira cheia" }, "."],
    body: "O cliente marca sozinho na página da sua barbearia e recebe a confirmação e os lembretes no WhatsApp. Se alguém desmarca, a vaga vai para o próximo da lista de espera — sem você digitar nada.",
    checklist: [
      { text: "Confirmação e lembretes no WhatsApp, sem ninguém digitar", icon: "reminder" },
      { text: "Lista de espera que oferece a vaga de quem desmarcou" },
      { text: "Página de agendamento com as fotos da sua barbearia" },
    ],
    desktopScreen: SCREENS.dayAgenda,
    phoneScreen: SCREENS.barbershopHome,
  },

  pain: {
    stat: { value: "~R$ 2.000", countTo: 2000 },
    kicker: "O que a falta custa",
    title: "Se 1 em cada 4 clientes falta, são R$ 2.000 a menos no mês.",
    body: [
      "Um exemplo: numa casa que fatura R$ 8.000, um cliente em cada quatro que não aparece leva ",
      { strong: "~R$ 2.000 por mês" },
      ". Faça a conta com a sua agenda. Caderno e WhatsApp na mão não lembram ninguém, e a cadeira fica parada.",
    ],
  },

  steps: {
    title: "Você corta. O resto anda sozinho.",
    kicker: "Em três passos",
    sweepTool: "razor",
    steps: [
      {
        lead: "O cliente marca sozinho",
        rest: " na página da sua barbearia, a qualquer hora — sem te chamar no WhatsApp.",
        // 15h00, picked, on the time choice.
        visual: {
          kind: "booking",
          screen: SCREENS.stepTimeChoice,
          fade: "none",
          ring: { left: "27.4%", top: "61%", width: "22.2%", height: "12.6%" },
        },
      },
      {
        lead: "Cai direto na agenda do dia",
        rest: " — com o encaixe, a hora atual marcada e o horário livre em destaque.",
        // the free slot with its waiting list, on the day agenda.
        visual: {
          kind: "agenda",
          screen: SCREENS.stepDayAgenda,
          fade: "both",
          ring: { left: "57.4%", top: "65.5%", width: "42.2%", height: "17.6%" },
        },
      },
      {
        lead: "Confirmação e lembretes saem sozinhos",
        rest: " no WhatsApp: na hora de marcar, na véspera e cerca de 2h antes.",
        visual: { kind: "reminder", screen: SCREENS.stepConfirmed, fade: "bottom", message: REMINDER_DAY_BEFORE },
      },
    ],
    footnote: "Pensado para a rotina da barbearia: corte, barba e combo, do jeito que você já trabalha.",
  },

  numbers: {
    title: "Lembrete funciona. Mais de um, melhor ainda.",
    kicker: "Na ponta do lápis",
    stats: [
      { value: "25%", countTo: 25, label: "menos faltas em clínicas quando o paciente recebe lembrete digital", anchor: true },
      {
        value: "3",
        prefix: "até",
        countTo: 3,
        label: "mensagens no WhatsApp por horário: confirmação, véspera e cerca de 2h antes",
        anchor: false,
      },
      { value: "~R$ 2.000", countTo: 2000, label: "a menos no mês se 1 em cada 4 clientes falta numa casa de R$ 8.000", anchor: false },
    ],
    source: {
      before: "Fonte do 25%:",
      label: "Robotham et al., BMJ Open, 2016",
      href: "https://pubmed.ncbi.nlm.nih.gov/27798006/",
      after:
        ", revisão de estudos em clínicas; mais de um lembrete funcionou melhor que um só. R$ 2.000 é um exemplo: 1 cliente em cada 4 faltando numa casa de R$ 8.000.",
    },
  },

  waitlist: {
    kicker: "Lista de espera",
    title: "Desmarcou? A vaga já tem dono.",
    body: "Quem quer um horário que está lotado entra na lista de espera. Quando alguém desmarca, o Xchair oferece a vaga sozinho — ninguém da barbearia precisa mandar mensagem.",
    steps: [
      "O cliente desmarca pelo link que recebeu — sem te ligar.",
      "A vaga vira uma oferta no WhatsApp para o próximo da fila, com prazo para aceitar.",
      "Ele aceita pelo site e a vaga é dele. Passou o prazo, a oferta vai para o seguinte.",
    ],
    screen: SCREENS.attentionToday,
    message: SLOT_FREED,
  },

  cash: {
    kicker: "Caixa",
    title: "Quanto entrou no mês. Sem caderno.",
    body: "Nada de fazer conta no fim do dia: o caixa do Xchair mostra o que entrou de verdade, já sem a taxa do cartão.",
    features: [
      "Cada atendimento entra com a taxa da maquininha já descontada",
      "Meta do mês e o resultado andando todo dia",
      "Extrato em CSV para o contador",
    ],
    screen: SCREENS.monthResults,
  },

  gallery: {
    title: "Barbearia de verdade. Agenda à altura.",
    body: "Enquanto você corta, o cliente marca pelo celular e a confirmação e os lembretes saem sozinhos no WhatsApp. Ninguém larga a tesoura pra responder mensagem.",
    slots: GALLERY_SLOTS,
  },

  showcase: {
    kicker: "A página da sua barbearia",
    title: "É isso que o seu cliente vê.",
    body: "Uma página só da sua barbearia, com as suas fotos, os seus serviços e o próximo horário livre logo na capa. Sem barbearia concorrente do lado.",
    // What the client finds on the shop's page and in their own area — all live today.
    features: [
      "Fotos da sua barbearia, enviadas pelo painel",
      "Serviços com preço e duração",
      "O próximo horário livre na capa",
      "Área do cliente com o próximo horário, o histórico e “repetir o último serviço”",
      "Cartão fidelidade digital: a cada tantos cortes, um benefício",
    ],
    // The barbershop looks the owner switches between in the panel (Configurações › Aparência),
    // all live today. Shown so the owner knows the page can change, never as a pick-one-here.
    themes: {
      title: "Quatro estilos. Um é a cara da sua barbearia.",
      note: "Você escolhe no painel, em Configurações, e troca quando quiser. Fotos, serviços e horários continuam no lugar.",
      defaultLabel: "Padrão",
      items: [
        {
          name: "Navalha",
          description: "Escuro e sofisticado, com detalhes em champanhe e títulos em serifa.",
          screen: SCREENS.themeNavalha,
          isDefault: true,
        },
        {
          name: "Velha Guarda",
          description: "Madeira escura e dourado envelhecido, com títulos em serifa clássica.",
          screen: SCREENS.themeVelhaGuarda,
        },
        {
          name: "Poste",
          description: "Papel claro e vermelho de poste, com títulos condensados em caixa alta.",
          screen: SCREENS.themePoste,
        },
        {
          name: "Oficina",
          description: "Verde-garrafa quase preto e latão, com títulos condensados em caixa alta.",
          screen: SCREENS.themeOficina,
        },
      ],
    },
  },

  plans: {
    title: "Comece pelo Essencial.",
    body: "É o plano que já está no ar: agenda, WhatsApp automático, lista de espera e caixa, para 1 profissional. O Completo e o Signature usam o mesmo sistema, com mais funções, e estão em construção.",
    featured: "essencial",
    cards: {
      essencial: {
        tagline: "Para o barbeiro que quer a agenda trabalhando sozinha",
        features: [
          "WhatsApp automático: confirmação na hora, lembrete na véspera e outro 2h antes",
          "Lista de espera: a vaga de quem desmarca vira oferta para o próximo da fila",
          "Sua página de agendamento, com suas fotos, serviços, preços e o próximo horário livre",
          "Agenda do dia com encaixe e o painel “Precisa de atenção hoje”",
          "Área do cliente, ficha com histórico e cartão fidelidade",
          "Caixa com a taxa da maquininha já descontada, meta e resultado do mês, extrato em CSV",
          "Vitrine de depoimentos e de produtos",
          "No navegador do celular e do computador",
        ],
      },
      completo: {
        tagline: "Para administrar a barbearia inteira, com a equipe",
        features: [
          "Agenda, preço e duração por profissional",
          "Comissão por serviço, aluguel de cadeira e relatório de parceria (Lei 13.352/2016)",
          "Comanda com pagamento dividido e crédito parcelado",
          "Caixa do dia com sangria e fechamento conferido",
          "Contas a pagar e a receber, cartão a receber por parcela, fluxo de caixa e lucro por serviço",
          "Estoque com custo, permissões por função e metas por profissional",
          "Clube de assinatura e sinal por Pix",
        ],
      },
      signature: {
        tagline: "Para a casa que quer o sistema trabalhando pelo faturamento",
        features: [
          "Recepcionista de WhatsApp com IA, que confirma e remarca",
          "Convite de retorno automático",
          "Várias unidades com visão de rede",
          "App nas lojas com a marca da barbearia",
          "Migração feita pela equipe do Xchair e gerente de sucesso",
        ],
      },
    },
  },

  faq: {
    title: "Pergunta de dono, resposta direta.",
    // No "cancele quando quiser" line until the owner confirms self-cancel.
    items: [
      {
        id: "whatsapp",
        question: "Já me viro no WhatsApp",
        answer:
          "Até o cliente esquecer. O WhatsApp na mão não lembra ninguém sozinho e não enche a vaga de quem desmarcou. No Xchair, a confirmação sai na hora do agendamento e os lembretes saem na véspera e cerca de 2h antes, sem ninguém digitar. E quando alguém desmarca, a vaga vira uma oferta no WhatsApp para o próximo da lista de espera: ele aceita pelo site e a cadeira não fica vazia.",
      },
      {
        id: "preco",
        question: "É caro?",
        answer:
          "Compare com a cadeira vazia: numa casa que fatura R$ 8.000, se 1 cliente em cada 4 falta, são cerca de R$ 2.000 a menos no mês. O Essencial custa R$ 99 por mês e já traz a página de agendamento da sua barbearia, a confirmação e os lembretes no WhatsApp e a lista de espera.",
      },
      {
        id: "config",
        question: "É complicado configurar?",
        answer:
          "Você assina, escolhe o endereço da sua página e ela fica pronta assim que o pagamento é confirmado. Depois cadastra os serviços com preço e duração e já começa a agendar.",
      },
      {
        id: "marketplace",
        question: "Meu cliente vai ver barbearia concorrente?",
        answer:
          "Não. O Xchair não é marketplace: sua página mostra só a sua barbearia, e a base de clientes é sua. Você conquista o cliente uma vez e ele volta pra você, não pra plataforma.",
      },
      {
        id: "celular",
        question: "Funciona no celular?",
        answer:
          "Sim. A página da sua barbearia e o seu painel abrem no navegador do celular e do computador, sem instalar nada. O app para instalar no celular vem em breve.",
      },
    ],
  },

  final: {
    kicker: "Fale com a gente",
    title: ["Comece hoje. Feche o mês ", { mark: "com menos falta" }, "."],
    body: "Chame no WhatsApp e veja o Xchair funcionando: o cliente marca sozinho, o WhatsApp lembra por você e a vaga de quem desmarca vai para o próximo da lista de espera.",
    nextSteps: [
      { title: "Você chama no WhatsApp", body: "A conversa já abre com esta mensagem:", sent: GREETING },
      { title: "A gente mostra o Xchair", body: "A página de agendamento, os lembretes e a lista de espera, funcionando." },
      {
        title: "Sua barbearia entra no ar",
        body: "Com o seu nome, as suas fotos e os seus serviços, assim que o pagamento é confirmado.",
      },
    ],
  },
};
