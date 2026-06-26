import { supabase } from '../lib/supabase.js';
import { OS_AREAS, OS_PRIORIDADES, OS_STATUS, areaLabel, prioridadeLabel, statusLabel } from './osService.js';
import { EQUIPES_TECNICAS, equipeTecnicaLabel } from './usuariosService.js';

export { OS_AREAS, OS_PRIORIDADES, OS_STATUS, EQUIPES_TECNICAS, areaLabel, prioridadeLabel, statusLabel, equipeTecnicaLabel };

const SUPERVISAO_SELECT = `
  *,
  ebap:ebaps(id,codigo,nome,nome_curto,status),
  solicitante:usuarios!ordens_servico_solicitante_id_fkey(id,nome,usuario,perfil,setor),
  supervisor:usuarios!ordens_servico_supervisor_responsavel_fkey(id,nome,usuario,perfil,setor,area_operacional,area_supervisao),
  tecnico:usuarios!ordens_servico_tecnico_responsavel_fkey(id,nome,usuario,perfil,setor,area_operacional),
  responsavel:usuarios!ordens_servico_responsavel_id_fkey(id,nome,usuario,perfil,setor)
`;

export const STATUS_SUPERVISOR = [
  { value: 'aguardando_supervisor', label: 'Aguardando supervisor', tone: 'orange' },
  { value: 'analise_supervisor', label: 'Em análise', tone: 'cyan' },
  { value: 'programada', label: 'Programada', tone: 'blue' },
  { value: 'encaminhada_tecnicos', label: 'Encaminhada para técnicos', tone: 'cyan' },
  { value: 'em_execucao', label: 'Em execução', tone: 'orange' },
  { value: 'validacao_supervisor', label: 'Aguardando validação', tone: 'orange' },
  { value: 'devolvida_correcao', label: 'Devolvida para correção', tone: 'red' },
  { value: 'concluida', label: 'Concluída', tone: 'green' },
  { value: 'reencaminhada', label: 'Reencaminhada', tone: 'slate' }
];

const AREA_MANAGERS = ['gerencia', 'diretoria', 'cco'];

export function statusSupervisorLabel(status) {
  return STATUS_SUPERVISOR.find((item) => item.value === status)?.label || status || '-';
}

export function statusSupervisorTone(status) {
  return STATUS_SUPERVISOR.find((item) => item.value === status)?.tone || 'cyan';
}

export function podeVerTodasAreas(perfil) {
  return AREA_MANAGERS.includes(perfil);
}

export async function obterContextoSupervisao(user) {
  if (!user?.id) throw new Error('Usuário não autenticado.');

  const [usuarioRes, areasRes, tecnicosRes, ebapsRes] = await Promise.all([
    supabase.from('usuarios').select('id,nome,usuario,perfil,setor,area_operacional,area_supervisao').eq('id', user.id).maybeSingle(),
    supabase.from('supervisor_areas').select('*, supervisor:usuarios(id,nome,usuario,perfil,setor,area_operacional,area_supervisao)').eq('ativo', true).is('deleted_at', null).order('nome'),
    supabase.from('usuarios').select('id,nome,usuario,perfil,setor,area_operacional,equipe,ativo').eq('ativo', true).is('deleted_at', null).in('perfil', ['tecnico', 'supervisor']).order('nome'),
    supabase.from('ebaps').select('id,codigo,nome,nome_curto,status').is('deleted_at', null).order('nome')
  ]);

  if (usuarioRes.error) throw usuarioRes.error;
  if (areasRes.error) throw areasRes.error;
  if (tecnicosRes.error) throw tecnicosRes.error;
  if (ebapsRes.error) throw ebapsRes.error;

  const usuario = usuarioRes.data || user;
  const areaAtual = user.perfil === 'supervisor' ? usuario.area_operacional || usuario.area_supervisao || user.area_operacional || user.area_supervisao || '' : '';

  return {
    usuario,
    areaAtual,
    canSeeAllAreas: podeVerTodasAreas(user.perfil),
    areas: areasRes.data || [],
    tecnicos: tecnicosRes.data || [],
    ebaps: ebapsRes.data || []
  };
}

