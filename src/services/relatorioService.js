import { supabase } from '../lib/supabase.js';

export const RELATORIO_STEPS = [
  { id: 'dados', title: 'Dados Gerais' },
  { id: 'operacao', title: 'Operação' },
  { id: 'bombas', title: 'Bombas' },
  { id: 'rastelos', title: 'Rastelos' },
  { id: 'comportas', title: 'Comportas' },
  { id: 'eletrocentro', title: 'Eletrocentro' },
  { id: 'geradores', title: 'Geradores' },
  { id: 'cco', title: 'Comunicação CCO' },
  { id: 'ocorrencias', title: 'Ocorrências' },
  { id: 'fotos', title: 'Fotos' },
  { id: 'revisao', title: 'Revisão' }
];

export const STATUS_OPTIONS = [
  'operando',
  'normal',
  'parado',
  'falha',
  'manutencao',
  'nao_aplicavel'
];

const RELATORIO_SELECT = `
  *,
  ebap:ebaps(id,nome,nome_curto,status),
  operador:usuarios!relatorios_diarios_operador_id_fkey(id,nome,usuario,perfil,setor)
`;

export async function listarEbapsRelatorio() {
  const { data, error } = await supabase.from('ebaps').select('id,codigo,nome,nome_curto,status').is('deleted_at', null).order('nome');
  if (error) throw new Error(error.message);
  return data || [];
}

export async function listarEquipamentosRelatorio(ebapId) {
  if (!ebapId) return [];
  const { data, error } = await supabase
    .from('equipamentos')
    .select('id,nome,tag,codigo,status_operacional,criticidade,tipo:equipamento_tipos(id,codigo,nome)')
    .eq('ebap_id', ebapId)
    .is('deleted_at', null)
    .order('nome');
  if (error) throw new Error(error.message);
  return data || [];
}

