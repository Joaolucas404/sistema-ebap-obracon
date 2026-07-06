import { supabase } from '../lib/supabase.js';

export const COMUNICACAO_BUCKET = 'communication-files';
const FOTO_PERFIL_EXPIRES_IN = 60 * 60 * 24 * 7;

export const STATUS_PRESENCA = [
  { value: 'online', label: 'Online', tone: 'green' },
  { value: 'ausente', label: 'Ausente', tone: 'yellow' },
  { value: 'offline', label: 'Offline', tone: 'slate' }
];

export const GRUPOS_OPERACIONAIS = [
  'Mecânica C',
  'Mecânica D',
  'Mecânica H',
  'Elétrica B',
  'Elétrica F',
  'Elétrica D',
  'Elétrica H',
  'Automação A',
  'Automação E',
  'CCO',
  'Supervisão',
  'Gerência',
  'Diretoria'
];

const CONVERSA_SELECT = `
  *,
  membros:comunicacao_membros(*, usuario:usuarios(id,nome,usuario,perfil,setor,area_operacional,area_supervisao,equipe)),
  ultima_mensagem:comunicacao_mensagens(id,tipo,corpo,created_at,autor:usuarios(id,nome,usuario))
`;

const MENSAGEM_SELECT = `
  *,
  autor:usuarios(id,nome,usuario,perfil,setor,area_operacional,area_supervisao,equipe),
  anexos:comunicacao_anexos(*),
  leituras:comunicacao_leituras(*)
`;

const USUARIO_COMUNICACAO_SELECT = 'id,nome,usuario,perfil,setor,area_operacional,area_supervisao,equipe,ativo,status_aprovacao,deleted_at';

function safeName(file) {
  return String(file?.name || 'arquivo').replace(/[^\w.\-]+/g, '_');
}

function extractSignedStoragePath(url) {
  try {
    const parsed = new URL(url);
    const marker = '/storage/v1/object/sign/';
    const index = parsed.pathname.indexOf(marker);
    if (index < 0) return null;
    const rest = parsed.pathname.slice(index + marker.length);
    const [bucket, ...pathParts] = rest.split('/');
    const path = decodeURIComponent(pathParts.join('/'));
    return bucket && path ? { bucket, path } : null;
  } catch {
    return null;
  }
}

export async function resolverUrlFotoPerfil(fotoUrl, expiresIn = FOTO_PERFIL_EXPIRES_IN) {
  const source = String(fotoUrl || '').trim();
  if (!source) return '';

  const signed = extractSignedStoragePath(source);
  const bucket = signed?.bucket || COMUNICACAO_BUCKET;
  const path = signed?.path || (!/^https?:\/\//i.test(source) ? source : '');
  if (!path) return source;

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (!error && data?.signedUrl) return data.signedUrl;

  const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path);
  return publicData?.publicUrl || source;
}

function fileKind(file) {
  const type = String(file?.type || '').toLowerCase();
  const name = String(file?.name || '').toLowerCase();
  if (type.startsWith('image/')) return 'imagem';
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'audio';
  if (type.includes('pdf') || name.endsWith('.pdf')) return 'pdf';
  if (type.includes('spreadsheet') || type.includes('excel') || /\.(xls|xlsx|csv)$/.test(name)) return 'planilha';
  if (type.includes('document') || /\.(doc|docx|odt|txt)$/.test(name)) return 'documento';
  return 'arquivo';
}

export function perfilComunicacao(user) {
  return {
    nome: user?.nome || user?.usuario || 'Usuário',
    cargo: user?.setor || user?.perfil || '-',
    equipe: user?.equipe || '-',
    area: user?.area_operacional || user?.area_supervisao || user?.perfil || '-',
    foto_url: user?.foto_url || user?.avatar_url || ''
  };
}

