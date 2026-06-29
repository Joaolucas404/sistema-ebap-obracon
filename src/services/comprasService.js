import { supabase } from '../lib/supabase.js';

export const COMPRA_STATUS = [
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'enviada', label: 'Enviada' },
  { value: 'solicitada', label: 'Solicitada' },
  { value: 'em_cotacao', label: 'Em cotacao' },
  { value: 'aguardando_aprovacao', label: 'Aguardando aprovacao' },
  { value: 'aprovada', label: 'Aprovada' },
  { value: 'reprovada', label: 'Reprovada' },
  { value: 'comprada', label: 'Comprada' },
  { value: 'recebida', label: 'Recebida' }
];

export const COMPRA_PRIORIDADES = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'normal', label: 'Normal' },
  { value: 'alta', label: 'Alta' },
  { value: 'urgente', label: 'Urgente' },
  { value: 'critica', label: 'Critica' }
];

export const COMPRA_AREAS = [
  { value: 'mecanica', label: 'Mecanica' },
  { value: 'eletrica', label: 'Eletrica' },
  { value: 'automacao', label: 'Automacao' },
  { value: 'operacao', label: 'Operacao' },
  { value: 'sst', label: 'SST' },
  { value: 'administrativo', label: 'Administrativo' },
  { value: 'almoxarifado', label: 'Almoxarifado' }
];

export const COMPRA_UNIDADES = ['un', 'pc', 'kg', 'l', 'm', 'cx', 'par', 'kit'];

function normalizeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function emptyToNull(value) {
  return value === '' || value == null ? null : value;
}

export function podeGerenciarCompras(perfil) {
  return ['almoxarifado', 'financeiro', 'supervisor', 'gerencia', 'diretoria'].includes(perfil);
}

export function podeAprovarCompras(perfil) {
  return ['gerencia', 'diretoria'].includes(perfil);
}

function validateUser(user) {
  if (!user?.id || !podeGerenciarCompras(user?.perfil)) {
    throw new Error('Usuario sem permissao para gerenciar compras.');
  }
}

function validateSolicitacao(payload) {
  if (!payload.area) throw new Error('Selecione a area da solicitacao.');
  if (!payload.justificativa?.trim() || payload.justificativa.trim().length < 10) {
    throw new Error('Informe uma justificativa com pelo menos 10 caracteres.');
  }

  const itens = payload.itens || [];
  if (!itens.length) throw new Error('Adicione pelo menos um material.');

  itens.forEach((item, index) => {
    if (!item.descricao?.trim() || item.descricao.trim().length < 3) {
      throw new Error(`Informe a descricao do material ${index + 1}.`);
    }
    if (normalizeNumber(item.quantidade) <= 0) {
      throw new Error(`Informe quantidade maior que zero no material ${index + 1}.`);
    }
  });
}

