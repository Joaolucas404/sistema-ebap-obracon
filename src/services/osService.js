import { supabase } from '../lib/supabase.js';

export const OS_STATUS = [
  { value: 'pendente_cco', label: 'Pendente CCO', tone: 'orange', perfil: 'CCO' },
  { value: 'aprovada_cco', label: 'Aprovada pelo CCO', tone: 'green', perfil: 'CCO' },
  { value: 'rejeitada_cco', label: 'Rejeitada pelo CCO', tone: 'red', perfil: 'CCO' },
  { value: 'correcao_solicitada_cco', label: 'Correcao solicitada pelo CCO', tone: 'orange', perfil: 'CCO' },
  { value: 'solicitada_prefeitura', label: 'Solicitada pela Prefeitura', tone: 'blue', perfil: 'Prefeitura' },
  { value: 'aguardando_supervisor', label: 'Aguardando Supervisor', tone: 'green', perfil: 'Supervisor' },
  { value: 'analise_supervisor', label: 'Em Análise do Supervisor', tone: 'green', perfil: 'Supervisor' },
  { value: 'programada', label: 'Programada', tone: 'green', perfil: 'Supervisor' },
  { value: 'encaminhada_tecnicos', label: 'Encaminhada para Técnicos', tone: 'green', perfil: 'Supervisor' },
  { value: 'em_execucao', label: 'Em Execução', tone: 'cyan', perfil: 'Técnicos' },
  { value: 'pausada', label: 'Pausada', tone: 'orange', perfil: 'Técnicos' },
  { value: 'concluida_tecnicos', label: 'Concluída pelos Técnicos', tone: 'cyan', perfil: 'Técnicos' },
  { value: 'validacao_supervisor', label: 'Em Validação do Supervisor', tone: 'green', perfil: 'Supervisor' },
  { value: 'enviada_prefeitura', label: 'Enviada para Prefeitura', tone: 'green', perfil: 'Supervisor' },
  { value: 'aguardando_validacao_prefeitura', label: 'Aguardando Validação da Prefeitura', tone: 'blue', perfil: 'Prefeitura' },
  { value: 'nao_conforme', label: 'Não Conforme - Retorno da Prefeitura', tone: 'red', perfil: 'Prefeitura' },
  { value: 'concluida_arquivada', label: 'Concluída / Arquivada', tone: 'green', perfil: 'Sistema' }
];

export const OS_WORKFLOW = OS_STATUS.map((item, index) => ({ ...item, ordem: index + 1 }));
export const OS_FINAL_STATUSES = ['concluida_arquivada', 'concluida', 'cancelada', 'rejeitada', 'rejeitada_cco', 'arquivada', 'finalizada'];

export const OS_PRIORIDADES = [
  { value: 'baixa', label: 'Baixa', tone: 'green' },
  { value: 'media', label: 'Média', tone: 'cyan' },
  { value: 'alta', label: 'Alta', tone: 'orange' },
  { value: 'critica', label: 'Crítica', tone: 'red' }
];

