/**
 * The salon page (`/salao`) — change xiax-lp-v5-salon · design D11. Same funnel as the barbershop
 * plus "Feito para salão"; same honesty rules from xiax-lp-v4-xchair: only what the Essencial does
 * today is sold as live, every number is cited or labelled as an example, and a salon feature still
 * being built is named only through the registry (`{ feature }`), so it always shows its badge.
 */
import type { PageContent } from "@/lib/content/types";

import { SALON_GALLERY_SLOTS } from "@/lib/data/gallery";
import { SCREENS } from "@/lib/data/screens";
import { SALON_REMINDER_DAY_BEFORE, SALON_SLOT_FREED } from "@/lib/data/whatsapp-messages";

const KEYWORD = "sistema de agendamento para salão de beleza";
const GREETING = "Olá! Tenho um salão de beleza e quero conhecer o Xchair.";

export const SALON: PageContent = {
  page: "salon",
  order: ["hero", "pain", "steps", "numbers", "waitlist", "salonFeatures", "cash", "gallery", "showcase", "plans", "faq", "final"],
  seo: {
    path: "/salao",
    title: "Sistema de Agendamento para Salão de Beleza | Xchair",
    description:
      "Sistema de agendamento para salão de beleza: a cliente marca sozinha, recebe a confirmação e os lembretes no WhatsApp, e a vaga de quem desmarca vai para a lista de espera.",
    keyword: KEYWORD,
    keywords: [KEYWORD, "agenda salão de beleza", "lembrete WhatsApp salão", "lista de espera salão", "reduzir falta salão de beleza"],
    audience: "Salões de beleza",
  },
  whatsapp: {
    greeting: GREETING,
    plan: {
      available: "Olá! Tenho um salão de beleza e quero conhecer o plano {plan} do Xchair para o meu salão.",
      consult: "Olá! Tenho um salão de beleza e quero saber mais sobre o plano {plan} do Xchair.",
      notify: "Olá! Tenho um salão de beleza e quero receber o aviso quando o plano {plan} do Xchair sair.",
    },
  },

  hero: {
    kicker: "Sistema de agendamento para salão de beleza",
    title: ["Menos falta. ", { mark: "Agenda cheia" }, "."],
    body: "A cliente marca sozinha na página do seu salão e recebe a confirmação e os lembretes no WhatsApp. Se alguém desmarca, a vaga vai para a próxima da lista de espera — sem você digitar nada.",
    checklist: [
      { text: "Confirmação e lembretes no WhatsApp, sem ninguém digitar", icon: "reminder" },
      { text: "Lista de espera que oferece a vaga de quem desmarcou" },
      { text: "Página de agendamento com as fotos do seu salão" },
    ],
    desktopScreen: SCREENS.salonDayAgenda,
    phoneScreen: SCREENS.salonHome,
  },

  pain: {
    stat: { value: "~R$ 2.000", countTo: 2000 },
    kicker: "O que a falta custa",
    title: "O horário que fica vazio custa caro.",
    body: [
      "Um exemplo: num salão que fatura R$ 8.000, uma cliente em cada quatro que não aparece leva ",
      { strong: "~R$ 2.000 por mês" },
      ". Faça a conta com a sua agenda. Caderno e WhatsApp na mão não lembram ninguém, e a cadeira fica vazia.",
    ],
  },

  steps: {
    title: "Você atende. O resto anda sozinho.",
    kicker: "Em três passos",
    sweepTool: "brush",
    steps: [
      {
        lead: "A cliente marca sozinha",
        rest: " na página do seu salão, a qualquer hora — sem te chamar no WhatsApp.",
        // 15h00, picked, on the time choice.
        visual: {
          kind: "booking",
          screen: SCREENS.salonStepTimeChoice,
          fade: "none",
          ring: { left: "27%", top: "66.5%", width: "23%", height: "13.6%" },
        },
      },
      {
        lead: "Cai direto na agenda do dia",
        rest: " — com o encaixe, a hora atual marcada e o horário livre em destaque.",
        // the free slot with its waiting list, on the day agenda.
        visual: {
          kind: "agenda",
          screen: SCREENS.salonStepDayAgenda,
          fade: "both",
          ring: { left: "55.5%", top: "58.3%", width: "44.3%", height: "14%" },
        },
      },
      {
        lead: "Confirmação e lembretes saem sozinhos",
        rest: " no WhatsApp: na hora de marcar, na véspera e cerca de 2h antes.",
        visual: { kind: "reminder", screen: SCREENS.salonStepConfirmed, fade: "bottom", message: SALON_REMINDER_DAY_BEFORE },
      },
    ],
    footnote: "Cada serviço com o preço e a duração que você define: escova, corte, coloração, manicure, do jeito que você já trabalha.",
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
      { value: "~R$ 2.000", countTo: 2000, label: "a menos no mês se 1 cliente em cada 4 falta num salão de R$ 8.000", anchor: false },
    ],
    source: {
      before: "Fonte do 25%:",
      label: "Robotham et al., BMJ Open, 2016",
      href: "https://pubmed.ncbi.nlm.nih.gov/27798006/",
      after:
        ", revisão de estudos em clínicas; mais de um lembrete funcionou melhor que um só. R$ 2.000 é um exemplo: 1 cliente em cada 4 faltando num salão de R$ 8.000.",
    },
  },

  waitlist: {
    kicker: "Lista de espera",
    title: "Desmarcou? A vaga já tem dona.",
    body: "Quem quer um horário que está lotado entra na lista de espera. Quando alguém desmarca, o Xchair oferece a vaga sozinho — ninguém do salão precisa mandar mensagem.",
    steps: [
      "A cliente desmarca pelo link que recebeu — sem te ligar.",
      "A vaga vira uma oferta no WhatsApp para a próxima da fila, com prazo para aceitar.",
      "Ela aceita pelo site e a vaga é dela. Passou o prazo, a oferta vai para a seguinte.",
    ],
    screen: SCREENS.salonAttentionToday,
    message: SALON_SLOT_FREED,
  },

  salonFeatures: {
    kicker: "Feito para salão",
    title: "Feito para a rotina do salão.",
    body: "Cada profissional com a sua agenda, a química com o tempo dela, cabelo e unha na mesma visita. É isso que o Xchair está ganhando para o salão.",
    // Both the available ones and the coming ones are Completo features; the note says so plainly.
    items: [
      "professionalChoice",
      "pricePerProfessional",
      "pauseTime",
      "multiProfessionalVisit",
      "roomsAndEquipment",
      "technicalRecord",
      "sessionPackages",
      "anamnesis",
      "commissionAndPartner",
      "salonCatalog",
    ],
    note: "Estes recursos são do plano Completo, que está em construção; os marcados com “Em breve” ainda não estão no app. Hoje, o Essencial atende 1 profissional, com agenda, WhatsApp automático, lista de espera e caixa.",
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
    screen: SCREENS.salonMonthResults,
  },

  gallery: {
    title: "Salão de verdade. Agenda à altura.",
    body: "Enquanto você atende, a cliente marca pelo celular e a confirmação e os lembretes saem sozinhos no WhatsApp. Ninguém larga a escova pra responder mensagem.",
    slots: SALON_GALLERY_SLOTS,
  },

  showcase: {
    kicker: "A página do seu salão",
    title: "É isso que a sua cliente vê.",
    body: "Uma página só do seu salão, com as suas fotos, os seus serviços e o próximo horário livre logo na capa. Sem salão concorrente do lado.",
    // What the client finds on the salon's page and in her own area — all live today.
    features: [
      "Fotos do seu salão, enviadas pelo painel",
      "Serviços com preço e duração",
      "O próximo horário livre na capa",
      "Área da cliente com o próximo horário, o histórico e “repetir o último serviço”",
      "Cartão fidelidade digital: a cada tantas visitas, um benefício",
    ],
    // Porcelana is the salon style the app has today; Rosé, Sálvia and Noite de Gala are not out yet.
    style: {
      name: "Estilo Porcelana",
      description: "Marfim, detalhes em terracota e títulos em serifa.",
      soon: "Mais estilos em breve",
    },
    screen: SCREENS.salonHome,
  },

  plans: {
    title: "Comece hoje. Cresça com o Completo.",
    body: "O Essencial já está no ar: agenda, WhatsApp automático, lista de espera e caixa, para 1 profissional. O Completo traz a equipe e a rotina do salão; ele e o Signature usam o mesmo sistema e estão em construção.",
    featured: "completo",
    featuredLabel: "O plano do salão",
    cards: {
      essencial: {
        tagline: "Para quem atende sozinha",
        features: [
          "WhatsApp automático: confirmação na hora, lembrete na véspera e outro 2h antes",
          "Lista de espera: a vaga de quem desmarca vira oferta para a próxima da fila",
          "Sua página de agendamento, com suas fotos, serviços, preços e o próximo horário livre",
          "Agenda do dia com encaixe e o painel “Precisa de atenção hoje”",
          "Área da cliente, ficha com histórico e cartão fidelidade",
          "Caixa com a taxa da maquininha já descontada, meta e resultado do mês, extrato em CSV",
          "No navegador do celular e do computador",
        ],
      },
      completo: {
        // The round brush instead of the barbershop's straight razor.
        icon: "/icons/plans/salon-completo.webp",
        tagline: "Para o salão com equipe, da agenda à comissão",
        features: [
          [{ feature: "professionalChoice" }, " e ", { feature: "pricePerProfessional", text: "preço e duração por profissional" }],
          [{ feature: "pauseTime" }],
          [{ feature: "multiProfessionalVisit" }],
          [{ feature: "roomsAndEquipment" }],
          [{ feature: "technicalRecord" }],
          [{ feature: "sessionPackages" }, " e ", { feature: "anamnesis", text: "anamnese" }],
          [{ feature: "commissionAndPartner" }],
          [{ feature: "salonCatalog" }],
          "Comanda com pagamento dividido, caixa do dia com fechamento conferido e contas a pagar e a receber",
          "Estoque com custo, permissões por função e metas por profissional",
        ],
      },
      signature: {
        tagline: "Para o salão que quer o sistema trabalhando pelo faturamento",
        features: [
          "Recepcionista de WhatsApp com IA, que confirma e remarca",
          "Convite de retorno automático",
          "Várias unidades com visão de rede",
          "App nas lojas com a marca do salão",
          "Migração feita pela equipe do Xchair e gerente de sucesso",
        ],
      },
    },
  },

  faq: {
    title: "Pergunta de quem tem salão, resposta direta.",
    items: [
      {
        id: "equipe",
        question: "Meu salão tem várias profissionais. Serve?",
        answer: [
          "Hoje, o Essencial atende 1 profissional: a sua agenda, o WhatsApp automático, a lista de espera e o caixa. Para a equipe, o plano é o ",
          { strong: "Completo" },
          ", que chega em breve: ",
          { feature: "professionalChoice", text: "a cliente escolhe a profissional" },
          ", com ",
          { feature: "pricePerProfessional", text: "preço e duração por profissional" },
          " e ",
          { feature: "commissionAndPartner", text: "a comissão de cada uma calculada" },
          ". Chame no WhatsApp e a gente avisa quando ele sair.",
        ],
      },
      {
        id: "pausa",
        question: "A agenda entende o tempo de pausa da química?",
        answer: [
          "Ainda não. O ",
          { feature: "pauseTime", text: "tempo de pausa da química" },
          " está em construção para o Completo: enquanto a química age, a agenda deixa a profissional livre para outra cliente. Hoje, cada serviço tem a duração que você define, e a agenda reserva esse tempo inteiro.",
        ],
      },
      {
        id: "servicos",
        question: "Dá para cadastrar os serviços do meu salão?",
        answer: [
          "Sim. Você cadastra cada serviço com o preço e a duração que quiser: escova, corte, coloração, manicure, sobrancelha. Um ",
          { feature: "salonCatalog", text: "catálogo de salão já pronto" },
          " vem com o Completo: cabelo, unhas, cílios, sobrancelha e estética, para você só ajustar preço e duração.",
        ],
      },
      {
        id: "whatsapp",
        question: "Já me viro no WhatsApp",
        answer:
          "Até a cliente esquecer. O WhatsApp na mão não lembra ninguém sozinho e não enche a vaga de quem desmarcou. No Xchair, a confirmação sai na hora do agendamento e os lembretes saem na véspera e cerca de 2h antes, sem ninguém digitar. E quando alguém desmarca, a vaga vira uma oferta no WhatsApp para a próxima da lista de espera: ela aceita pelo site e o horário não fica vazio.",
      },
      {
        id: "preco",
        question: "É caro?",
        answer:
          "Compare com o horário vazio: num salão que fatura R$ 8.000, se 1 cliente em cada 4 falta, são cerca de R$ 2.000 a menos no mês. O Essencial custa R$ 99 por mês e já traz a página de agendamento do seu salão, a confirmação e os lembretes no WhatsApp e a lista de espera.",
      },
      {
        id: "config",
        question: "É complicado configurar?",
        answer:
          "Você assina, escolhe o endereço da sua página e ela fica pronta assim que o pagamento é confirmado. Depois cadastra os serviços com preço e duração e já começa a agendar.",
      },
      {
        id: "marketplace",
        question: "Minha cliente vai ver salão concorrente?",
        answer:
          "Não. O Xchair não é marketplace: sua página mostra só o seu salão, e a base de clientes é sua. Você conquista a cliente uma vez e ela volta pra você, não pra plataforma.",
      },
      {
        id: "celular",
        question: "Funciona no celular?",
        answer:
          "Sim. A página do seu salão e o seu painel abrem no navegador do celular e do computador, sem instalar nada. O app para instalar no celular vem em breve.",
      },
    ],
  },

  final: {
    kicker: "Fale com a gente",
    title: ["Comece hoje. Feche o mês ", { mark: "com menos falta" }, "."],
    body: "Chame no WhatsApp e veja o Xchair funcionando: a cliente marca sozinha, o WhatsApp lembra por você e a vaga de quem desmarca vai para a próxima da lista de espera.",
    nextSteps: [
      { title: "Você chama no WhatsApp", body: "A conversa já abre com esta mensagem:", sent: GREETING },
      { title: "A gente mostra o Xchair", body: "A página de agendamento, os lembretes e a lista de espera, funcionando." },
      {
        title: "Seu salão entra no ar",
        body: "Com o seu nome, as suas fotos e os seus serviços, assim que o pagamento é confirmado.",
      },
    ],
  },
};
