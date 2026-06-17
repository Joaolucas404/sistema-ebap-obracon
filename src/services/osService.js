import { supabase } from '../lib/supabase.js';

export const OS_STATUS = [
  { value: 'aberta', label: 'Aberta', tone: 'cyan' },
  { value: 'em_analise', label: 'Em análise', tone: 'orange' },
  { value: 'programada', label: 'Programada', tone: 'blue' },
  { value: 'em_execucao', label: 'Em execução', tone: 'orange' },
  { value: 'aguardando_material', label: 'Aguardando material', tone: 'orange' },
  { value: 'concluida', label: 'Concluída', tone: 'green' },
  { value: 'rejeitada', label: 'Rejeitada', tone: 'red' },
  { value: 'cancelada', label: 'Cancelada', tone: 'slate' }
];

export const OS_PRIORIDADES = [
  { value: 'baixa', label: 'Baixa', tone: 'green' },
  { value: 'media', label: 'Média', tone: 'cyan' },
  { value: 'alta', label: 'Alta', tone: 'orange' },
  { value: 'critica', label: 'Crítica', tone: 'red' }
];

const OS_SELECT = `
  *,
  ebap:ebaps(id,nome,nome_curto,status),
  equipamento:equipamentos(id,nome,tag,codigo,status_operacional),
  solicitante:usuarios!ordens_servico_solicitante_id_fkey(id,nome,usuario,perfil,setor),
  responsavel:usuarios!ordens_servico_responsavel_id_fkey(id,nome,usuario,perfil,setor)
`;

export function statusLabel(status) {
  return OS_STATUS.find((item) => item.value === status)?.label || status || '-';
}

export function statusTone(status) {
  return OS_STATUS.find((item) => item.value === status)?.tone || 'cyan';
}

export function prioridadeLabel(prioridade) {
  return OS_PRIORIDADES.find((item) => item.value === prioridade)?.label || prioridade || '-';
}

export function prioridadeTone(prioridade) {
  return OS_PRIORIDADES.find((item) => item.value === prioridade)?.tone || 'cyan';
}

export function podeCriarOS(perfil) {
  return ['prefeitura', 'supervisor', 'gerencia', 'diretoria'].includes(perfil);
}

export function podeEditarOS(perfil, os) {
  if (!os || ['concluida', 'cancelada', 'rejeitada', 'arquivada', 'finalizada'].includes(os.status)) return false;
  return ['supervisor', 'gerencia', 'diretoria', 'prefeitura'].includes(perfil);
}

export function podeAtribuirOS(perfil) {
  return ['supervisor', 'gerencia', 'diretoria'].includes(perfil);
}

export function podeExecutarOS(perfil, os, userId) {
  if (!os || ['concluida', 'cancelada', 'rejeitada'].includes(os.status)) return false;
  return ['tecnico', 'supervisor', 'gerencia', 'diretoria'].includes(perfil) && (!userId || !os.responsavel_id || os.responsavel_id === userId || perfil !== 'tecnico');
}

export function podeEncerrarOS(perfil) {
  return ['supervisor', 'gerencia', 'diretoria'].includes(perfil);
}

function applyRoleScope(query, perfil, userId) {
  if (['gerencia', 'diretoria', 'supervisor'].includes(perfil)) return query;
  if (perfil === 'prefeitura') return query.eq('solicitante_id', userId);
  if (perfil === 'tecnico') return query.eq('responsavel_id', userId);
  return query.or(`solicitante_id.eq.${userId},responsavel_id.eq.${userId}`);
}