export const OS_AREAS = [
  { value: 'mecanica', label: 'Mecânica' },
  { value: 'eletrica', label: 'Elétrica' },
  { value: 'automacao', label: 'Automação' },
  { value: 'operacional', label: 'Operação' },
  { value: 'limpeza', label: 'Limpeza' },
  { value: 'civil', label: 'Civil / Estrutural' },
  { value: 'sst', label: 'SST' },
  { value: 'administrativo', label: 'Administrativo' },
  { value: 'outros', label: 'Outros' }
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

export function areaLabel(area) {
  return OS_AREAS.find((item) => item.value === area)?.label || area || '-';
}

export function podeCriarOS(perfil) {
  return ['prefeitura', 'supervisor', 'diretoria'].includes(perfil);
}

export function podeEditarOS(perfil, os) {
  if (!os || OS_FINAL_STATUSES.includes(os.status)) return false;
  return ['supervisor', 'prefeitura'].includes(perfil);
}

export function podeAtribuirOS(perfil) {
  return ['supervisor'].includes(perfil);
}

export function podeExecutarOS(perfil, os, userId) {
  if (!os || OS_FINAL_STATUSES.includes(os.status)) return false;
  return ['tecnico', 'supervisor'].includes(perfil) && (!userId || !os.responsavel_id || os.responsavel_id === userId || perfil !== 'tecnico');
}

export function podeEncerrarOS(perfil) {
  return false;
}

export function podeExcluirOS(perfil) {
  return perfil === 'diretoria';
}

export function getWorkflowActions(perfil, os) {
  if (!perfil || !os || OS_FINAL_STATUSES.includes(os.status)) return [];

  const actions = {
    prefeitura: [
      action(['aguardando_validacao_prefeitura', 'enviada_prefeitura'], 'concluida_arquivada', 'Aprovar e arquivar', 'Prefeitura aprovou a OS. Processo concluído e arquivado.', 'approve'),
      action(['aguardando_validacao_prefeitura', 'enviada_prefeitura'], 'nao_conforme', 'Reprovar OS', 'Prefeitura reprovou a OS e registrou não conformidade.', 'reject', true)
    ],
    supervisor: [
      action(['solicitada_prefeitura', 'aguardando_supervisor', 'aprovada_cco'], 'analise_supervisor', 'Iniciar análise', 'Supervisor abriu a OS e iniciou a análise.', 'review'),
      action(['programada'], 'encaminhada_tecnicos', 'Encaminhar técnicos', 'OS encaminhada para execução técnica.', 'assign'),
      action(['concluida_tecnicos'], 'validacao_supervisor', 'Validar execução', 'Supervisor iniciou a validação da execução técnica.', 'validate'),
      action(['validacao_supervisor'], 'aguardando_validacao_prefeitura', 'Enviar Prefeitura', 'Supervisor aprovou a execução e enviou para validação da Prefeitura.', 'send'),
      action(['validacao_supervisor', 'concluida_tecnicos'], 'encaminhada_tecnicos', 'Devolver técnicos', 'Supervisor devolveu a OS para ajuste técnico.', 'return', true),
      action(['nao_conforme'], 'analise_supervisor', 'Reanalisar NC', 'Supervisor reabriu a OS para tratar a não conformidade.', 'review')
    ],
    tecnico: [
      action(['encaminhada_tecnicos'], 'em_execucao', 'Iniciar execução', 'Técnico iniciou o atendimento da OS.', 'start'),
      action(['em_execucao'], 'concluida_tecnicos', 'Finalizar execução', 'Técnico finalizou a execução e devolveu para validação do Supervisor.', 'finish')
    ]
  };

  return (actions[perfil] || []).filter((item) => item.from.includes(os.status));
}

function action(from, to, label, descricao, acao, requiresMotivo = false) {
  return { from, to, label, descricao, acao, requiresMotivo };
}

function applyRoleScope(query, perfil, userId, areaSupervisao = '') {
  if (['gerencia', 'diretoria'].includes(perfil)) return query;
  if (perfil === 'supervisor') return areaSupervisao ? query.eq('area', areaSupervisao) : query;
  if (perfil === 'prefeitura') return query.eq('solicitante_id', userId);
  if (perfil === 'tecnico') return query.or(`responsavel_id.eq.${userId},status.eq.encaminhada_tecnicos`);
  return query.or(`solicitante_id.eq.${userId},responsavel_id.eq.${userId}`);
}

export async function listarOS({ page = 1, pageSize = 10, search = '', status = '', prioridade = '', ebapId = '', responsavelId = '', perfil, userId, areaSupervisao = '' } = {}) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  let query = supabase
    .from('ordens_servico')
    .select(OS_SELECT, { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  query = applyRoleScope(query, perfil, userId, areaSupervisao);

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
    .select('id,nome,usuario,perfil,setor,area_operacional,ativo')
    .in('perfil', ['tecnico', 'supervisor'])
    .eq('ativo', true)
    .is('deleted_at', null)
    .order('nome');
  if (error) throw new Error(error.message);
  return data || [];
}

export async function criarOS(payload, user) {
  const equipamentoFalha = String(payload.equipamento_falha || '').trim();
  if (equipamentoFalha.length < 3 || equipamentoFalha.length > 150) {
    throw new Error('Informe o equipamento com falha com 3 a 150 caracteres.');
  }

  if (!OS_AREAS.some((area) => area.value === payload.area)) {
    throw new Error('Selecione a área de atuação da OS.');
  }

  const numero = payload.numero || gerarNumeroOS();
  const origem = payload.origem || (user?.perfil === 'prefeitura' ? 'prefeitura' : 'operacao');
  const supervisorArea = await buscarSupervisorPorArea(payload.area);
  const now = new Date().toISOString();
  const insertPayload = {
    numero,
    origem,
    ebap_id: payload.ebap_id || null,
    equipamento_id: null,
    solicitante_id: payload.solicitante_id || user?.id || null,
    responsavel_id: payload.responsavel_id || null,
    titulo: payload.titulo,
    descricao: payload.descricao,
    area: payload.area,
    prioridade: payload.prioridade || 'media',
    status: payload.status || (origem === 'operacao' ? 'pendente_cco' : 'solicitada_prefeitura'),
    supervisor_responsavel: supervisorArea?.supervisor_id || null,
    status_supervisor: 'aguardando_supervisor',
    equipe: payload.equipe || payload.equipe_responsavel || null,
    tecnico_responsavel: payload.tecnico_responsavel || payload.responsavel_id || null,
    data_programada: payload.data_programada || null,
    hora_programada: payload.hora_programada || null,
    turno: payload.turno || null,
    historico_roteamento: [
      {
        acao: 'roteamento_inicial',
        area_anterior: null,
        area_nova: payload.area,
        supervisor_anterior: null,
        supervisor_novo: supervisorArea?.supervisor_id || null,
        justificativa: 'Roteamento automático por área da OS.',
        usuario_id: user?.id || null,
        data: now
      }
    ],
    created_by: user?.id || null,
    payload: {
      ...(payload.payload || {}),
      equipamento_falha: equipamentoFalha,
      roteamento_base: 'area'
    }
  };

  const { data, error } = await supabase.from('ordens_servico').insert(insertPayload).select('*').single();
  if (error) throwSupabaseError(error);

  await registrarHistoricoOS(data.id, {
    usuario_id: user?.id,
    acao: 'criada',
    status_novo: data.status,
    descricao: 'Prefeitura registrou a solicitação da OS no sistema.',
    metadata: { etapa: data.status }
  });

  await criarNotificacaoOS(data, {
    titulo: 'Nova OS da Prefeitura',
    mensagem: `${data.numero} foi aberta e aguarda análise do Supervisor.`,
    usuario_id: supervisorArea?.supervisor_id || null,
    perfil_destino: supervisorArea?.supervisor_id ? null : 'supervisor',
    tipo: 'alerta'
  });

  if (origem === 'operacao') {
    await criarNotificacaoOS(data, {
      titulo: 'Nova OS aguardando CCO',
      mensagem: `${data.numero} foi aberta pela operacao e aguarda validacao CCO.`,
      perfil_destino: 'cco',
      tipo: 'alerta'
    });
  }

  await criarNotificacaoOSAbertura(data, user, origem);

  return buscarOS(data.id);
}

async function buscarSupervisorPorArea(area) {
  if (!area) return null;
  const { data: supervisor, error: supervisorError } = await supabase
    .from('usuarios')
    .select('id,nome,usuario,perfil,area_operacional')
    .eq('perfil', 'supervisor')
    .eq('area_operacional', area)
    .eq('ativo', true)
    .is('deleted_at', null)
    .order('nome')
    .limit(1)
    .maybeSingle();

  if (supervisorError) throwSupabaseError(supervisorError);
  if (supervisor) return { area, supervisor_id: supervisor.id, supervisor };

  const { data, error } = await supabase
    .from('supervisor_areas')
    .select('area,nome,supervisor_id')
    .eq('area', area)
    .eq('ativo', true)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) throwSupabaseError(error);
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
    metadata: { ...updatePayload, etapa: 'programada' }
  });

  await criarNotificacaoOS(data, {
    titulo: 'OS programada',
    mensagem: `${data.numero} foi programada e está pronta para encaminhamento aos técnicos.`,
    perfil_destino: 'supervisor',
    tipo: 'info'
  });

  return data;
}