export async function listarFilaSupervisao(filters = {}, user) {
  const contexto = await obterContextoSupervisao(user);
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('ordens_servico')
    .select(SUPERVISAO_SELECT, { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (user?.perfil === 'supervisor') {
    if (!contexto.areaAtual) {
      return { data: [], count: 0, kpis: emptyKpis(), contexto };
    }
    query = query.eq('area', contexto.areaAtual);
  } else if (!contexto.canSeeAllAreas) {
    throw new Error('Perfil sem permissão para acessar a supervisão por área.');
  } else if (filters.area) {
    query = query.eq('area', filters.area);
  }

  if (filters.ebapId) query = query.eq('ebap_id', filters.ebapId);
  if (filters.statusSupervisor) query = query.eq('status_supervisor', filters.statusSupervisor);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.prioridade) query = query.eq('prioridade', filters.prioridade);
  if (filters.equipe) query = query.ilike('equipe', `%${filters.equipe}%`);
  if (filters.tecnicoId) query = query.eq('tecnico_responsavel', filters.tecnicoId);
  if (filters.data) query = query.eq('data_programada', filters.data);
  if (filters.search) {
    const term = `%${filters.search}%`;
    query = query.or(`numero.ilike.${term},titulo.ilike.${term},descricao.ilike.${term}`);
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;

  const rows = data || [];
  return { data: rows, count: count || 0, kpis: calcularKpis(rows), contexto };
}

export async function confirmarAreaOS(osId, user) {
  return atualizarSupervisao(osId, { status: 'analise_supervisor', status_supervisor: 'analise_supervisor' }, user, {
    acao: 'confirmar_area',
    descricao: 'Supervisor confirmou que a OS pertence à sua área.'
  });
}

export async function programarExecucaoOS(osId, payload, user) {
  if (!payload.equipe?.trim()) throw new Error('Informe a equipe.');
  if (!payload.data_programada) throw new Error('Informe a data programada.');
  if (!payload.turno) throw new Error('Informe o turno.');

  return atualizarSupervisao(osId, {
    status: 'programada',
    status_supervisor: 'programada',
    equipe: payload.equipe.trim(),
    equipe_responsavel: payload.equipe.trim(),
    tecnico_responsavel: payload.tecnico_responsavel || null,
    responsavel_id: payload.tecnico_responsavel || null,
    data_programada: payload.data_programada,
    hora_programada: payload.hora_programada || null,
    turno: payload.turno,
    payload: payload.payloadPatch
  }, user, {
    acao: 'programar_execucao',
    descricao: 'Supervisor programou a execução da OS.',
    justificativa: payload.observacao || ''
  });
}

export async function encaminharTecnicosOS(osId, user) {
  return atualizarSupervisao(osId, { status: 'encaminhada_tecnicos', status_supervisor: 'encaminhada_tecnicos' }, user, {
    acao: 'encaminhar_tecnicos',
    descricao: 'OS encaminhada para execução técnica.'
  });
}

export async function solicitarCorrecaoOS(osId, motivo, user) {
  if (!String(motivo || '').trim()) throw new Error('Informe a justificativa da correção.');
  return atualizarSupervisao(osId, { status: 'nao_conforme', status_supervisor: 'devolvida_correcao', motivo_cancelamento: motivo }, user, {
    acao: 'solicitar_correcao',
    descricao: 'Supervisor solicitou correção da OS.',
    justificativa: motivo
  });
}

export async function validarExecucaoOS(osId, user) {
  return atualizarSupervisao(osId, { status: 'aguardando_validacao_prefeitura', status_supervisor: 'concluida' }, user, {
    acao: 'validar_execucao',
    descricao: 'Supervisor validou a execução e enviou para validação da Prefeitura.'
  });
}

export async function reencaminharOS(osId, payload, user) {
  if (!payload.nova_area) throw new Error('Selecione a nova área.');
  if (!String(payload.justificativa || '').trim()) throw new Error('Informe a justificativa do reencaminhamento.');
  const destino = await buscarSupervisorArea(payload.nova_area);

  return atualizarSupervisao(osId, {
    area: payload.nova_area,
    supervisor_responsavel: destino?.supervisor_id || null,
    status: 'aguardando_supervisor',
    status_supervisor: 'reencaminhada'
  }, user, {
    acao: 'reencaminhar_supervisor',
    descricao: 'OS reencaminhada para outro supervisor.',
    justificativa: payload.justificativa,
    novaArea: payload.nova_area,
    novoSupervisor: destino?.supervisor_id || null,
    notificarSupervisor: true
  });
}

async function atualizarSupervisao(osId, patch, user, meta) {
  const atual = await buscarOSSupervisao(osId);
  await validarEscopoSupervisor(atual, user);

  const now = new Date().toISOString();
  const historicoRoteamento = [
    ...(Array.isArray(atual.historico_roteamento) ? atual.historico_roteamento : []),
    {
      acao: meta.acao,
      usuario_id: user?.id || null,
      perfil: user?.perfil || null,
      status_anterior: atual.status,
      status_novo: patch.status || atual.status,
      area_anterior: atual.area,
      area_nova: patch.area || atual.area,
      supervisor_anterior: atual.supervisor_responsavel || null,
      supervisor_novo: patch.supervisor_responsavel ?? atual.supervisor_responsavel ?? null,
      justificativa: meta.justificativa || null,
      data: now
    }
  ];

  const payload = patch.payload ? { ...(atual.payload || {}), ...patch.payload } : atual.payload;
  const updatePayload = { ...patch, payload, historico_roteamento: historicoRoteamento, updated_at: now };
  delete updatePayload.payloadPatch;

  const { data, error } = await supabase
    .from('ordens_servico')
    .update(updatePayload)
    .eq('id', osId)
    .select(SUPERVISAO_SELECT)
    .single();

  if (error) throw error;

  await registrarHistorico(osId, atual, data, user, meta);
  await notificarSupervisao(data, user, meta);

  return data;
}

async function buscarOSSupervisao(osId) {
  const { data, error } = await supabase.from('ordens_servico').select(SUPERVISAO_SELECT).eq('id', osId).single();
  if (error) throw error;
  return data;
}

async function buscarSupervisorArea(area) {
  const { data, error } = await supabase
    .from('supervisor_areas')
    .select('area,nome,supervisor_id')
    .eq('area', area)
    .eq('ativo', true)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function validarEscopoSupervisor(os, user) {
  if (podeVerTodasAreas(user?.perfil)) return;
  if (user?.perfil !== 'supervisor') throw new Error('Perfil sem permissão para movimentar supervisão.');
  const { data, error } = await supabase.from('usuarios').select('area_operacional,area_supervisao').eq('id', user.id).maybeSingle();
  if (error) throw error;
  const userArea = data?.area_operacional || data?.area_supervisao || user.area_operacional || user.area_supervisao;
  if (!userArea) throw new Error('Supervisor sem área configurada.');
  if (os.area !== userArea) throw new Error('Supervisor sem permissão para movimentar OS de outra área.');
}

async function registrarHistorico(osId, anterior, novo, user, meta) {
  const { error } = await supabase.from('os_historico').insert({
    os_id: osId,
    usuario_id: user?.id || null,
    acao: meta.acao,
    status_anterior: anterior.status,
    status_novo: novo.status,
    descricao: meta.descricao,
    metadata: {
      perfil: user?.perfil || null,
      area_anterior: anterior.area,
      area_nova: novo.area,
      supervisor_anterior: anterior.supervisor_responsavel || null,
      supervisor_novo: novo.supervisor_responsavel || null,
      justificativa: meta.justificativa || null,
      status_supervisor_anterior: anterior.status_supervisor,
      status_supervisor_novo: novo.status_supervisor
    }
  });
  if (error) throw error;
}

async function notificarSupervisao(os, user, meta) {
  const targetUser = meta.notificarSupervisor ? os.supervisor_responsavel : os.tecnico_responsavel || os.supervisor_responsavel;
  const row = {
    usuario_id: targetUser || null,
    perfil_destino: targetUser ? null : 'supervisor',
    titulo: meta.acao === 'reencaminhar_supervisor' ? 'OS reencaminhada para sua área' : 'Movimentação de OS pela supervisão',
    mensagem: `${os.numero} - ${meta.descricao}${meta.justificativa ? ` Justificativa: ${meta.justificativa}` : ''}`,
    tipo: meta.justificativa ? 'alerta' : 'info',
    entidade_tipo: 'ordem_servico',
    entidade_id: os.id,
    modulo: 'os',
    prioridade: os.prioridade === 'critica' ? 'critica' : os.prioridade === 'alta' ? 'alta' : 'normal',
    acao_url: `/os/${os.id}`,
    metadata: { origem: 'supervisao', acao: meta.acao, usuario_id: user?.id || null }
  };

  const { error } = await supabase.from('notificacoes').insert(row);
  if (error) throw error;
}

function calcularKpis(rows) {
  const kpis = emptyKpis();
  rows.forEach((os) => {
    const status = os.status_supervisor || 'aguardando_supervisor';
    if (status === 'aguardando_supervisor') kpis.aguardando += 1;
    if (status === 'analise_supervisor') kpis.analise += 1;
    if (status === 'programada') kpis.programadas += 1;
    if (['encaminhada_tecnicos', 'em_execucao'].includes(status)) kpis.execucao += 1;
    if (status === 'validacao_supervisor') kpis.validacao += 1;
    if (status === 'devolvida_correcao') kpis.devolvidas += 1;
    if (status === 'concluida') kpis.concluidas += 1;
    if (os.prioridade === 'critica') kpis.criticas += 1;
  });
  kpis.total = rows.length;
  return kpis;
}

function emptyKpis() {
  return { total: 0, aguardando: 0, analise: 0, programadas: 0, execucao: 0, validacao: 0, devolvidas: 0, concluidas: 0, criticas: 0 };
}
