import { supabase } from '../lib/supabase.js';

export const CCO_REPORT_STATUS = [
  { value: 'rascunho', label: 'Rascunho', tone: 'slate' },
  { value: 'pendente_validacao_cco', label: 'Pendente CCO', tone: 'orange' },
  { value: 'validado_cco', label: 'Validado CCO', tone: 'green' },
  { value: 'rejeitado_cco', label: 'Rejeitado CCO', tone: 'red' },
  { value: 'correcao_solicitada', label: 'Correção solicitada', tone: 'orange' }
];

const REPORT_SELECT = `
  *,
  ebap:ebaps(id,nome,nome_curto,status),
  operador:usuarios!relatorios_diarios_operador_id_fkey(id,nome,usuario,perfil,setor)
`;

export function ccoStatusLabel(status) {
  return CCO_REPORT_STATUS.find((item) => item.value === status)?.label || status || '-';
}

export function ccoStatusTone(status) {
  return CCO_REPORT_STATUS.find((item) => item.value === status)?.tone || 'cyan';
}

export function canValidateCco(perfil) {
  return perfil === 'cco';
}

export function canViewCcoQueue(perfil) {
  return ['operador', 'cco', 'supervisor', 'gerencia', 'diretoria'].includes(perfil);
}

function applyRoleScope(query, perfil, userId) {
  if (['cco', 'supervisor', 'gerencia', 'diretoria'].includes(perfil)) return query;
  if (perfil === 'operador') return query.eq('operador_id', userId);
  return query.eq('operador_id', '00000000-0000-0000-0000-000000000000');
}

export async function listarCcoRelatorios({ page = 1, pageSize = 8, search = '', status = '', ebapId = '', dataInicio = '', dataFim = '', perfil, userId } = {}) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  let query = supabase
    .from('relatorios_diarios')
    .select(REPORT_SELECT, { count: 'exact' })
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });

  query = applyRoleScope(query, perfil, userId);

  if (status) query = query.eq('status', status);
  else if (perfil !== 'operador') query = query.in('status', ['pendente_validacao_cco', 'validado_cco', 'rejeitado_cco', 'correcao_solicitada']);

  if (search) {
    const value = `%${search}%`;
    query = query.or(`codigo.ilike.${value},resumo.ilike.${value},ocorrencias.ilike.${value},conclusao_operador.ilike.${value}`);
  }

  if (ebapId) query = query.eq('ebap_id', ebapId);
  if (dataInicio) query = query.gte('data_operacao', dataInicio);
  if (dataFim) query = query.lte('data_operacao', dataFim);

  const { data, error, count } = await query.range(from, to);
  if (error) throw new Error(error.message);
  return { data: data || [], count: count || 0, page, pageSize };
}

