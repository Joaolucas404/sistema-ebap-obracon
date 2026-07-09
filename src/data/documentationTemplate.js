const screenshots = {
  'agenda-operacional': new URL('../../docs/assets/screenshots/agenda-operacional.png', import.meta.url).href,
  'agenda-calendario': new URL('../../docs/assets/screenshots/agenda-calendario.png', import.meta.url).href
};

const screenshot = (name) => screenshots[name];

export const officialDocumentationReference = {
  source: 'Guia_Operacional_SIGEBAP_Operador_Parte1_V3_PREMIUM.pdf',
  page: {
    format: 'A4 vertical',
    widthMm: 210,
    heightMm: 297,
    marginMm: 12,
    headerTopMm: 9,
    footerBottomMm: 9
  },
  typography: {
    family: 'Inter',
    eyebrow: '11px / 700 / uppercase',
    title: '30px / 800',
    subtitle: '15px / 400',
    body: '13px / 400',
    caption: '11px / 400'
  },
  visualRules: [
    'Página A4 vertical, sem containers pesados no miolo.',
    'Cabeçalho pequeno em verde no topo esquerdo com linha horizontal fina.',
    'Rodapé tripartido: documento, seção e número da página.',
    'Títulos grandes em azul escuro, subtítulos leves em cinza azulado.',
    'Componentes com borda fina, cantos arredondados e fundo branco suave.',
    'Prints centralizados em frame branco com borda clara e sombra discreta.',
    'Marcadores numerados circulares usando a cor do tema.',
    'Chamadas de boa prática/resultado com borda temática e fundo quase branco.'
  ]
};

export const documentationThemes = {
  operador: {
    name: 'Operador',
    primary: '#16A34A',
    soft: '#DCFCE7',
    border: '#BBF7D0',
    text: '#0B1224',
    footer: 'SIGEBAP - Guia Operacional do Operador'
  },
  supervisor: {
    name: 'Supervisor',
    primary: '#2563EB',
    soft: '#DBEAFE',
    border: '#BFDBFE',
    text: '#0B1224',
    footer: 'SIGEBAP - Guia Operacional do Supervisor'
  },
  tecnico: {
    name: 'Técnico',
    primary: '#F97316',
    soft: '#FFEDD5',
    border: '#FED7AA',
    text: '#0B1224',
    footer: 'SIGEBAP - Guia Operacional do Técnico'
  },
  cco: {
    name: 'CCO',
    primary: '#7C3AED',
    soft: '#EDE9FE',
    border: '#DDD6FE',
    text: '#0B1224',
    footer: 'SIGEBAP - Guia Operacional do CCO'
  },
  gerencia: {
    name: 'Gerência',
    primary: '#334155',
    soft: '#E2E8F0',
    border: '#CBD5E1',
    text: '#0B1224',
    footer: 'SIGEBAP - Guia Operacional da Gerência'
  },
  sst: {
    name: 'SST',
    primary: '#D97706',
    soft: '#FEF3C7',
    border: '#FDE68A',
    text: '#0B1224',
    footer: 'SIGEBAP - Guia Operacional SST'
  },
  prefeitura: {
    name: 'Prefeitura',
    primary: '#1D4ED8',
    soft: '#DBEAFE',
    border: '#BFDBFE',
    text: '#0B1224',
    footer: 'SIGEBAP - Guia Operacional Prefeitura'
  }
};