export async function salvarPerfilComunicacao(user, patch = {}) {
  if (!user?.id) throw new Error('Usuário não identificado.');
  const perfil = perfilComunicacao(user);
  const row = {
    usuario_id: user.id,
    cargo: patch.cargo ?? perfil.cargo,
    equipe: patch.equipe ?? user.equipe ?? null,
    area: patch.area ?? user.area_operacional ?? user.area_supervisao ?? user.perfil ?? null,
    status_manual: patch.status_manual || 'online',
    updated_at: new Date().toISOString()
  };
  if (Object.prototype.hasOwnProperty.call(patch, 'foto_url')) {
    row.foto_url = patch.foto_url ?? perfil.foto_url;
  }

  const { data, error } = await supabase
    .from('comunicacao_perfis')
    .upsert(row, { onConflict: 'usuario_id' })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function obterPerfilComunicacao(usuarioId) {
  if (!usuarioId) return null;
  const { data, error } = await supabase
    .from('comunicacao_perfis')
    .select('*')
    .eq('usuario_id', usuarioId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data || null;
}

export async function listarPerfisComunicacao(usuarioIds = []) {
  const ids = [...new Set((usuarioIds || []).filter(Boolean))];
  if (!ids.length) return [];

  const { data, error } = await supabase
    .from('comunicacao_perfis')
    .select('*')
    .in('usuario_id', ids);
  if (error) throw new Error(error.message);
  return data || [];
}

export async function enviarFotoPerfilComunicacao(file, user) {
  if (!file) throw new Error('Selecione uma foto de perfil.');
  if (!user?.id) throw new Error('Usuário não identificado.');
  const path = `perfis/${user.id}/${Date.now()}-${safeName(file)}`;
  const { error: uploadError } = await supabase.storage.from(COMUNICACAO_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || 'image/jpeg'
  });
  if (uploadError) throw new Error(uploadError.message);
  return salvarPerfilComunicacao(user, { foto_url: path });
}

export async function listarConversasComunicacao(user) {
  const { data, error } = await supabase
    .from('comunicacao_conversas')
    .select(CONVERSA_SELECT)
    .eq('ativo', true)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });

  if (error) throw new Error(error.message);

  const role = String(user?.perfil || '');
  const equipe = String(user?.equipe || '');
  const area = String(user?.area_operacional || user?.area_supervisao || '');

  return (data || []).filter((conversa) => {
    const isMember = (conversa.membros || []).some((membro) => membro.usuario_id === user?.id);
    if (isMember) return true;
    if (conversa.tipo === 'direta') {
      return false;
    }
    if (conversa.equipe && conversa.equipe === equipe) return true;
    if (conversa.area && [area, role].includes(conversa.area)) return true;
    if (conversa.nome === 'Supervisão' && role === 'supervisor') return true;
    if (conversa.nome === 'CCO' && role === 'cco') return true;
    return false;
  }).map((conversa) => formatarConversaParaUsuario(conversa, user));
}

export async function buscarPessoasComunicacao(search = '', currentUser) {
  const term = String(search || '').trim();
  if (term.length < 2) return [];

  const value = `%${term}%`;
  const { data, error } = await supabase
    .from('usuarios')
    .select(USUARIO_COMUNICACAO_SELECT)
    .is('deleted_at', null)
    .eq('ativo', true)
    .or(`nome.ilike.${value},usuario.ilike.${value}`)
    .order('nome', { ascending: true })
    .limit(12);

  if (error) throw new Error(error.message);
  return (data || []).filter((usuario) => usuario.id !== currentUser?.id);
}

async function buscarConversaDiretaExistente({ directKey, user, outro }) {
  const { data: porChave, error: chaveError } = await supabase
    .from('comunicacao_conversas')
    .select(CONVERSA_SELECT)
    .eq('tipo', 'direta')
    .eq('metadata->>direct_key', directKey)
    .is('deleted_at', null)
    .maybeSingle();
  if (chaveError) throw new Error(chaveError.message);
  if (porChave) return porChave;

  const nome = outro?.nome || outro?.usuario || '';
  if (!nome) return null;

  const { data: porNome, error: nomeError } = await supabase
    .from('comunicacao_conversas')
    .select(CONVERSA_SELECT)
    .eq('tipo', 'direta')
    .eq('nome', nome)
    .is('deleted_at', null)
    .limit(5);
  if (nomeError) throw new Error(nomeError.message);
  return (porNome || []).find((conversa) => {
    const membros = conversa.membros || [];
    return membros.some((membro) => membro.usuario_id === user?.id) && membros.some((membro) => membro.usuario_id === outro?.id);
  }) || null;
}

