import { supabase } from '../lib/supabase.js';

export const ATIVO_STATUS = [
  { value: 'operando', label: 'Operando', tone: 'green' },
  { value: 'atencao', label: 'Atenção', tone: 'yellow' },
  { value: 'parado', label: 'Parado', tone: 'red' },
  { value: 'em_manutencao', label: 'Em Manutenção', tone: 'blue' }
];

export const ATIVO_STATUS_VALUES = ATIVO_STATUS.map((status) => status.value);

export const ATIVO_TIPOS = ['Bomba', 'Gerador', 'CCM', 'Eletrocentro', 'Monovia', 'Comporta', 'Rastelo', 'Outros'];

const LEGACY_STATUS_MAP = {
  operando_restricao: 'atencao',
  fora_operacao: 'parado',
  manutencao: 'em_manutencao'
};

export const IMPACTO_EQUIPAMENTO = [
  { value: 'operando', label: 'Operando', status: 'operando' },
  { value: 'atencao', label: 'Atenção', status: 'atencao' },
  { value: 'parado', label: 'Parado', status: 'parado' },
  { value: 'em_manutencao', label: 'Em Manutenção', status: 'em_manutencao' }
];

const ATIVO_SELECT = `
  *,
  ebap:ebaps(id,codigo,nome,nome_curto,status)
`;

export function normalizeAtivoStatus(status) {
  const value = String(status || '').trim().toLowerCase();
  return LEGACY_STATUS_MAP[value] || value || 'operando';
}

export function ativoStatusLabel(status) {
  const normalized = normalizeAtivoStatus(status);
  return ATIVO_STATUS.find((item) => item.value === normalized)?.label || status || '-';
}

export function ativoStatusTone(status) {
  const normalized = normalizeAtivoStatus(status);
  return ATIVO_STATUS.find((item) => item.value === normalized)?.tone || 'cyan';
}

export function podeGerenciarAtivo(perfil) {
  return ['supervisor', 'gerencia', 'diretoria', 'administrador'].includes(perfil);
}

function normalizeText(value) {
  return String(value || '').trim();
}

function assertValidStatus(status) {
  const normalized = normalizeAtivoStatus(status);
  if (!ATIVO_STATUS_VALUES.includes(normalized)) throw new Error('Status operacional inválido.');
  return normalized;
}

