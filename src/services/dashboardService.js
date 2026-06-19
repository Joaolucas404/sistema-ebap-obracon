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
    supabase.from('ebaps').select('id,codigo,nome,nome_curto,status,ativa,bairro').is('deleted_at', null).order('nome'),
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

  return {
    kpis: {
      osAbertas,
      osConcluidasHoje,
      osAguardandoSupervisor,
      osCriticas,
      ebapsOperando
    },
    ebaps: ebaps.map((ebap) => ({
      ...ebap,
      gerencial: obterDadosGerenciaisEbap(ebap),
      ordensAbertas: activeOsRows.filter((ordem) => ordem.ebap_id === ebap.id).length,
      criticidade: getEbapCriticidade(ebap, activeOsRows)
    })),
    osPorStatus: countBy(osRows, 'status'),
    osPorArea: countBy(osRows, 'area'),
    ultimasOs: ultimasOsResult.data || [],
    ultimosRelatorios: ultimosRelatoriosResult.data || []
  };
}