export async function listarEbapsCompras() {
  const { data, error } = await supabase
    .from('ebaps')
    .select('id,codigo,nome,status')
    .is('deleted_at', null)
    .order('nome', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function listarItensAlmoxCompras() {
  const { data, error } = await supabase
    .from('almoxarifado_itens')
    .select('id,codigo,nome,categoria,unidade,estoque_atual,estoque_minimo,custo_medio,ativo')
    .eq('ativo', true)
    .is('deleted_at', null)
    .order('nome', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function listarFornecedoresCompras() {
  const { data, error } = await supabase
    .from('fornecedores')
    .select('*')
    .is('deleted_at', null)
    .order('nome', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function listarCompras(filters = {}) {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 10;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('compras')
    .select('*, ebap:ebaps(id,codigo,nome), fornecedor:fornecedores(id,nome,documento), solicitante:usuarios!compras_solicitante_id_fkey(id,nome,usuario,perfil), itens:compra_itens(*), aprovacoes:compra_aprovacoes(*), historico:compra_historico(*)', { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.area) query = query.eq('area', filters.area);
  if (filters.ebapId) query = query.eq('ebap_id', filters.ebapId);
  if (filters.search?.trim()) {
    const term = filters.search.trim();
    query = query.or(`numero.ilike.%${term}%,justificativa.ilike.%${term}%,area.ilike.%${term}%`);
  }

  const { data, error, count } = await query;
  console.log('[Compras] SELECT public.compras', {
    tabela: 'compras',
    filters,
    count,
    retornadas: data?.length || 0,
    error
  });
  if (error) throw error;
  return { data: data || [], count: count || 0 };
}

export async function listarHistoricoCompras(limit = 80) {
  const { data, error } = await supabase
    .from('compra_historico')
    .select('*, compra:compras(id,numero,area,status), usuario:usuarios(id,nome,usuario,perfil)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function obterDashboardCompras() {
  const { data, error } = await supabase
    .from('compras')
    .select('id,status,valor_total,deleted_at')
    .is('deleted_at', null);

  if (error) throw error;

  const rows = data || [];
  const byStatus = (status) => rows.filter((compra) => compra.status === status).length;
  const valorTotalSolicitado = rows.reduce((total, compra) => total + normalizeNumber(compra.valor_total), 0);

  return {
    pendentes: rows.filter((compra) => ['solicitada', 'aguardando_aprovacao'].includes(compra.status)).length,
    aprovadas: byStatus('aprovada'),
    reprovadas: byStatus('reprovada'),
    emCotacao: byStatus('em_cotacao'),
    recebidas: byStatus('recebida'),
    valorTotalSolicitado,
    total: rows.length
  };
}

export async function salvarSolicitacaoCompra(payload, user) {
  validateUser(user);
  validateSolicitacao(payload);

  const itens = (payload.itens || []).map((item) => ({
    almox_item_id: emptyToNull(item.almox_item_id),
    descricao: item.descricao,
    categoria: item.categoria || null,
    unidade: item.unidade || 'un',
    quantidade: normalizeNumber(item.quantidade),
    valor_unitario: normalizeNumber(item.valor_unitario)
  }));

  const { data, error } = await supabase.rpc('compras_salvar_solicitacao', {
    p_user_id: user.id,
    p_compra_id: payload.id || null,
    p_numero: payload.numero || null,
    p_area: payload.area,
    p_ebap_id: emptyToNull(payload.ebap_id),
    p_justificativa: payload.justificativa,
    p_prioridade: payload.prioridade || 'normal',
    p_prazo_necessario: emptyToNull(payload.prazo_necessario),
    p_itens: itens
  });

  console.log('[Compras] retorno RPC compras_salvar_solicitacao', {
    tabelaDestino: 'compras',
    payload: {
      compra_id: payload.id || null,
      area: payload.area,
      ebap_id: emptyToNull(payload.ebap_id),
      prioridade: payload.prioridade || 'normal',
      itens: itens.length
    },
    data,
    error
  });

  if (error) throw error;

  if (data?.id) {
    const { data: compraConfirmada, error: selectError } = await supabase
      .from('compras')
      .select('id,numero,status,area,ebap_id,solicitante_id,deleted_at,created_at')
      .eq('id', data.id)
      .maybeSingle();

    console.log('[Compras] confirmação SELECT após salvar', {
      tabela: 'compras',
      id: data.id,
      data: compraConfirmada,
      error: selectError
    });

    if (selectError) throw selectError;
    if (!compraConfirmada) {
      throw new Error('Solicitação salva, mas não liberada para leitura pela listagem. Verifique a política RLS de SELECT em compras.');
    }
  }

  return data;
}

export async function mudarStatusCompra(payload, user) {
  validateUser(user);

  const { data, error } = await supabase.rpc('compras_mudar_status', {
    p_user_id: user.id,
    p_compra_id: payload.id,
    p_status: payload.status,
    p_descricao: payload.descricao || null,
    p_fornecedor_id: emptyToNull(payload.fornecedor_id)
  });

  if (error) throw error;
  return data;
}

export async function aprovarCompra(payload, user) {
  if (!user?.id || !podeAprovarCompras(user?.perfil)) {
    throw new Error('Somente Gerencia ou Diretoria podem aprovar compras.');
  }

  if (!payload.aprovado && (!payload.parecer?.trim() || payload.parecer.trim().length < 5)) {
    throw new Error('Motivo obrigatorio para reprovar.');
  }

  const { data, error } = await supabase.rpc('compras_aprovar', {
    p_user_id: user.id,
    p_compra_id: payload.id,
    p_aprovado: Boolean(payload.aprovado),
    p_parecer: payload.parecer || null
  });

  if (error) throw error;
  return data;
}

export async function receberCompra(payload, user) {
  validateUser(user);

  const { data, error } = await supabase.rpc('compras_receber', {
    p_user_id: user.id,
    p_compra_id: payload.id,
    p_observacao: payload.observacao || null
  });

  if (error) throw error;
  return data;
}

export async function salvarFornecedorCompra(payload, user) {
  validateUser(user);

  const { data, error } = await supabase.rpc('compras_salvar_fornecedor', {
    p_user_id: user.id,
    p_fornecedor_id: payload.id || null,
    p_nome: payload.nome,
    p_razao_social: payload.razao_social || null,
    p_documento: payload.documento || null,
    p_email: payload.email || null,
    p_telefone: payload.telefone || null,
    p_contato: payload.contato || null,
    p_endereco: payload.endereco || null,
    p_cidade: payload.cidade || null,
    p_uf: payload.uf || null,
    p_cep: payload.cep || null,
    p_observacoes: payload.observacoes || null,
    p_ativo: payload.ativo !== false
  });

  if (error) throw error;
  return data;
}
