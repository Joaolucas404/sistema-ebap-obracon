import bcrypt from 'bcryptjs';
import { supabase } from '../lib/supabase.js';
import { normalizePerfil } from '../config/permissions.js';

export const AREAS_OPERACIONAIS = [
  { value: 'todas', label: 'Todas' },
  { value: 'mecanica', label: 'Mecânica' },
  { value: 'eletrica', label: 'Elétrica' },
  { value: 'automacao', label: 'Automação' },
  { value: 'operacional', label: 'Operação' },
  { value: 'sst', label: 'SST' },
  { value: 'administrativo', label: 'Administrativo' },
  { value: 'almoxarifado', label: 'Almoxarifado' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'cco', label: 'CCO' },
  { value: 'diretoria', label: 'Diretoria' },
  { value: 'gerencia', label: 'Gerência' },
  { value: 'prefeitura', label: 'Prefeitura' }
];

const AUTO_AREA_BY_PROFILE = {
  sst: 'sst',
  administrativo: 'administrativo',
  almoxarifado: 'almoxarifado',
  financeiro: 'financeiro',
  cco: 'cco',
  prefeitura: 'prefeitura'
};

const SELECT_FIELDS = 'id, usuario, nome, perfil, setor, area_operacional, area_supervisao, ativo, ultimo_login, criado_por, criado_em, atualizado_em, deleted_at';

export function areaOperacionalLabel(area) {
  return AREAS_OPERACIONAIS.find((item) => item.value === area)?.label || area || '-';
}

export function podeGerenciarUsuarios(user) {
  return ['diretoria', 'gerencia'].includes(user?.perfil);
}

function podeAlterarUsuario(alvoPerfil, currentUser) {
  if (currentUser?.perfil === 'diretoria') return true;
  if (currentUser?.perfil !== 'gerencia') return false;
  return !['diretoria', 'gerencia'].includes(normalizePerfil(alvoPerfil));
}

function normalizeAreaOperacional(area, perfil) {
  const cleanArea = area || '';
  if (perfil === 'diretoria' || perfil === 'gerencia') return cleanArea || 'todas';
  if (AUTO_AREA_BY_PROFILE[perfil] && !cleanArea) return AUTO_AREA_BY_PROFILE[perfil];
  if (perfil === 'supervisor' && !cleanArea) throw new Error('Área Operacional é obrigatória para supervisor.');
  if (perfil === 'tecnico' && !cleanArea) throw new Error('Área Operacional é obrigatória para técnico.');
  if (!cleanArea) return null;
  if (!AREAS_OPERACIONAIS.some((item) => item.value === cleanArea)) throw new Error('Área Operacional inválida.');
  return cleanArea;
}

function normalizePayload(payload) {
  const perfil = normalizePerfil(payload.perfil);
  const area = normalizeAreaOperacional(payload.area_operacional, perfil);
  const row = {
    nome: String(payload.nome || '').trim(),
    usuario: String(payload.usuario || '').trim(),
    perfil,
    setor: payload.setor ? String(payload.setor).trim() : null,
    area_operacional: area,
    ativo: Boolean(payload.ativo)
  };

  if (perfil === 'supervisor') row.area_supervisao = area;
  return row;
}

export async function listarUsuarios() {
  const { data, error } = await supabase.from('usuarios').select(SELECT_FIELDS).is('deleted_at', null).order('nome', { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function criarUsuario(payload, currentUser) {
  if (!podeGerenciarUsuarios(currentUser)) throw new Error('Perfil sem permissão para criar usuários.');
  const normalized = normalizePayload(payload);
  if (!podeAlterarUsuario(normalized.perfil, currentUser)) throw new Error('Gerência não pode criar usuários de Gerência ou Diretoria.');

  if (!normalized.nome || !normalized.usuario || !payload.senha) {
    throw new Error('Nome, usuário e senha inicial são obrigatórios.');
  }

  const senha_hash = await bcrypt.hash(payload.senha, 10);
  const { data, error } = await supabase
    .from('usuarios')
    .insert({
      ...normalized,
      senha_hash,
      criado_por: payload.criado_por || null,
      atualizado_em: new Date().toISOString()
    })
    .select(SELECT_FIELDS)
    .single();

  if (error) throw new Error(error.message);
  await sincronizarSupervisorArea(data);
  return data;
}

export async function atualizarUsuario(id, payload, currentUser) {
  if (!podeGerenciarUsuarios(currentUser)) throw new Error('Perfil sem permissão para editar usuários.');
  const atual = await buscarUsuario(id);
  if (!podeAlterarUsuario(atual.perfil, currentUser) || !podeAlterarUsuario(payload.perfil, currentUser)) {
    throw new Error('Gerência não pode editar usuários de Gerência ou Diretoria.');
  }

  const normalized = normalizePayload(payload);
  const { data, error } = await supabase
    .from('usuarios')
    .update({
      ...normalized,
      atualizado_em: new Date().toISOString()
    })
    .eq('id', id)
    .select(SELECT_FIELDS)
    .single();

  if (error) throw new Error(error.message);
  await sincronizarSupervisorArea(data);
  return data;
}

export async function desativarUsuario(id) {
  return atualizarStatusUsuario(id, false);
}

export async function reativarUsuario(id) {
  return atualizarStatusUsuario(id, true);
}

export async function excluirUsuario(id, deletedBy) {
  const { data, error } = await supabase.rpc('soft_delete_usuario_diretoria', {
    p_usuario_alvo_id: id,
    p_usuario_executor_id: deletedBy || null
  });
  if (error) throw new Error(error.message);
  return data?.[0] || null;
}

async function atualizarStatusUsuario(id, ativo) {
  const { data, error } = await supabase
    .from('usuarios')
    .update({ ativo, atualizado_em: new Date().toISOString() })
    .eq('id', id)
    .select(SELECT_FIELDS)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function resetarSenha(id, novaSenha) {
  if (!novaSenha || novaSenha.length < 6) {
    throw new Error('A nova senha deve ter pelo menos 6 caracteres.');
  }

  const senha_hash = await bcrypt.hash(novaSenha, 10);
  const { data, error } = await supabase
    .from('usuarios')
    .update({ senha_hash, atualizado_em: new Date().toISOString() })
    .eq('id', id)
    .select(SELECT_FIELDS)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

async function buscarUsuario(id) {
  const { data, error } = await supabase.from('usuarios').select(SELECT_FIELDS).eq('id', id).single();
  if (error) throw new Error(error.message);
  return data;
}

async function sincronizarSupervisorArea(usuario) {
  if (usuario.perfil !== 'supervisor' || !usuario.area_operacional) return;

  const { error } = await supabase
    .from('supervisor_areas')
    .upsert({
      area: usuario.area_operacional,
      nome: areaOperacionalLabel(usuario.area_operacional),
      supervisor_id: usuario.id,
      ativo: true,
      updated_at: new Date().toISOString()
    }, { onConflict: 'area' });

  if (error) throw new Error(error.message);
}