export async function listarOS({ page = 1, pageSize = 10, search = '', status = '', prioridade = '', ebapId = '', responsavelId = '', perfil, userId } = {}) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  let query = supabase
    .from('ordens_servico')
    .select(OS_SELECT, { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  query = applyRoleScope(query, perfil, userId);

  if (search) {
    const value = `%${search}%`;
    query = query.or(`numero.ilike.${value},titulo.ilike.${value},descricao.ilike.${value},area.ilike.${value}`);
  }

  if (status) query = query.eq('status', status);
  if (prioridade) query = query.eq('prioridade', prioridade);
  if (ebapId) query = query.eq('ebap_id', ebapId);
  if (responsavelId) query = query.eq('responsavel_id', responsavelId);

  const { data, error, count } = await query.range(from, to);

  if (error) throw new Error(error.message);

  return { data: data || [], count: count || 0, page, pageSize };
}

export async function buscarOS(id) {
  const { data, error } = await supabase.from('ordens_servico').select(OS_SELECT).eq('id', id).single();
  if (error) throw new Error(error.message);
  return data;
}

export async function listarEbaps() {
  const { data, error } = await supabase.from('ebaps').select('id,codigo,nome,nome_curto,status').is('deleted_at', null).order('nome');
  if (error) throw new Error(error.message);
  return data || [];
}

export async function listarEquipamentosPorEbap(ebapId) {
  if (!ebapId) return [];
  const { data, error } = await supabase
    .from('equipamentos')
    .select('id,nome,tag,codigo,status_operacional,criticidade')
    .eq('ebap_id', ebapId)
    .is('deleted_at', null)
    .order('nome');
  if (error) throw new Error(error.message);
  return data || [];
}

export async function listarResponsaveis() {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id,nome,usuario,perfil,setor,ativo')
    .in('perfil', ['tecnico', 'supervisor'])
    .eq('ativo', true)
    .is('deleted_at', null)
    .order('nome');
  if (error) throw new Error(error.message);
  return data || [];
}

export async function criarOS(payload, user) {
  const numero = payload.numero || gerarNumeroOS();
  const insertPayload = {
    numero,
    origem: payload.origem || (user?.perfil === 'prefeitura' ? 'prefeitura' : 'operacao'),
    ebap_id: payload.ebap_id || null,
    equipamento_id: payload.equipamento_id || null,
    solicitante_id: payload.solicitante_id || user?.id || null,
    responsavel_id: payload.responsavel_id || null,
    titulo: payload.titulo,
    descricao: payload.descricao,
    area: payload.area || null,
    prioridade: payload.prioridade || 'media',
    status: payload.status || 'aberta',
    data_programada: payload.data_programada || null,
    hora_programada: payload.hora_programada || null,
    turno: payload.turno || null,
    created_by: user?.id || null,
    payload: payload.payload || {}
  };

  const { data, error } = await supabase.from('ordens_servico').insert(insertPayload).select(OS_SELECT).single();
  if (error) throw new Error(error.message);

  await registrarHistoricoOS(data.id, {
    usuario_id: user?.id,
    acao: 'criada',
    status_novo: data.status,
    descricao: 'OS criada no sistema.'
  });

  return data;
}

export async function atualizarOS(id, payload, user) {
  const atual = await buscarOS(id);
  const updatePayload = {
    ebap_id: payload.ebap_id || null,
    equipamento_id: payload.equipamento_id || null,
    responsavel_id: payload.responsavel_id || null,
    titulo: payload.titulo,
    descricao: payload.descricao,
    area: payload.area || null,
    prioridade: payload.prioridade || 'media',
    status: payload.status || atual.status,
    equipe_responsavel: payload.equipe_responsavel || null,
    data_programada: payload.data_programada || null,
    hora_programada: payload.hora_programada || null,
    turno: payload.turno || null,
    payload: { ...(atual.payload || {}), ...(payload.payload || {}) }
  };

  const { data, error } = await supabase.from('ordens_servico').update(updatePayload).eq('id', id).select(OS_SELECT).single();
  if (error) throw new Error(error.message);

  await registrarHistoricoOS(id, {
    usuario_id: user?.id,
    acao: 'atualizada',
    status_anterior: atual.status,
    status_novo: data.status,
    descricao: 'Dados da OS atualizados.',
    metadata: diffMetadata(atual, data)
  });

  return data;
}

export async function atribuirProgramarOS(id, payload, user) {
  const atual = await buscarOS(id);
  const updatePayload = {
    responsavel_id: payload.responsavel_id || null,
    equipe_responsavel: payload.equipe_responsavel || null,
    data_programada: payload.data_programada || null,
    hora_programada: payload.hora_programada || null,
    turno: payload.turno || null,
    status: 'programada'
  };

  const { data, error } = await supabase.from('ordens_servico').update(updatePayload).eq('id', id).select(OS_SELECT).single();
  if (error) throw new Error(error.message);

  await registrarHistoricoOS(id, {
    usuario_id: user?.id,
    acao: 'programada',
    status_anterior: atual.status,
    status_novo: 'programada',
    descricao: 'OS atribuída e programada para execução.',
    metadata: updatePayload
  });

  return data;
}

export async function registrarExecucaoOS(id, payload, user) {
  const atual = await buscarOS(id);
  const status = payload.concluir ? 'em_analise' : 'em_execucao';
  const updatePayload = {
    status,
    inicio_execucao: payload.inicio_execucao || atual.inicio_execucao || new Date().toISOString(),
    fim_execucao: payload.concluir ? payload.fim_execucao || new Date().toISOString() : atual.fim_execucao,
    relatorio_tecnico: payload.relatorio_tecnico || atual.relatorio_tecnico || null,
    materiais_utilizados: payload.materiais_utilizados || atual.materiais_utilizados || null,
    pendencias: payload.pendencias || atual.pendencias || null
  };

  const { data, error } = await supabase.from('ordens_servico').update(updatePayload).eq('id', id).select(OS_SELECT).single();
  if (error) throw new Error(error.message);

  await registrarHistoricoOS(id, {
    usuario_id: user?.id,
    acao: payload.concluir ? 'execucao_concluida' : 'execucao_registrada',
    status_anterior: atual.status,
    status_novo: status,
    descricao: payload.concluir ? 'Técnico concluiu a execução e enviou para análise do Supervisor.' : 'Execução técnica registrada.',
    metadata: updatePayload
  });

  return data;
}

export async function encerrarOS(id, payload, user) {
  const atual = await buscarOS(id);
  const status = payload.status || 'concluida';
  const updatePayload = {
    status,
    fim_execucao: payload.fim_execucao || atual.fim_execucao || new Date().toISOString(),
    pendencias: payload.pendencias ?? atual.pendencias,
    motivo_cancelamento: payload.motivo_cancelamento || null
  };

  const { data, error } = await supabase.from('ordens_servico').update(updatePayload).eq('id', id).select(OS_SELECT).single();
  if (error) throw new Error(error.message);

  await registrarHistoricoOS(id, {
    usuario_id: user?.id,
    acao: status === 'concluida' ? 'encerrada' : status,
    status_anterior: atual.status,
    status_novo: status,
    descricao: payload.descricao || 'Encerramento da OS aprovado.',
    metadata: updatePayload
  });

  return data;
}

export async function listarHistoricoOS(osId) {
  const { data, error } = await supabase
    .from('os_historico')
    .select('*, usuario:usuarios(id,nome,usuario,perfil)')
    .eq('os_id', osId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function registrarHistoricoOS(osId, payload) {
  const { error } = await supabase.from('os_historico').insert({
    os_id: osId,
    usuario_id: payload.usuario_id || null,
    acao: payload.acao,
    status_anterior: payload.status_anterior || null,
    status_novo: payload.status_novo || null,
    descricao: payload.descricao || null,
    metadata: payload.metadata || {}
  });
  if (error) throw new Error(error.message);
}

export async function listarComentariosOS(osId) {
  const { data, error } = await supabase
    .from('comentarios')
    .select('*, usuario:usuarios(id,nome,usuario,perfil)')
    .eq('entidade_tipo', 'ordem_servico')
    .eq('entidade_id', osId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function criarComentarioOS(osId, comentario, user, interno = false) {
  const { data, error } = await supabase
    .from('comentarios')
    .insert({
      entidade_tipo: 'ordem_servico',
      entidade_id: osId,
      usuario_id: user?.id || null,
      comentario,
      interno
    })
    .select('*, usuario:usuarios(id,nome,usuario,perfil)')
    .single();

  if (error) throw new Error(error.message);

  await registrarHistoricoOS(osId, {
    usuario_id: user?.id,
    acao: 'comentario',
    descricao: 'Comentário adicionado à OS.'
  });

  return data;
}

export async function listarAnexosOS(osId) {
  const { data, error } = await supabase
    .from('anexos')
    .select('*, uploaded_by_user:usuarios!anexos_uploaded_by_fkey(id,nome,usuario)')
    .eq('entidade_tipo', 'ordem_servico')
    .eq('entidade_id', osId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function uploadAnexoOS(osId, file, user, legenda = '') {
  if (!file) throw new Error('Selecione um arquivo.');

  const safeName = file.name.replace(/[^\w.-]+/g, '-');
  const path = `${osId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage.from('service-order-files').upload(path, file, {
    cacheControl: '3600',
    upsert: false
  });

  if (uploadError) throw new Error(uploadError.message);

  const { data, error } = await supabase
    .from('anexos')
    .insert({
      entidade_tipo: 'ordem_servico',
      entidade_id: osId,
      bucket: 'service-order-files',
      path,
      nome_original: file.name,
      mime_type: file.type || null,
      tamanho_bytes: file.size || null,
      legenda,
      categoria: 'foto_execucao',
      uploaded_by: user?.id || null
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await registrarHistoricoOS(osId, {
    usuario_id: user?.id,
    acao: 'anexo',
    descricao: `Anexo enviado: ${file.name}`
  });

  return data;
}

export async function obterUrlAssinadaAnexo(anexo, expiresIn = 3600) {
  const { data, error } = await supabase.storage.from(anexo.bucket).createSignedUrl(anexo.path, expiresIn);
  if (error) throw new Error(error.message);
  return data?.signedUrl || '';
}

export async function obterDashboardOS({ perfil, userId } = {}) {
  let query = supabase
    .from('ordens_servico')
    .select('id,status,prioridade,created_at,data_programada,solicitante_id,responsavel_id')
    .is('deleted_at', null);

  query = applyRoleScope(query, perfil, userId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rows = data || [];
  const byStatus = countBy(rows, 'status');
  const byPrioridade = countBy(rows, 'prioridade');
  const abertas = rows.filter((os) => !['concluida', 'cancelada', 'rejeitada', 'arquivada', 'finalizada'].includes(os.status)).length;
  const atrasadas = rows.filter((os) => os.data_programada && new Date(os.data_programada) < startOfToday() && !['concluida', 'cancelada', 'rejeitada'].includes(os.status)).length;

  return {
    total: rows.length,
    abertas,
    concluidas: byStatus.concluida || 0,
    atrasadas,
    byStatus,
    byPrioridade
  };
}

function gerarNumeroOS() {
  const now = new Date();
  const year = now.getFullYear();
  const suffix = String(now.getTime()).slice(-7);
  return `OS-${year}-${suffix}`;
}

function countBy(rows, key) {
  return rows.reduce((acc, row) => {
    const value = row[key] || 'nao_informado';
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function diffMetadata(before, after) {
  const keys = ['titulo', 'descricao', 'prioridade', 'status', 'responsavel_id', 'data_programada', 'hora_programada', 'turno'];
  return keys.reduce((acc, key) => {
    if (before?.[key] !== after?.[key]) acc[key] = { antes: before?.[key] || null, depois: after?.[key] || null };
    return acc;
  }, {});
}
