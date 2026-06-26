import { supabase } from '../lib/supabase.js';
import { EQUIPES_TECNICAS, equipeTecnicaLabel } from './usuariosService.js';

export const MANUTENCAO_AREAS = [
  { value: 'mecanica', label: 'Mecânica' },
  { value: 'eletrica', label: 'Elétrica' },
  { value: 'automacao', label: 'Automação' },
  { value: 'operacional', label: 'Operação' }
];

export const MANUTENCAO_FREQUENCIAS = [
  { value: 'diaria', label: 'Diária' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'quinzenal', label: 'Quinzenal' },
  { value: 'mensal', label: 'Mensal' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual' }
];

export const MANUTENCAO_TIPOS = ['preventiva', 'preditiva', 'corretiva'];
export const MANUTENCAO_STATUS_EXECUCAO = ['pendente', 'programada', 'em_execucao', 'concluida', 'atrasada', 'cancelada'];
export const MANUTENCAO_FINAL_OS_STATUS = ['concluida_arquivada', 'concluida', 'cancelada', 'rejeitada', 'rejeitada_cco', 'arquivada', 'finalizada'];
export const MANUTENCAO_CALENDARIO_STATUS = ['programada', 'encaminhada_tecnicos', 'em_execucao', 'pausada', 'concluida_tecnicos'];

export function equipesPorArea(area) {
  if (!area || ['todas', 'gerencia', 'diretoria'].includes(area)) return EQUIPES_TECNICAS;
  return EQUIPES_TECNICAS.filter((equipe) => equipe.area === area);
}

export { equipeTecnicaLabel };

export const CHECKLISTS_PADRAO = {
  mecanica: [
    'Verificar fixacoes e bases',
    'Inspecionar vazamentos e vedacoes',
    'Verificar ruidos, vibracao e aquecimento',
    'Inspecionar acoplamentos, correias e rolamentos',
    'Registrar condicao final do equipamento'
  ],
  eletrica: [
    'Verificar quadro e protecoes',
    'Inspecionar cabos, bornes e conexoes',
    'Medir tensao/corrente quando aplicavel',
    'Verificar aterramento e identificacao',
    'Registrar anomalias eletricas'
  ],
  automacao: [
    'Verificar sensores e sinais',
    'Testar comunicacao e telemetria',
    'Inspecionar CLP/IHM/inversores',
    'Validar alarmes e intertravamentos',
    'Registrar ajustes realizados'
  ],
  operacional: [
    'Verificar condicao operacional geral',
    'Inspecionar limpeza e acesso',
    'Validar disponibilidade do equipamento',
    'Registrar ocorrencias operacionais',
    'Comunicar pendencias ao supervisor'
  ]
};

export function podeGerenciarManutencao(perfil) {
  return ['supervisor', 'gerencia', 'diretoria'].includes(perfil);
}

function validateUser(user) {
  if (!user?.id || !podeGerenciarManutencao(user?.perfil)) {
    throw new Error('Usuario sem permissao para gerenciar manutencao.');
  }
}

function emptyToNull(value) {
  return value === '' || value == null ? null : value;
}

function gerarCodigoPlanoManutencao() {
  const now = new Date();
  const ymd = now.toISOString().slice(0, 10).replaceAll('-', '');
  return 'PM-' + ymd + '-' + String(now.getTime()).slice(-5);
}

function normalizeChecklist(checklist) {
  if (Array.isArray(checklist)) {
    return checklist.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(checklist || '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function listarEbapsManutencao() {
  const { data, error } = await supabase
    .from('ebaps')
    .select('id,codigo,nome,status')
    .is('deleted_at', null)
    .order('nome', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function listarEquipamentosManutencao(ebapId = null) {
  let query = supabase
    .from('equipamentos')
    .select('id,codigo,tag,nome,ebap_id,area_responsavel,criticidade,status_operacional')
    .is('deleted_at', null)
    .order('nome', { ascending: true });

  if (ebapId) query = query.eq('ebap_id', ebapId);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function listarResponsaveisManutencao() {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id,nome,usuario,perfil,setor,equipe,area_operacional,ativo')
    .in('perfil', ['tecnico', 'supervisor'])
    .eq('ativo', true)
    .is('deleted_at', null)
    .order('nome', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function listarPlanosManutencao(filters = {}) {
  let query = supabase
    .from('manutencao_planos')
    .select('*, ebap:ebaps(id,codigo,nome), equipamento:equipamentos(id,codigo,tag,nome,criticidade,status_operacional), responsavel:usuarios!manutencao_planos_responsavel_id_fkey(id,nome,usuario,perfil)')
    .is('deleted_at', null)
    .order('proxima_execucao', { ascending: true });

  if (filters.ativo !== undefined) query = query.eq('ativo', filters.ativo);
  if (filters.area) query = query.eq('area', filters.area);
  if (filters.tipo) query = query.eq('tipo', filters.tipo);
  if (filters.ebapId) query = query.eq('ebap_id', filters.ebapId);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function listarExecucoesManutencao(limit = 200) {
  const { data, error } = await supabase
    .from('manutencao_execucoes')
    .select('*, plano:manutencao_planos(id,codigo,nome,area,frequencia), os:ordens_servico(id,numero,titulo,status,prioridade), ebap:ebaps(id,codigo,nome), equipamento:equipamentos(id,codigo,tag,nome), responsavel:usuarios!manutencao_execucoes_responsavel_id_fkey(id,nome,usuario,perfil)')
    .is('deleted_at', null)
    .order('data_programada', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function listarOsManutencao(limit = 500, user = null) {
  let query = supabase
    .from('ordens_servico')
    .select('id,numero,titulo,status,prioridade,area,ebap_id,equipamento_id,ativo_id,equipe,equipe_responsavel,data_programada,hora_programada,turno,created_at,updated_at,fim_execucao,payload,ebap:ebaps(id,codigo,nome,nome_curto),ativo:ativos(id,nome_operacional,tipo),equipamento:equipamentos(id,codigo,tag,nome)')
    .is('deleted_at', null)
    .order('data_programada', { ascending: true, nullsFirst: false })
    .limit(limit);

  const perfil = user?.perfil;
  if (perfil === 'supervisor') {
    const area = user.area_supervisao || user.area_operacional;
    if (area) query = query.eq('area', area);
  } else if (!['gerencia', 'diretoria'].includes(perfil)) {
    if (user?.equipe) query = query.or('equipe.eq.' + user.equipe + ',equipe_responsavel.eq.' + user.equipe);
    else if (user?.area_operacional) query = query.eq('area', user.area_operacional);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export function filtrarOsCalendario(osRows = [], filters = {}) {
  const inicio = filters.inicio || '';
  const fim = filters.fim || '';
  return osRows.filter((os) => {
    const data = String(os.data_programada || '').slice(0, 10);
    if (!data) return false;
    if (MANUTENCAO_FINAL_OS_STATUS.includes(os.status)) return false;
    if (!MANUTENCAO_CALENDARIO_STATUS.includes(os.status)) return false;
    if (filters.ebapId && os.ebap_id !== filters.ebapId) return false;
    if (filters.area && os.area !== filters.area) return false;
    if (filters.equipe && (os.equipe_responsavel || os.equipe) !== filters.equipe) return false;
    if (filters.status && os.status !== filters.status) return false;
    if (inicio && data < inicio) return false;
    if (fim && data > fim) return false;
    return true;
  });
}

export function obterDashboardCalendarioOS(osRows = []) {
  const hoje = new Date().toISOString().slice(0, 10);
  const mesAtual = hoje.slice(0, 7);
  const visiveis = osRows.filter((os) => os.data_programada && !MANUTENCAO_FINAL_OS_STATUS.includes(os.status));
  return {
    programadas: visiveis.filter((os) => os.status === 'programada' || os.status === 'encaminhada_tecnicos').length,
    emAndamento: visiveis.filter((os) => ['em_execucao', 'pausada', 'concluida_tecnicos'].includes(os.status)).length,
    atrasadas: visiveis.filter((os) => String(os.data_programada).slice(0, 10) < hoje && !['concluida_tecnicos'].includes(os.status)).length,
    concluidasMes: osRows.filter((os) => MANUTENCAO_FINAL_OS_STATUS.includes(os.status) && String(os.fim_execucao || os.updated_at || '').startsWith(mesAtual)).length
  };
}


export async function obterDashboardManutencao() {
  const [planos, execucoes, osManutencao] = await Promise.all([
    listarPlanosManutencao({ ativo: true }),
    listarExecucoesManutencao(500),
    listarOsManutencao(500)
  ]);

  const hoje = new Date().toISOString().slice(0, 10);
  const mesAtual = hoje.slice(0, 7);
  const preventivasProgramadas = execucoes.filter((item) => item.tipo === 'preventiva' && ['pendente', 'programada', 'em_execucao'].includes(item.status)).length;
  const preventivasConcluidas = execucoes.filter((item) => item.tipo === 'preventiva' && item.status === 'concluida' && String(item.data_execucao || '').startsWith(mesAtual)).length;
  const corretivasAbertas = osManutencao.filter((os) => !MANUTENCAO_FINAL_OS_STATUS.includes(os.status)).length;
  const corretivasCriticas = osManutencao.filter((os) => os.prioridade === 'critica' && !MANUTENCAO_FINAL_OS_STATUS.includes(os.status)).length;
  const backlog = execucoes.filter((item) => ['pendente', 'programada', 'em_execucao', 'atrasada'].includes(item.status)).length + corretivasAbertas;
  const vencidos = planos.filter((plano) => plano.proxima_execucao <= hoje);
  const concluidasMes = execucoes.filter((item) => item.status === 'concluida' && String(item.data_execucao || '').startsWith(mesAtual)).length;
  const programadasMes = execucoes.filter((item) => String(item.data_programada || '').startsWith(mesAtual)).length;
  const cumprimentoPlano = programadasMes ? Math.round((concluidasMes / programadasMes) * 100) : 0;

  return {
    preventivasProgramadas,
    preventivasConcluidas,
    corretivasAbertas,
    corretivasCriticas,
    backlog,
    cumprimentoPlano,
    planosAtivos: planos.length,
    planosVencidos: vencidos.length
  };
}

export async function salvarPlanoManutencao(payload, user) {
  validateUser(user);

  const checklist = normalizeChecklist(payload.checklist);
  if (!checklist.length) {
    throw new Error('Informe ao menos um item de checklist.');
  }

  const { data, error } = await supabase.rpc('manutencao_salvar_plano', {
    p_user_id: user.id,
    p_id: payload.id || null,
    p_codigo: payload.codigo || gerarCodigoPlanoManutencao(),
    p_nome: payload.nome,
    p_ebap_id: emptyToNull(payload.ebap_id),
    p_area: payload.area,
    p_equipamento_id: emptyToNull(payload.equipamento_id),
    p_frequencia: payload.frequencia,
    p_responsavel_id: emptyToNull(payload.responsavel_id),
    p_checklist: checklist,
    p_tipo: payload.tipo || 'preventiva',
    p_prioridade: payload.prioridade || 'media',
    p_proxima_execucao: emptyToNull(payload.proxima_execucao),
    p_ativo: payload.ativo !== false,
    p_observacoes: [payload.observacoes, payload.equipe_responsavel ? 'Equipe responsável: ' + equipeTecnicaLabel(payload.equipe_responsavel) : ''].filter(Boolean).join('\n') || null
  });

  if (error) throw error;
  return data;
}

export async function registrarExecucaoManutencao(payload, user) {
  validateUser(user);

  const { data, error } = await supabase.rpc('manutencao_registrar_execucao', {
    p_user_id: user.id,
    p_id: payload.id || null,
    p_plano_id: payload.plano_id,
    p_os_id: emptyToNull(payload.os_id),
    p_status: payload.status || 'pendente',
    p_data_programada: emptyToNull(payload.data_programada),
    p_data_execucao: emptyToNull(payload.data_execucao),
    p_checklist_resultado: normalizeChecklist(payload.checklist_resultado || payload.checklist),
    p_observacoes: payload.observacoes || null
  });

  if (error) throw error;
  return data;
}

export async function gerarOsManutencaoVencidas(user) {
  validateUser(user);

  const { data, error } = await supabase.rpc('manutencao_gerar_os_vencidas', {
    p_user_id: user.id
  });

  if (error) throw error;
  return data || 0;
}
