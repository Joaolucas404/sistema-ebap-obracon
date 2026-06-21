export const PERFIS = [
  'operador',
  'tecnico',
  'cco',
  'supervisor',
  'gerencia',
  'diretoria',
  'prefeitura',
  'sst',
  'administrativo',
  'almoxarifado',
  'financeiro'
];

export const ROUTE_KEYS = {
  dashboard: '/dashboard',
  notificacoes: '/notificacoes',
  dashboardOS: '/dashboard-os',
  localizacaoEbaps: '/localizacao-ebaps',
  relatorio: '/relatorio',
  ccoRelatoriosDiarios: '/cco-relatorios-diarios',
  ccoAnaliseOS: '/cco-analise-os',
  os: '/os',
  manutencao: '/manutencao',
  salaSituacaoEbaps: '/sala-situacao-ebaps',
  osDiaria: '/os-diaria',
  arquivoRelatorios: '/arquivo-relatorios',
  acervoOperador: '/acervo-operador',
  relatorios: '/relatorios',
  almoxarifado: '/almoxarifado',
  compras: '/compras',
  financeiroContrato: '/financeiro-contrato',
  sst: '/sst',
  administrativo: '/administrativo',
  orientacoes: '/orientacoes',
  config: '/config',
  usuarios: '/usuarios'
};

export const ROLE_PERMISSIONS = {
  operador: ['dashboard', 'notificacoes', 'localizacaoEbaps', 'relatorio', 'ccoRelatoriosDiarios', 'acervoOperador'],
  tecnico: ['dashboard', 'notificacoes', 'localizacaoEbaps', 'os', 'osDiaria', 'arquivoRelatorios'],
  cco: ['dashboard', 'notificacoes', 'localizacaoEbaps', 'ccoRelatoriosDiarios', 'ccoAnaliseOS'],
  supervisor: ['dashboard', 'notificacoes', 'localizacaoEbaps', 'dashboardOS', 'os', 'relatorio', 'ccoRelatoriosDiarios', 'manutencao', 'salaSituacaoEbaps', 'osDiaria', 'arquivoRelatorios', 'compras'],
  gerencia: [
    'dashboard',
    'notificacoes',
    'dashboardOS',
    'localizacaoEbaps',
    'relatorio',
    'ccoRelatoriosDiarios',
    'ccoAnaliseOS',
    'os',
    'manutencao',
    'salaSituacaoEbaps',
    'osDiaria',
    'arquivoRelatorios',
    'acervoOperador',
    'relatorios',
    'almoxarifado',
    'compras',
    'financeiroContrato',
    'sst',
    'administrativo',
    'orientacoes',
    'config'
  ],
  diretoria: ['*'],
  prefeitura: ['dashboard', 'notificacoes', 'dashboardOS', 'os', 'localizacaoEbaps', 'relatorios', 'financeiroContrato'],
  sst: ['dashboard', 'notificacoes', 'localizacaoEbaps', 'sst'],
  administrativo: ['dashboard', 'notificacoes', 'administrativo'],
  almoxarifado: ['dashboard', 'notificacoes', 'localizacaoEbaps', 'almoxarifado', 'compras'],
  financeiro: ['dashboard', 'notificacoes', 'localizacaoEbaps', 'financeiroContrato', 'compras']
};

export const START_ROUTE_BY_ROLE = {
  operador: '/dashboard',
  tecnico: '/dashboard',
  cco: '/dashboard',
  supervisor: '/dashboard',
  gerencia: '/dashboard',
  diretoria: '/dashboard',
  prefeitura: '/dashboard',
  sst: '/dashboard',
  administrativo: '/dashboard',
  almoxarifado: '/dashboard',
  financeiro: '/dashboard'
};

export function normalizePerfil(perfil) {
  return String(perfil || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function canAccess(perfil, permissionKey) {
  const role = normalizePerfil(perfil);
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes('*') || permissions.includes(permissionKey);
}
