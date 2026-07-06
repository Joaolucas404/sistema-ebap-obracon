import { supabase } from '../lib/supabase.js';

export const ALMOX_TIPOS_MOVIMENTACAO = [
  { value: 'entrada', label: 'Entrada' },
  { value: 'saida', label: 'Saida' },
  { value: 'ajuste', label: 'Ajuste positivo' },
  { value: 'emprestimo', label: 'Emprestimo' },
  { value: 'devolucao', label: 'Devolucao' },
  { value: 'transferencia', label: 'Transferencia' }
];

export const ALMOX_UNIDADES = ['un', 'pc', 'kg', 'l', 'm', 'cx', 'par', 'kit'];

export function podeGerenciarAlmoxarifado(perfil) {
  return ['almoxarifado', 'gerencia', 'diretoria'].includes(perfil);
}

function normalizeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function validateUser(user) {
  if (!user?.id || !podeGerenciarAlmoxarifado(user?.perfil)) {
    throw new Error('Usuario sem permissao para gerenciar almoxarifado.');
  }
}

function validateItemPayload(payload) {
  if (!payload.codigo?.trim() || payload.codigo.trim().length < 2) {
    throw new Error('Informe um codigo com pelo menos 2 caracteres.');
  }

  if (!payload.nome?.trim() || payload.nome.trim().length < 3) {
    throw new Error('Informe o nome do item com pelo menos 3 caracteres.');
  }

  if (!payload.categoria?.trim() || payload.categoria.trim().length < 2) {
    throw new Error('Informe a categoria do item.');
  }

  if (normalizeNumber(payload.estoque_minimo) < 0) {
    throw new Error('Estoque mínimo não pode ser negativo.');
  }
}

export async function listarLocaisAlmoxarifado() {
  const { data, error } = await supabase
    .from('almoxarifado_locais')
    .select('id,codigo,nome,descricao,ativo')
    .eq('ativo', true)
    .order('nome', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function listarCategoriasAlmoxarifado() {
  const { data, error } = await supabase
    .from('almoxarifado_itens')
    .select('categoria')
    .is('deleted_at', null)
    .order('categoria', { ascending: true });

  if (error) throw error;

  return [...new Set((data || []).map((item) => item.categoria).filter(Boolean))];
}

export async function listarItensAlmoxarifado(filters = {}) {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 10;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const precisaFiltroLocal = filters.estoque === 'baixo';

  let query = supabase
    .from('almoxarifado_itens')
    .select('*, local:almoxarifado_locais(id,codigo,nome)', { count: 'exact' })
    .is('deleted_at', null)
    .order('nome', { ascending: true });

  if (filters.search?.trim()) {
    const term = filters.search.trim();
    query = query.or(`codigo.ilike.%${term}%,nome.ilike.%${term}%,categoria.ilike.%${term}%`);
  }

  if (filters.categoria) {
    query = query.eq('categoria', filters.categoria);
  }

  if (filters.localId) {
    query = query.eq('local_id', filters.localId);
  }

  if (filters.status === 'ativo') {
    query = query.eq('ativo', true);
  }

  if (filters.status === 'inativo') {
    query = query.eq('ativo', false);
  }

  if (filters.estoque === 'baixo') {
    query = query.eq('ativo', true).limit(1000);
  } else {
    query = query.range(from, to);
  }

  if (filters.estoque === 'zerado') {
    query = query.eq('ativo', true).eq('estoque_atual', 0);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  if (precisaFiltroLocal) {
    const filtrados = (data || []).filter((item) => normalizeNumber(item.estoque_atual) <= normalizeNumber(item.estoque_minimo));
    return { data: filtrados.slice(from, to + 1), count: filtrados.length };
  }

  return { data: data || [], count: count || 0 };
}

export async function obterDashboardAlmoxarifado() {
  const { data: itens, error: itensError } = await supabase
    .from('almoxarifado_itens')
    .select('id,ativo,estoque_atual,estoque_minimo,custo_medio,categoria')
    .is('deleted_at', null);

  if (itensError) throw itensError;

  const { data: movimentos, error: movError } = await supabase
    .from('movimentacoes_estoque')
    .select('id,tipo,created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  if (movError) throw movError;

  const rows = itens || [];
  const ativos = rows.filter((item) => item.ativo);
  const baixo = ativos.filter((item) => normalizeNumber(item.estoque_atual) <= normalizeNumber(item.estoque_minimo));
  const zerados = ativos.filter((item) => normalizeNumber(item.estoque_atual) === 0);
  const valorEstimado = ativos.reduce((total, item) => total + normalizeNumber(item.estoque_atual) * normalizeNumber(item.custo_medio), 0);
  const hoje = new Date().toISOString().slice(0, 10);
  const movimentosHoje = (movimentos || []).filter((mov) => mov.created_at?.slice(0, 10) === hoje);

  return {
    totalItens: rows.length,
    ativos: ativos.length,
    estoqueBaixo: baixo.length,
    zerados: zerados.length,
    movimentosHoje: movimentosHoje.length,
    valorEstimado,
    categorias: [...new Set(rows.map((item) => item.categoria).filter(Boolean))].length
  };
}

export async function salvarItemAlmoxarifado(payload, user) {
  validateUser(user);
  validateItemPayload(payload);

  const { data, error } = await supabase.rpc('almox_salvar_item', {
    p_user_id: user.id,
    p_item_id: payload.id || null,
    p_codigo: payload.codigo,
    p_nome: payload.nome,
    p_categoria: payload.categoria,
    p_unidade: payload.unidade || 'un',
    p_local_id: payload.local_id || null,
    p_estoque_minimo: normalizeNumber(payload.estoque_minimo),
    p_custo_medio: payload.custo_medio === '' || payload.custo_medio == null ? null : normalizeNumber(payload.custo_medio),
    p_controlado: Boolean(payload.controlado),
    p_ativo: payload.ativo !== false
  });

  if (error) throw error;
  return data;
}

export async function desativarItemAlmoxarifado(id, user) {
  validateUser(user);

  const { data, error } = await supabase.rpc('almox_desativar_item', {
    p_user_id: user.id,
    p_item_id: id
  });

  if (error) throw error;
  return data;
}

export async function registrarMovimentacaoAlmoxarifado(payload, user) {
  validateUser(user);

  if (!payload.item_id) {
    throw new Error('Selecione o item para movimentar.');
  }

  if (!payload.tipo) {
    throw new Error('Selecione o tipo de movimentacao.');
  }

  const quantidade = normalizeNumber(payload.quantidade);
  if (quantidade <= 0) {
    throw new Error('Quantidade deve ser maior que zero.');
  }

  const { data, error } = await supabase.rpc('registrar_movimentacao_estoque', {
    p_user_id: user.id,
    p_item_id: payload.item_id,
    p_tipo: payload.tipo,
    p_quantidade: quantidade,
    p_origem: payload.origem || null,
    p_destino: payload.destino || null,
    p_os_id: payload.os_id || null,
    p_solicitante_id: payload.solicitante_id || null,
    p_observacao: payload.observacao || null
  });

  if (error) throw error;
  return data;
}

export async function listarMovimentacoesAlmoxarifado(filters = {}) {
  const limit = filters.limit || 50;

  let query = supabase
    .from('movimentacoes_estoque')
    .select('*, item:almoxarifado_itens(id,codigo,nome,unidade,categoria)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (filters.itemId) {
    query = query.eq('item_id', filters.itemId);
  }

  if (filters.tipo) {
    query = query.eq('tipo', filters.tipo);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data || [];
}
