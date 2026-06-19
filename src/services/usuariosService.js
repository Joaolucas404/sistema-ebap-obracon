import bcrypt from 'bcryptjs';
import { supabase } from '../lib/supabase.js';
import { normalizePerfil } from '../config/permissions.js';

const SELECT_FIELDS = 'id, usuario, nome, perfil, setor, ativo, ultimo_login, criado_por, criado_em, atualizado_em, deleted_at';

function normalizePayload(payload) {
  return {
    nome: String(payload.nome || '').trim(),
    usuario: String(payload.usuario || '').trim(),
    perfil: normalizePerfil(payload.perfil),
    setor: payload.setor ? String(payload.setor).trim() : null,
    ativo: Boolean(payload.ativo)
  };
}

export async function listarUsuarios() {
  const { data, error } = await supabase.from('usuarios').select(SELECT_FIELDS).is('deleted_at', null).order('nome', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export async function criarUsuario(payload) {
  const normalized = normalizePayload(payload);

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

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function atualizarUsuario(id, payload) {
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

  if (error) {
    throw new Error(error.message);
  }

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
  if (error) {
    throw new Error(error.message);
  }

  return data?.[0] || null;
}

async function atualizarStatusUsuario(id, ativo) {
  const { data, error } = await supabase
    .from('usuarios')
    .update({ ativo, atualizado_em: new Date().toISOString() })
    .eq('id', id)
    .select(SELECT_FIELDS)
    .single();

  if (error) {
    throw new Error(error.message);
  }

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

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