export async function listarAtivos(filters = {}) {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 30;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('ativos')
    .select(ATIVO_SELECT, { count: 'exact' })
    .is('deleted_at', null)
    .eq('ativo', true)
    .order('nome_operacional', { ascending: true });

  if (filters.ebapId) query = query.eq('ebap_id', filters.ebapId);
  if (filters.status) {
    const status = assertValidStatus(filters.status);
    const legacy = status === 'atencao' ? ['atencao', 'operando_restricao'] : status === 'parado' ? ['parado', 'fora_operacao'] : [status];
    query = query.in('status_operacional', legacy);
  }
  if (filters.tipo) query = query.eq('tipo', filters.tipo);
  if (filters.area) query = query.eq('area_responsavel', filters.area);
  if (filters.search) {
    const value = `%${filters.search}%`;
    query = query.or(`nome_operacional.ilike.${value},codigo.ilike.${value},tipo.ilike.${value},fabricante.ilike.${value},modelo.ilike.${value},numero_serie.ilike.${value}`);
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw new Error(error.message);
  return { data: data || [], count: count || 0, page, pageSize };
}

export async function listarAtivosPorEbap(ebapId) {
  if (!ebapId) return [];
  const { data, error } = await supabase
    .from('ativos')
    .select(ATIVO_SELECT)
    .eq('ebap_id', ebapId)
    .eq('ativo', true)
    .is('deleted_at', null)
    .order('nome_operacional', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function obterAtivo(id) {
  if (!id) return null;
  const { data, error } = await supabase
    .from('ativos')
    .select(ATIVO_SELECT)
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data || null;
}

export async function obterDashboardAtivos() {
  const { data, error } = await supabase
    .from('ativos')
    .select('id,status_operacional,ebap_id,area_responsavel,tipo')
    .eq('ativo', true)
    .is('deleted_at', null);

  if (error) throw new Error(error.message);
  const rows = data || [];
  const byStatus = Object.fromEntries(ATIVO_STATUS.map((status) => [status.value, 0]));
  rows.forEach((row) => {
    const status = normalizeAtivoStatus(row.status_operacional);
    byStatus[status] = (byStatus[status] || 0) + 1;
  });

  return {
    total: rows.length,
    byStatus,
    operando: byStatus.operando || 0,
    atencao: byStatus.atencao || 0,
    parado: byStatus.parado || 0,
    manutencao: byStatus.em_manutencao || 0
  };
}

export async function criarAtivo(payload, user) {
  const nome = normalizeText(payload.nome_operacional);
  if (nome.length < 3) throw new Error('Informe o nome operacional do ativo.');
  if (!payload.tipo) throw new Error('Informe o tipo do ativo.');
  if (!payload.ebap_id) throw new Error('Selecione a EBAP do ativo.');
  if (!payload.area_responsavel) throw new Error('Informe a área responsável.');

  const row = {
    codigo: payload.codigo || null,
    nome_operacional: nome,
    tipo: payload.tipo,
    ebap_id: payload.ebap_id,
    area_responsavel: payload.area_responsavel,
    status_operacional: assertValidStatus(payload.status_operacional || 'operando'),
    fabricante: normalizeText(payload.fabricante) || null,
    modelo: normalizeText(payload.modelo) || null,
    numero_serie: normalizeText(payload.numero_serie) || null,
    instalado_em: payload.instalado_em || null,
    observacoes: normalizeText(payload.observacoes) || null,
    metadata: { criado_por: user?.id || null },
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase.from('ativos').insert(row).select(ATIVO_SELECT).single();
  if (error) throw new Error(error.message);

  const { error: histError } = await supabase.from('ativo_status_historico').insert({
    ativo_id: data.id,
    status_anterior: null,
    status_novo: data.status_operacional,
    motivo: 'Ativo cadastrado no módulo operacional.',
    usuario_id: user?.id || null,
    metadata: { origem: 'cadastro_ativo' }
  });
  if (histError) throw new Error(histError.message);

  return data;
}

export async function atualizarAtivo(id, payload) {
  const row = {
    nome_operacional: normalizeText(payload.nome_operacional),
    tipo: payload.tipo,
    ebap_id: payload.ebap_id || null,
    area_responsavel: payload.area_responsavel || null,
    fabricante: normalizeText(payload.fabricante) || null,
    modelo: normalizeText(payload.modelo) || null,
    numero_serie: normalizeText(payload.numero_serie) || null,
    instalado_em: payload.instalado_em || null,
    observacoes: normalizeText(payload.observacoes) || null,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase.from('ativos').update(row).eq('id', id).select(ATIVO_SELECT).single();
  if (error) throw new Error(error.message);
  return data;
}

export async function alterarStatusAtivo(id, payload, user) {
  if (!podeGerenciarAtivo(user?.perfil)) throw new Error('Perfil sem permissão para alterar status do ativo.');
  const motivo = normalizeText(payload.motivo);
  if (!motivo) throw new Error('Informe o motivo da alteração de status.');

  const { data: atual, error: atualError } = await supabase
    .from('ativos')
    .select('id,status_operacional')
    .eq('id', id)
    .single();
  if (atualError) throw new Error(atualError.message);

  const novoStatus = assertValidStatus(payload.status_operacional);
  const statusAnterior = normalizeAtivoStatus(atual.status_operacional);

  const { data, error } = await supabase
    .from('ativos')
    .update({ status_operacional: novoStatus, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(ATIVO_SELECT)
    .single();
  if (error) throw new Error(error.message);

  const { error: histError } = await supabase.from('ativo_status_historico').insert({
    ativo_id: id,
    os_id: payload.os_id || null,
    status_anterior: statusAnterior,
    status_novo: novoStatus,
    motivo,
    usuario_id: user?.id || null,
    metadata: payload.metadata || {}
  });
  if (histError) throw new Error(histError.message);

  return data;
}

export async function listarHistoricoAtivo(ativoId) {
  if (!ativoId) return { status: [], os: [], relatorios: [] };

  const [statusRes, osRes, relatoriosRes] = await Promise.all([
    supabase
      .from('ativo_status_historico')
      .select('*, usuario:usuarios(id,nome,usuario), os:ordens_servico(id,numero,titulo,status)')
      .eq('ativo_id', ativoId)
      .order('created_at', { ascending: false }),
    supabase
      .from('ordens_servico')
      .select('id,numero,titulo,status,tipo_manutencao,prioridade,created_at,updated_at')
      .eq('ativo_id', ativoId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('respostas_relatorio')
      .select('id,status,tipo_manutencao,ativo_nome,created_at,updated_at, modelo:modelos_relatorio(titulo,codigo)')
      .eq('ativo_id', ativoId)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .limit(20)
  ]);

  if (statusRes.error) throw new Error(statusRes.error.message);
  if (osRes.error) throw new Error(osRes.error.message);
  if (relatoriosRes.error) throw new Error(relatoriosRes.error.message);

  return {
    status: statusRes.data || [],
    os: osRes.data || [],
    relatorios: relatoriosRes.data || []
  };
}