export async function obterDashboardCco({ perfil, userId } = {}) {
  let query = supabase
    .from('relatorios_diarios')
    .select('id,status,updated_at,operador_id')
    .is('deleted_at', null);

  query = applyRoleScope(query, perfil, userId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rows = data || [];
  const today = new Date().toISOString().slice(0, 10);

  return {
    pendentes: rows.filter((row) => row.status === 'pendente_validacao_cco').length,
    aprovadosHoje: rows.filter((row) => row.status === 'validado_cco' && String(row.updated_at || '').slice(0, 10) === today).length,
    rejeitadosHoje: rows.filter((row) => row.status === 'rejeitado_cco' && String(row.updated_at || '').slice(0, 10) === today).length,
    correcoesSolicitadas: rows.filter((row) => row.status === 'correcao_solicitada').length
  };
}

export async function listarEbapsCco() {
  const { data, error } = await supabase.from('ebaps').select('id,nome,nome_curto,status').is('deleted_at', null).order('nome');
  if (error) throw new Error(error.message);
  return data || [];
}

export async function obterRelatorioCco(relatorioId) {
  const [report, secoes, itens, fotos, validacoes, auditoria] = await Promise.all([
    buscarRelatorio(relatorioId),
    listarSecoes(relatorioId),
    listarItens(relatorioId),
    listarFotos(relatorioId),
    listarValidacoes(relatorioId),
    listarAuditoria(relatorioId)
  ]);

  return { report, secoes, itens, fotos, validacoes, auditoria };
}

export async function obterUrlFotoCco(foto) {
  if (!foto?.bucket || !foto?.path) return '';
  const { data, error } = await supabase.storage.from(foto.bucket).createSignedUrl(foto.path, 3600);
  if (error) throw new Error(error.message);
  return data?.signedUrl || '';
}

export async function validarRelatorioCco(relatorio, action, payload, user) {
  if (!relatorio?.id) throw new Error('Relatório inválido.');

  const map = {
    aprovar: { reportStatus: 'validado_cco', validationStatus: 'validado', auditAction: 'approve', title: 'Relatório aprovado pelo CCO' },
    rejeitar: { reportStatus: 'rejeitado_cco', validationStatus: 'nao_validado', auditAction: 'reject', title: 'Relatório rejeitado pelo CCO' },
    correcao: { reportStatus: 'correcao_solicitada', validationStatus: 'aguardando_correcao', auditAction: 'update', title: 'Correção solicitada pelo CCO' }
  };

  const config = map[action];
  if (!config) throw new Error('Ação CCO inválida.');
  if (['rejeitar', 'correcao'].includes(action) && !payload?.motivo?.trim()) {
    throw new Error('Informe o motivo antes de continuar.');
  }

  const validationPayload = {
    relatorio_id: relatorio.id,
    operador_cco_id: user?.id || null,
    status: config.validationStatus,
    comunicacao_status: payload?.comunicacao_status || null,
    protocolo: payload?.protocolo || null,
    motivo_devolucao: payload?.motivo || null,
    observacoes: payload?.observacoes || null,
    assinatura_digital: payload?.assinatura_digital || user?.nome || null,
    validado_em: new Date().toISOString()
  };

  const { error: validationError } = await supabase.from('validacoes_cco').insert(validationPayload);
  if (validationError) throw new Error(validationError.message);

  const { data: updated, error: updateError } = await supabase
    .from('relatorios_diarios')
    .update({ status: config.reportStatus, updated_at: new Date().toISOString() })
    .eq('id', relatorio.id)
    .select(REPORT_SELECT)
    .single();

  if (updateError) throw new Error(updateError.message);

  await registrarAuditoria(relatorio, updated, config.auditAction, user, payload);
  await gerarNotificacao(updated, config.title, payload?.motivo || payload?.observacoes || config.title);

  return updated;
}

export async function criarNotificacaoManual(relatorio, titulo, mensagem) {
  return gerarNotificacao(relatorio, titulo, mensagem);
}

async function buscarRelatorio(relatorioId) {
  const { data, error } = await supabase.from('relatorios_diarios').select(REPORT_SELECT).eq('id', relatorioId).single();
  if (error) throw new Error(error.message);
  return data;
}

async function listarSecoes(relatorioId) {
  const { data, error } = await supabase
    .from('relatorio_diario_secoes')
    .select('*')
    .eq('relatorio_id', relatorioId)
    .order('ordem', { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

async function listarItens(relatorioId) {
  const { data, error } = await supabase
    .from('relatorio_diario_itens')
    .select('*, equipamento:equipamentos(id,nome,tag,codigo)')
    .eq('relatorio_id', relatorioId)
    .order('tipo_item', { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

async function listarFotos(relatorioId) {
  const { data, error } = await supabase
    .from('anexos')
    .select('*')
    .eq('entidade_tipo', 'relatorio_diario')
    .eq('entidade_id', relatorioId)
    .eq('bucket', 'report-photos')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

async function listarValidacoes(relatorioId) {
  const { data, error } = await supabase
    .from('validacoes_cco')
    .select('*, operador_cco:usuarios!validacoes_cco_operador_cco_id_fkey(id,nome,usuario,perfil)')
    .eq('relatorio_id', relatorioId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

async function listarAuditoria(relatorioId) {
  const { data, error } = await supabase
    .from('auditoria')
    .select('*, usuario:usuarios(id,nome,usuario,perfil)')
    .eq('tabela', 'relatorios_diarios')
    .eq('registro_id', relatorioId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

async function registrarAuditoria(before, after, action, user, payload) {
  const { error } = await supabase.from('auditoria').insert({
    usuario_id: user?.id || null,
    tabela: 'relatorios_diarios',
    registro_id: before.id,
    acao: action,
    dados_anteriores: {
      status: before.status,
      motivo: payload?.motivo || null
    },
    dados_novos: {
      status: after.status,
      motivo: payload?.motivo || null,
      observacoes: payload?.observacoes || null
    }
  });
  if (error) throw new Error(error.message);
}

async function gerarNotificacao(relatorio, titulo, mensagem) {
  const { error } = await supabase.from('notificacoes').insert({
    usuario_id: relatorio.operador_id || null,
    perfil_destino: 'operador',
    titulo,
    mensagem,
    tipo: relatorio.status === 'validado_cco' ? 'sucesso' : relatorio.status === 'rejeitado_cco' ? 'erro' : 'alerta',
    entidade_tipo: 'relatorio_diario',
    entidade_id: relatorio.id
  });
  if (error) throw new Error(error.message);
}
