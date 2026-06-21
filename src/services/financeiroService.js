import { supabase } from '../lib/supabase.js';

export const CONTRATO_STATUS = [
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'ativo', label: 'Ativo' },
  { value: 'suspenso', label: 'Suspenso' },
  { value: 'encerrado', label: 'Encerrado' },
  { value: 'cancelado', label: 'Cancelado' }
];

export const MEDICAO_STATUS = [
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'enviada', label: 'Enviada' },
  { value: 'em_analise', label: 'Em analise' },
  { value: 'aprovada', label: 'Aprovada' },
  { value: 'glosada', label: 'Glosada' },
  { value: 'paga', label: 'Paga' },
  { value: 'cancelada', label: 'Cancelada' }
];

export const PREFEITURA_STATUS = [
  { value: 'nao_enviada', label: 'Nao enviada' },
  { value: 'enviada', label: 'Enviada' },
  { value: 'em_fiscalizacao', label: 'Em fiscalizacao' },
  { value: 'aprovada', label: 'Aprovada' },
  { value: 'reprovada', label: 'Reprovada' },
  { value: 'ajuste_solicitado', label: 'Ajuste solicitado' }
];

export const LANCAMENTO_STATUS = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'pago', label: 'Pago' },
  { value: 'cancelado', label: 'Cancelado' },
  { value: 'atrasado', label: 'Atrasado' }
];

export const LANCAMENTO_TIPOS = [
  { value: 'custo', label: 'Custo' },
  { value: 'pagamento', label: 'Pagamento' },
  { value: 'previsao', label: 'Previsao' },
  { value: 'glosa', label: 'Glosa' },
  { value: 'reembolso', label: 'Reembolso' }
];

export const AREAS_FINANCEIRAS = [
  { value: 'mecanica', label: 'Mecanica' },
  { value: 'eletrica', label: 'Eletrica' },
  { value: 'automacao', label: 'Automacao' },
  { value: 'operacao', label: 'Operacao' },
  { value: 'sst', label: 'SST' },
  { value: 'almoxarifado', label: 'Almoxarifado' },
  { value: 'administrativo', label: 'Administrativo' },
  { value: 'financeiro', label: 'Financeiro' }
];

const WRITE_ROLES = ['financeiro', 'gerencia', 'diretoria'];
const APPROVAL_ROLES = ['gerencia', 'diretoria'];

function normalizeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function emptyToNull(value) {
  return value === '' || value == null ? null : value;
}