export const documentationVolumes = [
  {
    number: '01',
    title: 'Operador',
    theme: 'operador',
    chapters: [
      {
        number: '01',
        title: 'Primeiros Passos',
        status: 'pronto',
        source: 'Guia_Operacional_SIGEBAP_Operador_Parte1_V3_PREMIUM.pdf',
        topics: ['Bem-vindo ao SIGEBAP', 'Objetivos do sistema', 'Primeiro acesso', 'Login', 'Recuperação de senha', 'Tela inicial', 'Perfil do usuário', 'Encerrando a sessão']
      },
      {
        number: '02',
        title: 'Agenda Operacional',
        topics: ['Visão geral', 'Calendário', 'Lista de atividades', 'Filtros', 'Status', 'Prioridades', 'Indicadores', 'Alteração de data', 'Pesquisa']
      },
      {
        number: '03',
        title: 'Executando Atividades',
        topics: ['Abrir atividade', 'Registrar execução', 'Atualizar status', 'Registrar observações', 'Concluir atividade']
      },
      {
        number: '04',
        title: 'Ordens de Serviço',
        topics: ['Quando abrir uma OS', 'Como abrir', 'Prioridade', 'Criticidade', 'Fotos', 'Evidências', 'Comentários', 'Histórico']
      },
      {
        number: '05',
        title: 'Agenda Particular',
        subtitle: 'Nova Agenda do Operador',
        topics: ['Criando lembretes', 'Eventos pessoais', 'Avisos', 'Compromissos', 'Alterar data', 'Repetições', 'Cores']
      },
      {
        number: '06',
        title: 'RDO',
        topics: ['Criando RDO', 'Responder pendências', 'Evidências', 'Fotos', 'Assinatura', 'Envio']
      },
      {
        number: '07',
        title: 'Chat Corporativo',
        topics: ['Conversas', 'Grupos', 'Arquivos', 'Fotos', 'Áudios', 'Histórico']
      },
      {
        number: '08',
        title: 'Alertas',
        topics: ['Alertas do sistema', 'Notificações', 'Prioridades', 'Pendências']
      },
      {
        number: '09',
        title: 'Minha Conta',
        topics: ['Perfil', 'Senha', 'Foto', 'Preferências', 'Tema']
      },
      {
        number: '10',
        title: 'Perguntas Frequentes',
        topics: ['Problemas comuns', 'Soluções', 'Contatos']
      }
    ]
  },
  {
    number: '02',
    title: 'Supervisor',
    theme: 'supervisor',
    chapters: ['Visão Geral do Supervisor', 'Dashboard', 'Agenda Geral', 'Planejamento Preventivo', 'Importação de XLS', 'Calendário Inteligente', 'Gestão das Equipes', 'Ordens de Serviço', 'Aprovações', 'RDO das Equipes', 'Relatórios', 'Indicadores', 'Dashboard Executivo'].map((title, index) => ({
      number: String(index + 1).padStart(2, '0'),
      title,
      topics: []
    }))
  },
  {
    number: '03',
    title: 'Técnico',
    theme: 'tecnico',
    chapters: ['Recebendo uma OS', 'Executando Serviço', 'Checklist', 'Fotos', 'Materiais', 'Finalizando Serviço', 'Histórico'].map((title, index) => ({
      number: String(index + 1).padStart(2, '0'),
      title,
      topics: []
    }))
  },
  {
    number: '04',
    title: 'CCO',
    theme: 'cco',
    chapters: ['Painel Geral', 'Monitoramento', 'Validação dos Checklists', 'Comunicação', 'Ocorrências', 'Relatórios'].map((title, index) => ({
      number: String(index + 1).padStart(2, '0'),
      title,
      topics: []
    }))
  },
  {
    number: '05',
    title: 'Gerência / Diretoria',
    theme: 'gerencia',
    chapters: ['Visão Geral', 'Indicadores', 'Produtividade', 'Custos', 'Disponibilidade', 'Relatórios Executivos', 'Analytics'].map((title, index) => ({
      number: String(index + 1).padStart(2, '0'),
      title,
      topics: []
    }))
  },
  {
    number: '06',
    title: 'Prefeitura',
    theme: 'prefeitura',
    chapters: ['Portal', 'Acompanhamento das EBAPs', 'Consulta de Serviços', 'Relatórios', 'Indicadores'].map((title, index) => ({
      number: String(index + 1).padStart(2, '0'),
      title,
      topics: []
    }))
  },
  {
    number: '07',
    title: 'SST',
    theme: 'sst',
    chapters: [
      {
        number: '01',
        title: 'Introdução ao SST',
        topics: ['Objetivo do módulo', 'Responsabilidades', 'Conceitos básicos']
      },
      {
        number: '02',
        title: 'Dashboard SST',
        topics: ['Indicadores', 'Pendências', 'Alertas', 'Dias sem acidentes']
      },
      {
        number: '03',
        title: 'Funcionários',
        topics: ['Cadastro', 'Documentação', 'Situação']
      },
      {
        number: '04',
        title: 'EPIs',
        topics: ['Cadastro', 'Entrega', 'Controle', 'Histórico', 'Vencimentos']
      },
      {
        number: '05',
        title: 'Treinamentos',
        topics: ['NR-10', 'NR-12', 'NR-33', 'NR-35', 'Integrações', 'Certificados']
      },
      {
        number: '06',
        title: 'ASO',
        topics: ['Admissional', 'Periódico', 'Retorno', 'Demissional']
      },
      {
        number: '07',
        title: 'APR e DDS',
        topics: ['Cadastro', 'Participantes', 'Lista de presença', 'Fotos', 'Assinaturas']
      },
      {
        number: '08',
        title: 'Permissão de Trabalho (PT)',
        topics: ['Emissão', 'Aprovação', 'Execução', 'Encerramento']
      },
      {
        number: '09',
        title: 'Incidentes e Acidentes',
        topics: ['Registro', 'Investigação', 'Evidências', 'Plano de ação']
      },
      {
        number: '10',
        title: 'Relatórios SST',
        topics: ['Funcionários', 'EPIs', 'Treinamentos', 'ASOs', 'Incidentes', 'Exportação PDF']
      }
    ]
  },
  {
    number: '08',
    title: 'Administrador do Sistema',
    theme: 'gerencia',
    chapters: ['Configurações Gerais', 'Usuários', 'Perfis e Permissões', 'EBAPs', 'Equipes', 'Importação de Dados', 'Logs', 'Integrações', 'Backup e Auditoria'].map((title, index) => ({
      number: String(index + 1).padStart(2, '0'),
      title,
      topics: []
    }))
  }
];

