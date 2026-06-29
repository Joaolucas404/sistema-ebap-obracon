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

export const EQUIPES_TECNICAS = [
  { value: 'mecanica_c', label: 'Mecânica C', area: 'mecanica' },
  { value: 'mecanica_d', label: 'Mecânica D', area: 'mecanica' },
  { value: 'mecanica_h', label: 'Mecânica H', area: 'mecanica' },
  { value: 'eletrica_b', label: 'Elétrica B', area: 'eletrica' },
  { value: 'eletrica_f', label: 'Elétrica F', area: 'eletrica' },
  { value: 'eletrica_d', label: 'Elétrica D', area: 'eletrica' },
  { value: 'eletrica_h', label: 'Elétrica H', area: 'eletrica' },
  { value: 'automacao_a', label: 'Automação A', area: 'automacao' },
  { value: 'automacao_e', label: 'Automação E', area: 'automacao' }
];

const GLOBAL_APPROVERS = ['gerencia', 'diretoria', 'administrador'];

const AUTO_AREA_BY_PROFILE = {
  sst: 'sst',
  administrativo: 'administrativo',
  almoxarifado: 'almoxarifado',
  financeiro: 'financeiro',
  cco: 'cco',
  prefeitura: 'prefeitura'
};

const SELECT_FIELDS = 'id, usuario, nome, perfil, setor, area_operacional, area_supervisao, equipe, status_aprovacao, aprovado_por, aprovado_em, rejeitado_por, rejeitado_em, motivo_rejeicao, ativo, ultimo_login, criado_por, criado_em, atualizado_em, deleted_at';

export function areaOperacionalLabel(area) {
  return AREAS_OPERACIONAIS.find((item) => item.value === area)?.label || area || '-';
}

export function equipeTecnicaLabel(equipe) {
  return EQUIPES_TECNICAS.find((item) => item.value === equipe)?.label || equipe || '-';
}

export function areaFromEquipe(equipe) {
  return EQUIPES_TECNICAS.find((item) => item.value === equipe)?.area || '';
}

export function podeGerenciarUsuarios(user) {
  return ['diretoria', 'gerencia', 'administrador'].includes(user?.perfil);
}

