import { supabase } from '../lib/supabase.js';

export const NOTIFICACAO_MODULOS = [
  { value: 'os', label: 'OS' },
  { value: 'ro', label: 'RDO' },
  { value: 'cco', label: 'CCO' },
  { value: 'sst', label: 'SST' },
  { value: 'almoxarifado', label: 'Almoxarifado' },
  { value: 'compras', label: 'Compras' },
  { value: 'manutencao', label: 'Manutencao' }
];

export const NOTIFICACAO_PRIORIDADES = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'normal', label: 'Normal' },
  { value: 'alta', label: 'Alta' },
  { value: 'critica', label: 'Critica' }
];

export const NOTIFICACAO_TIPOS = [
  { value: 'info', label: 'Info' },
  { value: 'sucesso', label: 'Sucesso' },
  { value: 'alerta', label: 'Alerta' },
  { value: 'erro', label: 'Erro' }
];

function normalizeDateStart(value) {
  return value ? `${value}T00:00:00` : null;
}

function normalizeDateEnd(value) {
  return value ? `${value}T23:59:59` : null;
}

export function inferirModulo(notificacao) {
  if (notificacao.modulo) return notificacao.modulo;

  const entidade = String(notificacao.entidade_tipo || '').toLowerCase();
  if (entidade.includes('ordem') || entidade.includes('os')) return 'os';
  if (entidade.includes('relatorio')) return 'ro';
  if (entidade.includes('cco') || notificacao.titulo?.toLowerCase().includes('cco')) return 'cco';
  if (entidade.includes('sst')) return 'sst';
  if (entidade.includes('almox')) return 'almoxarifado';
  if (entidade.includes('compra')) return 'compras';
  if (entidade.includes('manut')) return 'manutencao';
  return 'geral';
}

export function inferirPrioridade(notificacao) {
  if (notificacao.prioridade) return notificacao.prioridade;
  if (notificacao.tipo === 'erro') return 'critica';
  if (notificacao.tipo === 'alerta') return 'alta';
  return 'normal';
}

function applyVisibility(query, user) {
  if (!user?.id) return query.eq('id', '00000000-0000-0000-0000-000000000000');
  if (user.perfil === 'diretoria') return query;

  return query.or(`usuario_id.eq.${user.id},perfil_destino.eq.${user.perfil}`);
}

export async function listarNotificacoes(filters = {}, user) {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('notificacoes')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  query = applyVisibility(query, user);

  if (filters.modulo) query = query.eq('modulo', filters.modulo);
  if (filters.prioridade) query = query.eq('prioridade', filters.prioridade);
  if (filters.tipo) query = query.eq('tipo', filters.tipo);
  if (filters.status === 'lidas') query = query.not('lida_em', 'is', null);
  if (filters.status === 'nao_lidas') query = query.is('lida_em', null);
  if (filters.dataInicio) query = query.gte('created_at', normalizeDateStart(filters.dataInicio));
  if (filters.dataFim) query = query.lte('created_at', normalizeDateEnd(filters.dataFim));

  const { data, error, count } = await query;
  if (error) throw error;

  const normalized = (data || []).map((item) => ({
    ...item,
    modulo: inferirModulo(item),
    prioridade: inferirPrioridade(item)
  }));

  return { data: normalized, count: count || 0 };
}

export async function contarNotificacoesNaoLidas(user) {
  let query = supabase
    .from('notificacoes')
    .select('id', { count: 'exact', head: true })
    .is('lida_em', null);

  query = applyVisibility(query, user);

  const { error, count } = await query;
  if (error) throw error;
  return count || 0;
}

export async function listarUltimasNotificacoes(user, limit = 8) {
  let query = supabase
    .from('notificacoes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  query = applyVisibility(query, user);

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((item) => ({
    ...item,
    modulo: inferirModulo(item),
    prioridade: inferirPrioridade(item)
  }));
}

export async function marcarNotificacaoLida(id, user) {
  if (!user?.id) throw new Error('Usuario nao autenticado.');

  const { data, error } = await supabase.rpc('marcar_notificacao_lida', {
    p_user_id: user.id,
    p_notificacao_id: id
  });

  if (error) throw error;
  return data;
}

export async function marcarTodasNotificacoesLidas(user) {
  if (!user?.id) throw new Error('Usuario nao autenticado.');

  const { data, error } = await supabase.rpc('marcar_todas_notificacoes_lidas', {
    p_user_id: user.id
  });

  if (error) throw error;
  return data || 0;
}

export function subscribeNotificacoes(user, callback) {
  if (!user?.id) return () => {};

  const channel = supabase
    .channel(`notificacoes-${user.id}-${user.perfil}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notificacoes' }, (payload) => {
      const row = payload.new || payload.old;
      if (!row) return;
      const visible = user.perfil === 'diretoria' || row.usuario_id === user.id || row.perfil_destino === user.perfil;
      if (visible) callback(payload);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