function formatarConversaParaUsuario(conversa, user) {
  if (!conversa || conversa.tipo !== 'direta') return conversa;
  const outroMembro = (conversa.membros || []).find((membro) => membro.usuario_id !== user?.id);
  const outro = outroMembro?.usuario;
  const nome = outro?.nome || outro?.usuario || conversa.metadata?.display_name || conversa.nome || 'Conversa direta';
  return {
    ...conversa,
    nome_sistema: conversa.nome,
    nome,
    descricao: `Conversa direta com ${nome}`
  };
}

async function garantirMembrosConversaDireta(conversaId, user, outro) {
  const membros = [
    {
      conversa_id: conversaId,
      usuario_id: user.id,
      perfil: user.perfil || null,
      equipe: user.equipe || null,
      area: user.area_operacional || user.area_supervisao || null,
      papel: 'membro'
    },
    {
      conversa_id: conversaId,
      usuario_id: outro.id,
      perfil: outro.perfil || null,
      equipe: outro.equipe || null,
      area: outro.area_operacional || outro.area_supervisao || null,
      papel: 'membro'
    }
  ];

  const { error } = await supabase.from('comunicacao_membros').upsert(membros, { onConflict: 'conversa_id,usuario_id' });
  if (error) throw new Error(error.message);
  return membros;
}

export async function garantirMembroConversaComunicacao(conversa, user) {
  if (!conversa?.id || !user?.id) return conversa;
  if ((conversa.membros || []).some((membro) => membro.usuario_id === user.id)) return conversa;

  const membro = {
    conversa_id: conversa.id,
    usuario_id: user.id,
    perfil: user.perfil || null,
    equipe: user.equipe || null,
    area: user.area_operacional || user.area_supervisao || null,
    papel: 'membro'
  };

  const { error } = await supabase.from('comunicacao_membros').upsert(membro, { onConflict: 'conversa_id,usuario_id' });
  if (error) throw new Error(error.message);

  return {
    ...conversa,
    membros: [
      ...(conversa.membros || []),
      {
        ...membro,
        usuario: {
          id: user.id,
          nome: user.nome,
          usuario: user.usuario,
          perfil: user.perfil,
          setor: user.setor,
          area_operacional: user.area_operacional,
          area_supervisao: user.area_supervisao,
          equipe: user.equipe
        }
      }
    ]
  };
}

