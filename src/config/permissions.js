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
  ativos: '/ativos',
  relatorio: '/relatorio',
  ccoRelatoriosDiarios: '/cco-relatorios-diarios',
  ccoAnaliseOS: '/cco-analise-os',
  os: '/os',
  supervisao: '/supervisao',
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
  operador: ['dashboard', 'notificacoes', 'localizacaoEbaps', 'ativos', 'relatorio', 'ccoRelatoriosDiarios', 'acervoOperador', 'orientacoes'],
  tecnico: ['dashboard', 'notificacoes', 'localizacaoEbaps', 'ativos', 'os', 'osDiaria', 'arquivoRelatorios', 'orientacoes'],
  cco: ['dashboard', 'notificacoes', 'localizacaoEbaps', 'ativos', 'ccoRelatoriosDiarios', 'ccoAnaliseOS', 'supervisao', 'orientacoes'],
  supervisor: ['dashboard', 'notificacoes', 'localizacaoEbaps', 'ativos', 'dashboardOS', 'os', 'supervisao', 'relatorio', 'ccoRelatoriosDiarios', 'manutencao', 'salaSituacaoEbaps', 'osDiaria', 'arquivoRelatorios', 'compras', 'orientacoes', 'usuarios'],
  gerencia: [
    'dashboard',
    'notificacoes',
    'dashboardOS',
    'localizacaoEbaps',
    'ativos',
    'relatorio',
    'ccoRelatoriosDiarios',
    'ccoAnaliseOS',
    'os',
    'supervisao',
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
    'config',
    'usuarios'
  ],
  diretoria: ['*'],
  prefeitura: ['dashboard', 'notificacoes', 'dashboardOS', 'os', 'localizacaoEbaps', 'ativos', 'relatorios', 'financeiroContrato', 'orientacoes'],
  sst: ['dashboard', 'notificacoes', 'localizacaoEbaps', 'ativos', 'sst', 'orientacoes'],
  administrativo: ['dashboard', 'notificacoes', 'administrativo', 'orientacoes'],
  almoxarifado: ['dashboard', 'notificacoes', 'localizacaoEbaps', 'ativos', 'almoxarifado', 'compras', 'orientacoes'],
  financeiro: ['dashboard', 'notificacoes', 'localizacaoEbaps', 'ativos', 'financeiroContrato', 'compras', 'orientacoes']
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
