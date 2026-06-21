import { supabase } from '../lib/supabase.js';

export const MANUTENCAO_AREAS = [
  { value: 'mecanica', label: 'Mecanica' },
  { value: 'eletrica', label: 'Eletrica' },
  { value: 'automacao', label: 'Automacao' },
  { value: 'operacional', label: 'Operacao' }
];

export const MANUTENCAO_FREQUENCIAS = [
  { value: 'diaria', label: 'Diaria' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'quinzenal', label: 'Quinzenal' },
  { value: 'mensal', label: 'Mensal' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual' }
];

export const MANUTENCAO_TIPOS = ['preventiva', 'preditiva', 'corretiva'];
export const MANUTENCAO_STATUS_EXECUCAO = ['pendente', 'programada', 'em_execucao', 'concluida', 'atrasada', 'cancelada'];

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
    .select('id,nome,usuario,perfil,setor,ativo')
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

export async function listarOsManutencao(limit = 200) {
  const { data, error } = await supabase
    .from('ordens_servico')
    .select('id,numero,titulo,status,prioridade,area,ebap_id,equipamento_id,data_programada,created_at,payload')
    .eq('origem', 'manutencao')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
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
  const corretivasAbertas = osManutencao.filter((os) => !['concluida_arquivada', 'concluida', 'finalizada', 'arquivada', 'cancelada'].includes(os.status)).length;
  const corretivasCriticas = osManutencao.filter((os) => os.prioridade === 'critica' && !['concluida_arquivada', 'concluida', 'finalizada', 'arquivada', 'cancelada'].includes(os.status)).length;
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
    p_codigo: payload.codigo,
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
    p_observacoes: payload.observacoes || null
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
