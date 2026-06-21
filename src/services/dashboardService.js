import { supabase } from '../lib/supabase.js';
import { obterDadosGerenciaisEbap } from '../data/relatorioGerencialEbaps.js';

const FINAL_OS_STATUSES = ['concluida_arquivada', 'concluida', 'finalizada', 'arquivada', 'cancelada', 'rejeitada'];
const ACTIVE_OS_STATUSES = [
  'solicitada_prefeitura',
  'aguardando_supervisor',
  'analise_supervisor',
  'programada',
  'encaminhada_tecnicos',
  'em_execucao',
  'concluida_tecnicos',
  'validacao_supervisor',
  'enviada_prefeitura',
  'aguardando_validacao_prefeitura',
  'nao_conforme',
  'aberta',
  'em_analise',
  'enviada_cco',
  'validada_cco',
  'devolvida_cco',
  'aguardando_material',
  'execucao_concluida',
  'aguardando_prefeitura'
];

export const STATUS_LABELS = {
  solicitada_prefeitura: 'Solicitada',
  aguardando_supervisor: 'Aguard. Supervisor',
  analise_supervisor: 'Analise Supervisor',
  programada: 'Programada',
  encaminhada_tecnicos: 'Encam. Tecnicos',
  em_execucao: 'Em execucao',
  concluida_tecnicos: 'Concluida Tecnicos',
  validacao_supervisor: 'Valid. Supervisor',
  enviada_prefeitura: 'Enviada Prefeitura',
  aguardando_validacao_prefeitura: 'Valid. Prefeitura',
  nao_conforme: 'Nao conforme',
  concluida_arquivada: 'Concluida',
  aberta: 'Aberta',
  em_analise: 'Em analise',
  aguardando_material: 'Aguard. Material',
  concluida: 'Concluida',
  finalizada: 'Finalizada',
  cancelada: 'Cancelada',
  rejeitada: 'Rejeitada'
};

export const AREA_LABELS = {
  mecanica: 'Mecanica',
  eletrica: 'Eletrica',
  automacao: 'Automacao',
  civil: 'Civil',
  operacional: 'Operacional',
  seguranca: 'Seguranca',
  hidraulica: 'Hidraulica'
};

function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

async function countRows(builder) {
  const { count, error } = await builder;
  if (error) throw new Error(error.message);
  return count || 0;
}

async function safeCountRows(builder) {
  try {
    return await countRows(builder);
  } catch {
    return 0;
  }
}

