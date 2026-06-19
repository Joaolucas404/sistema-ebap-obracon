export const RELATORIO_GERENCIAL_META = {
  titulo: 'Relatorio Gerencial - Disponibilidade e Eficacia Operacional das EBAPs',
  emitidoEm: '2026-05-08',
  disponibilidadeGeral: 83.4,
  totalEquipamentos: 181,
  equipamentosDisponiveis: 151,
  itensIndisponiveis: 30,
  unidadesAvaliadas: 11
};

export const RELATORIO_GERENCIAL_EBAPS = {
  aribiri: {
    unidade: 'ARIBIRI',
    disponibilidade: 85.7,
    statusRelatorio: 'Crítica',
    statusDashboard: 'critico',
    grupos: {
      bombas: '1/2',
      comportas: '5/6',
      rastelos: '2/2',
      comportaRastelo: '4/4'
    },
    motivo:
      'Uma bomba indisponivel por falha em inversor de frequencia, em tratativa pela SEDURB/Paulitec. Apenas a Comporta no 6 encontra-se inoperante, com anormalidade no conjunto de acionamento.'
  },
  bigossi: {
    unidade: 'BIGOSSI',
    disponibilidade: 87.5,
    statusRelatorio: 'Crítica',
    statusDashboard: 'critico',
    grupos: {
      bombas: '1/2',
      comportas: '2/2',
      rastelos: '2/2',
      comportaRastelo: '2/2'
    },
    motivo:
      'Bomba no 02 em manutencao/garantia SEDURB/USIPLAN e em processo de reinstalacao. Rele de supervisao de alta tensao inoperante desde a ocorrencia de queima da Bomba no 01.'
  },
  'canal-da-costa': {
    unidade: 'CANAL DA COSTA',
    disponibilidade: 58.3,
    statusRelatorio: 'Crítica',
    statusDashboard: 'critico',
    grupos: {
      bombas: '3/4',
      comportas: '2/4',
      rastelos: '-',
      comportaRastelo: '2/4'
    },
    motivo:
      'Bombas apresentaram falhas severas e vem sendo retiradas para substituicao. Previsao de instalacao da ultima bomba existente em 11/05/2026; bombas novas em fabricacao com previsoes para junho/2026 e agosto/2026.'
  },
  cobilandia: {
    unidade: 'COBILANDIA',
    disponibilidade: 100,
    statusRelatorio: 'Adequada',
    statusDashboard: 'normal',
    grupos: {
      bombas: '4/4',
      comportas: '2/2',
      rastelos: '6/6',
      comportaRastelo: '4/4'
    },
    motivo: 'Disponibilidade operacional das bombas e comportas integralmente restabelecida.'
  },
  comportas: {
    unidade: 'ESTACAO DE COMPORTAS',
    disponibilidade: 100,
    statusRelatorio: 'Adequada',
    statusDashboard: 'normal',
    grupos: {
      bombas: '-',
      comportas: '9/9',
      rastelos: '-',
      comportaRastelo: '-'
    },
    motivo: 'Estacao com 9 comportas existentes e 9 disponiveis.'
  },
  'foz-do-costa': {
    unidade: 'FOZ DO COSTA',
    disponibilidade: 71.9,
    statusRelatorio: 'Crítica',
    statusDashboard: 'critico',
    grupos: {
      bombas: '3/8',
      comportas: '3/6',
      rastelos: '8/8',
      comportaRastelo: '9/10'
    },
    motivo:
      'Quatro bombas indisponiveis por falha nos inversores, atualmente na MX Drives. Uma bomba encontra-se queimada e sera encaminhada para avaliacao especializada. Comportas de mare no 01, 02 e 03 inoperantes; comporta de rastelo com atuador danificado, aguardando pecas.'
  },
  garanhuns: {
    unidade: 'GUARANHUNS',
    disponibilidade: 100,
    statusRelatorio: 'Adequada',
    statusDashboard: 'normal',
    grupos: {
      bombas: '1/1',
      comportas: '3/3',
      rastelos: '-',
      comportaRastelo: '-'
    },
    motivo:
      'Embora a disponibilidade dos equipamentos existentes esteja integral, a unidade possui apenas 1 bomba existente frente a capacidade prevista de 4 bombas, aguardando chegada de novos equipamentos para substituicao.'
  },
  laranja: {
    unidade: 'LARANJA',
    disponibilidade: 73.7,
    statusRelatorio: 'Crítica',
    statusDashboard: 'critico',
    grupos: {
      bombas: '7/8',
      comportas: '10/10',
      rastelos: '1/10',
      comportaRastelo: '10/10'
    },
    motivo:
      'Unidade com limitacao operacional por problemas nos rastelos automaticos. Uma bomba e um inversor apresentam falha e estao em tratativa pela SEDURB/DPBarros, em garantia.'
  },
  marilandia: {
    unidade: 'MARILANDIA',
    disponibilidade: 100,
    statusRelatorio: 'Adequada',
    statusDashboard: 'normal',
    grupos: {
      bombas: '4/4',
      comportas: '-',
      rastelos: '6/6',
      comportaRastelo: '4/4'
    },
    motivo: 'Disponibilidade operacional das bombas integralmente restabelecida.'
  },
  marinho: {
    unidade: 'MARINHO',
    disponibilidade: 90.3,
    statusRelatorio: 'Atenção',
    statusDashboard: 'atencao',
    grupos: {
      bombas: '7/8',
      comportas: '5/6',
      rastelos: '7/8',
      comportaRastelo: '9/9'
    },
    motivo:
      'Bomba da posicao no 4 temporariamente indisponivel por fissura no cabo de potencia, sem indicacao atual de falha interna da bomba. Comporta de mare no 4 desativada por curto-circuito associado a umidade interna.'
  },
  'sitio-batalha': {
    unidade: 'SITIO BATALHA',
    disponibilidade: 100,
    statusRelatorio: 'Adequada',
    statusDashboard: 'normal',
    grupos: {
      bombas: '2/2',
      comportas: '1/1',
      rastelos: '-',
      comportaRastelo: '-'
    },
    motivo: 'Unidade operando com disponibilidade plena dos equipamentos informados.'
  }
};

export function normalizarNomeEbap(value = '') {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\bdo\b/g, 'da')
    .replace(/estacao-de-/g, '')
    .replace(/ebap/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (normalized === 'canal-da-costa' || normalized === 'canal-do-costa') return 'canal-da-costa';
  if (normalized === 'foz-da-costa' || normalized === 'foz-do-costa') return 'foz-do-costa';
  return normalized;
}

export function obterDadosGerenciaisEbap(ebap) {
  const keys = [ebap?.nome_curto, ebap?.nome, ebap?.codigo].map(normalizarNomeEbap).filter(Boolean);
  return keys.map((key) => RELATORIO_GERENCIAL_EBAPS[key]).find(Boolean) || null;
}
