import { supabase } from '../lib/supabase.js';

export const APR_STATUS = ['rascunho', 'em_analise', 'liberada', 'reprovada', 'encerrada', 'cancelada'];
export const TREINAMENTO_STATUS = ['pendente', 'valido', 'vencendo', 'vencido', 'dispensado'];

export function podeGerenciarSst(perfil) {
  return ['sst', 'supervisor', 'gerencia', 'diretoria'].includes(perfil);
}

export function podeCadastrarBaseSst(perfil) {
  return ['sst', 'gerencia', 'diretoria'].includes(perfil);
}

function validateUser(user) {
  if (!user?.id || !podeGerenciarSst(user?.perfil)) {
    throw new Error('Usuario sem permissao para gerenciar SST.');
  }
}

function normalizeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function emptyToNull(value) {
  return value === '' || value == null ? null : value;
}

export async function listarFuncionariosSst() {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id,nome,usuario,perfil,setor,ativo')
    .eq('ativo', true)
    .is('deleted_at', null)
    .order('nome', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function listarEbapsSst() {
  const { data, error } = await supabase
    .from('ebaps')
    .select('id,codigo,nome')
    .eq('ativa', true)
    .is('deleted_at', null)
    .order('nome', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function listarEpis(filters = {}) {
  let query = supabase
    .from('epi_itens')
    .select('*')
    .is('deleted_at', null)
    .order('nome', { ascending: true });

  if (filters.ativos !== false) {
    query = query.eq('ativo', true);
  }

  if (filters.search?.trim()) {
    const term = filters.search.trim();
    query = query.or(`codigo.ilike.%${term}%,nome.ilike.%${term}%,ca.ilike.%${term}%,categoria.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function listarEntregasEpi(limit = 50) {
  const { data, error } = await supabase
    .from('epi_entregas')
    .select('*, epi:epi_itens(id,codigo,nome,ca), funcionario:usuarios!epi_entregas_funcionario_id_fkey(id,nome,usuario,perfil)')
    .is('deleted_at', null)
    .order('entregue_em', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function listarTreinamentos(filters = {}) {
  let query = supabase
    .from('treinamentos')
    .select('*')
    .is('deleted_at', null)
    .order('nome', { ascending: true });

  if (filters.ativos !== false) {
    query = query.eq('ativo', true);
  }

  if (filters.search?.trim()) {
    const term = filters.search.trim();
    query = query.or(`codigo.ilike.%${term}%,nome.ilike.%${term}%,norma.ilike.%${term}%,categoria.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function listarFuncionarioTreinamentos(limit = 80) {
  const { data, error } = await supabase
    .from('funcionario_treinamentos')
    .select('*, treinamento:treinamentos(id,codigo,nome,norma,validade_meses), funcionario:usuarios!funcionario_treinamentos_funcionario_id_fkey(id,nome,usuario,perfil)')
    .is('deleted_at', null)
    .order('valido_ate', { ascending: true, nullsFirst: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function listarAprs(limit = 80) {
  const { data, error } = await supabase
    .from('apr')
    .select('*, ebap:ebaps(id,codigo,nome), responsavel:usuarios!apr_responsavel_id_fkey(id,nome,usuario,perfil)')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function obterDashboardSst() {
  const [epis, entregas, treinamentos, funcionarioTreinamentos, aprs] = await Promise.all([
    listarEpis({ ativos: true }),
    listarEntregasEpi(200),
    listarTreinamentos({ ativos: true }),
    listarFuncionarioTreinamentos(500),
    listarAprs(200)
  ]);

  const hoje = new Date().toISOString().slice(0, 10);
  const em30Dias = new Date();
  em30Dias.setDate(em30Dias.getDate() + 30);
  const limite = em30Dias.toISOString().slice(0, 10);

  const treinamentosVencidos = funcionarioTreinamentos.filter((row) => row.valido_ate && row.valido_ate < hoje);
  const treinamentosVencendo = funcionarioTreinamentos.filter((row) => row.valido_ate && row.valido_ate >= hoje && row.valido_ate <= limite);
  const caVencidos = epis.filter((epi) => epi.validade_ca && epi.validade_ca < hoje);
  const caVencendo = epis.filter((epi) => epi.validade_ca && epi.validade_ca >= hoje && epi.validade_ca <= limite);
  const aprAbertas = aprs.filter((apr) => !['encerrada', 'cancelada'].includes(apr.status));

  return {
    totalEpis: epis.length,
    entregasHoje: entregas.filter((entrega) => entrega.entregue_em === hoje).length,
    treinamentos: treinamentos.length,
    treinamentosVencidos: treinamentosVencidos.length,
    treinamentosVencendo: treinamentosVencendo.length,
    caVencidos: caVencidos.length,
    caVencendo: caVencendo.length,
    aprAbertas: aprAbertas.length,
    alertas: treinamentosVencidos.length + treinamentosVencendo.length + caVencidos.length + caVencendo.length,
    alertasLista: [
      ...treinamentosVencidos.slice(0, 8).map((row) => ({ tipo: 'Treinamento vencido', titulo: row.treinamento?.nome, pessoa: row.funcionario?.nome, data: row.valido_ate, severidade: 'red' })),
      ...treinamentosVencendo.slice(0, 8).map((row) => ({ tipo: 'Treinamento vencendo', titulo: row.treinamento?.nome, pessoa: row.funcionario?.nome, data: row.valido_ate, severidade: 'orange' })),
      ...caVencidos.slice(0, 8).map((epi) => ({ tipo: 'CA vencido', titulo: epi.nome, pessoa: epi.ca, data: epi.validade_ca, severidade: 'red' })),
      ...caVencendo.slice(0, 8).map((epi) => ({ tipo: 'CA vencendo', titulo: epi.nome, pessoa: epi.ca, data: epi.validade_ca, severidade: 'orange' }))
    ].slice(0, 12)
  };
}

export async function salvarEpi(payload, user) {
  validateUser(user);

  const { data, error } = await supabase.rpc('sst_salvar_epi', {
    p_user_id: user.id,
    p_id: payload.id || null,
    p_codigo: payload.codigo,
    p_nome: payload.nome,
    p_ca: payload.ca || null,
    p_validade_ca: emptyToNull(payload.validade_ca),
    p_categoria: payload.categoria || null,
    p_fabricante: payload.fabricante || null,
    p_estoque_minimo: Number(payload.estoque_minimo || 0),
    p_ativo: payload.ativo !== false
  });

  if (error) throw error;
  return data;
}

export async function registrarEntregaEpi(payload, user) {
  validateUser(user);

  const { data, error } = await supabase.rpc('sst_registrar_entrega_epi', {
    p_user_id: user.id,
    p_epi_id: payload.epi_id,
    p_funcionario_id: payload.funcionario_id,
    p_quantidade: Number(payload.quantidade || 1),
    p_entregue_em: emptyToNull(payload.entregue_em),
    p_validade_uso: emptyToNull(payload.validade_uso),
    p_os_id: emptyToNull(payload.os_id),
    p_observacoes: payload.observacoes || null
  });

  if (error) throw error;
  return data;
}

export async function salvarTreinamento(payload, user) {
  validateUser(user);

  const { data, error } = await supabase.rpc('sst_salvar_treinamento', {
    p_user_id: user.id,
    p_id: payload.id || null,
    p_codigo: payload.codigo,
    p_nome: payload.nome,
    p_norma: payload.norma || null,
    p_categoria: payload.categoria || null,
    p_carga_horaria: normalizeNumber(payload.carga_horaria),
    p_validade_meses: payload.validade_meses ? Number(payload.validade_meses) : null,
    p_obrigatorio: payload.obrigatorio !== false,
    p_ativo: payload.ativo !== false
  });

  if (error) throw error;
  return data;
}

export async function registrarFuncionarioTreinamento(payload, user) {
  validateUser(user);

  const { data, error } = await supabase.rpc('sst_registrar_funcionario_treinamento', {
    p_user_id: user.id,
    p_treinamento_id: payload.treinamento_id,
    p_funcionario_id: payload.funcionario_id,
    p_realizado_em: emptyToNull(payload.realizado_em),
    p_valido_ate: emptyToNull(payload.valido_ate),
    p_os_id: emptyToNull(payload.os_id),
    p_observacoes: payload.observacoes || null,
    p_status: payload.status || null
  });

  if (error) throw error;
  return data;
}

export async function salvarApr(payload, user) {
  validateUser(user);

  const { data, error } = await supabase.rpc('sst_salvar_apr', {
    p_user_id: user.id,
    p_id: payload.id || null,
    p_codigo: payload.codigo,
    p_os_id: emptyToNull(payload.os_id),
    p_ebap_id: emptyToNull(payload.ebap_id),
    p_atividade: payload.atividade,
    p_local_atividade: payload.local_atividade || null,
    p_riscos: payload.riscos || null,
    p_medidas_controle: payload.medidas_controle || null,
    p_epis_obrigatorios: payload.epis_obrigatorios || null,
    p_responsavel_id: emptyToNull(payload.responsavel_id),
    p_status: payload.status || 'rascunho',
    p_inicio_previsto: emptyToNull(payload.inicio_previsto),
    p_fim_previsto: emptyToNull(payload.fim_previsto),
    p_observacoes: payload.observacoes || null
  });

  if (error) throw error;
  return data;
}