async function safeRows(builder) {
  try {
    const { data, error } = await builder;
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

async function fetchAllPages(builder, pageSize = 1000) {
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await builder.range(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }
  return rows;
}

function countBy(rows, key) {
  const grouped = rows.reduce((acc, row) => {
    const value = row[key] || 'nao_informado';
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([value, total]) => ({
      value,
      name: key === 'status' ? STATUS_LABELS[value] || value : AREA_LABELS[value] || value.replaceAll('_', ' '),
      total
    }))
    .sort((a, b) => b.total - a.total);
}

function getEbapCriticidade(ebap, ordens) {
  const gerencial = obterDadosGerenciaisEbap(ebap);
  const os = ordens.filter((ordem) => ordem.ebap_id === ebap.id);
  const criticas = os.filter((ordem) => ordem.prioridade === 'critica').length;
  const emExecucao = os.filter((ordem) => ordem.status === 'em_execucao').length;

  if (gerencial?.statusDashboard === 'critico') return { nivel: 'critico', score: 95, label: 'Critica' };
  if (gerencial?.statusDashboard === 'atencao') return { nivel: 'atencao', score: 62, label: 'Atencao' };
  if (gerencial?.statusDashboard === 'normal') return { nivel: 'normal', score: 18, label: 'Normal' };
  if (ebap.status === 'critico' || criticas > 0) return { nivel: 'critico', score: 95, label: 'Critica' };
  if (ebap.status === 'atencao' || os.length >= 3 || emExecucao > 0) return { nivel: 'atencao', score: 62, label: 'Atencao' };
  return { nivel: 'normal', score: 18, label: 'Normal' };
}

export async function obterDashboardExecutivo() {
  const { start, end } = todayRange();
  const currentMonth = new Date().toISOString().slice(0, 7);

  const [
    osAbertas,
    osConcluidasHoje,
    osAguardandoSupervisor,
    osCriticas,
    ebapsOperando,
    ebapsResult,
    osChartRows,
    ultimasOsResult,
    ultimosRelatoriosResult
  ] = await Promise.all([
    countRows(
      supabase
        .from('ordens_servico')
        .select('id', { count: 'exact', head: true })
        .not('status', 'in', `(${FINAL_OS_STATUSES.join(',')})`)
        .is('deleted_at', null)
    ),
    countRows(
      supabase
        .from('ordens_servico')
        .select('id', { count: 'exact', head: true })
        .in('status', ['concluida_arquivada', 'concluida', 'finalizada'])
        .gte('updated_at', start)
        .lt('updated_at', end)
        .is('deleted_at', null)
    ),
    countRows(
      supabase
        .from('ordens_servico')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'aguardando_supervisor')
        .is('deleted_at', null)
    ),
    countRows(
      supabase
        .from('ordens_servico')
        .select('id', { count: 'exact', head: true })
        .eq('prioridade', 'critica')
        .not('status', 'in', `(${FINAL_OS_STATUSES.join(',')})`)
        .is('deleted_at', null)
    ),
    countRows(
      supabase
        .from('ebaps')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'normal')
        .eq('ativa', true)
        .is('deleted_at', null)
    ),
    supabase.from('ebaps').select('id,codigo,nome,nome_curto,status,status_operacional,ativa,bairro,created_at,updated_at').is('deleted_at', null).order('nome'),
    fetchAllPages(
      supabase
        .from('ordens_servico')
        .select('id,numero,titulo,status,prioridade,area,ebap_id,created_at,updated_at')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
    ),
    supabase
      .from('ordens_servico')
      .select('id,numero,titulo,status,prioridade,area,created_at,ebap:ebaps(id,nome,nome_curto)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('relatorios_diarios')
      .select('id,codigo,status,prioridade,data_operacao,created_at,ebap:ebaps(id,nome,nome_curto),operador:usuarios!relatorios_diarios_operador_id_fkey(id,nome)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(10)
  ]);

  if (ebapsResult.error) throw new Error(ebapsResult.error.message);
  if (ultimasOsResult.error) throw new Error(ultimasOsResult.error.message);
  if (ultimosRelatoriosResult.error) throw new Error(ultimosRelatoriosResult.error.message);

  const ebaps = ebapsResult.data || [];
  const osRows = osChartRows || [];
  const activeOsRows = osRows.filter((ordem) => ACTIVE_OS_STATUSES.includes(ordem.status));
  const [
    roPendentes,
    aprPendentes,
    estoqueCritico,
    comprasPendentes,
    medicoesPendentes,
    contratosAtivos,
    valorMedidoMesRows,
    comprasPorStatusRows,
    roPorEbapRows,
    preventivasRows,
    ultimasCompras,
    ultimasApr,
    ultimasMedicoes
  ] = await Promise.all([
    safeCountRows(supabase.from('relatorios_diarios').select('id', { count: 'exact', head: true }).in('status', ['pendente_validacao_cco', 'rascunho', 'correcao_solicitada']).is('deleted_at', null)),
    safeCountRows(supabase.from('apr').select('id', { count: 'exact', head: true }).in('status', ['rascunho', 'em_analise']).is('deleted_at', null)),
    safeCountRows(supabase.from('almoxarifado_itens').select('id', { count: 'exact', head: true }).lte('estoque_atual', 0).is('deleted_at', null)),
    safeCountRows(supabase.from('compras').select('id', { count: 'exact', head: true }).in('status', ['solicitada', 'aguardando_aprovacao', 'em_cotacao']).is('deleted_at', null)),
    safeCountRows(supabase.from('medicoes').select('id', { count: 'exact', head: true }).in('status', ['enviada', 'em_analise', 'rascunho']).is('deleted_at', null)),
    safeCountRows(supabase.from('contratos').select('id', { count: 'exact', head: true }).eq('status', 'ativo').is('deleted_at', null)),
    safeRows(supabase.from('medicoes').select('valor_medido,valor_aprovado,valor_glosa,competencia_mes,competencia_ano').is('deleted_at', null)),
    safeRows(supabase.from('compras').select('status').is('deleted_at', null)),
    safeRows(supabase.from('relatorios_diarios').select('id,ebap_id,ebap:ebaps(id,nome,nome_curto)').is('deleted_at', null)),
    safeRows(supabase.from('manutencao_execucoes').select('status').is('deleted_at', null)),
    safeRows(supabase.from('compras').select('id,numero,status,area,created_at').is('deleted_at', null).order('created_at', { ascending: false }).limit(10)),
    safeRows(supabase.from('apr').select('id,codigo,atividade,status,created_at').is('deleted_at', null).order('created_at', { ascending: false }).limit(10)),
    safeRows(supabase.from('medicoes').select('id,codigo,numero,status,valor_medido,valor_aprovado,created_at').is('deleted_at', null).order('created_at', { ascending: false }).limit(10))
  ]);

  const valorMedidoMes = valorMedidoMesRows
    .filter((row) => `${row.competencia_ano}-${String(row.competencia_mes).padStart(2, '0')}` === currentMonth)
    .reduce((sum, row) => sum + Number(row.valor_medido || 0), 0);
  const valorAprovado = valorMedidoMesRows.reduce((sum, row) => sum + Number(row.valor_aprovado || 0), 0);
  const valorGlosado = valorMedidoMesRows.reduce((sum, row) => sum + Number(row.valor_glosa || 0), 0);
  const comprasPorStatus = countBy(comprasPorStatusRows, 'status');
  const roPorEbap = Object.values(roPorEbapRows.reduce((acc, row) => {
    const id = row.ebap_id || 'sem_ebap';
    acc[id] ||= { value: id, name: row.ebap?.nome_curto || row.ebap?.nome || 'Sem EBAP', total: 0 };
    acc[id].total += 1;
    return acc;
  }, {})).sort((a, b) => b.total - a.total);
  const preventivasPorSituacao = countBy(preventivasRows, 'status');
  const ultimasMovimentacoes = [
    ...(ultimasOsResult.data || []).map((row) => ({ tipo: 'OS', titulo: row.numero, descricao: row.titulo, data: row.created_at, path: `/os/${row.id}` })),
    ...(ultimosRelatoriosResult.data || []).map((row) => ({ tipo: 'RO', titulo: row.codigo, descricao: row.ebap?.nome || row.status, data: row.created_at, path: '/relatorio' })),
    ...ultimasCompras.map((row) => ({ tipo: 'Compra', titulo: row.numero, descricao: `${row.area || '-'} - ${row.status}`, data: row.created_at, path: '/compras' })),
    ...ultimasApr.map((row) => ({ tipo: 'APR', titulo: row.codigo, descricao: row.atividade || row.status, data: row.created_at, path: '/sst' })),
    ...ultimasMedicoes.map((row) => ({ tipo: 'Medicao', titulo: row.numero || row.codigo, descricao: row.status, data: row.created_at, path: '/financeiro-contrato' }))
  ].sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0)).slice(0, 15);

  return {
    kpis: {
      osAbertas,
      osConcluidasHoje,
      osAguardandoSupervisor,
      osCriticas,
      ebapsOperando,
      roPendentes,
      aprPendentes,
      estoqueCritico,
      comprasPendentes,
      medicoesPendentes,
      contratosAtivos,
      valorMedidoMes,
      valorAprovado,
      valorGlosado
    },
    ebaps: ebaps.map((ebap) => ({
      ...ebap,
      gerencial: obterDadosGerenciaisEbap(ebap),
      ordensAbertas: activeOsRows.filter((ordem) => ordem.ebap_id === ebap.id).length,
      roPendentes: roPorEbapRows.filter((row) => row.ebap_id === ebap.id).length,
      preventivasPendentes: 0,
      updatedAt: ebap.updated_at || ebap.created_at,
      criticidade: getEbapCriticidade(ebap, activeOsRows)
    })),
    osPorStatus: countBy(osRows, 'status'),
    osPorArea: countBy(osRows, 'area'),
    roPorEbap,
    comprasPorStatus,
    preventivasPorSituacao,
    ultimasMovimentacoes,
    ultimasOs: ultimasOsResult.data || [],
    ultimosRelatorios: ultimosRelatoriosResult.data || []
  };
}
