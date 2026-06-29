import { supabase } from '../lib/supabase.js';
import { normalizePerfil } from '../config/permissions.js';
import { ATIVO_TIPOS } from './ativosService.js';

const MODELO_SELECT = `
  *,
  campos:campos_relatorio(*)
`;

export const MODELO_PAGE_SIZE = 20;

export const MODELO_AREAS = [
  { value: 'mecanica', label: 'Mecânica' },
  { value: 'eletrica', label: 'Elétrica' },
  { value: 'automacao', label: 'Automação' }
];

export const MODELO_TIPOS_MANUTENCAO = ['preventiva', 'corretiva', 'preditiva'];
export const MODELO_TIPOS_EQUIPAMENTO = ATIVO_TIPOS;

function orderCampos(campos = []) {
  return [...campos].sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
}

function gerarCodigoModelo() {
  const now = new Date();
  const ymd = now.toISOString().slice(0, 10).replaceAll('-', '');
  return 'MR-' + ymd + '-' + String(now.getTime()).slice(-5);
}

function normalizeChecklist(checklist) {
  if (Array.isArray(checklist)) return checklist.map((item) => String(item).trim()).filter(Boolean);
  return String(checklist || '').split('\n').map((item) => item.trim()).filter(Boolean);
}

function escopoAreaUsuario(user) {
  const perfil = normalizePerfil(user?.perfil);
  if (perfil === 'supervisor') return user?.area_supervisao || user?.area_operacional || '';
  return '';
}

function canSeeAll(user) {
  return ['gerencia', 'diretoria'].includes(normalizePerfil(user?.perfil));
}

function baseQuery(user, filters = {}, select = MODELO_SELECT, options = {}) {
  let query = supabase.from('modelos_relatorio').select(select, options).is('deleted_at', null);
  const scopedArea = escopoAreaUsuario(user);
  if (scopedArea) query = query.eq('area', scopedArea);
  else if (!canSeeAll(user)) return null;

  if (filters.area) query = query.eq('area', filters.area);
  if (filters.tipoManutencao) query = query.eq('tipo_manutencao', filters.tipoManutencao);
  if (filters.equipamentoTipo) query = query.eq('equipamento_tipo', filters.equipamentoTipo);
  if (filters.search) {
    const value = '%' + String(filters.search).trim() + '%';
    query = query.or('titulo.ilike.' + value + ',equipamento_tipo.ilike.' + value + ',resumo.ilike.' + value);
  }
  return query;
}

export function podeAdministrarModelo(user, modelo = null) {
  if (canSeeAll(user)) return true;
  if (normalizePerfil(user?.perfil) !== 'supervisor') return false;
  if (!modelo) return true;
  const area = escopoAreaUsuario(user);
  return !modelo.area || modelo.area === area;
}

export async function listarModelosAdmin(user, filters = {}) {
  const page = Math.max(1, Number(filters.page || 1));
  const pageSize = Number(filters.pageSize || MODELO_PAGE_SIZE);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const query = baseQuery(user, filters, MODELO_SELECT, { count: 'exact' });
  if (!query) return { data: [], count: 0, page, pageSize };

  const { data, error, count } = await query
    .order('area', { ascending: true })
    .order('tipo_manutencao', { ascending: true })
    .order('equipamento_tipo', { ascending: true })
    .order('titulo', { ascending: true })
    .range(from, to);
  if (error) throw new Error(error.message);
  return { data: (data || []).map((modelo) => ({ ...modelo, campos: orderCampos(modelo.campos) })), count: count || 0, page, pageSize };
}

export async function obterContadoresModelos(user, filters = {}) {
  const query = baseQuery(user, { ...filters, tipoManutencao: '' }, 'id,tipo_manutencao', { count: 'exact' });
  if (!query) return { total: 0, byTipo: {} };
  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  const byTipo = Object.fromEntries(MODELO_TIPOS_MANUTENCAO.map((tipo) => [tipo, 0]));
  (data || []).forEach((modelo) => { byTipo[modelo.tipo_manutencao] = (byTipo[modelo.tipo_manutencao] || 0) + 1; });
  return { total: count || 0, byTipo };
}

export async function salvarModeloAdmin(payload, user) {
  if (!podeAdministrarModelo(user, payload)) throw new Error('Perfil sem permissão para administrar este modelo.');
  const checklist = normalizeChecklist(payload.checklist);
  if (!payload.titulo?.trim()) throw new Error('Informe o nome do modelo.');
  if (!payload.area) throw new Error('Informe a área.');
  if (!payload.tipo_manutencao) throw new Error('Informe o tipo de manutenção.');
  if (!payload.equipamento_tipo) throw new Error('Informe o tipo de equipamento.');
  if (!checklist.length) throw new Error('Informe ao menos um item de checklist.');
  const row = {
    codigo: payload.codigo || gerarCodigoModelo(),
    titulo: payload.titulo.trim(),
    area: payload.area,
    tipo_manutencao: payload.tipo_manutencao,
    equipamento_tipo: payload.equipamento_tipo,
    resumo: payload.resumo || null,
    ativo: payload.ativo !== false,
    metadata: { ...(payload.metadata || {}), origem: 'admin_modelos' },
    updated_at: new Date().toISOString()
  };
  const query = payload.id ? supabase.from('modelos_relatorio').update(row).eq('id', payload.id) : supabase.from('modelos_relatorio').insert(row);
  const { data, error } = await query.select('*').single();
  if (error) throw new Error(error.message);
  await supabase.from('campos_relatorio').delete().eq('modelo_id', data.id);
  const campos = checklist.map((label, index) => ({
    modelo_id: data.id,
    chave: 'check_' + String(index + 1).padStart(2, '0'),
    label,
    tipo: 'checklist',
    grupo: 'checklist',
    obrigatorio: true,
    ordem: index + 1,
    opcoes: []
  }));
  if (campos.length) {
    const { error: camposError } = await supabase.from('campos_relatorio').insert(campos);
    if (camposError) throw new Error(camposError.message);
  }
  return data;
}

export async function duplicarModeloAdmin(modelo, user) {
  if (!podeAdministrarModelo(user, modelo)) throw new Error('Perfil sem permissão para duplicar este modelo.');
  return salvarModeloAdmin({
    titulo: modelo.titulo + ' - Cópia',
    area: modelo.area,
    tipo_manutencao: modelo.tipo_manutencao,
    equipamento_tipo: modelo.equipamento_tipo,
    resumo: modelo.resumo || '',
    checklist: (modelo.campos || []).filter((campo) => campo.grupo === 'checklist').map((campo) => campo.label).join('\n'),
    ativo: modelo.ativo !== false
  }, user);
}

export async function excluirModeloAdmin(modelo, user) {
  if (!podeAdministrarModelo(user, modelo)) throw new Error('Perfil sem permissão para excluir este modelo.');
  const { error } = await supabase.from('modelos_relatorio').update({ deleted_at: new Date().toISOString(), ativo: false, updated_at: new Date().toISOString() }).eq('id', modelo.id);
  if (error) throw new Error(error.message);
}
