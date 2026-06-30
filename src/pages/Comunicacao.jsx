import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive,
  ArrowLeft,
  Camera,
  Copy,
  Download,
  File as FileIcon,
  FileText,
  Forward,
  Image,
  MessageCircle,
  Mic,
  Paperclip,
  Pause,
  Pin,
  Play,
  Radio,
  Reply,
  Search,
  Send,
  Share2,
  Square,
  Trash2,
  Users,
  Video,
  X
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Toast from '../components/ui/Toast.jsx';
import { useAuthStore } from '../store/authStore.js';
import { supabase } from '../lib/supabase.js';
import {
  broadcastDigitando,
  atualizarMensagemComunicacao,
  buscarPessoasComunicacao,
  criarCanalDigitando,
  criarCanalPresenca,
  enviarArquivoComunicacao,
  enviarFotoPerfilComunicacao,
  enviarMensagemComunicacao,
  excluirMensagemComunicacao,
  GRUPOS_OPERACIONAIS,
  listarConversasComunicacao,
  listarMensagensComunicacao,
  marcarMensagensComoLidas,
  obterOuCriarConversaDireta,
  obterUrlArquivoComunicacao,
  perfilComunicacao,
  resolverUrlFotoPerfil,
  salvarPerfilComunicacao,
  subscribeMensagens
} from '../services/comunicacaoService.js';

const tabs = [
  { key: 'conversas', label: 'Conversas', icon: MessageCircle },
  { key: 'grupos', label: 'Grupos', icon: Users },
  { key: 'arquivos', label: 'Arquivos', icon: Archive }
];

const statusOptions = [
  { value: 'online', label: 'Online', className: 'bg-emerald-400' },
  { value: 'ausente', label: 'Ausente', className: 'bg-amber-300' },
  { value: 'offline', label: 'Offline', className: 'bg-slate-500' }
];

function formatTime(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('pt-BR');
}

function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