export async function registrarExecucaoOS(id, payload, user) {
  const atual = await buscarOS(id);
  const status = payload.concluir ? 'concluida_tecnicos' : 'em_execucao';
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
    descricao: payload.concluir ? 'Técnico concluiu a execução e enviou para validação do Supervisor.' : 'Execução técnica registrada.',
    metadata: { ...updatePayload, etapa: status }
  });

  if (payload.concluir) {
    await criarNotificacaoOS(data, {
      titulo: 'Execução técnica concluída',
      mensagem: `${data.numero} foi finalizada pelos técnicos e aguarda validação.`,
      perfil_destino: 'supervisor',
      tipo: 'alerta'
    });
  }

  return data;
}

export async function encerrarOS(id, payload, user) {
  const atual = await buscarOS(id);
  const status = payload.status === 'concluida' ? 'concluida_arquivada' : payload.status || 'concluida_arquivada';
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
    acao: status === 'concluida_arquivada' ? 'encerrada' : status,
    status_anterior: atual.status,
    status_novo: status,
    descricao: payload.descricao || 'Encerramento da OS aprovado.',
    metadata: { ...updatePayload, etapa: status }
  });

  return data;
}

export async function excluirOS(id, user) {
  if (!podeExcluirOS(user?.perfil)) {
    throw new Error('Apenas Diretoria pode excluir OS.');
  }

  const { error } = await supabase.rpc('soft_delete_os_diretoria', {
    p_os_id: id,
    p_usuario_id: user?.id || null
  });
  if (error) throwSupabaseError(error);
}

