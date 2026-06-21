import { supabase } from '../lib/supabase.js';

const ROLES = ['administrativo', 'gerencia', 'diretoria'];

function canManage(user) {
  return ROLES.includes(user?.perfil);
}

function requireManage(user) {
  if (!user?.id || !canManage(user)) throw new Error('Usuario sem permissao para gerenciar Administrativo.');
}

function emptyToNull(value) {
  return value === '' || value == null ? null : value;
}

function numberOrZero(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function historico(entidade_tipo, entidade_id, acao, descricao, user, extra = {}) {
  const { error } = await supabase.from('adm_historico').insert({
    entidade_tipo,
    entidade_id,
    usuario_id: user?.id || null,
    acao,
    descricao,
    status_anterior: extra.status_anterior || null,
    status_novo: extra.status_novo || null,
    metadata: extra.metadata || {}
  });
  if (error) console.warn('Falha ao registrar historico administrativo', error);
}

async function audit(tabela, registro_id, acao, user, dados_novos) {
  const { error } = await supabase.from('auditoria').insert({
    usuario_id: user?.id || null,
    tabela,
    registro_id,
    acao,
    dados_novos
  });
  if (error) console.warn('Falha ao registrar auditoria administrativa', error);
}

export function podeGerenciarAdministrativo(perfil) {
  return ROLES.includes(perfil);
}

export async function carregarApoioAdministrativo() {
  const [usuarios, sstColaboradores, fornecedores, manutencoes] = await Promise.all([
    supabase.from('usuarios').select('id,nome,usuario,perfil,setor,ativo').is('deleted_at', null).order('nome'),
    supabase.from('sst_colaboradores').select('id,nome,matricula,funcao,setor,status').is('deleted_at', null).order('nome'),
    supabase.from('fornecedores').select('id,nome,documento,ativo').is('deleted_at', null).order('nome'),
    supabase.from('manutencao_execucoes').select('id,status,data_programada,data_execucao,observacoes,plano:manutencao_planos(id,codigo,nome)').is('deleted_at', null).order('created_at', { ascending: false }).limit(100)
  ]);

  if (usuarios.error) throw usuarios.error;
  if (sstColaboradores.error) throw sstColaboradores.error;
  if (fornecedores.error) throw fornecedores.error;
  if (manutencoes.error) throw manutencoes.error;

  return {
    usuarios: usuarios.data || [],
    sstColaboradores: sstColaboradores.data || [],
    fornecedores: fornecedores.data || [],
    manutencoes: manutencoes.data || []
  };
}

export async function listarAdministrativo() {
  const [colaboradores, ferias, atestados, documentos, veiculos, frotaManutencoes, historicoRows] = await Promise.all([
    supabase.from('adm_colaboradores').select('*, usuario:usuarios!adm_colaboradores_usuario_id_fkey(id,nome,usuario,perfil), sst_colaborador:sst_colaboradores!adm_colaboradores_sst_colaborador_id_fkey(id,nome,matricula,status)').is('deleted_at', null).order('nome'),
    supabase.from('adm_ferias').select('*, colaborador:adm_colaboradores(id,nome,matricula,cargo,setor)').is('deleted_at', null).order('inicio', { ascending: false }),
    supabase.from('adm_atestados').select('*, colaborador:adm_colaboradores(id,nome,matricula,cargo,setor)').is('deleted_at', null).order('inicio', { ascending: false }),
    supabase.from('adm_documentos').select('*, uploaded_by_user:usuarios!adm_documentos_uploaded_by_fkey(id,nome,usuario)').is('deleted_at', null).order('created_at', { ascending: false }),
    supabase.from('adm_veiculos').select('*, responsavel:usuarios!adm_veiculos_responsavel_id_fkey(id,nome,usuario,perfil)').is('deleted_at', null).order('placa'),
    supabase.from('adm_frota_manutencoes').select('*, veiculo:adm_veiculos(id,placa,prefixo,modelo), fornecedor:fornecedores(id,nome), manutencao:manutencao_execucoes(id,status,data_programada)').is('deleted_at', null).order('data_programada', { ascending: true, nullsFirst: false }),
    supabase.from('adm_historico').select('*, usuario:usuarios!adm_historico_usuario_id_fkey(id,nome,usuario,perfil)').order('created_at', { ascending: false }).limit(120)
  ]);

  for (const result of [colaboradores, ferias, atestados, documentos, veiculos, frotaManutencoes, historicoRows]) {
    if (result.error) throw result.error;
  }

  return {
    colaboradores: colaboradores.data || [],
    ferias: ferias.data || [],
    atestados: atestados.data || [],
    documentos: documentos.data || [],
    veiculos: veiculos.data || [],
    frotaManutencoes: frotaManutencoes.data || [],
    historico: historicoRows.data || []
  };
}

export async function obterDashboardAdministrativo() {
  const data = await listarAdministrativo();
  const today = new Date().toISOString().slice(0, 10);
  const in30 = new Date();
  in30.setDate(in30.getDate() + 30);
  const limit = in30.toISOString().slice(0, 10);

  return {
    colaboradoresAtivos: data.colaboradores.filter((row) => row.status === 'ativo').length,
    colaboradoresFerias: data.colaboradores.filter((row) => row.status === 'ferias').length,
    atestadosMes: data.atestados.filter((row) => row.inicio?.slice(0, 7) === today.slice(0, 7)).length,
    documentosVencendo: data.documentos.filter((row) => row.validade && row.validade >= today && row.validade <= limit && row.status !== 'arquivado').length,
    veiculosOperacionais: data.veiculos.filter((row) => row.status === 'operacional').length,
    frotaManutencao: data.veiculos.filter((row) => row.status === 'manutencao').length,
    manutencoesAtrasadas: data.frotaManutencoes.filter((row) => row.status !== 'concluida' && row.data_programada && row.data_programada < today).length,
    alertas: [
      ...data.documentos.filter((row) => row.validade && row.validade <= limit && row.status !== 'arquivado').map((row) => ({ tipo: 'documento', titulo: row.nome, data: row.validade, status: row.validade < today ? 'vencido' : 'vencendo' })),
      ...data.veiculos.filter((row) => row.licenciamento_validade && row.licenciamento_validade <= limit).map((row) => ({ tipo: 'licenciamento', titulo: row.placa, data: row.licenciamento_validade, status: row.licenciamento_validade < today ? 'vencido' : 'vencendo' })),
      ...data.veiculos.filter((row) => row.seguro_validade && row.seguro_validade <= limit).map((row) => ({ tipo: 'seguro', titulo: row.placa, data: row.seguro_validade, status: row.seguro_validade < today ? 'vencido' : 'vencendo' }))
    ].sort((a, b) => String(a.data).localeCompare(String(b.data))).slice(0, 12)
  };
}

export async function salvarColaborador(payload, user) {
  requireManage(user);
  if (!payload.nome?.trim()) throw new Error('Informe o nome do colaborador.');
  const row = {
    usuario_id: emptyToNull(payload.usuario_id),
    sst_colaborador_id: emptyToNull(payload.sst_colaborador_id),
    matricula: payload.matricula || null,
    nome: payload.nome.trim(),
    cpf: payload.cpf || null,
    cargo: payload.cargo || null,
    setor: payload.setor || null,
    tipo_contrato: payload.tipo_contrato || 'clt',
    admissao_em: emptyToNull(payload.admissao_em),
    desligamento_em: emptyToNull(payload.desligamento_em),
    salario_base: numberOrZero(payload.salario_base),
    status: payload.status || 'ativo',
    telefone: payload.telefone || null,
    email: payload.email || null,
    endereco: payload.endereco || null,
    observacoes: payload.observacoes || null,
    created_by: payload.id ? payload.created_by || user.id : user.id
  };
  const query = payload.id ? supabase.from('adm_colaboradores').update(row).eq('id', payload.id).select().single() : supabase.from('adm_colaboradores').insert(row).select().single();
  const { data, error } = await query;
  if (error) throw error;
  await historico('colaborador', data.id, payload.id ? 'update' : 'create', payload.id ? 'Colaborador atualizado.' : 'Colaborador cadastrado.', user, { status_novo: data.status });
  await audit('adm_colaboradores', data.id, payload.id ? 'update' : 'insert', user, data);
  return data;
}

export async function salvarFerias(payload, user) {
  requireManage(user);
  if (!payload.colaborador_id) throw new Error('Selecione o colaborador.');
  const row = {
    colaborador_id: payload.colaborador_id,
    periodo_aquisitivo_inicio: payload.periodo_aquisitivo_inicio,
    periodo_aquisitivo_fim: payload.periodo_aquisitivo_fim,
    inicio: payload.inicio,
    fim: payload.fim,
    dias: Number(payload.dias || 1),
    abono: Boolean(payload.abono),
    status: payload.status || 'programada',
    aprovado_por: emptyToNull(payload.aprovado_por),
    aprovado_em: payload.aprovado_por ? new Date().toISOString() : null,
    observacoes: payload.observacoes || null,
    created_by: payload.id ? payload.created_by || user.id : user.id
  };
  const query = payload.id ? supabase.from('adm_ferias').update(row).eq('id', payload.id).select().single() : supabase.from('adm_ferias').insert(row).select().single();
  const { data, error } = await query;
  if (error) throw error;
  await historico('ferias', data.id, payload.id ? 'update' : 'create', 'Férias registradas.', user, { status_novo: data.status });
  return data;
}

export async function salvarAtestado(payload, user) {
  requireManage(user);
  if (!payload.colaborador_id) throw new Error('Selecione o colaborador.');
  const row = {
    colaborador_id: payload.colaborador_id,
    tipo: payload.tipo || 'medico',
    inicio: payload.inicio,
    fim: payload.fim,
    dias: Number(payload.dias || 1),
    cid: payload.cid || null,
    medico: payload.medico || null,
    status: payload.status || 'registrado',
    observacoes: payload.observacoes || null,
    created_by: payload.id ? payload.created_by || user.id : user.id
  };
  const query = payload.id ? supabase.from('adm_atestados').update(row).eq('id', payload.id).select().single() : supabase.from('adm_atestados').insert(row).select().single();
  const { data, error } = await query;
  if (error) throw error;
  await historico('atestado', data.id, payload.id ? 'update' : 'create', 'Atestado registrado.', user, { status_novo: data.status });
  return data;
}

export async function salvarVeiculo(payload, user) {
  requireManage(user);
  if (!payload.placa?.trim() || !payload.modelo?.trim()) throw new Error('Informe placa e modelo.');
  const row = {
    placa: payload.placa.trim().toUpperCase(),
    prefixo: payload.prefixo || null,
    modelo: payload.modelo.trim(),
    marca: payload.marca || null,
    ano: emptyToNull(payload.ano),
    tipo: payload.tipo || 'leve',
    status: payload.status || 'operacional',
    km_atual: Number(payload.km_atual || 0),
    renavam: payload.renavam || null,
    seguro_validade: emptyToNull(payload.seguro_validade),
    licenciamento_validade: emptyToNull(payload.licenciamento_validade),
    responsavel_id: emptyToNull(payload.responsavel_id),
    observacoes: payload.observacoes || null,
    created_by: payload.id ? payload.created_by || user.id : user.id
  };
  const query = payload.id ? supabase.from('adm_veiculos').update(row).eq('id', payload.id).select().single() : supabase.from('adm_veiculos').insert(row).select().single();
  const { data, error } = await query;
  if (error) throw error;
  await historico('veiculo', data.id, payload.id ? 'update' : 'create', 'Veículo salvo.', user, { status_novo: data.status });
  return data;
}

export async function salvarManutencaoFrota(payload, user) {
  requireManage(user);
  if (!payload.veiculo_id || !payload.descricao?.trim()) throw new Error('Informe veículo e descrição.');
  const row = {
    veiculo_id: payload.veiculo_id,
    manutencao_id: emptyToNull(payload.manutencao_id),
    tipo: payload.tipo || 'preventiva',
    descricao: payload.descricao.trim(),
    km_execucao: emptyToNull(payload.km_execucao),
    data_programada: emptyToNull(payload.data_programada),
    data_execucao: emptyToNull(payload.data_execucao),
    custo: numberOrZero(payload.custo),
    fornecedor_id: emptyToNull(payload.fornecedor_id),
    status: payload.status || 'programada',
    observacoes: payload.observacoes || null,
    created_by: payload.id ? payload.created_by || user.id : user.id
  };
  const query = payload.id ? supabase.from('adm_frota_manutencoes').update(row).eq('id', payload.id).select().single() : supabase.from('adm_frota_manutencoes').insert(row).select().single();
  const { data, error } = await query;
  if (error) throw error;
  await historico('manutencao_frota', data.id, payload.id ? 'update' : 'create', 'Manutenção de frota salva.', user, { status_novo: data.status });
  return data;
}

export async function uploadDocumentoAdministrativo({ entidade_tipo, entidade_id, tipo, validade, file }, user) {
  requireManage(user);
  if (!file) throw new Error('Selecione um arquivo.');
  const cleanName = file.name.replace(/[^\w.\-]+/g, '_');
  const path = `${entidade_tipo}/${entidade_id || 'geral'}/${Date.now()}-${cleanName}`;
  const { error: uploadError } = await supabase.storage.from('admin-files').upload(path, file, { cacheControl: '3600', upsert: false });
  if (uploadError) throw uploadError;
  const { data, error } = await supabase.from('adm_documentos').insert({
    entidade_tipo,
    entidade_id: emptyToNull(entidade_id),
    tipo: tipo || 'documento',
    nome: file.name,
    validade: emptyToNull(validade),
    bucket: 'admin-files',
    path,
    mime_type: file.type || null,
    tamanho_bytes: file.size || null,
    uploaded_by: user.id
  }).select().single();
  if (error) throw error;
  await historico('documento', data.id, 'upload', `Documento anexado: ${file.name}`, user, { metadata: { path } });
  return data;
}

export async function abrirDocumentoAdministrativo(documento) {
  const { data, error } = await supabase.storage.from(documento.bucket).createSignedUrl(documento.path, 3600);
  if (error) throw error;
  return data?.signedUrl || '';
}

export async function removerAdministrativo({ tabela, id, entidade_tipo }, user) {
  requireManage(user);
  const { data, error } = await supabase.from(tabela).update({ deleted_at: new Date().toISOString(), deleted_by: user.id }).eq('id', id).select().single();
  if (error) throw error;
  await historico(entidade_tipo, id, 'delete', 'Registro removido.', user, { status_anterior: data.status });
  return data;
}
