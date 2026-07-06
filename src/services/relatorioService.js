import { supabase } from '../lib/supabase.js';

export const RELATORIO_STEPS = [
  { id: 'dados', title: 'Dados Gerais' },
  { id: 'bombas', title: 'Bombas' },
  { id: 'rastelos', title: 'Rastelos' },
  { id: 'comportas', title: 'Comportas' },
  { id: 'eletrocentro', title: 'Eletrocentro' },
  { id: 'geradores', title: 'Geradores' },
  { id: 'cco', title: 'Comunicação CCO' },
  { id: 'ocorrencias', title: 'Ocorrências' },
  { id: 'fotos', title: 'Fotos' },
  { id: 'revisão', title: 'Revisão' }
];

export const STATUS_OPTIONS = [
  { value: 'operando', label: 'Operando', tone: 'green' },
  { value: 'atencao', label: 'Atenção', tone: 'yellow' },
  { value: 'parado', label: 'Parado', tone: 'red' },
  { value: 'em_manutencao', label: 'Em Manutenção', tone: 'blue' }
];

export const STATUS_VALUES = STATUS_OPTIONS.map((status) => status.value);
export const ALERT_STATUS_VALUES = ['atencao', 'parado', 'em_manutencao'];

export const FOTO_CATEGORIAS_OBRIGATORIAS = [
  { value: 'ebap_geral', label: 'Foto da EBAP', description: 'Foto geral da estação.' },
  { value: 'bombas_geral', label: 'Foto das Bombas', description: 'Foto geral do conjunto de bombas.' },
  { value: 'supervisorio', label: 'Foto do Supervisório', description: 'Foto da tela do supervisório.' }
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
    .from('ativos')
    .select('id,codigo,nome_operacional,tipo,status_operacional,area_responsavel')
    .eq('ebap_id', ebapId)
    .eq('ativo', true)
    .is('deleted_at', null)
    .order('tipo', { ascending: true })
    .order('nome_operacional', { ascending: true });
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

export async function cancelarRascunhoRelatorio(relatorioId, user) {
  if (!relatorioId) throw new Error('Relatório não identificado.');

  let query = supabase
    .from('relatorios_diarios')
    .update({
      status: 'cancelado',
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', relatorioId)
    .in('status', ['rascunho', 'correcao_solicitada']);

  if (user?.id) query = query.eq('operador_id', user.id);

  const { data, error } = await query.select(RELATORIO_SELECT).single();

  if (error) throw new Error(error.message);
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

export async function finalizarRelatorio(relatorioId, payload, fotos = []) {
  const pendencias = validarRdoOperacional(payload, fotos);
  if (pendencias.length) throw new Error(pendencias.join(' '));

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

export async function uploadFotoRelatorio(relatorioId, file, user, legenda = '', categoria = 'foto_relatorio') {
  if (!file) throw new Error('Selecione uma foto.');
  const optimizedFile = await otimizarImagemRelatorio(file);
  const safeName = optimizedFile.name.replace(/[^\w.-]+/g, '-');
  const path = `${relatorioId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage.from('report-photos').upload(path, optimizedFile, {
    cacheControl: '3600',
    upsert: false,
    contentType: optimizedFile.type || 'image/jpeg'
  });
  if (uploadError) throw new Error(uploadError.message);

  const { data, error } = await supabase
    .from('anexos')
    .insert({
      entidade_tipo: 'relatorio_diario',
      entidade_id: relatorioId,
      bucket: 'report-photos',
      path,
      nome_original: optimizedFile.name,
      mime_type: optimizedFile.type || null,
      tamanho_bytes: optimizedFile.size || null,
      legenda,
      categoria,
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
  const rows = RELATORIO_STEPS.filter((step) => step.id !== 'revisão').map((step, index) => ({
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
  const sections = ['bombas', 'rastelos', 'comportas', 'eletrocentro', 'geradores'];

  sections.forEach((section) => {
    const records = payload?.[section]?.items || [];
    records.forEach((item) => {
      itemRows.push({
        relatorio_id: relatorioId,
        equipamento_id: null,
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
    bombas: { quantidade: 0, items: [], observacao: '' },
    rastelos: { quantidade: 0, items: [], observacao: '' },
    comportas: { quantidade: 0, items: [], observacao: '' },
    eletrocentro: { sensores_possui: 'nao', sensores_quantidade: 0, climatizadores_possui: 'nao', climatizadores_quantidade: 0, items: [], observacao: '' },
    geradores: { possui: 'nao', quantidade: 0, items: [], observacao: '' },
    cco: { comunicacao: '', supervisão: '', alarmes: '', observacao: '' },
    ocorrencias: { houve: 'nao', prioridade: 'baixa', descricao: '', conclusao: '' },
    fotos: { observacao: '' }
  };
}

export function getTurnoAtual(date = new Date()) {
  const hour = date.getHours();
  return hour >= 6 && hour < 18 ? '06-18' : '18-06';
}

export function prepararPayloadEquipamentos(payload, equipamentos) {
  const next = structuredCloneSafe(payload || blankPayload());
  const rows = equipamentos || [];
  const bySection = {
    bombas: rows.filter((eq) => eq.tipo === 'Bomba'),
    rastelos: rows.filter((eq) => eq.tipo === 'Rastelo'),
    comportas: rows.filter((eq) => ['Comporta', 'Comporta de Rastelo'].includes(eq.tipo)),
    eletrocentro: rows.filter((eq) => ['CCM', 'Painel Elétrico', 'Sensor', 'Atuador'].includes(eq.tipo))
  };

  Object.entries(bySection).forEach(([section, sectionRows]) => {
    const existingItems = next[section]?.items || [];
    const mergedItems = mergeOperationalItems(existingItems, sectionRows);
    const manualEletrocentro = section === 'eletrocentro'
      ? existingItems.filter((item) => !item.ativo_id && ['Sensor', 'Climatizador'].includes(item.tipo))
      : [];
    next[section] = {
      ...(next[section] || {}),
      quantidade: sectionRows.length,
      items: [...mergedItems, ...manualEletrocentro]
    };
  });

  return next;
}

function mergeOperationalItems(existingItems, rows) {
  const byAtivo = new Map((existingItems || []).map((item) => [item.ativo_id || item.equipamento_id || item.nome, item]));
  return rows.map((eq) => {
    const previous = byAtivo.get(eq.id) || byAtivo.get(eq.nome_operacional) || {};
    return {
      ...previous,
      ativo_id: eq.id,
      equipamento_id: null,
      nome: eq.nome_operacional,
      tipo: eq.tipo,
      status: normalizeRdoStatus(previous.status || eq.status_operacional),
      observacao: previous.observacao || '',
      solicitar_os: Boolean(previous.solicitar_os)
    };
  });
}

export function normalizeRdoStatus(status) {
  const value = String(status || '').trim().toLowerCase();
  const map = { normal: 'operando', falha: 'parado', manutencao: 'em_manutencao', fora_operacao: 'parado', operando_restricao: 'atencao' };
  return STATUS_VALUES.includes(map[value] || value) ? (map[value] || value) : 'operando';
}

export function validarRdoOperacional(payload, fotos = []) {
  const pendencias = [];
  if (!String(payload?.dados?.clima || '').trim()) pendencias.push('Informe a condição climática.');
  const nivelMare = Number(payload?.dados?.nivel_geral);
  if (!String(payload?.dados?.nivel_geral || '').trim() || !Number.isFinite(nivelMare)) pendencias.push('Informe o nível de maré em metros.');

  const sections = ['bombas', 'rastelos', 'comportas', 'eletrocentro', 'geradores'];
  sections.forEach((section) => {
    (payload?.[section]?.items || []).forEach((item) => {
      const status = normalizeRdoStatus(item.status);
      if (ALERT_STATUS_VALUES.includes(status) && !String(item.observacao || '').trim()) {
        pendencias.push('Informe o motivo para ' + item.nome + ' em ' + statusLabel(status) + '.');
      }
      if (section === 'geradores' && payload?.geradores?.possui === 'sim') {
        const diesel = Number(item.diesel);
        if (!Number.isFinite(diesel) || diesel < 0 || diesel > 100) pendencias.push('Informe o nível de diesel (%) de ' + item.nome + '.');
      }
    });
  });

  const categorias = new Set((fotos || []).map((foto) => foto.categoria));
  FOTO_CATEGORIAS_OBRIGATORIAS.forEach((categoria) => {
    if (!categorias.has(categoria.value)) pendencias.push('Anexe: ' + categoria.label + '.');
  });
  if (payload?.geradores?.possui === 'sim') {
    (payload.geradores.items || []).forEach((item, index) => {
      if (!categorias.has('gerador_' + (index + 1))) pendencias.push('Anexe a foto do ' + (item.nome || ('Gerador ' + (index + 1))) + '.');
    });
  }
  return pendencias;
}

export function statusLabel(status) {
  return STATUS_OPTIONS.find((item) => item.value === normalizeRdoStatus(status))?.label || status || '-';
}

async function otimizarImagemRelatorio(file) {
  if (typeof document === 'undefined' || !file?.type?.startsWith('image/')) return file;
  const bitmap = await createImageBitmap(file);
  const maxSide = 1600;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d');
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.78));
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
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
