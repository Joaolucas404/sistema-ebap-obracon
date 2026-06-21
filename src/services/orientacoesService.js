import { supabase } from '../lib/supabase.js';

export const ORIENTACAO_CATEGORIAS = [
  { value: 'operacao', label: 'Operação' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'sst', label: 'SST' },
  { value: 'cco', label: 'CCO' },
  { value: 'eletrica', label: 'Elétrica' },
  { value: 'mecanica', label: 'Mecânica' },
  { value: 'automacao', label: 'Automação' },
  { value: 'emergencia', label: 'Emergência' }
];

export const ORIENTACAO_STATUS = [
  { value: 'publicado', label: 'Publicado' },
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'arquivado', label: 'Arquivado' }
];

export const ORIENTACAO_TIPOS = [
  { value: 'orientacao', label: 'Orientação' },
  { value: 'comunicado', label: 'Comunicado' }
];

export function podeCriarOrientacao(perfil) {
  return ['supervisor', 'gerencia', 'diretoria'].includes(perfil);
}

export function podeEditarOrientacao(perfil) {
  return ['gerencia', 'diretoria'].includes(perfil);
}

export function podeExcluirOrientacao(perfil) {
  return perfil === 'diretoria';
}

function emptyToNull(value) {
  return value === '' || value == null ? null : value;
}

function validatePayload(payload, user, editing = false) {
  if (!user?.id) throw new Error('Sessão inválida.');
  if (editing && !podeEditarOrientacao(user.perfil)) throw new Error('Usuário sem permissão para editar orientações.');
  if (!editing && !podeCriarOrientacao(user.perfil)) throw new Error('Usuário sem permissão para criar orientações.');
  if (!payload.titulo?.trim() || payload.titulo.trim().length < 3) throw new Error('Informe um título com pelo menos 3 caracteres.');
  if (!payload.categoria) throw new Error('Selecione a categoria.');
  if (!payload.descricao?.trim() || payload.descricao.trim().length < 10) throw new Error('Informe uma descrição com pelo menos 10 caracteres.');
  if (!payload.conteudo?.trim() || payload.conteudo.trim().length < 10) throw new Error('Informe o passo a passo/conteúdo com pelo menos 10 caracteres.');
}

export async function listarOrientacoes(filters = {}) {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 12;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('orientacoes')
    .select('*, responsavel_user:usuarios!orientacoes_created_by_fkey(id,nome,usuario,perfil), anexos:orientacao_anexos(*), versoes:orientacao_versoes(*)', { count: 'exact' })
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .range(from, to);

  if (filters.categoria) query = query.eq('categoria', filters.categoria);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.tipo) query = query.eq('tipo', filters.tipo);
  if (filters.search?.trim()) {
    const term = filters.search.trim();
    query = query.or(`titulo.ilike.%${term}%,descricao.ilike.%${term}%,conteudo.ilike.%${term}%,categoria.ilike.%${term}%`);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return { data: data || [], count: count || 0 };
}

export async function listarComunicadosOperacionais(limit = 5) {
  const { data, error } = await supabase
    .from('orientacoes')
    .select('*, responsavel_user:usuarios!orientacoes_created_by_fkey(id,nome,usuario,perfil), anexos:orientacao_anexos(*)')
    .eq('tipo', 'comunicado')
    .eq('status', 'publicado')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function obterDashboardOrientacoes() {
  const { data, error } = await supabase
    .from('orientacoes')
    .select('id,categoria,status,tipo,deleted_at')
    .is('deleted_at', null);

  if (error) throw error;

  const rows = data || [];
  return {
    total: rows.length,
    publicados: rows.filter((item) => item.status === 'publicado').length,
    comunicados: rows.filter((item) => item.tipo === 'comunicado').length,
    emergencias: rows.filter((item) => item.categoria === 'emergencia').length,
    porCategoria: ORIENTACAO_CATEGORIAS.map((categoria) => ({
      ...categoria,
      total: rows.filter((item) => item.categoria === categoria.value).length
    }))
  };
}

export async function salvarOrientacao(payload, user) {
  const editing = Boolean(payload.id);
  validatePayload(payload, user, editing);

  const row = {
    titulo: payload.titulo.trim(),
    categoria: payload.categoria,
    descricao: payload.descricao.trim(),
    conteudo: payload.conteudo.trim(),
    status: payload.status || 'publicado',
    tipo: payload.tipo || 'orientacao',
    responsavel: payload.responsavel || user.nome || user.usuario || null,
    data_referencia: payload.data_referencia || new Date().toISOString().slice(0, 10),
    updated_by: user.id
  };

  if (editing) {
    const { data, error } = await supabase
      .from('orientacoes')
      .update(row)
      .eq('id', payload.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('orientacoes')
    .insert({ ...row, created_by: user.id })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function excluirOrientacao(id, user) {
  if (!podeExcluirOrientacao(user?.perfil)) throw new Error('Somente Diretoria pode excluir orientações.');

  const { error } = await supabase
    .from('orientacoes')
    .update({ deleted_at: new Date().toISOString(), deleted_by: user.id, updated_by: user.id })
    .eq('id', id);

  if (error) throw error;
}

export async function uploadAnexoOrientacao(orientacaoId, file, user) {
  if (!podeCriarOrientacao(user?.perfil)) throw new Error('Usuário sem permissão para anexar arquivos.');
  if (!orientacaoId) throw new Error('Salve a orientação antes de anexar arquivos.');
  if (!file) throw new Error('Selecione um arquivo.');

  const safeName = file.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]/g, '-');
  const path = `${orientacaoId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage.from('orientation-files').upload(path, file, {
    cacheControl: '3600',
    upsert: false
  });

  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from('orientacao_anexos')
    .insert({
      orientacao_id: orientacaoId,
      nome: file.name,
      bucket: 'orientation-files',
      path,
      mime_type: emptyToNull(file.type),
      tamanho: file.size || null,
      uploaded_by: user.id
    })
    .select()
    .single();

  if (error) throw error;
  await supabase
    .from('orientacoes')
    .update({ anexo_url: path, updated_by: user.id })
    .eq('id', orientacaoId)
    .is('anexo_url', null);

  return data;
}

export async function obterUrlAnexoOrientacao(anexo, expiresIn = 3600) {
  const { data, error } = await supabase.storage.from(anexo.bucket || 'orientation-files').createSignedUrl(anexo.path, expiresIn);
  if (error) throw error;
  return data?.signedUrl;
}