export function podeAprovarTecnicos(user) {
  return user?.perfil === 'supervisor' || GLOBAL_APPROVERS.includes(user?.perfil);
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
  const equipe = payload.equipe || null;
  const equipeArea = equipe ? areaFromEquipe(equipe) : '';
  if (equipe && !equipeArea) throw new Error('Equipe técnica inválida.');
  if (perfil === 'tecnico' && !equipe) throw new Error('Equipe é obrigatória para técnico.');
  const area = normalizeAreaOperacional(payload.area_operacional, perfil);
  if (perfil === 'tecnico' && equipeArea && area !== equipeArea) {
    throw new Error('A área operacional do técnico deve corresponder à equipe selecionada.');
  }
  const row = {
    nome: String(payload.nome || '').trim(),
    usuario: String(payload.usuario || '').trim(),
    perfil,
    setor: payload.setor ? String(payload.setor).trim() : null,
    area_operacional: area,
    equipe,
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

export async function solicitarAcessoTecnico(payload) {
  const nome = String(payload.nome || '').trim();
  const usuario = String(payload.usuario || '').trim();
  const senha = String(payload.senha || '');
  const confirmarSenha = String(payload.confirmarSenha || '');
  const equipe = payload.equipe;
  const area = areaFromEquipe(equipe);

  if (!nome || !usuario || !senha || !confirmarSenha || !equipe) {
    throw new Error('Nome, login, senha, confirmação e equipe são obrigatórios.');
  }
  if (!area) throw new Error('Selecione uma equipe oficial.');
  if (senha.length < 6) throw new Error('A senha deve ter pelo menos 6 caracteres.');
  if (senha !== confirmarSenha) throw new Error('As senhas não conferem.');

  const senha_hash = await bcrypt.hash(senha, 10);
  const { data, error } = await supabase
    .from('usuarios')
    .insert({
      nome,
      usuario,
      senha_hash,
      perfil: 'tecnico',
      setor: equipeTecnicaLabel(equipe),
      area_operacional: area,
      equipe,
      ativo: false,
      status_aprovacao: 'pendente',
      atualizado_em: new Date().toISOString()
    })
    .select(SELECT_FIELDS)
    .single();

  if (error) {
    if (error.code === '23505') throw new Error('Este login já está em uso.');
    throw new Error(error.message);
  }

  await registrarAuditoriaUsuarios({
    acao: 'auto_cadastro_tecnico',
    usuario_alvo_id: data.id,
    descricao: `Solicitação de acesso técnico criada para ${data.nome}.`,
    metadata: { equipe, area_operacional: area }
  });

  return data;
}

export async function listarAcessosPendentes(currentUser) {
  if (!podeAprovarTecnicos(currentUser)) return [];

  let query = supabase
    .from('usuarios')
    .select(SELECT_FIELDS)
    .eq('perfil', 'tecnico')
    .eq('status_aprovacao', 'pendente')
    .is('deleted_at', null)
    .order('criado_em', { ascending: true });

  if (currentUser?.perfil === 'supervisor') {
    const area = currentUser.area_supervisao || currentUser.area_operacional;
    query = query.eq('area_operacional', area);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function aprovarAcessoTecnico(id, currentUser) {
  await garantirPodeAprovar(id, currentUser);
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('usuarios')
    .update({
      ativo: true,
      status_aprovacao: 'aprovado',
      aprovado_por: currentUser?.id || null,
      aprovado_em: now,
      rejeitado_por: null,
      rejeitado_em: null,
      motivo_rejeicao: null,
      atualizado_em: now
    })
    .eq('id', id)
    .select(SELECT_FIELDS)
    .single();

  if (error) throw new Error(error.message);
  await registrarAuditoriaUsuarios({
    acao: 'aprovacao_acesso_tecnico',
    usuario_alvo_id: id,
    responsavel_id: currentUser?.id,
    descricao: `Acesso técnico aprovado por ${currentUser?.nome || currentUser?.usuario || 'sistema'}.`,
    metadata: { equipe: data.equipe, area_operacional: data.area_operacional }
  });
  return data;
}

export async function rejeitarAcessoTecnico(id, currentUser, motivo) {
  const cleanMotivo = String(motivo || '').trim();
  if (!cleanMotivo) throw new Error('Informe o motivo da rejeição.');
  const alvo = await garantirPodeAprovar(id, currentUser);
  const now = new Date().toISOString();

  await registrarAuditoriaUsuarios({
    acao: 'rejeicao_acesso_tecnico',
    usuario_alvo_id: id,
    responsavel_id: currentUser?.id,
    descricao: `Acesso técnico rejeitado por ${currentUser?.nome || currentUser?.usuario || 'sistema'}. Login ${alvo.usuario} liberado para novo cadastro.`,
    metadata: { equipe: alvo.equipe, area_operacional: alvo.area_operacional, motivo: cleanMotivo, login_liberado: true }
  });

  await removerUsuarioOuMarcarExcluido(id, {
    ativo: false,
    status_aprovacao: 'rejeitado',
    rejeitado_por: currentUser?.id || null,
    rejeitado_em: now,
    motivo_rejeicao: cleanMotivo,
    atualizado_em: now,
    deleted_at: now,
    deleted_by: currentUser?.id || null
  }, (query) => query.eq('perfil', 'tecnico').eq('status_aprovacao', 'pendente'));

  return { ...alvo, status_aprovacao: 'rejeitado', motivo_rejeicao: cleanMotivo, login_liberado: true };
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

  if (error) {
    if (error.code === '23505' || error.status === 409) {
      throw new Error('Este login já existe em um usuário ativo ou pendente. Exclua ou rejeite o cadastro existente antes de reutilizar o login.');
    }
    throw new Error(error.message);
  }
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
  const alvo = await buscarUsuario(id);
  const now = new Date().toISOString();

  await registrarAuditoriaUsuarios({
    acao: 'exclusao_usuario_permanente',
    usuario_alvo_id: id,
    responsavel_id: deletedBy || null,
    descricao: `Usuário ${alvo.usuario} excluído permanentemente. Login liberado para reutilização.`,
    metadata: { usuario: alvo.usuario, nome: alvo.nome, perfil: alvo.perfil, login_liberado: true }
  });

  await removerUsuarioOuMarcarExcluido(id, {
    ativo: false,
    atualizado_em: now,
    deleted_at: now,
    deleted_by: deletedBy || null
  });

  return { ...alvo, excluido_permanentemente: true, login_liberado: true };
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

async function garantirPodeAprovar(id, currentUser) {
  if (!podeAprovarTecnicos(currentUser)) throw new Error('Perfil sem permissão para aprovar técnicos.');
  const alvo = await buscarUsuario(id);
  if (alvo.perfil !== 'tecnico' || alvo.status_aprovacao !== 'pendente') {
    throw new Error('Solicitação de acesso inválida ou já processada.');
  }
  if (currentUser?.perfil === 'supervisor') {
    const area = currentUser.area_supervisao || currentUser.area_operacional;
    if (!area || alvo.area_operacional !== area) {
      throw new Error('Supervisor só pode aprovar técnicos da própria área.');
    }
  }
  return alvo;
}

async function registrarAuditoriaUsuarios({ acao, usuario_alvo_id, responsavel_id = null, descricao, metadata = {} }) {
  const { error } = await supabase.from('auditoria').insert({
    usuario_id: responsavel_id,
    acao,
    tabela: 'usuarios',
    registro_id: usuario_alvo_id,
    descricao,
    metadata
  });

  if (error && error.code !== '42P01') {
    console.warn('Falha ao registrar auditoria de usuários:', error.message);
  }
}

async function removerUsuarioOuMarcarExcluido(id, softDeletePayload, applyDeleteFilters = (query) => query) {
  const deleteQuery = applyDeleteFilters(supabase.from('usuarios').delete().eq('id', id));
  const { error: deleteError } = await deleteQuery;

  if (!deleteError) return;

  if (deleteError.code !== '23503') {
    throw new Error(deleteError.message);
  }

  const { error: updateError } = await supabase
    .from('usuarios')
    .update(softDeletePayload)
    .eq('id', id);

  if (updateError) throw new Error(updateError.message);
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
