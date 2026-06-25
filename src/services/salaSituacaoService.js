import { supabase } from '../lib/supabase.js';
import { obterDashboardExecutivo } from './dashboardService.js';
import { obterIndicadoresEbaps } from './localizacaoEbapsService.js';

const FINAL_OS = ['concluida_arquivada', 'concluida', 'cancelada', 'rejeitada', 'arquivada', 'finalizada'];
const RO_PENDENTES = ['pendente_validacao_cco', 'correcao_solicitada', 'rascunho'];

async function safeRows(builder) {
  try {
    const { data, error } = await builder;
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

function sortByDate(rows, field = 'created_at') {
  return [...rows].sort((a, b) => new Date(b[field] || 0) - new Date(a[field] || 0));
}

export async function obterSalaSituacaoOperacional() {
  const [
    dashboard,
    mapa,
    osCriticas,
    osAguardandoSupervisor,
    roPendentes,
    aprPendentes,
    aptPendentes,
    estoqueCritico,
    comprasAprovacao,
    ultimasOs,
    ultimosRo,
    ultimasCompras,
    ultimasApr
  ] = await Promise.all([
    obterDashboardExecutivo(),
    obterIndicadoresEbaps(),
    safeRows(
      supabase
        .from('ordens_servico')
        .select('id,numero,titulo,descricao,status,prioridade,area,created_at,updated_at,ebap:ebaps(id,nome,nome_curto)')
        .eq('prioridade', 'critica')
        .not('status', 'in', `(${FINAL_OS.join(',')})`)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(20)
    ),
    safeRows(
      supabase
        .from('ordens_servico')
        .select('id,numero,titulo,status,prioridade,area,created_at,updated_at,ebap:ebaps(id,nome,nome_curto)')
        .eq('status', 'aguardando_supervisor')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(20)
    ),
    safeRows(
      supabase
        .from('relatorios_diarios')
        .select('id,codigo,status,created_at,data_operacao,ebap:ebaps(id,nome,nome_curto),operador:usuarios!relatorios_diarios_operador_id_fkey(id,nome)')
        .in('status', RO_PENDENTES)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(20)
    ),
    safeRows(
      supabase
        .from('apr')
        .select('id,codigo,atividade,status,inicio_previsto,fim_previsto,created_at,ebap:ebaps(id,nome,nome_curto)')
        .in('status', ['rascunho', 'em_analise', 'liberada'])
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(20)
    ),
    safeRows(
      supabase
        .from('apt')
        .select('id,codigo,atividade,status,inicio_previsto,fim_previsto,created_at,ebap:ebaps(id,nome,nome_curto)')
        .in('status', ['rascunho', 'em_analise', 'liberada'])
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(20)
    ),
    safeRows(
      supabase
        .from('almoxarifado_itens')
        .select('id,codigo,nome,categoria,unidade,estoque_atual,estoque_minimo,updated_at')
        .is('deleted_at', null)
        .order('estoque_atual', { ascending: true })
        .limit(30)
    ),
    safeRows(
      supabase
        .from('compras')
        .select('id,numero,status,prioridade,area,valor_total,created_at')
        .eq('status', 'aguardando_aprovacao')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(20)
    ),
    safeRows(
      supabase
        .from('ordens_servico')
        .select('id,numero,titulo,status,prioridade,created_at,ebap:ebaps(id,nome,nome_curto)')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(10)
    ),
    safeRows(
      supabase
        .from('relatorios_diarios')
        .select('id,codigo,status,created_at,ebap:ebaps(id,nome,nome_curto)')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(10)
    ),
    safeRows(
      supabase
        .from('compras')
        .select('id,numero,status,area,created_at')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(10)
    ),
    safeRows(
      supabase
        .from('apr')
        .select('id,codigo,atividade,status,created_at')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(10)
    )
  ]);

  const estoqueFiltrado = estoqueCritico.filter((item) => Number(item.estoque_atual || 0) <= Number(item.estoque_minimo || 0));
  const ebapsCriticas = (mapa.ebaps || []).filter((ebap) => ebap.status_operacional === 'CRITICA');
  const alertasSst = [...aprPendentes, ...aptPendentes].filter((item) => ['rascunho', 'em_analise'].includes(item.status));
  const ultimasMovimentacoes = sortByDate([
    ...ultimasOs.map((item) => ({ tipo: 'OS', titulo: item.numero, descricao: item.titulo, data: item.created_at, path: `/os/${item.id}` })),
    ...ultimosRo.map((item) => ({ tipo: 'RDO', titulo: item.codigo, descricao: item.status, data: item.created_at, path: '/relatorio' })),
    ...ultimasCompras.map((item) => ({ tipo: 'Compra', titulo: item.numero, descricao: `${item.area || '-'} - ${item.status}`, data: item.created_at, path: '/compras' })),
    ...ultimasApr.map((item) => ({ tipo: 'APR', titulo: item.codigo, descricao: item.atividade || item.status, data: item.created_at, path: '/sst' }))
  ], 'data').slice(0, 12);

  return {
    dashboard,
    mapa,
    filas: {
      osCriticas,
      osAguardandoSupervisor,
      roPendentes,
      alertasSst,
      estoqueCritico: estoqueFiltrado,
      comprasAprovacao,
      ebapsCriticas,
      ultimasMovimentacoes
    },
    kpis: {
      osCriticas: osCriticas.length,
      osAguardandoSupervisor: osAguardandoSupervisor.length,
      roPendentes: roPendentes.length,
      alertasSst: alertasSst.length,
      estoqueCritico: estoqueFiltrado.length,
      comprasAprovacao: comprasAprovacao.length,
      ebapsCriticas: ebapsCriticas.length
    }
  };
}
