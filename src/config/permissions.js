export const PERFIS = [
  'operador',
  'tecnico',
  'cco',
  'supervisor',
  'gerencia',
  'diretoria',
  'prefeitura',
  'fiscal_operacional',
  'sst',
  'administrativo',
  'almoxarifado',
  'financeiro'
];

export const ROUTE_KEYS = {
  dashboard: '/dashboard',
  comunicacao: '/comunicacao',
  notificacoes: '/notificacoes',
  dashboardOS: '/dashboard-os',
  localizacaoEbaps: '/localizacao-ebaps',
  ativos: '/ativos',
  relatorio: '/relatorio',
  ccoRelatoriosDiarios: '/cco-relatorios-diarios',
  ccoAnaliseOS: '/cco-analise-os',
  os: '/os',
  supervisao: '/supervisao',
  perfil: '/perfil',
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
  usuarios: '/usuarios',
  modelosRelatorio: '/administrativo/modelos-relatorio'
};

export const ROLE_PERMISSIONS = {
  operador: ['dashboard', 'notificacoes', 'comunicacao', 'localizacaoEbaps', 'ativos', 'relatorio', 'ccoRelatoriosDiarios', 'acervoOperador', 'orientacoes', 'perfil', 'os'],
  tecnico: ['os', 'relatorio', 'perfil', 'comunicacao'],
  cco: ['dashboard', 'notificacoes', 'comunicacao', 'localizacaoEbaps', 'ativos', 'ccoRelatoriosDiarios', 'ccoAnaliseOS', 'supervisao', 'orientacoes', 'perfil'],
  supervisor: ['dashboard', 'notificacoes', 'comunicacao', 'localizacaoEbaps', 'ativos', 'dashboardOS', 'os', 'supervisao', 'relatorio', 'ccoRelatoriosDiarios', 'manutencao', 'salaSituacaoEbaps', 'osDiaria', 'arquivoRelatorios', 'compras', 'orientacoes', 'usuarios', 'modelosRelatorio', 'perfil'],
  gerencia: [
    'dashboard',
    'notificacoes',
    'comunicacao',
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
    'usuarios',
    'perfil'
  ],
  diretoria: ['*'],
  prefeitura: ['dashboard', 'notificacoes', 'comunicacao', 'dashboardOS', 'os', 'localizacaoEbaps', 'ativos', 'relatorios', 'financeiroContrato', 'orientacoes', 'perfil'],
  fiscal_operacional: ['dashboard', 'os', 'perfil'],
  sst: ['dashboard', 'notificacoes', 'comunicacao', 'localizacaoEbaps', 'ativos', 'sst', 'orientacoes', 'perfil'],
  administrativo: ['dashboard', 'notificacoes', 'comunicacao', 'administrativo', 'orientacoes', 'perfil'],
  almoxarifado: ['dashboard', 'notificacoes', 'comunicacao', 'localizacaoEbaps', 'ativos', 'almoxarifado', 'compras', 'orientacoes', 'perfil'],
  financeiro: ['dashboard', 'notificacoes', 'comunicacao', 'localizacaoEbaps', 'ativos', 'financeiroContrato', 'compras', 'orientacoes', 'perfil']
};

export const START_ROUTE_BY_ROLE = {
  operador: '/dashboard',
  tecnico: '/os',
  cco: '/dashboard',
  supervisor: '/dashboard',
  gerencia: '/dashboard',
  diretoria: '/dashboard',
  prefeitura: '/dashboard',
  fiscal_operacional: '/dashboard',
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