function initials(name = '') {
  return String(name || '?').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function presenceList(state = {}) {
  return Object.values(state).flat().filter(Boolean);
}

function fileIcon(tipo) {
  if (tipo === 'imagem') return Image;
  if (tipo === 'audio') return Mic;
  return FileIcon;
}

function getMessageText(mensagem) {
  return String(mensagem?.corpo || mensagem?.metadata?.original?.corpo || '').trim();
}

function createMessageReference(mensagem) {
  return {
    id: mensagem?.id,
    autor: mensagem?.autor?.nome || mensagem?.autor?.usuario || 'Usuário',
    corpo: getMessageText(mensagem) || (mensagem?.anexos?.length ? 'Arquivo anexado' : 'Mensagem'),
    created_at: mensagem?.created_at || null
  };
}

export default function Comunicacao() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const [activeTab, setActiveTab] = useState('conversas');
  const [conversas, setConversas] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [mensagens, setMensagens] = useState([]);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [peopleResults, setPeopleResults] = useState([]);
  const [searchingPeople, setSearchingPeople] = useState(false);
  const [presenceState, setPresenceState] = useState({});
  const [status, setStatus] = useState('online');
  const [typing, setTyping] = useState(null);
  const [perfilFoto, setPerfilFoto] = useState('');
  const [mobileListOpen, setMobileListOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [attachmentMenuOpen, setAttachmentMenuOpen] = useState(false);
  const [pendingAudio, setPendingAudio] = useState(null);
  const [audioLevels, setAudioLevels] = useState([10, 16, 24, 34, 42, 34, 24, 16, 10]);
  const [imagePreview, setImagePreview] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [shareMessage, setShareMessage] = useState(null);
  const [shareTargets, setShareTargets] = useState([]);
  const [newMessagesNotice, setNewMessagesNotice] = useState(false);
  const [toast, setToast] = useState({ message: '', tone: 'cyan' });
  const [signedUrls, setSignedUrls] = useState({});
  const recorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesScrollRef = useRef(null);
  const isAtBottomRef = useRef(true);
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const documentInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const holdTimerRef = useRef(null);
  const holdStartedRef = useRef(false);
  const suppressAudioClickRef = useRef(false);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);
  const recordingStartedAtRef = useRef(0);

  const selected = useMemo(() => conversas.find((conversa) => conversa.id === selectedId) || conversas[0] || null, [conversas, selectedId]);
  const perfil = perfilComunicacao(user);
  const onlineUsers = useMemo(() => presenceList(presenceState), [presenceState]);
  const filteredConversas = useMemo(() => {
    const term = search.trim().toLowerCase();
    return conversas.filter((conversa) => !term || conversa.nome.toLowerCase().includes(term) || String(conversa.descricao || '').toLowerCase().includes(term));
  }, [conversas, search]);
  const arquivos = useMemo(() => mensagens.flatMap((mensagem) => (mensagem.anexos || []).map((anexo) => ({ ...anexo, mensagem }))), [mensagens]);
  const pinnedMessages = useMemo(() => mensagens.filter((mensagem) => mensagem.metadata?.pinned), [mensagens]);

  async function loadConversas() {
    setLoading(true);
    try {
      const rows = await listarConversasComunicacao(user);
      setConversas(rows);
      setSelectedId((current) => current || rows[0]?.id || '');
      const perfilRow = await salvarPerfilComunicacao(user, { status_manual: status });
      setPerfilFoto(perfilRow?.foto_url ? await resolverUrlFotoPerfil(perfilRow.foto_url) : '');
    } catch (err) {
      setToast({ message: err.message || 'Falha ao carregar comunicação.', tone: 'red' });
    } finally {
      setLoading(false);
    }
  }

  async function loadMensagens(conversaId = selected?.id) {
    if (!conversaId) {
      setMensagens([]);
      return;
    }
    try {
      const rows = await listarMensagensComunicacao(conversaId);
      setMensagens(rows);
      await marcarMensagensComoLidas(conversaId, rows, user);
    } catch (err) {
      setToast({ message: err.message || 'Falha ao carregar mensagens.', tone: 'red' });
    }
  }

  useEffect(() => {
    loadConversas();
  }, [user?.id]);

  useEffect(() => {
    if (selected?.id) loadMensagens(selected.id);
  }, [selected?.id]);

  useEffect(() => {
    const term = search.trim();
    if (term.length < 2) {
      setPeopleResults([]);
      return undefined;
    }

    let alive = true;
    setSearchingPeople(true);
    const timer = window.setTimeout(() => {
      buscarPessoasComunicacao(term, user)
        .then((rows) => {
          if (alive) setPeopleResults(rows);
        })
        .catch(() => {
          if (alive) setPeopleResults([]);
        })
        .finally(() => {
          if (alive) setSearchingPeople(false);
        });
    }, 250);

    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [search, user?.id]);

  useEffect(() => {
    const channel = criarCanalPresenca(user, status, {
      onSync: setPresenceState
    });
    salvarPerfilComunicacao(user, { status_manual: status }).catch(() => {});
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [user?.id, status]);

  useEffect(() => {
    if (!selected?.id) return undefined;
    const channel = subscribeMensagens(
      selected.id,
      () => loadMensagens(selected.id),
      () => loadMensagens(selected.id)
    );
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [selected?.id]);

  useEffect(() => {
    if (!selected?.id) return undefined;
    const channel = criarCanalDigitando(selected.id, user, (payload) => {
      if (payload?.digitando) {
        setTyping(payload);
        window.clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = window.setTimeout(() => setTyping(null), 2500);
      } else {
        setTyping(null);
      }
    });
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [selected?.id, user?.id]);

  useEffect(() => {
    if (isAtBottomRef.current || mensagens[mensagens.length - 1]?.autor_id === user?.id) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      setNewMessagesNotice(false);
    } else if (mensagens.length) {
      setNewMessagesNotice(true);
    }
  }, [mensagens.length, selected?.id]);

  useEffect(() => {
    if (!recording) {
      setRecordingSeconds(0);
      return undefined;
    }
    const timer = window.setInterval(() => setRecordingSeconds((current) => current + 1), 1000);
    return () => window.clearInterval(timer);
  }, [recording]);

  useEffect(() => () => {
    window.clearTimeout(holdTimerRef.current);
    window.cancelAnimationFrame(animationRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    audioContextRef.current?.close?.();
  }, []);

  useEffect(() => () => {
    if (pendingAudio?.url) URL.revokeObjectURL(pendingAudio.url);
  }, [pendingAudio?.url]);

  useEffect(() => {
    const anexos = mensagens.flatMap((mensagem) => mensagem.anexos || []);
    anexos.forEach((anexo) => {
      if (signedUrls[anexo.id]) return;
      obterUrlArquivoComunicacao(anexo)
        .then((url) => setSignedUrls((current) => ({ ...current, [anexo.id]: url })))
        .catch(() => {});
    });
  }, [mensagens, signedUrls]);

  async function handleSend(event) {
    event.preventDefault();
    if (!selected?.id || !message.trim()) return;
    setSending(true);
    try {
      await enviarMensagemComunicacao({
        conversaId: selected.id,
        corpo: message,
        metadata: replyTo ? { reply_to: createMessageReference(replyTo) } : {}
      }, user);
      setMessage('');
      setReplyTo(null);
      await loadMensagens(selected.id);
    } catch (err) {
      setToast({ message: err.message || 'Falha ao enviar mensagem.', tone: 'red' });
    } finally {
      setSending(false);
    }
  }

  function handleMessagesScroll() {
    const node = messagesScrollRef.current;
    if (!node) return;
    const distanceFromBottom = node.scrollHeight - node.scrollTop - node.clientHeight;
    isAtBottomRef.current = distanceFromBottom < 80;
    if (isAtBottomRef.current) setNewMessagesNotice(false);
  }

  function scrollToBottom() {
    isAtBottomRef.current = true;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    setNewMessagesNotice(false);
  }

  function scrollToMessage(messageId) {
    document.getElementById(`mensagem-${messageId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  async function copyMessage(mensagem = actionMessage) {
    const text = getMessageText(mensagem);
    if (!text) return;
    await navigator.clipboard?.writeText(text);
    setActionMessage(null);
    setToast({ message: 'Mensagem copiada.', tone: 'green' });
  }

  function startReply(mensagem = actionMessage) {
    setReplyTo(mensagem);
    setActionMessage(null);
  }

  function startShare(mensagem = actionMessage) {
    setShareMessage(mensagem);
    setShareTargets([]);
    setActionMessage(null);
  }

  async function shareSelectedMessage() {
    if (!shareMessage || !shareTargets.length) return;
    setSending(true);
    try {
      await Promise.all(shareTargets.map((conversaId) => enviarMensagemComunicacao({
        conversaId,
        corpo: getMessageText(shareMessage) || 'Mensagem compartilhada',
        metadata: {
          shared: true,
          shared_by: user?.nome || user?.usuario || 'Usuário',
          original: createMessageReference(shareMessage)
        }
      }, user)));
      setShareMessage(null);
      setShareTargets([]);
      setToast({ message: 'Mensagem compartilhada.', tone: 'green' });
    } catch (err) {
      setToast({ message: err.message || 'Falha ao compartilhar mensagem.', tone: 'red' });
    } finally {
      setSending(false);
    }
  }

  async function togglePinMessage(mensagem = actionMessage) {
    if (!mensagem) return;
    try {
      await atualizarMensagemComunicacao(mensagem, {
        metadata: { ...(mensagem.metadata || {}), pinned: !mensagem.metadata?.pinned, pinned_by: user?.id || null }
      }, user);
      setActionMessage(null);
      await loadMensagens(selected.id);
    } catch (err) {
      setToast({ message: err.message || 'Falha ao fixar mensagem.', tone: 'red' });
    }
  }

  async function deleteMessage(mensagem = actionMessage) {
    if (!mensagem) return;
    try {
      await excluirMensagemComunicacao(mensagem, user);
      setActionMessage(null);
      await loadMensagens(selected.id);
      setToast({ message: 'Mensagem excluída.', tone: 'green' });
    } catch (err) {
      setToast({ message: err.message || 'Falha ao excluir mensagem.', tone: 'red' });
    }
  }

  async function handleFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !selected?.id) return;
    setAttachmentMenuOpen(false);
    setSending(true);
    try {
      await enviarArquivoComunicacao({ conversaId: selected.id, file }, user);
      await loadMensagens(selected.id);
      setToast({ message: 'Arquivo enviado.', tone: 'green' });
    } catch (err) {
      setToast({ message: err.message || 'Falha ao enviar arquivo.', tone: 'red' });
    } finally {
      setSending(false);
    }
  }

  async function handleProfilePhoto(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const row = await enviarFotoPerfilComunicacao(file, user);
      setPerfilFoto(row?.foto_url ? await resolverUrlFotoPerfil(row.foto_url) : '');
      updateUser({ foto_url: row?.foto_url || '', cargo: row?.cargo || user?.cargo });
      setToast({ message: 'Foto de perfil atualizada.', tone: 'green' });
    } catch (err) {
      setToast({ message: err.message || 'Falha ao atualizar foto de perfil.', tone: 'red' });
    }
  }

  async function openDirectConversation(person) {
    try {
      const conversa = await obterOuCriarConversaDireta(person.id, user);
      setConversas((current) => {
        const exists = current.some((item) => item.id === conversa.id);
        return exists ? current.map((item) => (item.id === conversa.id ? conversa : item)) : [conversa, ...current];
      });
      setSelectedId(conversa.id);
      setActiveTab('conversas');
      setMobileListOpen(false);
      setSearch('');
      setPeopleResults([]);
    } catch (err) {
      setToast({ message: err.message || 'Falha ao abrir conversa direta.', tone: 'red' });
    }
  }

  async function startRecording() {
    if (recording || sending) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setToast({ message: 'Gravação de áudio não suportada neste navegador.', tone: 'orange' });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        const audioContext = new AudioContextClass();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        animateWaveform();
      }
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        window.cancelAnimationFrame(animationRef.current);
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        audioContextRef.current?.close?.();
        audioContextRef.current = null;
        analyserRef.current = null;
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (!blob.size) return;
        const file = new window.File([blob], `audio-${Date.now()}.webm`, { type: 'audio/webm' });
        const duration = recordingStartedAtRef.current ? Math.max(1, Math.round((Date.now() - recordingStartedAtRef.current) / 1000)) : recordingSeconds;
        setPendingAudio({ file, url: URL.createObjectURL(blob), duration });
      };
      recorder.start();
      recordingStartedAtRef.current = Date.now();
      setRecording(true);
    } catch (err) {
      setToast({ message: err.message || 'Não foi possível iniciar o áudio.', tone: 'red' });
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  function animateWaveform() {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    const draw = () => {
      analyser.getByteFrequencyData(data);
      const levels = Array.from({ length: 9 }, (_, index) => {
        const start = Math.floor((index / 9) * data.length);
        const end = Math.floor(((index + 1) / 9) * data.length);
        const slice = data.slice(start, end);
        const average = slice.reduce((sum, value) => sum + value, 0) / Math.max(1, slice.length);
        return Math.max(8, Math.min(44, Math.round(8 + average / 5)));
      });
      setAudioLevels(levels);
      animationRef.current = window.requestAnimationFrame(draw);
    };
    draw();
  }

  async function sendPendingAudio() {
    if (!pendingAudio?.file || !selected?.id) return;
    setSending(true);
    try {
      await enviarArquivoComunicacao({ conversaId: selected.id, file: pendingAudio.file, corpo: 'Áudio' }, user);
      await loadMensagens(selected.id);
      URL.revokeObjectURL(pendingAudio.url);
      setPendingAudio(null);
      setToast({ message: 'Áudio enviado.', tone: 'green' });
    } catch (err) {
      setToast({ message: err.message || 'Falha ao enviar áudio.', tone: 'red' });
    } finally {
      setSending(false);
    }
  }

  function discardPendingAudio() {
    if (pendingAudio?.url) URL.revokeObjectURL(pendingAudio.url);
    setPendingAudio(null);
  }

  function handleAudioPointerDown() {
    if (message.trim() || sending || recording) return;
    holdStartedRef.current = false;
    window.clearTimeout(holdTimerRef.current);
    holdTimerRef.current = window.setTimeout(() => {
      holdStartedRef.current = true;
      startRecording();
    }, 350);
  }

  function handleAudioPointerUp() {
    window.clearTimeout(holdTimerRef.current);
    if (holdStartedRef.current) {
      suppressAudioClickRef.current = true;
      stopRecording();
      window.setTimeout(() => {
        suppressAudioClickRef.current = false;
      }, 250);
    }
  }

  function handleAudioClick() {
    if (suppressAudioClickRef.current || message.trim() || sending) return;
    if (recording) {
      stopRecording();
      return;
    }
    startRecording();
  }

  function handleTyping(value) {
    setMessage(value);
    if (!selected?.id) return;
    const channel = supabase.channel(`comunicacao-digitando-${selected.id}`);
    channel.subscribe((state) => {
      if (state === 'SUBSCRIBED') {
        broadcastDigitando(channel, user, selected.id, Boolean(value));
        window.setTimeout(() => supabase.removeChannel(channel), 300);
      }
    });
  }

  return (
    <div className="grid gap-0 md:gap-4">
      <div className="hidden md:block">
        <PageHeader
          title="Comunicação"
          description="Conversas operacionais, grupos, arquivos, áudio e rastreabilidade interna do SIGEBAP."
          leading={<span className="grid size-12 place-items-center rounded-2xl bg-navy-950/60 text-cyan-100"><Radio size={24} /></span>}
        />
      </div>

      <section className="hidden gap-3 rounded-3xl border border-cyan-300/15 bg-navy-950/45 p-4 md:grid lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="flex items-center gap-3">
          <label className="relative cursor-pointer" title="Atualizar foto de perfil">
            <Avatar user={user} fotoUrl={perfilFoto} />
            <input className="hidden" type="file" accept="image/*" onChange={handleProfilePhoto} />
          </label>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-black text-white">{perfil.nome}</h2>
            <p className="text-sm font-bold text-slate-300">{perfil.cargo} • {perfil.equipe} • {perfil.area}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={status === option.value ? 'primary-button min-h-10 px-3' : 'secondary-button min-h-10 px-3'}
              onClick={() => setStatus(option.value)}
            >
              <span className={`size-2.5 rounded-full ${option.className}`} />
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="grid min-h-screen gap-0 md:min-h-[680px] md:gap-4 xl:grid-cols-[390px_minmax(0,1fr)]">
        <aside className={`${mobileListOpen || !selected ? 'grid' : 'hidden'} min-h-screen min-w-0 grid-rows-[auto_auto_minmax(0,1fr)_auto] gap-3 overflow-hidden border border-cyan-300/15 bg-navy-950/55 p-4 md:min-h-[680px] md:rounded-3xl xl:grid`}>
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button key={tab.key} type="button" className={`${tab.key === 'arquivos' ? 'hidden md:inline-flex' : ''} ${activeTab === tab.key ? 'primary-button min-h-10 px-3' : 'secondary-button min-h-10 px-3'}`} onClick={() => setActiveTab(tab.key)}>
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cyan-200" size={18} />
            <input className="form-control pl-10" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar conversa, nome ou login..." />
          </label>

          <div className="grid min-h-0 gap-3 overflow-hidden">
            {search.trim().length >= 2 && (
              <section className="min-h-0 rounded-2xl border border-cyan-300/10 bg-navy-900/55 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="text-xs font-black uppercase tracking-wide text-cyan-100">Pessoas</h3>
                  {searchingPeople && <span className="text-[11px] font-black uppercase text-slate-400">Buscando...</span>}
                </div>
                <div className="grid max-h-44 gap-2 overflow-y-auto overflow-x-hidden pr-1">
                  {peopleResults.length ? peopleResults.map((person) => (
                    <button key={person.id} type="button" className="rounded-xl border border-cyan-300/10 bg-navy-950/55 p-3 text-left hover:border-cyan-300/25" onClick={() => openDirectConversation(person)}>
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-cyan-400/10 text-xs font-black text-cyan-50">{initials(person.nome || person.usuario)}</span>
                        <span className="min-w-0">
                          <strong className="block truncate text-sm text-white">{person.nome || person.usuario}</strong>
                          <small className="block truncate text-xs font-bold text-slate-400">@{person.usuario} • {person.equipe || person.area_operacional || person.perfil || '-'}</small>
                        </span>
                      </div>
                    </button>
                  )) : (
                    <div className="rounded-xl bg-navy-950/55 p-3 text-sm font-bold text-slate-400">Nenhuma pessoa encontrada.</div>
                  )}
                </div>
              </section>
            )}

            {activeTab !== 'arquivos' ? (
              <div className="grid min-h-0 min-w-0 content-start gap-2 overflow-y-auto overflow-x-hidden pr-2">
                {loading ? (
                  <div className="rounded-2xl bg-navy-900/70 p-4 text-sm font-bold text-slate-300">Carregando conversas...</div>
                ) : filteredConversas.length ? (
                  filteredConversas.map((conversa) => {
                    const ultima = Array.isArray(conversa.ultima_mensagem) ? conversa.ultima_mensagem[0] : conversa.ultima_mensagem;
                    return (
                      <button
                        key={conversa.id}
                        type="button"
                        className={selected?.id === conversa.id ? 'overflow-hidden rounded-2xl border border-cyan-300/35 bg-cyan-400/10 p-3 text-left' : 'overflow-hidden rounded-2xl border border-cyan-300/10 bg-navy-900/60 p-3 text-left hover:border-cyan-300/25'}
                        onClick={() => {
                          setSelectedId(conversa.id);
                          setActiveTab('conversas');
                          setMobileListOpen(false);
                        }}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar user={{ nome: conversa.nome }} fotoUrl="" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <strong className="block truncate text-white">{conversa.nome}</strong>
                              <span className="shrink-0 text-[11px] font-black text-slate-400">{formatTime(ultima?.created_at)}</span>
                            </div>
                            <span className="mt-1 block truncate text-xs font-bold text-slate-400">{ultima?.corpo || conversa.descricao || 'Sem mensagens recentes'}</span>
                          </div>
                          {conversa.tipo === 'grupo' && <span className="shrink-0 rounded-full bg-navy-950/70 px-2 py-1 text-[10px] font-black uppercase text-cyan-100">Grupo</span>}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="rounded-2xl bg-navy-900/70 p-4 text-sm font-bold text-slate-300">Nenhuma conversa encontrada.</div>
                )}
              </div>
            ) : (
              <div className="min-h-0 overflow-y-auto overflow-x-hidden pr-2">
                <ArquivosPanel arquivos={arquivos} signedUrls={signedUrls} />
              </div>
            )}
          </div>

          <div className="hidden rounded-2xl border border-cyan-300/10 bg-navy-900/55 p-3 md:block">
            <h3 className="mb-2 text-xs font-black uppercase tracking-wide text-cyan-100">Presença</h3>
            <div className="grid gap-2">
              {onlineUsers.slice(0, 8).map((presence) => (
                <div key={`${presence.user_id}-${presence.online_at}`} className="flex items-center gap-2 text-sm font-bold text-slate-200">
                  <span className={`size-2 rounded-full ${presence.status === 'ausente' ? 'bg-amber-300' : 'bg-emerald-400'}`} />
                  <span className="truncate">{presence.nome || 'Usuário'}</span>
                </div>
              ))}
              {!onlineUsers.length && <span className="text-sm font-bold text-slate-400">Sem usuários online.</span>}
            </div>
          </div>
        </aside>

        <main className={`${mobileListOpen && selected ? 'hidden xl:grid' : 'grid'} h-[100dvh] min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden border border-cyan-300/15 bg-navy-950/55 md:h-auto md:min-h-[680px] md:rounded-3xl xl:grid`}>
          {selected ? (
            <>
              <header className="flex items-center gap-3 border-b border-cyan-300/10 p-3 md:p-4">
                <button className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-blue-100 xl:hidden" type="button" onClick={() => setMobileListOpen(true)} aria-label="Voltar para conversas">
                  <ArrowLeft size={20} />
                </button>
                <Avatar user={{ nome: selected.nome }} fotoUrl="" />
                <button className="min-w-0 flex-1 text-left" type="button" onClick={() => setToast({ message: 'Detalhes da conversa em breve.', tone: 'cyan' })}>
                  <h2 className="truncate text-lg font-black text-white md:text-xl">{selected.nome}</h2>
                  <p className="truncate text-xs font-bold text-slate-300 md:text-sm">{selected.tipo === 'direta' ? 'Online' : `${selected.membros?.length || 0} participantes`}</p>
                </button>
                <div className="hidden flex-wrap gap-2 md:flex">
                  {GRUPOS_OPERACIONAIS.includes(selected.nome) && <span className="status-chip">Grupo operacional</span>}
                  <span className="status-chip">{mensagens.length} mensagem(ns)</span>
                </div>
              </header>

              <section ref={messagesScrollRef} className="relative min-h-0 space-y-3 overflow-auto p-3 md:p-4" onScroll={handleMessagesScroll}>
                {!!pinnedMessages.length && (
                  <div className="sticky top-0 z-10 rounded-2xl border border-blue-200/20 bg-[#10224D]/95 p-3 shadow-xl shadow-black/20 backdrop-blur">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-blue-100">
                      <Pin size={14} />
                      Mensagem fixada
                    </div>
                    <button className="mt-1 line-clamp-2 text-left text-sm font-semibold text-white" type="button" onClick={() => scrollToMessage(pinnedMessages[0].id)}>
                      {getMessageText(pinnedMessages[0]) || 'Arquivo anexado'}
                    </button>
                  </div>
                )}
                {mensagens.map((mensagem) => (
                  <MensagemItem
                    key={mensagem.id}
                    mensagem={mensagem}
                    mine={mensagem.autor_id === user?.id}
                    signedUrls={signedUrls}
                    onPreviewImage={setImagePreview}
                    onOpenActions={setActionMessage}
                    onGoToMessage={scrollToMessage}
                  />
                ))}
                {typing?.digitando && <div className="text-sm font-bold text-cyan-100">{typing.nome} está digitando...</div>}
                <div ref={messagesEndRef} />
                {newMessagesNotice && (
                  <button className="sticky bottom-2 mx-auto flex min-h-10 items-center gap-2 rounded-full bg-blue-600 px-4 text-sm font-black text-white shadow-xl shadow-blue-950/30" type="button" onClick={scrollToBottom}>
                    <ArrowLeft className="-rotate-90" size={16} />
                    Novas mensagens
                  </button>
                )}
              </section>

              <form className="sticky bottom-0 z-20 border-t border-cyan-300/10 bg-[#0A1633]/95 p-2 backdrop-blur sm:p-4 md:static" onSubmit={handleSend}>
                {replyTo && (
                  <div className="mb-2 flex items-start gap-3 rounded-2xl border border-blue-200/15 bg-white/5 p-3">
                    <Reply className="mt-0.5 shrink-0 text-blue-200" size={17} />
                    <div className="min-w-0 flex-1">
                      <strong className="block truncate text-xs font-black text-blue-100">{replyTo.autor?.nome || replyTo.autor?.usuario || 'Usuário'}</strong>
                      <span className="line-clamp-2 text-sm font-semibold text-slate-200">{getMessageText(replyTo) || 'Arquivo anexado'}</span>
                    </div>
                    <button className="grid size-8 shrink-0 place-items-center rounded-full bg-white/10 text-slate-200" type="button" onClick={() => setReplyTo(null)} aria-label="Cancelar resposta">
                      <X size={16} />
                    </button>
                  </div>
                )}
                {pendingAudio && (
                  <div className="mb-3 rounded-3xl border border-blue-200/15 bg-[#0A1633]/90 p-3">
                    <VoiceMessage url={pendingAudio.url} durationHint={pendingAudio.duration || 0} />
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button className="secondary-button min-h-10 justify-center" type="button" onClick={discardPendingAudio} disabled={sending}>
                        <X size={17} />
                        Excluir
                      </button>
                      <button className="primary-button min-h-10 justify-center" type="button" onClick={sendPendingAudio} disabled={sending}>
                        <Send size={17} />
                        Enviar
                      </button>
                    </div>
                  </div>
                )}
                <input ref={cameraInputRef} className="hidden" type="file" accept="image/*" capture="environment" onChange={handleFile} disabled={sending} />
                <input ref={galleryInputRef} className="hidden" type="file" accept="image/*" onChange={handleFile} disabled={sending} />
                <input ref={documentInputRef} className="hidden" type="file" accept=".pdf,.xls,.xlsx,.csv,.doc,.docx,.txt" onChange={handleFile} disabled={sending} />
                <input ref={videoInputRef} className="hidden" type="file" accept="video/*" onChange={handleFile} disabled={sending} />

                <div className="relative flex min-h-[54px] w-full items-center gap-2 rounded-[28px] border border-blue-200/15 bg-[#0A1633]/90 px-2 shadow-inner shadow-white/5 ring-1 ring-white/5">
                  {attachmentMenuOpen && (
                    <div className="absolute bottom-[calc(100%+0.6rem)] left-0 z-20 grid w-56 gap-1 rounded-3xl border border-blue-200/15 bg-[#10224D] p-2 shadow-2xl shadow-black/35">
                      <button className="flex min-h-11 items-center gap-3 rounded-2xl px-3 text-left text-sm font-black text-white hover:bg-white/10" type="button" onClick={() => cameraInputRef.current?.click()}>
                        <Camera size={18} className="text-blue-200" />
                        Tirar foto
                      </button>
                      <button className="flex min-h-11 items-center gap-3 rounded-2xl px-3 text-left text-sm font-black text-white hover:bg-white/10" type="button" onClick={() => galleryInputRef.current?.click()}>
                        <Image size={18} className="text-blue-200" />
                        Galeria
                      </button>
                      <button className="flex min-h-11 items-center gap-3 rounded-2xl px-3 text-left text-sm font-black text-white hover:bg-white/10" type="button" onClick={() => documentInputRef.current?.click()}>
                        <FileText size={18} className="text-blue-200" />
                        Documento
                      </button>
                      <button className="flex min-h-11 items-center gap-3 rounded-2xl px-3 text-left text-sm font-black text-white hover:bg-white/10" type="button" onClick={() => videoInputRef.current?.click()}>
                        <Video size={18} className="text-blue-200" />
                        Vídeo
                      </button>
                    </div>
                  )}

                  <button
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-slate-200 transition hover:bg-white/10 active:scale-95"
                    type="button"
                    onClick={() => setAttachmentMenuOpen((open) => !open)}
                    disabled={sending || recording}
                    aria-label="Anexar arquivo"
                  >
                    <Paperclip size={22} />
                  </button>

                  {recording ? (
                    <div className="flex min-w-0 flex-1 items-center gap-3 text-sm font-black text-white">
                      <span className="inline-flex items-center gap-2 text-red-200">
                        <Mic size={18} />
                        Gravando
                      </span>
                      <span className="font-mono text-slate-200">{formatDuration(recordingSeconds)}</span>
                      <span className="flex min-w-0 flex-1 items-end gap-0.5 overflow-hidden" aria-hidden="true">
                        {audioLevels.map((height, index) => (
                          <span
                            key={`${height}-${index}`}
                            className="w-1 animate-pulse rounded-full bg-blue-200/80"
                            style={{ height, animationDelay: `${index * 80}ms` }}
                          />
                        ))}
                      </span>
                    </div>
                  ) : (
                    <input
                      className="min-h-11 min-w-0 flex-1 bg-transparent text-base font-semibold text-white outline-none placeholder:text-slate-400"
                      value={message}
                      onChange={(event) => handleTyping(event.target.value)}
                      placeholder="Digite uma mensagem..."
                      disabled={sending}
                    />
                  )}

                  <button
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-full transition active:scale-95 ${
                      message.trim() ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/30' : recording ? 'bg-red-500/90 text-white' : 'bg-white/10 text-blue-100'
                    }`}
                    type={message.trim() ? 'submit' : 'button'}
                    onClick={message.trim() ? undefined : handleAudioClick}
                    onPointerDown={handleAudioPointerDown}
                    onPointerUp={handleAudioPointerUp}
                    onPointerCancel={handleAudioPointerUp}
                    disabled={sending || Boolean(pendingAudio)}
                    aria-label={message.trim() ? 'Enviar mensagem' : recording ? 'Parar gravação' : 'Gravar áudio'}
                  >
                    {message.trim() ? <Send size={21} /> : recording ? <Square size={18} /> : <Mic size={21} />}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="grid place-items-center p-8 text-center text-slate-300">Nenhuma conversa disponível para este perfil.</div>
          )}
        </main>
      </section>

      <Toast message={toast.message} tone={toast.tone} onClose={() => setToast({ message: '', tone: 'cyan' })} />
      {imagePreview && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/90 p-3" role="dialog" aria-modal="true">
          <button className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white" type="button" onClick={() => setImagePreview(null)} aria-label="Fechar imagem">
            <X size={24} />
          </button>
          <img className="max-h-[88vh] max-w-full rounded-2xl object-contain shadow-2xl" src={imagePreview.url} alt={imagePreview.name} />
        </div>
      )}
      {actionMessage && (
        <MessageActions
          mensagem={actionMessage}
          mine={actionMessage.autor_id === user?.id}
          onClose={() => setActionMessage(null)}
          onReply={() => startReply(actionMessage)}
          onShare={() => startShare(actionMessage)}
          onCopy={() => copyMessage(actionMessage)}
          onForward={() => startShare(actionMessage)}
          onPin={() => togglePinMessage(actionMessage)}
          onDelete={() => deleteMessage(actionMessage)}
        />
      )}
      {shareMessage && (
        <ShareMessageModal
          conversas={conversas}
          selectedId={selected?.id}
          selectedTargets={shareTargets}
          onToggle={(conversaId) => setShareTargets((current) => (current.includes(conversaId) ? current.filter((id) => id !== conversaId) : [...current, conversaId]))}
          onClose={() => setShareMessage(null)}
          onSubmit={shareSelectedMessage}
          sending={sending}
        />
      )}
    </div>
  );
}

function Avatar({ user, fotoUrl }) {
  return (
    <span className="grid size-14 shrink-0 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-lg font-black text-cyan-50">
      {fotoUrl ? <img className="size-full rounded-2xl object-cover" src={fotoUrl} alt={user.nome || 'Perfil'} /> : initials(user?.nome || user?.usuario)}
    </span>
  );
}

function MensagemItem({ mensagem, mine, signedUrls, onPreviewImage, onOpenActions, onGoToMessage }) {
  const longPressTimerRef = useRef(null);
  const leituraCount = mensagem.leituras?.length || 0;
  const anexos = mensagem.anexos || [];
  const onlyVisualMedia = anexos.length === 1 && ['imagem', 'video', 'audio'].includes(anexos[0].tipo);
  const mediaName = anexos[0]?.nome_original || '';
  const shouldShowBody = Boolean(mensagem.corpo) && !(onlyVisualMedia && [mediaName, 'Áudio'].includes(mensagem.corpo));
  const reply = mensagem.metadata?.reply_to;
  const sharedBy = mensagem.metadata?.shared_by;
  return (
    <article
      id={`mensagem-${mensagem.id}`}
      className={mine ? 'ml-auto max-w-[85%] rounded-2xl border border-blue-300/20 bg-blue-500/15 p-3' : 'mr-auto max-w-[85%] rounded-2xl border border-cyan-300/15 bg-navy-900/80 p-3'}
      onContextMenu={(event) => {
        event.preventDefault();
        onOpenActions?.(mensagem);
      }}
      onPointerDown={() => {
        window.clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = window.setTimeout(() => onOpenActions?.(mensagem), 550);
      }}
      onPointerUp={() => window.clearTimeout(longPressTimerRef.current)}
      onPointerCancel={() => window.clearTimeout(longPressTimerRef.current)}
      onDoubleClick={() => onOpenActions?.(mensagem)}
    >
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <strong className="text-sm text-white">{mensagem.autor?.nome || mensagem.autor?.usuario || 'Sistema'}</strong>
        <span className="text-xs font-bold text-slate-400">{formatTime(mensagem.created_at)}</span>
      </div>
      {sharedBy && (
        <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-blue-100">
          <Forward size={14} />
          Mensagem compartilhada por {sharedBy}
        </div>
      )}
      {reply && (
        <button className="mb-2 block w-full rounded-xl border-l-4 border-blue-300 bg-white/5 p-2 text-left" type="button" onClick={() => reply.id && onGoToMessage?.(reply.id)}>
          <strong className="block truncate text-xs font-black text-blue-100">{reply.autor}</strong>
          <span className="line-clamp-2 text-xs font-semibold text-slate-200">{reply.corpo}</span>
        </button>
      )}
      {shouldShowBody && <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-100">{mensagem.corpo}</p>}
      {!!anexos.length && (
        <div className="mt-3 grid gap-2">
          {anexos.map((anexo) => {
            const url = signedUrls[anexo.id];
            return <AnexoMensagem key={anexo.id} anexo={anexo} url={url} onPreviewImage={onPreviewImage} />;
          })}
        </div>
      )}
      <button className="mt-2 text-[11px] font-black uppercase tracking-wide text-blue-100/80 md:hidden" type="button" onClick={() => onOpenActions?.(mensagem)}>
        Ações
      </button>
      {mine && <small className="mt-2 block text-right text-[11px] font-black uppercase tracking-wide text-blue-100">Lido por {leituraCount}</small>}
    </article>
  );
}

function MessageActions({ mensagem, mine, onClose, onReply, onShare, onCopy, onForward, onPin, onDelete }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-end bg-black/45 p-3 md:items-center md:justify-center" role="dialog" aria-modal="true">
      <button className="absolute inset-0 cursor-default" type="button" onClick={onClose} aria-label="Fechar ações" />
      <div className="relative w-full max-w-md rounded-3xl border border-blue-200/15 bg-[#10224D] p-3 shadow-2xl shadow-black/40">
        <div className="mb-2 flex items-center justify-between px-1">
          <span className="text-sm font-black text-white">Ações da mensagem</span>
          <button className="grid size-9 place-items-center rounded-full bg-white/10 text-slate-200" type="button" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        <div className="mb-3 rounded-2xl bg-[#0A1633]/80 p-3 text-sm font-semibold text-slate-100">
          <span className="line-clamp-2">{getMessageText(mensagem) || 'Arquivo anexado'}</span>
        </div>
        <div className="grid gap-1">
          <ActionButton icon={Reply} label="Responder" onClick={onReply} />
          <ActionButton icon={Share2} label="Compartilhar" onClick={onShare} />
          <ActionButton icon={Copy} label="Copiar" onClick={onCopy} />
          <ActionButton icon={Forward} label="Encaminhar" onClick={onForward} />
          <ActionButton icon={Pin} label={mensagem.metadata?.pinned ? 'Desfixar' : 'Fixar mensagem'} onClick={onPin} />
          {mine && <ActionButton icon={Trash2} label="Excluir" danger onClick={onDelete} />}
        </div>
      </div>
    </div>
  );
}

function ActionButton({ icon: Icon, label, danger = false, onClick }) {
  return (
    <button className={`flex min-h-12 items-center gap-3 rounded-2xl px-3 text-left text-sm font-black transition hover:bg-white/10 ${danger ? 'text-red-200' : 'text-white'}`} type="button" onClick={onClick}>
      <Icon size={18} />
      {label}
    </button>
  );
}

function ShareMessageModal({ conversas, selectedId, selectedTargets, onToggle, onClose, onSubmit, sending }) {
  const options = conversas.filter((conversa) => conversa.id !== selectedId);
  return (
    <div className="fixed inset-0 z-[90] flex items-end bg-black/55 p-3 md:items-center md:justify-center" role="dialog" aria-modal="true">
      <button className="absolute inset-0 cursor-default" type="button" onClick={onClose} aria-label="Fechar compartilhamento" />
      <div className="relative flex max-h-[82dvh] w-full max-w-md flex-col rounded-3xl border border-blue-200/15 bg-[#10224D] shadow-2xl shadow-black/40">
        <header className="flex items-center justify-between border-b border-blue-200/10 p-4">
          <div>
            <h3 className="text-lg font-black text-white">Compartilhar mensagem</h3>
            <p className="text-sm font-semibold text-slate-300">Selecione conversas ou grupos.</p>
          </div>
          <button className="grid size-10 place-items-center rounded-full bg-white/10 text-slate-200" type="button" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </header>
        <div className="grid gap-2 overflow-auto p-3">
          {options.map((conversa) => (
            <label key={conversa.id} className="flex min-h-14 items-center gap-3 rounded-2xl border border-blue-200/10 bg-[#0A1633]/70 px-3 text-white">
              <input className="size-5 accent-blue-500" type="checkbox" checked={selectedTargets.includes(conversa.id)} onChange={() => onToggle(conversa.id)} />
              <Avatar user={{ nome: conversa.nome }} fotoUrl="" />
              <span className="min-w-0 flex-1">
                <strong className="block truncate text-sm">{conversa.nome}</strong>
                <small className="block truncate text-xs font-semibold text-slate-300">{conversa.descricao || 'Conversa operacional'}</small>
              </span>
            </label>
          ))}
          {!options.length && <div className="rounded-2xl bg-[#0A1633]/70 p-4 text-sm font-bold text-slate-300">Nenhuma outra conversa disponível.</div>}
        </div>
        <footer className="border-t border-blue-200/10 p-3">
          <button className="primary-button min-h-12 w-full justify-center" type="button" onClick={onSubmit} disabled={sending || !selectedTargets.length}>
            <Share2 size={18} />
            Compartilhar
          </button>
        </footer>
      </div>
    </div>
  );
}

function AnexoMensagem({ anexo, url, onPreviewImage }) {
  const name = anexo.nome_original || 'Arquivo';

  if (anexo.tipo === 'imagem') {
    return (
      <button className="overflow-hidden rounded-2xl border border-blue-200/15 bg-navy-950/55 text-left" type="button" onClick={() => url && onPreviewImage?.({ url, name })}>
        {url ? <img className="max-h-72 w-full object-cover" src={url} alt={name} /> : <div className="grid h-40 place-items-center text-sm font-bold text-slate-300">Carregando imagem...</div>}
      </button>
    );
  }

  if (anexo.tipo === 'video') {
    return (
      <div className="overflow-hidden rounded-2xl border border-blue-200/15 bg-navy-950/55">
        {url ? <video className="max-h-72 w-full bg-black" src={url} controls /> : <div className="grid h-36 place-items-center text-sm font-bold text-slate-300">Carregando vídeo...</div>}
        <span className="block truncate px-3 py-2 text-xs font-black text-blue-100">{name}</span>
      </div>
    );
  }

  if (anexo.tipo === 'audio') {
    return (
      <div className="rounded-2xl border border-blue-200/15 bg-navy-950/55 p-2">
        {url ? <VoiceMessage url={url} /> : <div className="px-2 py-3 text-sm font-bold text-slate-300">Carregando áudio...</div>}
      </div>
    );
  }

  const Icon = fileIcon(anexo.tipo);
  return (
    <div className="rounded-2xl border border-cyan-300/10 bg-navy-950/55 p-3 text-sm font-bold text-cyan-50">
      <div className="flex items-center gap-3">
        <Icon size={20} />
        <span className="min-w-0 flex-1 truncate">{name}</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <a className="secondary-button min-h-10 justify-center" href={url || '#'} target="_blank" rel="noreferrer">Visualizar</a>
        <a className="primary-button min-h-10 justify-center" href={url || '#'} download={name} target="_blank" rel="noreferrer">
          <Download size={16} />
          Baixar
        </a>
      </div>
    </div>
  );
}

function VoiceMessage({ url, durationHint = 0 }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(durationHint);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;

    const handleTime = () => setCurrentTime(audio.currentTime || 0);
    const handleLoaded = () => {
      if (Number.isFinite(audio.duration)) setDuration(Math.round(audio.duration));
    };
    const handleEnded = () => setPlaying(false);

    audio.addEventListener('timeupdate', handleTime);
    audio.addEventListener('loadedmetadata', handleLoaded);
    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('timeupdate', handleTime);
      audio.removeEventListener('loadedmetadata', handleLoaded);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [url]);

  async function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    await audio.play();
    setPlaying(true);
  }

  const total = duration || durationHint || 0;
  const progress = total ? Math.min(100, (currentTime / total) * 100) : 0;

  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl bg-[#0A1633]/85 px-3 py-2 ring-1 ring-blue-200/10">
      <audio ref={audioRef} src={url} preload="metadata" />
      <button
        className="grid size-10 shrink-0 place-items-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-950/25 transition hover:bg-blue-500 active:scale-95"
        type="button"
        onClick={togglePlay}
        aria-label={playing ? 'Pausar áudio' : 'Reproduzir áudio'}
      >
        {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
      </button>
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <span className="text-xs font-black uppercase tracking-wide text-blue-100">Áudio</span>
          <span className="font-mono text-[11px] font-black text-slate-300">{formatDuration(Math.round(currentTime))} / {formatDuration(total)}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-blue-300 transition-[width]" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}

function ArquivosPanel({ arquivos, signedUrls }) {
  if (!arquivos.length) {
    return <div className="rounded-2xl bg-navy-900/70 p-4 text-sm font-bold text-slate-300">Nenhum arquivo nesta conversa.</div>;
  }

  return (
    <div className="grid max-h-[600px] gap-2 overflow-auto pr-1">
      {arquivos.map((anexo) => {
        const Icon = fileIcon(anexo.tipo);
        return (
          <a key={anexo.id} className="rounded-2xl border border-cyan-300/10 bg-navy-900/60 p-3 hover:border-cyan-300/25" href={signedUrls[anexo.id] || '#'} target="_blank" rel="noreferrer">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-cyan-400/10 text-cyan-100"><Icon size={18} /></span>
              <span className="min-w-0">
                <strong className="block truncate text-sm text-white">{anexo.nome_original || 'Arquivo'}</strong>
                <small className="block text-xs font-bold text-slate-400">{anexo.tipo} • {formatDate(anexo.created_at)}</small>
              </span>
            </div>
          </a>
        );
      })}
    </div>
  );
}
