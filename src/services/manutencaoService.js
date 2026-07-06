import { supabase } from '../lib/supabase.js';
import { criarOS } from './osService.js';
import { EQUIPES_TECNICAS, equipeTecnicaLabel } from './usuariosService.js';

export const MANUTENCAO_AREAS = [
  { value: 'mecanica', label: 'Mecânica' },
  { value: 'eletrica', label: 'Elétrica' },
  { value: 'automacao', label: 'Automação' }
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
  return sincronizarStatusCronogramaComOs(data || []);
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

export const CRONOGRAMA_AREAS = [
  { value: 'mecanica', label: 'Mecânica' },
  { value: 'eletrica', label: 'Elétrica' },
  { value: 'automacao', label: 'Automação' }
];

export const CRONOGRAMA_STATUS = [
  { value: 'programada', label: 'Programada' },
  { value: 'os_gerada', label: 'OS Gerada' },
  { value: 'em_execucao', label: 'Em execução' },
  { value: 'concluida', label: 'Concluída' },
  { value: 'atrasada', label: 'Atrasada' },
  { value: 'reprogramada', label: 'Reprogramada' },
  { value: 'cancelada', label: 'Cancelada' }
];

export const CRONOGRAMA_TIPOS_EVENTO = [
  'Manutenção',
  'Lembrete',
  'Aviso',
  'Reunião',
  'Treinamento',
  'DDS',
  'Feriado',
  'Visita',
  'Inspeção',
  'Auditoria',
  'Parada Programada',
  'Outro'
];

export const CRONOGRAMA_ABAS_VALIDAS = [
  { nome: 'Prog automação', area: 'automacao' },
  { nome: 'Prog elétrica', area: 'eletrica' },
  { nome: 'Prog mecânica', area: 'mecanica' },
  { nome: 'Prog elétrica - Noite', area: 'eletrica' },
  { nome: 'Prog mecânica - Noite', area: 'mecanica' }
];

export const CRONOGRAMA_AREA_TERMS = {
  mecanica: ['bomba', 'motor', 'gerador', 'comporta', 'rastelo', 'redutor', 'rolamento', 'eixo', 'acoplamento', 'lubrificação', 'lubrificacao', 'válvula', 'valvula', 'tubulação', 'tubulacao', 'limpeza mecânica', 'limpeza mecanica'],
  eletrica: ['painel', 'disjuntor', 'contator', 'relé', 'rele', 'inversor', 'transformador', 'cabo', 'alimentação', 'alimentacao', 'iluminação', 'iluminacao', 'quadro elétrico', 'quadro eletrico', 'ccm', 'barramento'],
  automacao: ['clp', 'supervisório', 'supervisorio', 'ihm', 'instrumentação', 'instrumentacao', 'sensor', 'transmissor', 'regulador de nível', 'regulador de nivel', 'câmera', 'camera', 'cftv', 'rede', 'internet', 'switch', 'rádio', 'radio', 'fibra óptica', 'fibra optica', 'antena', 'comunicação', 'comunicacao', 'telemetria', 'scada', 'plc', 'modem', 'conversor', 'encoder']
};

export function normalizarTexto(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function areaLabel(area) {
  return CRONOGRAMA_AREAS.find((item) => item.value === area)?.label || area || '-';
}

export function statusCronogramaLabel(status) {
  return CRONOGRAMA_STATUS.find((item) => item.value === status)?.label || status || '-';
}

export function areaDoUsuarioManutencao(user) {
  const raw = normalizarTexto(user?.area_supervisao || user?.area_operacional || user?.setor || user?.area || '');
  if (raw.includes('mecan')) return 'mecanica';
  if (raw.includes('eletr')) return 'eletrica';
  if (raw.includes('autom')) return 'automacao';
  return '';
}

export function podeVerTodasAreasManutencao(user) {
  return ['gerencia', 'diretoria', 'administrador', 'admin'].includes(user?.perfil);
}

export function podeEditarCronograma(user, area = '') {
  if (podeVerTodasAreasManutencao(user)) return true;
  if (user?.perfil !== 'supervisor') return false;
  return !area || areaDoUsuarioManutencao(user) === area;
}

export function abasPermitidasManutencao(user) {
  if (podeVerTodasAreasManutencao(user)) return CRONOGRAMA_ABAS_VALIDAS;
  if (user?.perfil === 'supervisor') {
    const area = areaDoUsuarioManutencao(user);
    return CRONOGRAMA_ABAS_VALIDAS.filter((aba) => aba.area === area);
  }
  return [];
}

export function classificarAtividadeManutencao(atividade, associacoes = {}) {
  const normalizada = normalizarTexto(atividade);
  if (associacoes[normalizada]) return associacoes[normalizada];
  for (const [area, termos] of Object.entries(CRONOGRAMA_AREA_TERMS)) {
    if (termos.some((term) => normalizada.includes(normalizarTexto(term)))) return area;
  }
  return '';
}

export function resumoCronograma(eventos = []) {
  const hoje = new Date().toISOString().slice(0, 10);
  const proximos7 = new Date();
  proximos7.setDate(proximos7.getDate() + 7);
  const seteDias = proximos7.toISOString().slice(0, 10);
  const ativos = eventos.filter((evento) => !['cancelada', 'concluida'].includes(evento.status));
  return {
    total: eventos.length,
    programadas: eventos.filter((evento) => evento.status === 'programada').length,
    osGeradas: eventos.filter((evento) => evento.status === 'os_gerada').length,
    emExecucao: eventos.filter((evento) => evento.status === 'em_execucao').length,
    atrasadas: ativos.filter((evento) => evento.data_programada < hoje || evento.status === 'atrasada').length,
    proximos7: ativos.filter((evento) => evento.data_programada >= hoje && evento.data_programada <= seteDias).length
  };
}

export async function listarAssociacoesAtividades() {
  const { data, error } = await supabase
    .from('manutencao_classificacao_atividade')
    .select('atividade_normalizada,area');

  if (error) throw error;
  return (data || []).reduce((acc, row) => ({ ...acc, [row.atividade_normalizada]: row.area }), {});
}

export async function listarCronogramaManutencao(user, filters = {}) {
  let query = supabase
    .from('cronograma_manutencao')
    .select('*')
    .is('deleted_at', null)
    .order('data_programada', { ascending: true })
    .order('hora_programada', { ascending: true, nullsFirst: false });

  if (!podeVerTodasAreasManutencao(user)) {
    const area = areaDoUsuarioManutencao(user);
    if (area) query = query.eq('area', area);
    else query = query.eq('area', '__sem_acesso__');
  }
  if (filters.area) query = query.eq('area', filters.area);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.ebap) query = query.ilike('ebap', `%${filters.ebap}%`);
  if (filters.inicio) query = query.gte('data_programada', filters.inicio);
  if (filters.fim) query = query.lte('data_programada', filters.fim);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function listarImportacoesCronograma(user) {
  let query = supabase
    .from('cronograma_manutencao_importacoes')
    .select('*')
    .is('deleted_at', null)
    .order('criado_em', { ascending: false })
    .limit(100);

  if (!podeVerTodasAreasManutencao(user)) {
    const area = areaDoUsuarioManutencao(user);
    if (area) query = query.eq('area', area);
    else query = query.eq('area', '__sem_acesso__');
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function salvarEventoCronograma(payload, user) {
  if (!podeEditarCronograma(user, payload.area)) throw new Error('Usuário sem permissão para editar este evento.');
  const row = {
    supervisor_id: payload.supervisor_id || (user?.perfil === 'supervisor' ? user.id : null),
    area: payload.area,
    equipe: payload.equipe || null,
    categoria: payload.categoria || null,
    ebap: payload.ebap || null,
    equipamento: payload.equipamento || null,
    atividade: payload.atividade,
    descricao: payload.descricao || null,
    data_programada: payload.data_programada,
    hora_programada: payload.hora_programada || null,
    status: payload.status || 'programada',
    tipo_evento: payload.tipo_evento || 'Manutenção',
    origem: payload.origem || 'manual',
    arquivo_importado: payload.arquivo_importado || null,
    aba_origem: payload.aba_origem || null,
    linha_origem: payload.linha_origem || null,
    os_id: payload.os_id || null,
    criado_por: payload.criado_por || user?.id || null
  };

  const query = payload.id
    ? supabase.from('cronograma_manutencao').update(row).eq('id', payload.id).select('*').single()
    : supabase.from('cronograma_manutencao').insert(row).select('*').single();

  const { data, error } = await query;
  if (error) throw error;
  await salvarAssociacaoClassificacao(data.atividade, data.area, user);
  return data;
}

export async function cancelarEventoCronograma(evento, user) {
  if (!podeEditarCronograma(user, evento.area)) throw new Error('Usuário sem permissão para cancelar este evento.');
  const { data, error } = await supabase
    .from('cronograma_manutencao')
    .update({ status: 'cancelada' })
    .eq('id', evento.id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function excluirEventoCronograma(evento, user) {
  if (!podeEditarCronograma(user, evento.area)) throw new Error('Usuário sem permissão para excluir este evento.');
  const { error } = await supabase
    .from('cronograma_manutencao')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', evento.id);
  if (error) throw error;
}

export async function duplicarEventoCronograma(evento, user) {
  const { id, criado_em, atualizado_em, os_id, importacao_id, ...copy } = evento;
  return salvarEventoCronograma({ ...copy, status: 'programada', origem: 'manual' }, user);
}

export async function salvarImportacaoCronograma({ arquivo, mesReferencia, modo, eventos, resumo }, user) {
  const areas = [...new Set(eventos.map((evento) => evento.area).filter(Boolean))];
  const areaImportacao = areas.length === 1 ? areas[0] : null;
  const abas = [...new Set(eventos.map((evento) => evento.aba_origem).filter(Boolean))];

  if (modo === 'substituir' && mesReferencia) {
    let deleteQuery = supabase
      .from('cronograma_manutencao')
      .update({ deleted_at: new Date().toISOString() })
      .is('deleted_at', null)
      .gte('data_programada', `${mesReferencia}-01`)
      .lte('data_programada', `${mesReferencia}-31`);
    if (areaImportacao) deleteQuery = deleteQuery.eq('area', areaImportacao);
    const { error: deleteError } = await deleteQuery;
    if (deleteError) throw deleteError;
  }

  const { data: importacao, error: importError } = await supabase
    .from('cronograma_manutencao_importacoes')
    .insert({
      arquivo,
      mes_referencia: mesReferencia || null,
      abas_importadas: abas,
      total_eventos: eventos.length,
      area: areaImportacao,
      usuario_id: user?.id || null,
      modo,
      resumo
    })
    .select('*')
    .single();
  if (importError) throw importError;

  const rows = eventos.map((evento) => ({
    supervisor_id: user?.perfil === 'supervisor' ? user.id : null,
    area: evento.area,
    equipe: evento.equipe || null,
    categoria: evento.categoria || null,
    ebap: evento.ebap || null,
    equipamento: evento.equipamento || null,
    atividade: evento.atividade,
    descricao: evento.descricao || null,
    data_programada: evento.data_programada,
    hora_programada: evento.hora_programada || null,
    status: 'programada',
    tipo_evento: evento.tipo_evento || 'Manutenção',
    origem: 'importacao',
    arquivo_importado: arquivo,
    aba_origem: evento.aba_origem,
    linha_origem: evento.linha_origem,
    importacao_id: importacao.id,
    criado_por: user?.id || null
  }));

  const { data, error } = await supabase.from('cronograma_manutencao').insert(rows).select('*');
  if (error) throw error;
  await Promise.all(rows.map((row) => salvarAssociacaoClassificacao(row.atividade, row.area, user)));
  return { importacao, eventos: data || [] };
}

export async function salvarAssociacaoClassificacao(atividade, area, user) {
  const atividadeNormalizada = normalizarTexto(atividade);
  if (!atividadeNormalizada || !area) return null;
  const { data, error } = await supabase
    .from('manutencao_classificacao_atividade')
    .upsert({
      atividade_normalizada: atividadeNormalizada,
      atividade_exemplo: atividade,
      area,
      criado_por: user?.id || null,
      atualizado_em: new Date().toISOString()
    }, { onConflict: 'atividade_normalizada' })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function gerarOsDoEventoCronograma(evento, user) {
  if (!podeEditarCronograma(user, evento.area)) throw new Error('Usuário sem permissão para gerar OS deste evento.');
  if (evento.os_id) return evento.os_id;

  const os = await criarOS({
    origem: 'operacao',
    titulo: evento.atividade,
    descricao: evento.descricao || `OS gerada a partir do planejamento de manutenção: ${evento.atividade}`,
    area: evento.area,
    equipe_responsavel: evento.equipe || null,
    equipamento_falha: evento.equipamento || evento.atividade,
    tipo_manutencao: 'preventiva',
    prioridade: 'media',
    data_programada: evento.data_programada,
    hora_programada: evento.hora_programada || null,
    payload: {
      cronograma_manutencao_id: evento.id,
      ebap_texto: evento.ebap || null,
      equipamento_texto: evento.equipamento || null,
      origem_planejamento: evento.origem
    }
  }, user);

  const { data, error } = await supabase
    .from('cronograma_manutencao')
    .update({ os_id: os.id, status: 'os_gerada' })
    .eq('id', evento.id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

async function sincronizarStatusCronogramaComOs(eventos) {
  const osIds = [...new Set(eventos.map((evento) => evento.os_id).filter(Boolean))];
  if (!osIds.length) return eventos.map(aplicarAtrasoCronograma);

  const { data, error } = await supabase
    .from('ordens_servico')
    .select('id,status')
    .in('id', osIds);
  if (error) throw error;

  const osById = new Map((data || []).map((os) => [os.id, os.status]));
  const updates = [];
  const normalized = eventos.map((evento) => {
    const statusOs = osById.get(evento.os_id);
    const status = statusOs ? statusCronogramaPorOs(statusOs) : evento.status;
    const next = aplicarAtrasoCronograma({ ...evento, status });
    if (next.status !== evento.status && !['cancelada', 'reprogramada'].includes(evento.status)) {
      updates.push(supabase.from('cronograma_manutencao').update({ status: next.status }).eq('id', evento.id));
    }
    return next;
  });

  if (updates.length) await Promise.all(updates);
  return normalized;
}

function statusCronogramaPorOs(statusOs) {
  if (MANUTENCAO_FINAL_OS_STATUS.includes(statusOs)) return 'concluida';
  if (['em_execucao', 'pausada', 'concluida_tecnicos'].includes(statusOs)) return 'em_execucao';
  return 'os_gerada';
}

function aplicarAtrasoCronograma(evento) {
  const hoje = new Date().toISOString().slice(0, 10);
  if (evento.data_programada < hoje && ['programada', 'os_gerada'].includes(evento.status)) {
    return { ...evento, status: 'atrasada' };
  }
  return evento;
}
