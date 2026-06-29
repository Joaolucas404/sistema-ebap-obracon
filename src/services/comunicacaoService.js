import { supabase } from '../lib/supabase.js';

export const COMUNICACAO_BUCKET = 'communication-files';

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

function safeName(file) {
  return String(file?.name || 'arquivo').replace(/[^\w.\-]+/g, '_');
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
    foto_url: patch.foto_url ?? perfil.foto_url,
    cargo: patch.cargo ?? perfil.cargo,
    equipe: patch.equipe ?? user.equipe ?? null,
    area: patch.area ?? user.area_operacional ?? user.area_supervisao ?? user.perfil ?? null,
    status_manual: patch.status_manual || 'online',
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('comunicacao_perfis')
    .upsert(row, { onConflict: 'usuario_id' })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data;
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
  const { data, error } = await supabase.storage.from(COMUNICACAO_BUCKET).createSignedUrl(path, 60 * 60 * 24 * 7);
  if (error) throw new Error(error.message);
  return salvarPerfilComunicacao(user, { foto_url: data?.signedUrl || '' });
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
    if (['gerencia', 'diretoria'].includes(role)) return true;
    if (!conversa.equipe && !conversa.area) return true;
    if (conversa.equipe && conversa.equipe === equipe) return true;
    if (conversa.area && [area, role].includes(conversa.area)) return true;
    if (conversa.nome === 'Supervisão' && role === 'supervisor') return true;
    if (conversa.nome === 'CCO' && ['cco', 'supervisor', 'gerencia', 'diretoria'].includes(role)) return true;
    return false;
  });
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
  if (error) throw new Error(error.message);
  return data?.signedUrl || '';
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