export async function obterOuCriarConversaDireta(outroUsuarioId, user) {
  if (!user?.id) throw new Error('Usuário não identificado.');
  if (!outroUsuarioId) throw new Error('Selecione uma pessoa.');

  const ids = [user.id, outroUsuarioId].sort();
  const directKey = ids.join(':');

  const { data: outro, error: outroError } = await supabase
    .from('usuarios')
    .select(USUARIO_COMUNICACAO_SELECT)
    .eq('id', outroUsuarioId)
    .maybeSingle();
  if (outroError) throw new Error(outroError.message);
  if (!outro) throw new Error('Pessoa não encontrada.');

  const nome = outro.nome || outro.usuario || 'Conversa direta';
  const existente = await buscarConversaDiretaExistente({ directKey, user, outro });
  if (existente) {
    const membros = await garantirMembrosConversaDireta(existente.id, user, outro);
    return formatarConversaParaUsuario({
      ...existente,
      membros: existente.membros?.length ? existente.membros : membros.map((membro) => ({
        ...membro,
        usuario: membro.usuario_id === user.id ? user : outro
      }))
    }, user);
  }

  const nomeInterno = `Direta:${directKey}`;
  const { data: conversa, error } = await supabase
    .from('comunicacao_conversas')
    .insert({
      tipo: 'direta',
      nome: nomeInterno,
      descricao: `Conversa direta com ${nome}`,
      criado_por: user.id,
      metadata: { direct_key: directKey, participantes: ids, display_name: nome }
    })
    .select(CONVERSA_SELECT)
    .single();
  if (error) {
    if (error.code === '23505') {
      const fallback = await buscarConversaDiretaExistente({ directKey, user, outro });
      if (fallback) {
        const membros = await garantirMembrosConversaDireta(fallback.id, user, outro);
        return formatarConversaParaUsuario({
          ...fallback,
          membros: fallback.membros?.length ? fallback.membros : membros.map((membro) => ({
            ...membro,
            usuario: membro.usuario_id === user.id ? user : outro
          }))
        }, user);
      }
    }
    throw new Error(error.message);
  }

  const membros = await garantirMembrosConversaDireta(conversa.id, user, outro);

  return formatarConversaParaUsuario({
    ...conversa,
    membros: membros.map((membro) => ({
      ...membro,
      usuario: membro.usuario_id === outro.id ? outro : {
        id: user.id,
        nome: user.nome,
        usuario: user.usuario,
        perfil: user.perfil,
        setor: user.setor,
        area_operacional: user.area_operacional,
        area_supervisao: user.area_supervisao,
        equipe: user.equipe
      }
    }))
  }, user);
}

export async function listarMensagensComunicacao(conversaId, limit = 80) {
  if (!conversaId) return [];
  const { data, error } = await supabase
    .from('comunicacao_mensagens')
    .select(MENSAGEM_SELECT)
    .eq('conversa_id', conversaId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return [...(data || [])].reverse();
}

export async function enviarMensagemComunicacao({ conversaId, corpo, tipo = 'texto', metadata = {} }, user) {
  if (!user?.id) throw new Error('Usuário não identificado.');
  if (!conversaId) throw new Error('Selecione uma conversa.');
  if (tipo === 'texto' && !String(corpo || '').trim()) throw new Error('Digite uma mensagem.');

  const { data, error } = await supabase
    .from('comunicacao_mensagens')
    .insert({
      conversa_id: conversaId,
      autor_id: user.id,
      tipo,
      corpo: String(corpo || '').trim() || null,
      metadata
    })
    .select(MENSAGEM_SELECT)
    .single();
  if (error) throw new Error(error.message);

  await supabase
    .from('comunicacao_conversas')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversaId);

  return data;
}