export async function movimentarOS(id, payload, user) {
  const atual = await buscarOS(id);
  const available = getWorkflowActions(user?.perfil, atual);
  const selected = available.find((item) => item.to === payload.status);

  if (!selected) {
    throw new Error('Movimentação não permitida para o perfil ou status atual da OS.');
  }

  if (selected.requiresMotivo && !String(payload.motivo || '').trim()) {
    throw new Error('Informe o motivo para a devolução ou não conformidade.');
  }

  const now = new Date().toISOString();
  const updatePayload = {
    status: selected.to,
    payload: {
      ...(atual.payload || {}),
      workflow: {
        ...((atual.payload || {}).workflow || {}),
        ultima_acao: selected.acao,
        ultima_etapa: selected.to,
        ultimo_usuario_id: user?.id || null,
        movimentado_em: now,
        motivo: payload.motivo || null
      }
    }
  };

  if (selected.to === 'em_execucao') updatePayload.inicio_execucao = atual.inicio_execucao || now;
  if (selected.to === 'em_execucao' && user?.perfil === 'tecnico' && !atual.responsavel_id) updatePayload.responsavel_id = user.id;
  if (selected.to === 'concluida_tecnicos' || selected.to === 'concluida_arquivada') updatePayload.fim_execucao = atual.fim_execucao || now;
  if (selected.to === 'nao_conforme') updatePayload.motivo_cancelamento = payload.motivo;

  const { data, error } = await supabase.from('ordens_servico').update(updatePayload).eq('id', id).select(OS_SELECT).single();
  if (error) throw new Error(error.message);

  await registrarHistoricoOS(id, {
    usuario_id: user?.id,
    acao: selected.acao,
    status_anterior: atual.status,
    status_novo: selected.to,
    descricao: payload.comentario || selected.descricao,
    metadata: {
      etapa: selected.to,
      motivo: payload.motivo || null,
      comentario: payload.comentario || null
    }
  });

  if (payload.comentario) {
    await criarComentarioOS(id, `[${statusLabel(selected.to)}] ${payload.comentario}`, user, false, selected.to);
  }

  await notificarMovimentacaoOS(data, selected, user, payload.motivo);
  return data;
}

