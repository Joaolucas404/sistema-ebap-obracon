import { supabase } from '../lib/supabase.js';
import { OS_AREAS, OS_PRIORIDADES } from './osService.js';

export const CCO_OS_STATUS = [
  { value: 'pendente_cco', label: 'Pendente CCO' },
  { value: 'aprovada_cco', label: 'Aprovada CCO' },
  { value: 'rejeitada_cco', label: 'Rejeitada CCO' },
  { value: 'correcao_solicitada_cco', label: 'Correcao solicitada' }
];

export const CCO_OS_ORIGENS = [
  { value: 'operacao', label: 'Operacao' },
  { value: 'prefeitura', label: 'Prefeitura' },
  { value: 'manutencao', label: 'Manutencao' },
  { value: 'sst', label: 'SST' },
  { value: 'almoxarifado', label: 'Almoxarifado' },
  { value: 'administrativo', label: 'Administrativo' }
];

export { OS_AREAS, OS_PRIORIDADES };

const OS_CCO_SELECT = `
  *,
  ebap:ebaps(id,codigo,nome,nome_curto,status),
  solicitante:usuarios!ordens_servico_solicitante_id_fkey(id,nome,usuario,perfil,setor),
  responsavel:usuarios!ordens_servico_responsavel_id_fkey(id,nome,usuario,perfil,setor)
`;

function today() {
  return new Date().toISOString().slice(0, 10);
}

function startOfDay(date = today()) {
  return `${date}T00:00:00`;
}

function endOfDay(date = today()) {
  return `${date}T23:59:59`;
}

export function podeValidarCcoOS(perfil) {
  return ['cco', 'gerencia', 'diretoria'].includes(perfil);
}

export async function listarEbapsCcoOS() {
  const { data, error } = await supabase
    .from('ebaps')
    .select('id,codigo,nome,nome_curto,status')
    .is('deleted_at', null)
    .order('nome');

  if (error) throw error;
  return data || [];
}

export async function listarFilaCcoOS(filters = {}) {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 10;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('ordens_servico')
    .select(OS_CCO_SELECT, { count: 'exact' })
    .is('deleted_at', null)
    .in('status', ['pendente_cco', 'aprovada_cco', 'rejeitada_cco', 'correcao_solicitada_cco'])
    .order('created_at', { ascending: false })
    .range(from, to);

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.ebapId) query = query.eq('ebap_id', filters.ebapId);
  if (filters.area) query = query.eq('area', filters.area);
  if (filters.prioridade) query = query.eq('prioridade', filters.prioridade);
  if (filters.origem) query = query.eq('origem', filters.origem);
  if (filters.data) {
    query = query.gte('created_at', startOfDay(filters.data)).lte('created_at', endOfDay(filters.data));
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data || [], count: count || 0 };
}

export async function obterDashboardCcoOS() {
  const { data, error } = await supabase
    .from('ordens_servico')
    .select('id,status,prioridade,created_at,deleted_at')
    .is('deleted_at', null)
    .in('status', ['pendente_cco', 'aprovada_cco', 'rejeitada_cco', 'correcao_solicitada_cco']);

  if (error) throw error;

  const { data: validacoes, error: validacoesError } = await supabase
    .from('validacoes_cco')
    .select('id,status,created_at')
    .not('os_id', 'is', null)
    .gte('created_at', startOfDay())
    .lte('created_at', endOfDay());

  if (validacoesError) throw validacoesError;

  const rows = data || [];
  const validations = validacoes || [];

  return {
    aguardandoAnalise: rows.filter((os) => os.status === 'pendente_cco').length,
    aprovadasHoje: validations.filter((item) => item.status === 'aprovada_os').length,
    rejeitadasHoje: validations.filter((item) => item.status === 'rejeitada_os').length,
    devolvidasCorrecao: rows.filter((os) => os.status === 'correcao_solicitada_cco').length,
    criticasPendentes: rows.filter((os) => os.status === 'pendente_cco' && os.prioridade === 'critica').length,
    total: rows.length
  };
}

export async function buscarDetalheCcoOS(osId) {
  const { data: os, error: osError } = await supabase
    .from('ordens_servico')
    .select(OS_CCO_SELECT)
    .eq('id', osId)
    .single();

  if (osError) throw osError;

  const [historico, comentarios, anexos, validacoes] = await Promise.all([
    listarHistoricoCcoOS(osId),
    listarComentariosCcoOS(osId),
    listarAnexosCcoOS(osId),
    listarValidacoesCcoOS(osId)
  ]);

  return { os, historico, comentarios, anexos, validacoes };
}

export async function listarHistoricoCcoOS(osId) {
  const { data, error } = await supabase
    .from('os_historico')
    .select('*, usuario:usuarios!os_historico_usuario_id_fkey(id,nome,usuario,perfil)')
    .eq('os_id', osId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function listarComentariosCcoOS(osId) {
  const { data, error } = await supabase
    .from('comentarios')
    .select('*, usuario:usuarios!comentarios_usuario_id_fkey(id,nome,usuario,perfil)')
    .eq('entidade_tipo', 'ordem_servico')
    .eq('entidade_id', osId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function listarAnexosCcoOS(osId) {
  const { data, error } = await supabase
    .from('anexos')
    .select('*, uploaded_by_user:usuarios!anexos_uploaded_by_fkey(id,nome,usuario)')
    .eq('entidade_tipo', 'ordem_servico')
    .eq('entidade_id', osId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function listarValidacoesCcoOS(osId) {
  const { data, error } = await supabase
    .from('validacoes_cco')
    .select('*, operador:usuarios!validacoes_cco_operador_cco_id_fkey(id,nome,usuario,perfil)')
    .eq('os_id', osId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function validarCcoOS(payload, user) {
  if (!user?.id || !podeValidarCcoOS(user?.perfil)) {
    throw new Error('Usuario sem permissao para validar OS no CCO.');
  }

  if (['rejeitar', 'corrigir'].includes(payload.acao) && (!payload.motivo?.trim() || payload.motivo.trim().length < 5)) {
    throw new Error('Motivo obrigatorio com pelo menos 5 caracteres.');
  }

  const { data, error } = await supabase.rpc('cco_validar_os', {
    p_user_id: user.id,
    p_os_id: payload.osId,
    p_acao: payload.acao,
    p_motivo: payload.motivo || null
  });

  if (error) throw error;
  return data;
}