export const agendaChapter = {
  profile: 'operador',
  chapterNumber: '02',
  title: 'Agenda Operacional',
  subtitle: 'Consultando atividades programadas e acompanhando a rotina diária no SIGEBAP.',
  sectionLabel: 'CAPÍTULO 2 - AGENDA OPERACIONAL',
  coverSubtitle: 'Consultando atividades programadas e executando a rotina operacional.',
  pages: [
    {
      kind: 'intro',
      header: 'CAPÍTULO 2 - AGENDA OPERACIONAL',
      title: 'Agenda Operacional',
      subtitle: 'A Agenda Operacional reúne atividades programadas, pendências, atrasos e informações do turno.',
      cards: [
        { number: '1', title: 'Atividades de hoje', text: 'Consulte as demandas previstas para o turno.' },
        { number: '2', title: 'Atividades atrasadas', text: 'Identifique pendências que exigem atenção.' },
        { number: '3', title: 'OS em andamento', text: 'Acompanhe serviços já iniciados pela equipe.' },
        { number: '4', title: 'Filtros rápidos', text: 'Alterne entre hoje, amanhã, próximos dias e concluídas.' }
      ],
      calloutTitle: 'IMPORTANTE',
      calloutText: 'A agenda deve ser consultada no início do turno para evitar perda de atividades programadas.'
    },
    {
      kind: 'steps-screenshot',
      header: 'CAPÍTULO 2 - AGENDA OPERACIONAL',
      title: '1. Consultando a agenda',
      subtitle: 'Siga os passos abaixo para localizar suas atividades programadas.',
      screenshot: screenshot('agenda-operacional'),
      figure: 'Figura 2.1 - Tela da Agenda Operacional do perfil Operador.',
      steps: [
        { title: 'Abra a Agenda Operacional', text: 'Acesse o módulo pelo menu inicial ou pela navegação do sistema.' },
        { title: 'Verifique os indicadores', text: 'Observe atividades de hoje, atrasadas, em andamento e concluídas.' },
        { title: 'Use os filtros', text: 'Selecione o período ou situação desejada para refinar a consulta.' },
        { title: 'Abra os detalhes', text: 'Clique na atividade para consultar informações de execução.' }
      ],
      calloutTitle: 'BOA PRÁTICA',
      calloutText: 'Consulte a agenda antes de abrir novas solicitações. Muitas demandas já podem estar programadas.'
    },
    {
      kind: 'screenshot-cards',
      header: 'CAPÍTULO 2 - AGENDA OPERACIONAL',
      title: '2. Entendendo a tela da agenda',
      subtitle: 'A tela foi organizada para leitura rápida durante a rotina operacional.',
      screenshot: screenshot('agenda-calendario'),
      figure: 'Figura 2.2 - Calendário operacional com atividades programadas.',
      cards: [
        { number: '1', title: 'Calendário', text: 'Mostra as atividades distribuídas por dia.' },
        { number: '2', title: 'Status', text: 'Indica se a atividade está programada, atrasada ou em execução.' },
        { number: '3', title: 'Detalhes', text: 'Permite consultar informações da atividade selecionada.' }
      ]
    },
    {
      kind: 'flow',
      header: 'CAPÍTULO 2 - AGENDA OPERACIONAL',
      title: '3. Fluxo de uso da Agenda',
      subtitle: 'O fluxo abaixo resume a sequência recomendada para o operador durante o turno.',
      flow: [
        'Acessar o sistema',
        'Abrir Agenda Operacional',
        'Ver atividades do turno',
        'Consultar detalhes',
        'Executar atividade',
        'Registrar evidências quando necessário',
        'Atualizar status ou abrir OS'
      ],
      calloutTitle: 'RESULTADO ESPERADO',
      calloutText: 'Ao seguir esse fluxo, a rotina fica registrada e disponível para acompanhamento da Supervisão e do CCO.'
    },
    {
      kind: 'practices',
      header: 'CAPÍTULO 2 - AGENDA OPERACIONAL',
      title: '4. Boas práticas na Agenda',
      subtitle: 'Pequenas atitudes reduzem retrabalho e melhoram a rastreabilidade da operação.',
      do: [
        'Consulte a agenda no início do turno.',
        'Leia os detalhes antes de executar a atividade.',
        'Registre evidências quando solicitado.',
        'Comunique a supervisão em caso de impedimento.'
      ],
      avoid: [
        'Ignorar atividades atrasadas.',
        'Abrir OS duplicada sem verificar a agenda.',
        'Finalizar atividade sem executar.',
        'Deixar pendências sem observação.'
      ],
      checklist: [
        'Consigo localizar as atividades do dia.',
        'Consigo identificar atividades atrasadas.',
        'Sei abrir os detalhes de uma atividade.',
        'Sei quando devo registrar evidência ou abrir OS.'
      ]
    }
  ]
};