export async function listarHistoricoOS(osId) {
  const { data, error } = await supabase
    .from('os_historico')
    .select('*, usuario:usuarios!os_historico_usuario_id_fkey(id,nome,usuario,perfil)')
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
    .select('*, usuario:usuarios!comentarios_usuario_id_fkey(id,nome,usuario,perfil)')
    .eq('entidade_tipo', 'ordem_servico')
    .eq('entidade_id', osId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function criarComentarioOS(osId, comentario, user, interno = false, etapa = null) {
  const { data, error } = await supabase
    .from('comentarios')
    .insert({
      entidade_tipo: 'ordem_servico',
      entidade_id: osId,
      usuario_id: user?.id || null,
      comentario,
      interno
    })
    .select('*, usuario:usuarios!comentarios_usuario_id_fkey(id,nome,usuario,perfil)')
    .single();

  if (error) throw new Error(error.message);

  await registrarHistoricoOS(osId, {
    usuario_id: user?.id,
    acao: 'comentario',
    status_novo: etapa,
    descricao: etapa ? `Comentário adicionado na etapa ${statusLabel(etapa)}.` : 'Comentário adicionado à OS.',
    metadata: etapa ? { etapa } : {}
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

export async function obterDashboardOS({ perfil, userId, areaSupervisao = '' } = {}) {
  let query = supabase
    .from('ordens_servico')
    .select('id,status,prioridade,created_at,data_programada,solicitante_id,responsavel_id')
    .is('deleted_at', null);

  query = applyRoleScope(query, perfil, userId, areaSupervisao);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rows = data || [];
  const byStatus = countBy(rows, 'status');
  const byPrioridade = countBy(rows, 'prioridade');
  const abertas = rows.filter((os) => !OS_FINAL_STATUSES.includes(os.status)).length;
  const atrasadas = rows.filter((os) => os.data_programada && new Date(os.data_programada) < startOfToday() && !OS_FINAL_STATUSES.includes(os.status)).length;

  return {
    total: rows.length,
    abertas,
    concluidas: byStatus.concluida_arquivada || byStatus.concluida || 0,
    atrasadas,
    byStatus,
    byPrioridade
  };
}

async function notificarMovimentacaoOS(os, actionConfig, user, motivo = '') {
  const map = {
    analise_supervisor: { perfil_destino: 'supervisor', titulo: 'OS em análise' },
    programada: { perfil_destino: 'supervisor', titulo: 'OS programada' },
    encaminhada_tecnicos: { usuario_id: os.responsavel_id || null, perfil_destino: os.responsavel_id ? null : 'tecnico', titulo: 'OS encaminhada para execução' },
    em_execucao: { perfil_destino: 'supervisor', titulo: 'Execução iniciada' },
    concluida_tecnicos: { perfil_destino: 'supervisor', titulo: 'Execução técnica concluída' },
    validacao_supervisor: { perfil_destino: 'supervisor', titulo: 'OS em validação' },
    aguardando_validacao_prefeitura: { usuario_id: os.solicitante_id || null, perfil_destino: os.solicitante_id ? null : 'prefeitura', titulo: 'OS enviada para validação' },
    nao_conforme: { perfil_destino: 'supervisor', titulo: 'OS não conforme' },
    concluida_arquivada: { perfil_destino: 'supervisor', titulo: 'OS concluída e arquivada' }
  };

  const target = map[actionConfig.to];
  if (!target) return;

  await criarNotificacaoOS(os, {
    ...target,
    mensagem: `${os.numero} - ${statusLabel(actionConfig.to)}.${motivo ? ` Motivo: ${motivo}` : ''}`,
    tipo: actionConfig.requiresMotivo || actionConfig.to === 'nao_conforme' ? 'alerta' : 'info',
    created_by: user?.id || null
  });
}

async function criarNotificacaoOS(os, payload) {
  const { error } = await supabase.from('notificacoes').insert({
    usuario_id: payload.usuario_id || null,
    perfil_destino: payload.perfil_destino || null,
    titulo: payload.titulo,
    mensagem: payload.mensagem,
    tipo: payload.tipo || 'info',
    entidade_tipo: 'ordem_servico',
    entidade_id: os.id,
    modulo: 'os',
    prioridade: os.prioridade === 'critica' ? 'critica' : os.prioridade === 'alta' ? 'alta' : 'normal',
    acao_url: `/os/${os.id}`
  });

  if (error) throwSupabaseError(error);
}

async function criarNotificacaoOSAbertura(os, user, origem) {
  const { data: usuarios, error: usuariosError } = await supabase
    .from('usuarios')
    .select('id')
    .eq('ativo', true)
    .is('deleted_at', null);

  if (usuariosError) throwSupabaseError(usuariosError);
  if (!usuarios?.length) return;

  const prioridade = os.prioridade === 'critica' ? 'critica' : os.prioridade === 'alta' ? 'alta' : 'normal';
  const notificacoes = usuarios.map((usuario) => ({
    usuario_id: usuario.id,
    perfil_destino: null,
    titulo: origem === 'operacao' ? 'Nova OS aberta pela operacao' : 'Nova OS aberta',
    mensagem: `${os.numero} - ${os.titulo || 'Ordem de Servico'} foi aberta por ${user?.nome || 'usuario do sistema'} e esta em ${statusLabel(os.status)}.`,
    tipo: os.prioridade === 'critica' ? 'alerta' : 'info',
    entidade_tipo: 'ordem_servico',
    entidade_id: os.id,
    modulo: 'os',
    prioridade,
    acao_url: `/os/${os.id}`,
    metadata: {
      broadcast: true,
      origem,
      status: os.status,
      prioridade: os.prioridade,
      solicitante_id: os.solicitante_id || null,
      created_by: user?.id || null
    }
  }));

  const { error } = await supabase.from('notificacoes').insert(notificacoes);
  if (error) throwSupabaseError(error);
}

function throwSupabaseError(error) {
  const parts = [error.message, error.details, error.hint].filter(Boolean);
  throw new Error(parts.join(' '));
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
