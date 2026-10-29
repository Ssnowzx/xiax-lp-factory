/**
 * Real Xchair screens used on the page (change xiax-lp-v4-xchair · design D2). Files come from
 * `scripts/capture-screens.mjs` + `scripts/optimize-screens.mjs`; `width`/`height` are the
 * file's pixels (2 per CSS px of the app), so `next/image` never upscales them.
 *
 * The data on every screen is fictional (Barbearia Central, its barbers and clients): the
 * page labels them as an example and never presents them as a real customer.
 */
export interface Screen {
  src: string;
  width: number;
  height: number;
  alt: string;
}

export type ScreenId =
  | "barbershopHome"
  | "dayAgenda"
  | "stepTimeChoice"
  | "stepDayAgenda"
  | "stepConfirmed"
  | "attentionToday"
  | "monthResults"
  | "salonHome"
  | "salonDayAgenda"
  | "salonStepTimeChoice"
  | "salonStepDayAgenda"
  | "salonStepConfirmed"
  | "salonAttentionToday"
  | "salonMonthResults";

export const SCREENS: Record<ScreenId, Screen> = {
  barbershopHome: {
    src: "/screens/barbershop-home.webp",
    width: 780,
    height: 1688,
    alt: "Tela de início da página de uma barbearia de exemplo no celular: foto da casa, botão Agendar horário, o próximo horário do cliente e os serviços com duração e preço.",
  },
  dayAgenda: {
    src: "/screens/day-agenda.webp",
    width: 2880,
    height: 1800,
    alt: "Painel do dono no computador com a agenda do dia: agendados, confirmados, encaixes e recebido hoje no topo, os horários do dia com a linha da hora atual e, ao lado, o quadro Precisa de atenção hoje.",
  },
  stepTimeChoice: {
    src: "/screens/step-time-choice.webp",
    width: 780,
    height: 780,
    alt: "Escolha do horário no celular: dias da semana com sábado lotado e domingo fechado, e os horários livres de manhã, de tarde e de noite, com 15h00 escolhido.",
  },
  stepDayAgenda: {
    src: "/screens/step-day-agenda.webp",
    width: 842,
    height: 842,
    alt: "Trecho da agenda do dia: atendimentos com status confirmado ou sem resposta, um encaixe, a linha da hora atual às 14h20 e um horário livre com 3 clientes na lista de espera.",
  },
  stepConfirmed: {
    src: "/screens/step-confirmed.webp",
    width: 780,
    height: 780,
    alt: "Tela de horário confirmado no celular: sexta, 30 de outubro às 15h00, com o serviço e o profissional logo abaixo.",
  },
  attentionToday: {
    src: "/screens/attention-today.webp",
    width: 672,
    height: 760,
    alt: "Quadro Precisa de atenção hoje: 5 clientes ainda não confirmaram e um barbeiro está livre das 16h às 17h com 3 clientes esperando vaga, cada aviso com o botão da ação.",
  },
  monthResults: {
    src: "/screens/month-results.webp",
    width: 1580,
    height: 952,
    alt: "Gráfico de faturamento acumulado do mês: R$ 48.320 até o dia 28, a meta de R$ 55 mil e a previsão de fechar em R$ 54.190 com o que já está agendado.",
  },
  salonHome: {
    src: "/screens/salon-home.webp",
    width: 780,
    height: 1688,
    alt: "Tela de início da página de um salão de exemplo no celular: foto de uma cliente de cabelo cacheado, o nome Salão Aurora, os botões Agendar e Ver serviços e as categorias Cabelo, Unhas, Escova e Coloração.",
  },
  salonDayAgenda: {
    src: "/screens/salon-day-agenda.webp",
    width: 2880,
    height: 1800,
    alt: "Painel da dona do salão no computador com a agenda do dia: agendados, confirmados, encaixes e recebido hoje no topo, os horários de Camila, Bianca e Lívia com a linha da hora atual e, ao lado, o quadro Precisa de atenção hoje.",
  },
  salonStepTimeChoice: {
    src: "/screens/salon-step-time-choice.webp",
    width: 780,
    height: 780,
    alt: "Escolha do horário no celular: dias da semana com sábado lotado e domingo fechado, e os horários livres de manhã, de tarde e de noite, com 15h00 escolhido para uma escova modelada.",
  },
  salonStepDayAgenda: {
    src: "/screens/salon-step-day-agenda.webp",
    width: 1120,
    height: 1120,
    alt: "Trecho da agenda do dia do salão: atendimentos de escova, corte feminino, manicure e coloração, a linha da hora atual às 14h20 e um horário livre das 16h às 17h com 3 clientes na lista de espera.",
  },
  salonStepConfirmed: {
    src: "/screens/salon-step-confirmed.webp",
    width: 780,
    height: 780,
    alt: "Tela de horário confirmado no celular: sexta, 30 de outubro às 15h00, com escova modelada de 50 minutos com a Camila logo abaixo.",
  },
  salonAttentionToday: {
    src: "/screens/salon-attention-today.webp",
    width: 1008,
    height: 1140,
    alt: "Quadro Precisa de atenção hoje: 5 clientes ainda não confirmaram e uma profissional está livre das 16h às 17h com 3 clientes esperando vaga, cada aviso com o botão da ação.",
  },
  salonMonthResults: {
    src: "/screens/salon-month-results.webp",
    width: 1480,
    height: 848,
    alt: "Gráfico de faturamento acumulado do mês: R$ 48.320 até o dia 28, acima da linha de setembro e perto da meta de R$ 55 mil.",
  },
};