function buildCode(prefix) {
  const date = new Date();
  const ymd = date.toISOString().slice(0, 10).replaceAll('-', '');
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${prefix}-${ymd}-${suffix}`;
}

export function podeGerenciarFinanceiro(perfil) {
  return WRITE_ROLES.includes(perfil);
}

export function podeAprovarFinanceiro(perfil) {
  return APPROVAL_ROLES.includes(perfil);
}

function requireManage(user) {
  if (!user?.id || !podeGerenciarFinanceiro(user?.perfil)) {
    throw new Error('Usuario sem permissao para gerenciar Financeiro/Contratos.');
  }
}

function requireApproval(user) {
  if (!user?.id || !podeAprovarFinanceiro(user?.perfil)) {
    throw new Error('Somente Gerencia ou Diretoria podem aprovar.');
  }
}

async function registrarHistorico(payload, user) {
  const { error } = await supabase.from('financeiro_historico').insert({
    entidade_tipo: payload.entidade_tipo,
    entidade_id: payload.entidade_id,
    usuario_id: user?.id || null,
    acao: payload.acao,
    status_anterior: payload.status_anterior || null,
    status_novo: payload.status_novo || null,
    descricao: payload.descricao || null,
    metadata: payload.metadata || {}
  });

  if (error) throw error;
}

async function registrarAuditoria(payload, user) {
  const { error } = await supabase.from('auditoria').insert({
    usuario_id: user?.id || null,
    tabela: payload.tabela,
    registro_id: payload.registro_id,
    acao: payload.acao,
    dados_anteriores: payload.dados_anteriores || null,
    dados_novos: payload.dados_novos || null
  });

  if (error) console.warn('Falha ao registrar auditoria financeira', error);
}

export async function listarApoioFinanceiro() {
  const [fornecedoresResult, ebapsResult, usuariosResult] = await Promise.all([
    supabase.from('fornecedores').select('id,nome,documento,ativo').is('deleted_at', null).order('nome', { ascending: true }),
    supabase.from('ebaps').select('id,codigo,nome,nome_curto,status,status_operacional').is('deleted_at', null).order('nome', { ascending: true }),
    supabase.from('usuarios').select('id,nome,usuario,perfil,setor,ativo').is('deleted_at', null).order('nome', { ascending: true })
  ]);

  if (fornecedoresResult.error) throw fornecedoresResult.error;
  if (ebapsResult.error) throw ebapsResult.error;
  if (usuariosResult.error) throw usuariosResult.error;

  return {
    fornecedores: fornecedoresResult.data || [],
    ebaps: ebapsResult.data || [],
    usuarios: usuariosResult.data || []
  };
}

export async function listarContratos(filters = {}) {
  let query = supabase
    .from('contratos')
    .select('*, fornecedor:fornecedores(id,nome,documento), ebap:ebaps(id,codigo,nome), gestor:usuarios!contratos_gestor_id_fkey(id,nome,usuario,perfil), fiscal:usuarios!contratos_fiscal_id_fkey(id,nome,usuario,perfil)')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.fornecedorId) query = query.eq('fornecedor_id', filters.fornecedorId);
  if (filters.ebapId) query = query.eq('ebap_id', filters.ebapId);
  if (filters.search?.trim()) {
    const term = filters.search.trim();
    query = query.or(`numero.ilike.%${term}%,objeto.ilike.%${term}%,observacoes.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function listarMedicoes(filters = {}) {
  let query = supabase
    .from('medicoes')
    .select('*, contrato:contratos(id,numero,objeto,status), ebap:ebaps(id,codigo,nome), responsavel:usuarios!medicoes_responsavel_id_fkey(id,nome,usuario,perfil)')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.prefeituraStatus) query = query.eq('prefeitura_status', filters.prefeituraStatus);
  if (filters.contratoId) query = query.eq('contrato_id', filters.contratoId);
  if (filters.ebapId) query = query.eq('ebap_id', filters.ebapId);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function listarLancamentos(filters = {}) {
  let query = supabase
    .from('financeiro_lancamentos')
    .select('*, contrato:contratos(id,numero,objeto), medicao:medicoes(id,codigo,numero,status), fornecedor:fornecedores(id,nome,documento), ebap:ebaps(id,codigo,nome)')
    .is('deleted_at', null)
    .order('vencimento', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.tipo) query = query.eq('tipo', filters.tipo);
  if (filters.contratoId) query = query.eq('contrato_id', filters.contratoId);
  if (filters.ebapId) query = query.eq('ebap_id', filters.ebapId);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function listarDocumentosFinanceiros() {
  const { data, error } = await supabase
    .from('financeiro_documentos')
    .select('*, uploaded_by_user:usuarios!financeiro_documentos_uploaded_by_fkey(id,nome,usuario)')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) throw error;
  return data || [];
}

export async function listarHistoricoFinanceiro(limit = 120) {
  const { data, error } = await supabase
    .from('financeiro_historico')
    .select('*, usuario:usuarios(id,nome,usuario,perfil)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function obterDashboardFinanceiro() {
  const [contratosResult, medicoesResult, lancamentosResult] = await Promise.all([
    supabase.from('contratos').select('id,status,valor_total,valor_executado,data_fim,deleted_at').is('deleted_at', null),
    supabase.from('medicoes').select('id,status,prefeitura_status,valor_medido,valor_aprovado,valor_glosa,competencia_mes,competencia_ano,deleted_at').is('deleted_at', null),
    supabase.from('financeiro_lancamentos').select('id,tipo,status,valor,vencimento,pago_em,deleted_at').is('deleted_at', null)
  ]);

  if (contratosResult.error) throw contratosResult.error;
  if (medicoesResult.error) throw medicoesResult.error;
  if (lancamentosResult.error) throw lancamentosResult.error;

  const contratos = contratosResult.data || [];
  const medicoes = medicoesResult.data || [];
  const lancamentos = lancamentosResult.data || [];
  const today = new Date().toISOString().slice(0, 10);

  const valorContratado = contratos.reduce((sum, row) => sum + normalizeNumber(row.valor_total), 0);
  const valorExecutado = contratos.reduce((sum, row) => sum + normalizeNumber(row.valor_executado), 0);
  const valorMedido = medicoes.reduce((sum, row) => sum + normalizeNumber(row.valor_medido), 0);
  const valorAprovado = medicoes.reduce((sum, row) => sum + normalizeNumber(row.valor_aprovado), 0);
  const valorPendente = lancamentos
    .filter((row) => ['pendente', 'aprovado', 'atrasado'].includes(row.status))
    .reduce((sum, row) => sum + normalizeNumber(row.valor), 0);

  return {
    contratosAtivos: contratos.filter((row) => row.status === 'ativo').length,
    contratosVencendo: contratos.filter((row) => row.data_fim && row.data_fim >= today && daysUntil(row.data_fim) <= 60).length,
    medicoesPendentes: medicoes.filter((row) => ['enviada', 'em_analise'].includes(row.status)).length,
    medicoesPrefeitura: medicoes.filter((row) => ['enviada', 'em_fiscalizacao', 'ajuste_solicitado'].includes(row.prefeitura_status)).length,
    lancamentosPendentes: lancamentos.filter((row) => ['pendente', 'atrasado'].includes(row.status)).length,
    lancamentosAtrasados: lancamentos.filter((row) => row.status === 'atrasado' || (row.status === 'pendente' && row.vencimento && row.vencimento < today)).length,
    valorContratado,
    valorExecutado,
    valorMedido,
    valorAprovado,
    valorPendente,
    saldoContratual: Math.max(valorContratado - valorExecutado, 0)
  };
}

function daysUntil(dateText) {
  const now = new Date();
  const date = new Date(`${dateText}T00:00:00`);
  return Math.ceil((date.getTime() - now.getTime()) / 86400000);
}

export async function salvarContrato(payload, user) {
  requireManage(user);
  if (!payload.numero?.trim()) throw new Error('Informe o numero do contrato.');
  if (!payload.objeto?.trim() || payload.objeto.trim().length < 5) throw new Error('Informe o objeto do contrato.');

  const row = {
    numero: payload.numero.trim(),
    fornecedor_id: emptyToNull(payload.fornecedor_id),
    ebap_id: emptyToNull(payload.ebap_id),
    tipo: payload.tipo || 'prestacao_servico',
    objeto: payload.objeto.trim(),
    valor_total: normalizeNumber(payload.valor_total),
    valor_executado: normalizeNumber(payload.valor_executado),
    data_assinatura: emptyToNull(payload.data_assinatura),
    data_inicio: emptyToNull(payload.data_inicio),
    data_fim: emptyToNull(payload.data_fim),
    status: payload.status || 'ativo',
    gestor_id: emptyToNull(payload.gestor_id),
    fiscal_id: emptyToNull(payload.fiscal_id),
    fiscalizacao_status: payload.fiscalizacao_status || 'pendente',
    observacoes: payload.observacoes || null,
    created_by: payload.id ? payload.created_by || user.id : user.id
  };

  const query = payload.id
    ? supabase.from('contratos').update(row).eq('id', payload.id).select().single()
    : supabase.from('contratos').insert(row).select().single();

  const { data, error } = await query;
  if (error) throw error;

  await registrarHistorico({
    entidade_tipo: 'contrato',
    entidade_id: data.id,
    acao: payload.id ? 'UPDATE' : 'CREATE',
    status_novo: data.status,
    descricao: payload.id ? 'Contrato atualizado.' : 'Contrato cadastrado.',
    metadata: { numero: data.numero }
  }, user);
  await registrarAuditoria({ tabela: 'contratos', registro_id: data.id, acao: payload.id ? 'UPDATE' : 'INSERT', dados_novos: data }, user);
  return data;
}

export async function salvarMedicao(payload, user) {
  requireManage(user);
  if (!payload.contrato_id) throw new Error('Selecione o contrato da medicao.');
  if (!payload.competencia_mes || !payload.competencia_ano) throw new Error('Informe a competencia da medicao.');

  const row = {
    contrato_id: payload.contrato_id,
    codigo: payload.codigo?.trim() || buildCode('MED'),
    numero: payload.numero?.trim() || null,
    ebap_id: emptyToNull(payload.ebap_id),
    competencia_mes: Number(payload.competencia_mes),
    competencia_ano: Number(payload.competencia_ano),
    data_inicio: emptyToNull(payload.data_inicio),
    data_fim: emptyToNull(payload.data_fim),
    valor_medido: normalizeNumber(payload.valor_medido),
    valor_aprovado: payload.valor_aprovado === '' || payload.valor_aprovado == null ? null : normalizeNumber(payload.valor_aprovado),
    valor_glosa: normalizeNumber(payload.valor_glosa),
    percentual_execucao: normalizeNumber(payload.percentual_execucao),
    status: payload.status || 'rascunho',
    prefeitura_status: payload.prefeitura_status || 'nao_enviada',
    resumo: payload.resumo || null,
    responsavel_id: emptyToNull(payload.responsavel_id),
    created_by: payload.id ? payload.created_by || user.id : user.id
  };

  const query = payload.id
    ? supabase.from('medicoes').update(row).eq('id', payload.id).select().single()
    : supabase.from('medicoes').insert(row).select().single();

  const { data, error } = await query;
  if (error) throw error;

  await registrarHistorico({
    entidade_tipo: 'medicao',
    entidade_id: data.id,
    acao: payload.id ? 'UPDATE' : 'CREATE',
    status_novo: data.status,
    descricao: payload.id ? 'Medicao atualizada.' : 'Medicao cadastrada.',
    metadata: { codigo: data.codigo, competencia: `${data.competencia_mes}/${data.competencia_ano}` }
  }, user);
  await registrarAuditoria({ tabela: 'medicoes', registro_id: data.id, acao: payload.id ? 'UPDATE' : 'INSERT', dados_novos: data }, user);
  return data;
}

export async function salvarLancamento(payload, user) {
  requireManage(user);
  if (!payload.descricao?.trim() || payload.descricao.trim().length < 5) throw new Error('Informe a descricao do lancamento.');
  if (normalizeNumber(payload.valor) <= 0) throw new Error('Informe valor maior que zero.');

  const row = {
    contrato_id: emptyToNull(payload.contrato_id),
    compra_id: emptyToNull(payload.compra_id),
    medicao_id: emptyToNull(payload.medicao_id),
    fornecedor_id: emptyToNull(payload.fornecedor_id),
    ebap_id: emptyToNull(payload.ebap_id),
    tipo: payload.tipo || 'custo',
    categoria: payload.categoria || null,
    descricao: payload.descricao.trim(),
    valor: normalizeNumber(payload.valor),
    vencimento: emptyToNull(payload.vencimento),
    pago_em: emptyToNull(payload.pago_em),
    data_emissao: emptyToNull(payload.data_emissao),
    competencia_mes: emptyToNull(payload.competencia_mes),
    competencia_ano: emptyToNull(payload.competencia_ano),
    forma_pagamento: payload.forma_pagamento || null,
    status: payload.status || 'pendente',
    observacoes: payload.observacoes || null,
    created_by: payload.id ? payload.created_by || user.id : user.id
  };

  const query = payload.id
    ? supabase.from('financeiro_lancamentos').update(row).eq('id', payload.id).select().single()
    : supabase.from('financeiro_lancamentos').insert(row).select().single();

  const { data, error } = await query;
  if (error) throw error;

  await registrarHistorico({
    entidade_tipo: 'lancamento',
    entidade_id: data.id,
    acao: payload.id ? 'UPDATE' : 'CREATE',
    status_novo: data.status,
    descricao: payload.id ? 'Lancamento atualizado.' : 'Lancamento financeiro criado.',
    metadata: { valor: data.valor, tipo: data.tipo }
  }, user);
  await registrarAuditoria({ tabela: 'financeiro_lancamentos', registro_id: data.id, acao: payload.id ? 'UPDATE' : 'INSERT', dados_novos: data }, user);
  return data;
}

export async function aprovarFinanceiro(payload, user) {
  requireApproval(user);
  const table = payload.entidade_tipo === 'contrato' ? 'contratos' : payload.entidade_tipo === 'medicao' ? 'medicoes' : 'financeiro_lancamentos';
  const nextStatus = payload.status_novo;
  if (!payload.id || !nextStatus) throw new Error('Informe o registro e o novo status.');
  if (['cancelado', 'glosada', 'reprovada'].includes(nextStatus) && (!payload.motivo?.trim() || payload.motivo.trim().length < 5)) {
    throw new Error('Motivo obrigatorio para reprovar, glosar ou cancelar.');
  }

  const { data: current, error: currentError } = await supabase.from(table).select('*').eq('id', payload.id).single();
  if (currentError) throw currentError;

  const patch = {
    status: nextStatus,
    aprovado_por: user.id,
    aprovado_em: new Date().toISOString()
  };

  if (payload.entidade_tipo === 'medicao' && payload.prefeitura_status) {
    patch.prefeitura_status = payload.prefeitura_status;
    patch.fiscalizado_por = user.id;
    patch.fiscalizado_em = new Date().toISOString();
  }

  const { data, error } = await supabase.from(table).update(patch).eq('id', payload.id).select().single();
  if (error) throw error;

  await registrarHistorico({
    entidade_tipo: payload.entidade_tipo,
    entidade_id: payload.id,
    acao: 'APPROVAL',
    status_anterior: current.status,
    status_novo: nextStatus,
    descricao: payload.motivo || 'Aprovacao registrada.',
    metadata: { prefeitura_status: payload.prefeitura_status || null }
  }, user);
  await registrarAuditoria({ tabela: table, registro_id: payload.id, acao: 'APPROVAL', dados_anteriores: current, dados_novos: data }, user);
  return data;
}

export async function excluirFinanceiro(payload, user) {
  requireManage(user);
  const table = payload.entidade_tipo === 'contrato' ? 'contratos' : payload.entidade_tipo === 'medicao' ? 'medicoes' : 'financeiro_lancamentos';
  const { data, error } = await supabase
    .from(table)
    .update({ deleted_at: new Date().toISOString(), deleted_by: user.id })
    .eq('id', payload.id)
    .select()
    .single();

  if (error) throw error;
  await registrarHistorico({
    entidade_tipo: payload.entidade_tipo,
    entidade_id: payload.id,
    acao: 'DELETE',
    status_anterior: data.status,
    descricao: payload.motivo || 'Registro removido do modulo financeiro.'
  }, user);
  return data;
}

export async function uploadDocumentoFinanceiro({ entidade_tipo, entidade_id, file }, user) {
  requireManage(user);
  if (!entidade_tipo || !entidade_id || !file) throw new Error('Selecione o registro e o arquivo.');

  const cleanName = file.name.replace(/[^\w.\-]+/g, '_');
  const path = `${entidade_tipo}/${entidade_id}/${Date.now()}-${cleanName}`;
  const { error: uploadError } = await supabase.storage.from('contract-files').upload(path, file, {
    cacheControl: '3600',
    upsert: false
  });

  if (uploadError) throw uploadError;

  const { data, error } = await supabase.from('financeiro_documentos').insert({
    entidade_tipo,
    entidade_id,
    nome: file.name,
    bucket: 'contract-files',
    path,
    mime_type: file.type || null,
    tamanho_bytes: file.size || null,
    uploaded_by: user.id
  }).select().single();

  if (error) throw error;

  await registrarHistorico({
    entidade_tipo,
    entidade_id,
    acao: 'UPLOAD',
    descricao: `Documento anexado: ${file.name}`,
    metadata: { documento_id: data.id, path }
  }, user);
  return data;
}

export async function gerarUrlDocumentoFinanceiro(documento, expiresIn = 3600) {
  const { data, error } = await supabase.storage.from(documento.bucket).createSignedUrl(documento.path, expiresIn);
  if (error) throw error;
  return data?.signedUrl || '';
}
