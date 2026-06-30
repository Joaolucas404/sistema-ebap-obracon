import bcrypt from 'bcryptjs';
import { supabase } from '../lib/supabase.js';
import { normalizePerfil } from '../config/permissions.js';

const PUBLIC_USER_FIELDS = 'id, usuario, nome, perfil, setor, area_operacional, area_supervisao, equipe, ebap_id, status_aprovacao, ativo, ultimo_login, criado_em';

export async function loginWithUsuarioSenha(usuario, senha) {
  const cleanUsuario = String(usuario || '').trim();

  if (!cleanUsuario || !senha) {
    throw new Error('Informe usuário e senha.');
  }

  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('usuario', cleanUsuario)
    .single();

  if (error || !data) {
    throw new Error('Usuário ou senha inválidos.');
  }

  if (data.status_aprovacao === 'pendente') {
    throw new Error('Acesso em aprovação. Aguarde a liberação do Supervisor da sua área.');
  }

  if (data.status_aprovacao === 'rejeitado') {
    throw new Error('Solicitação de acesso rejeitada. Procure seu Supervisor.');
  }

  if (!data.ativo) {
    throw new Error('Usuário desativado. Solicite liberação à Diretoria.');
  }

  const senhaValida = await bcrypt.compare(senha, data.senha_hash);

  if (!senhaValida) {
    throw new Error('Usuário ou senha inválidos.');
  }

  const ultimoLogin = new Date().toISOString();

  await supabase
    .from('usuarios')
    .update({ ultimo_login: ultimoLogin, atualizado_em: ultimoLogin })
    .eq('id', data.id);

  const { data: perfilComunicacao } = await supabase
    .from('comunicacao_perfis')
    .select('foto_url,cargo,area,equipe')
    .eq('usuario_id', data.id)
    .maybeSingle();

  return {
    id: data.id,
    usuario: data.usuario,
    nome: data.nome,
    perfil: normalizePerfil(data.perfil),
    setor: data.setor,
    area_operacional: data.area_operacional,
    area_supervisao: data.area_supervisao,
    equipe: data.equipe,
    ebap_id: data.ebap_id,
    foto_url: perfilComunicacao?.foto_url || '',
    cargo: perfilComunicacao?.cargo || data.setor || data.perfil,
    status_aprovacao: data.status_aprovacao,
    ativo: data.ativo,
    ultimo_login: ultimoLogin,
    criado_em: data.criado_em
  };
}

export async function buscarUsuarioPublico(id) {
  const { data, error } = await supabase.from('usuarios').select(PUBLIC_USER_FIELDS).eq('id', id).single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