export async function atualizarMensagemComunicacao(mensagem, patch = {}, user) {
  if (!mensagem?.id) throw new Error('Mensagem não identificada.');
  if (!user?.id) throw new Error('Usuário não identificado.');

  const { data, error } = await supabase
    .from('comunicacao_mensagens')
    .update(patch)
    .eq('id', mensagem.id)
    .select(MENSAGEM_SELECT)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function excluirMensagemComunicacao(mensagem, user) {
  if (!mensagem?.id) throw new Error('Mensagem não identificada.');
  if (!user?.id) throw new Error('Usuário não identificado.');
  if (mensagem.autor_id !== user.id) throw new Error('Somente mensagens próprias podem ser excluídas.');

  const { error } = await supabase
    .from('comunicacao_mensagens')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', mensagem.id)
    .eq('autor_id', user.id);
  if (error) throw new Error(error.message);
}

export async function enviarArquivoComunicacao({ conversaId, file, corpo = '' }, user) {
  if (!file) throw new Error('Selecione um arquivo.');
  const tipoArquivo = fileKind(file);
  const mensagem = await enviarMensagemComunicacao({
    conversaId,
    corpo: corpo || file.name,
    tipo: tipoArquivo === 'audio' ? 'audio' : 'arquivo',
    metadata: { mime_type: file.type || null, nome_original: file.name }
  }, user);

  const path = `${conversaId}/${mensagem.id}/${Date.now()}-${safeName(file)}`;
  const { error: uploadError } = await supabase.storage.from(COMUNICACAO_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || 'application/octet-stream'
  });
  if (uploadError) throw new Error(uploadError.message);

  const { data, error } = await supabase
    .from('comunicacao_anexos')
    .insert({
      mensagem_id: mensagem.id,
      conversa_id: conversaId,
      usuario_id: user?.id || null,
      bucket: COMUNICACAO_BUCKET,
      path,
      nome_original: file.name,
      mime_type: file.type || null,
      tamanho: file.size || null,
      tipo: tipoArquivo
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);

  return { ...mensagem, anexos: [data] };
}

export async function obterUrlArquivoComunicacao(anexo, expiresIn = 3600) {
  if (!anexo?.bucket || !anexo?.path) return '';
  const { data, error } = await supabase.storage.from(anexo.bucket).createSignedUrl(anexo.path, expiresIn);
  if (!error && data?.signedUrl) return data.signedUrl;

  const { data: publicData } = supabase.storage.from(anexo.bucket).getPublicUrl(anexo.path);
  return publicData?.publicUrl || '';
}

export async function marcarMensagensComoLidas(conversaId, mensagens = [], user) {
  if (!conversaId || !user?.id || !mensagens.length) return;
  const rows = mensagens
    .filter((mensagem) => mensagem.autor_id !== user.id)
    .map((mensagem) => ({
      mensagem_id: mensagem.id,
      conversa_id: conversaId,
      usuario_id: user.id,
      lido_em: new Date().toISOString()
    }));
  if (!rows.length) return;
  const { error } = await supabase.from('comunicacao_leituras').upsert(rows, { onConflict: 'mensagem_id,usuario_id' });
  if (error) throw new Error(error.message);
}

export function subscribeMensagens(conversaId, onInsert, onRead) {
  if (!conversaId) return null;
  const channel = supabase
    .channel(`comunicacao-mensagens-${conversaId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'comunicacao_mensagens',
      filter: `conversa_id=eq.${conversaId}`
    }, (payload) => onInsert?.(payload.new))
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'comunicacao_leituras',
      filter: `conversa_id=eq.${conversaId}`
    }, (payload) => onRead?.(payload.new))
    .subscribe();
  return channel;
}

export function criarCanalPresenca(user, status, handlers = {}) {
  const channel = supabase.channel('comunicacao-presenca', {
    config: { presence: { key: user?.id || 'anon' } }
  });

  channel
    .on('presence', { event: 'sync' }, () => handlers.onSync?.(channel.presenceState()))
    .on('presence', { event: 'join' }, ({ newPresences }) => handlers.onJoin?.(newPresences))
    .on('presence', { event: 'leave' }, ({ leftPresences }) => handlers.onLeave?.(leftPresences))
    .subscribe(async (state) => {
      if (state === 'SUBSCRIBED') {
        await channel.track({
          user_id: user?.id,
          nome: user?.nome || user?.usuario,
          perfil: user?.perfil,
          equipe: user?.equipe,
          area: user?.area_operacional || user?.area_supervisao,
          status,
          online_at: new Date().toISOString()
        });
      }
    });

  return channel;
}

export function criarCanalDigitando(conversaId, user, onTyping) {
  if (!conversaId) return null;
  const channel = supabase.channel(`comunicacao-digitando-${conversaId}`);
  channel
    .on('broadcast', { event: 'typing' }, ({ payload }) => {
      if (payload?.user_id !== user?.id) onTyping?.(payload);
    })
    .subscribe();
  return channel;
}

export function broadcastDigitando(channel, user, conversaId, digitando = true) {
  if (!channel || !user?.id || !conversaId) return;
  channel.send({
    type: 'broadcast',
    event: 'typing',
    payload: {
      conversa_id: conversaId,
      user_id: user.id,
      nome: user.nome || user.usuario,
      digitando,
      at: new Date().toISOString()
    }
  });
}
