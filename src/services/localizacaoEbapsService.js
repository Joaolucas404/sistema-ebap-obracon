import { supabase } from '../lib/supabase.js';

export const EBAP_STATUS = [
  { value: 'OPERANDO', label: 'Operando', tone: 'green' },
  { value: 'ATENCAO', label: 'Atencao', tone: 'orange' },
  { value: 'CRITICA', label: 'Critica', tone: 'red' }
];

const FINAL_OS = ['concluida_arquivada', 'concluida', 'cancelada', 'rejeitada', 'rejeitada_cco', 'arquivada', 'finalizada'];
const RO_PENDENTES = ['rascunho', 'pendente_validacao_cco', 'correcao_solicitada', 'enviado_cco', 'devolvido_cco'];

function normalizeStatus(ebap) {
  if (ebap.status_operacional) return ebap.status_operacional;
  if (ebap.status === 'critico') return 'CRITICA';
  if (ebap.status === 'atencao') return 'ATENCAO';
  return 'OPERANDO';
}

function countByEbap(rows, ebapIdField = 'ebap_id') {
  return rows.reduce((acc, row) => {
    const id = row[ebapIdField];
    if (id) acc[id] = (acc[id] || 0) + 1;
    return acc;
  }, {});
}

export function statusLabel(status) {
  return EBAP_STATUS.find((item) => item.value === status)?.label || status || '-';
}

export async function listarEbapsMapa() {
  const { data, error } = await supabase
    .from('ebaps')
    .select('id,codigo,nome,nome_curto,status,status_operacional,latitude,longitude,link_maps,ativo,ativa,updated_at,created_at')
    .is('deleted_at', null)
    .order('nome', { ascending: true });

  if (error) throw error;
  return (data || [])
    .filter((ebap) => ebap.ativo !== false && ebap.ativa !== false)
    .map((ebap) => ({ ...ebap, status_operacional: normalizeStatus(ebap) }));
}

export async function obterIndicadoresEbaps() {
  const [ebaps, osResult, roResult, manutResult] = await Promise.all([
    listarEbapsMapa(),
    supabase.from('ordens_servico').select('id,ebap_id,status').is('deleted_at', null),
    supabase.from('relatorios_diarios').select('id,ebap_id,status').is('deleted_at', null),
    supabase.from('manutencao_execucoes').select('id,ebap_id,status,data_programada').is('deleted_at', null)
  ]);

  const errors = [osResult.error, roResult.error, manutResult.error].filter(Boolean);
  if (errors.length) throw errors[0];

  const osAbertas = (osResult.data || []).filter((os) => !FINAL_OS.includes(os.status));
  const roPendentes = (roResult.data || []).filter((ro) => RO_PENDENTES.includes(ro.status));
  const preventivasPendentes = (manutResult.data || []).filter((item) => ['pendente', 'programada', 'atrasada'].includes(item.status));

  const osByEbap = countByEbap(osAbertas);
  const roByEbap = countByEbap(roPendentes);
  const manutByEbap = countByEbap(preventivasPendentes);

  const enriched = ebaps.map((ebap) => ({
    ...ebap,
    os_abertas: osByEbap[ebap.id] || 0,
    ro_pendentes: roByEbap[ebap.id] || 0,
    preventivas_pendentes: manutByEbap[ebap.id] || 0
  }));

  return {
    ebaps: enriched,
    dashboard: {
      total: enriched.length,
      operando: enriched.filter((ebap) => ebap.status_operacional === 'OPERANDO').length,
      atencao: enriched.filter((ebap) => ebap.status_operacional === 'ATENCAO').length,
      critica: enriched.filter((ebap) => ebap.status_operacional === 'CRITICA').length,
      osAbertas: osAbertas.length,
      roPendentes: roPendentes.length
    }
  };
}