export async function listarRelatoriosAnteriores({ perfil, userId, page = 1, pageSize = 8 } = {}) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  let query = supabase
    .from('relatorios_diarios')
    .select(RELATORIO_SELECT, { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (perfil === 'operador') query = query.eq('operador_id', userId);

  const { data, error, count } = await query.range(from, to);
  if (error) throw new Error(error.message);
  return { data: data || [], count: count || 0 };
}

export async function buscarRascunhoOperador(userId) {
  const { data, error } = await supabase
    .from('relatorios_diarios')
    .select(RELATORIO_SELECT)
    .eq('operador_id', userId)
    .in('status', ['rascunho', 'correcao_solicitada'])
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data || null;
}

export async function criarRascunhoRelatorio({ ebapId, user }) {
  const now = new Date();
  const codigo = gerarCodigoRelatorio(now);
  const initialPayload = blankPayload();
  const { data, error } = await supabase
    .from('relatorios_diarios')
    .insert({
      codigo,
      ebap_id: ebapId,
      operador_id: user?.id || null,
      data_operacao: now.toISOString().slice(0, 10),
      inicio_em: now.toISOString(),
      status: 'rascunho',
      created_by: user?.id || null,
      payload: initialPayload
    })
    .select(RELATORIO_SELECT)
    .single();

  if (error) throw new Error(error.message);
  await salvarSecoes(data.id, initialPayload);
  return data;
}

export async function salvarRascunhoRelatorio(relatorioId, payload) {
  const resumo = payload?.ocorrencias?.descricao || payload?.ocorrencias?.conclusao || null;
  const { data, error } = await supabase
    .from('relatorios_diarios')
    .update({ payload, resumo, updated_at: new Date().toISOString() })
    .eq('id', relatorioId)
    .select(RELATORIO_SELECT)
    .single();

  if (error) throw new Error(error.message);
  await salvarSecoes(relatorioId, payload);
  return data;
}

export async function alterarEbapRelatorio(relatorioId, ebapId) {
  const { data, error } = await supabase
    .from('relatorios_diarios')
    .update({ ebap_id: ebapId, payload: blankPayload(), updated_at: new Date().toISOString() })
    .eq('id', relatorioId)
    .select(RELATORIO_SELECT)
    .single();

  if (error) throw new Error(error.message);
  await salvarSecoes(relatorioId, data.payload || blankPayload());
  return data;
}

export async function finalizarRelatorio(relatorioId, payload) {
  await salvarRascunhoRelatorio(relatorioId, payload);
  await salvarItensRelatorio(relatorioId, payload);

  const { data, error } = await supabase
    .from('relatorios_diarios')
    .update({
      status: 'pendente_validacao_cco',
      finalizado_em: new Date().toISOString(),
      ocorrencias: payload?.ocorrencias?.descricao || null,
      conclusao_operador: payload?.ocorrencias?.conclusao || null,
      hash_conferencia: simpleHash(JSON.stringify(payload)),
      updated_at: new Date().toISOString()
    })
    .eq('id', relatorioId)
    .select(RELATORIO_SELECT)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function uploadFotoRelatorio(relatorioId, file, user, legenda = '') {
  if (!file) throw new Error('Selecione uma foto.');
  const safeName = file.name.replace(/[^\w.-]+/g, '-');
  const path = `${relatorioId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage.from('report-photos').upload(path, file, {
    cacheControl: '3600',
    upsert: false
  });
  if (uploadError) throw new Error(uploadError.message);

  const { data, error } = await supabase
    .from('anexos')
    .insert({
      entidade_tipo: 'relatorio_diario',
      entidade_id: relatorioId,
      bucket: 'report-photos',
      path,
      nome_original: file.name,
      mime_type: file.type || null,
      tamanho_bytes: file.size || null,
      legenda,
      categoria: 'foto_relatorio',
      uploaded_by: user?.id || null
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function listarFotosRelatorio(relatorioId) {
  if (!relatorioId) return [];
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

export async function listarValidacoesRelatorio(relatorioId) {
  const { data, error } = await supabase
    .from('validacoes_cco')
    .select('*, operador_cco:usuarios!validacoes_cco_operador_cco_id_fkey(id,nome,usuario,perfil)')
    .eq('relatorio_id', relatorioId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function obterUrlFotoRelatorio(foto) {
  const { data, error } = await supabase.storage.from(foto.bucket).createSignedUrl(foto.path, 3600);
  if (error) throw new Error(error.message);
  return data?.signedUrl || '';
}

async function salvarSecoes(relatorioId, payload) {
  const rows = RELATORIO_STEPS.filter((step) => step.id !== 'revisao').map((step, index) => ({
    relatorio_id: relatorioId,
    codigo: step.id,
    titulo: step.title,
    ordem: index + 1,
    status: secaoCompleta(step.id, payload) ? 'concluida' : 'em_andamento',
    dados: payload?.[step.id] || {},
    concluida_em: secaoCompleta(step.id, payload) ? new Date().toISOString() : null
  }));

  const { error } = await supabase.from('relatorio_diario_secoes').upsert(rows, { onConflict: 'relatorio_id,codigo' });
  if (error) throw new Error(error.message);
}

async function salvarItensRelatorio(relatorioId, payload) {
  const itemRows = [];
  const sections = ['operacao', 'bombas', 'rastelos', 'comportas', 'eletrocentro', 'geradores', 'cco'];

  sections.forEach((section) => {
    const records = payload?.[section]?.items || [];
    records.forEach((item) => {
      itemRows.push({
        relatorio_id: relatorioId,
        equipamento_id: item.equipamento_id || null,
        tipo_item: section,
        descricao: item.nome || item.descricao || section,
        status: item.status || null,
        observacao: item.observacao || null,
        solicitar_os: Boolean(item.solicitar_os),
        dados: item
      });
    });
  });

  await supabase.from('relatorio_diario_itens').delete().eq('relatorio_id', relatorioId);
  if (!itemRows.length) return;
  const { error } = await supabase.from('relatorio_diario_itens').insert(itemRows);
  if (error) throw new Error(error.message);
}

export function blankPayload() {
  return {
    dados: { turno: getTurnoAtual(), clima: '', nivel_geral: '', observacao: '' },
    operacao: { items: [], observacao: '' },
    bombas: { quantidade: 0, items: [], observacao: '' },
    rastelos: { quantidade: 0, items: [], observacao: '' },
    comportas: { quantidade: 0, items: [], observacao: '' },
    eletrocentro: { items: [], observacao: '' },
    geradores: { quantidade: 0, items: [], observacao: '' },
    cco: { comunicacao: '', supervisao: '', alarmes: '', observacao: '' },
    ocorrencias: { houve: 'nao', prioridade: 'baixa', descricao: '', conclusao: '' },
    fotos: { observacao: '' }
  };
}

export function getTurnoAtual(date = new Date()) {
  const hour = date.getHours();
  return hour >= 6 && hour < 18 ? '06-18' : '18-06';
}

export function prepararPayloadEquipamentos(payload, equipamentos) {
  const byType = {
    eletrocentro: ['eletrocentro', 'sensor', 'cco'],
    operacao: []
  };

  const next = structuredCloneSafe(payload || blankPayload());
  Object.keys(byType).forEach((section) => {
    const wanted = byType[section];
    const rows = section === 'operacao'
      ? equipamentos
      : equipamentos.filter((eq) => wanted.includes(eq.tipo?.codigo));

    if (!next[section]?.items?.length) {
      next[section] = {
        ...(next[section] || {}),
        items: rows.map((eq) => ({
          equipamento_id: eq.id,
          nome: eq.tag ? `${eq.tag} - ${eq.nome}` : eq.nome,
          status: eq.status_operacional || 'operando',
          observacao: '',
          solicitar_os: false
        }))
      };
    }
  });

  return next;
}

function secaoCompleta(stepId, payload) {
  if (stepId === 'dados') return Boolean(payload?.dados?.turno);
  if (stepId === 'cco') return Boolean(payload?.cco?.comunicacao);
  if (stepId === 'ocorrencias') return Boolean(payload?.ocorrencias?.houve);
  if (stepId === 'fotos') return true;
  return Array.isArray(payload?.[stepId]?.items) && payload[stepId].items.length > 0;
}

function gerarCodigoRelatorio(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const suffix = String(date.getTime()).slice(-6);
  return `RDO-${y}${m}${d}-${suffix}`;
}

function simpleHash(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return `ROH-${Math.abs(hash).toString(16).toUpperCase()}`;
}

function structuredCloneSafe(value) {
  return JSON.parse(JSON.stringify(value));
}
