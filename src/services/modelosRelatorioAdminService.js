import { supabase } from '../lib/supabase.js';
import { normalizePerfil } from '../config/permissions.js';

const MODELO_SELECT = `
  *,
  campos:campos_relatorio(*)
`;

export const MODELO_AREAS = [
  { value: 'mecanica', label: 'Mecânica' },
  { value: 'eletrica', label: 'Elétrica' },
  { value: 'automacao', label: 'Automação' }
];

export const MODELO_TIPOS_MANUTENCAO = ['preventiva', 'corretiva', 'preditiva'];
export const MODELO_TIPOS_EQUIPAMENTO = ['Bomba', 'Gerador', 'Comporta', 'Rastelo', 'Painel', 'Sensor', 'Climatizador', 'Outros'];

function orderCampos(campos = []) {
  return [...campos].sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
}

function gerarCodigoModelo() {
  const now = new Date();
  const ymd = now.toISOString().slice(0, 10).replaceAll('-', '');
  return 'MR-' + ymd + '-' + String(now.getTime()).slice(-5);
}

export function podeAdministrarModelo(user, modelo = null) {
  const perfil = normalizePerfil(user?.perfil);
  if (['gerencia', 'diretoria'].includes(perfil)) return true;
  if (perfil !== 'supervisor') return false;
  if (!modelo) return true;
  const area = user?.area_supervisao || user?.area_operacional;
  return !modelo.area || modelo.area === area;
}

export async function listarModelosAdmin(user, filters = {}) {
  let query = supabase.from('modelos_relatorio').select(MODELO_SELECT).is('deleted_at', null).order('area', { ascending: true }).order('equipamento_tipo', { ascending: true });
  const perfil = normalizePerfil(user?.perfil);
  if (perfil === 'supervisor') {
    const area = user?.area_supervisao || user?.area_operacional;
    if (area) query = query.eq('area', area);
  } else if (!['gerencia', 'diretoria'].includes(perfil)) {
    return [];
  }
  if (filters.area) query = query.eq('area', filters.area);
  if (filters.tipoManutencao) query = query.eq('tipo_manutencao', filters.tipoManutencao);
  if (filters.equipamentoTipo) query = query.eq('equipamento_tipo', filters.equipamentoTipo);
  if (filters.search) {
    const value = '%' + filters.search + '%';
    query = query.or('titulo.ilike.' + value + ',equipamento_tipo.ilike.' + value + ',resumo.ilike.' + value);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data || []).map((modelo) => ({ ...modelo, campos: orderCampos(modelo.campos) }));
}

function normalizeChecklist(checklist) {
  if (Array.isArray(checklist)) return checklist.map((item) => String(item).trim()).filter(Boolean);
  return String(checklist || '').split('\n').map((item) => item.trim()).filter(Boolean);
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

export async function excluirModeloAdmin(modelo, user) {
  if (!podeAdministrarModelo(user, modelo)) throw new Error('Perfil sem permissão para excluir este modelo.');
  const { error } = await supabase.from('modelos_relatorio').update({ deleted_at: new Date().toISOString(), ativo: false, updated_at: new Date().toISOString() }).eq('id', modelo.id);
  if (error) throw new Error(error.message);
}
