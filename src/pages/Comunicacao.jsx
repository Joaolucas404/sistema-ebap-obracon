import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive,
  Download,
  File,
  Image,
  MessageCircle,
  Mic,
  Paperclip,
  Play,
  Radio,
  Search,
  Send,
  Square,
  Users
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Toast from '../components/ui/Toast.jsx';
import { useAuthStore } from '../store/authStore.js';
import { supabase } from '../lib/supabase.js';
import {
  broadcastDigitando,
  buscarPessoasComunicacao,
  criarCanalDigitando,
  criarCanalPresenca,
  enviarArquivoComunicacao,
  enviarFotoPerfilComunicacao,
  enviarMensagemComunicacao,
  GRUPOS_OPERACIONAIS,
  listarConversasComunicacao,
  listarMensagensComunicacao,
  marcarMensagensComoLidas,
  obterOuCriarConversaDireta,
  obterUrlArquivoComunicacao,
  perfilComunicacao,
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

function initials(name = '') {
  return String(name || '?').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function presenceList(state = {}) {
  return Object.values(state).flat().filter(Boolean);
}

function fileIcon(tipo) {
  if (tipo === 'imagem') return Image;
  if (tipo === 'audio') return Mic;
  return File;
}

export default function Comunicacao() {
  const user = useAuthStore((state) => state.user);
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
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [toast, setToast] = useState({ message: '', tone: 'cyan' });
  const [signedUrls, setSignedUrls] = useState({});
  const recorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  const selected = useMemo(() => conversas.find((conversa) => conversa.id === selectedId) || conversas[0] || null, [conversas, selectedId]);
  const perfil = perfilComunicacao(user);
  const onlineUsers = useMemo(() => presenceList(presenceState), [presenceState]);
  const filteredConversas = useMemo(() => {
    const term = search.trim().toLowerCase();
    return conversas.filter((conversa) => !term || conversa.nome.toLowerCase().includes(term) || String(conversa.descricao || '').toLowerCase().includes(term));
  }, [conversas, search]);
  const arquivos = useMemo(() => mensagens.flatMap((mensagem) => (mensagem.anexos || []).map((anexo) => ({ ...anexo, mensagem }))), [mensagens]);

  async function loadConversas() {
    setLoading(true);
    try {
      const rows = await listarConversasComunicacao(user);
      setConversas(rows);
      setSelectedId((current) => current || rows[0]?.id || '');
      const perfilRow = await salvarPerfilComunicacao(user, { status_manual: status });
      setPerfilFoto(perfilRow?.foto_url || '');
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [mensagens.length, selected?.id]);

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
      await enviarMensagemComunicacao({ conversaId: selected.id, corpo: message }, user);
      setMessage('');
      await loadMensagens(selected.id);
    } catch (err) {
      setToast({ message: err.message || 'Falha ao enviar mensagem.', tone: 'red' });
    } finally {
      setSending(false);
    }
  }

  async function handleFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !selected?.id) return;
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
      setPerfilFoto(row?.foto_url || '');
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
      setSearch('');
      setPeopleResults([]);
    } catch (err) {
      setToast({ message: err.message || 'Falha ao abrir conversa direta.', tone: 'red' });
    }
  }

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setToast({ message: 'Gravação de áudio não suportada neste navegador.', tone: 'orange' });
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioChunksRef.current = [];
    const recorder = new MediaRecorder(stream);
    recorderRef.current = recorder;
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) audioChunksRef.current.push(event.data);
    };
    recorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      setAudioUrl(URL.createObjectURL(blob));
      const file = new File([blob], `audio-${Date.now()}.webm`, { type: 'audio/webm' });
      if (selected?.id) {
        setSending(true);
        try {
          await enviarArquivoComunicacao({ conversaId: selected.id, file, corpo: 'Áudio' }, user);
          await loadMensagens(selected.id);
          setToast({ message: 'Áudio enviado.', tone: 'green' });
        } catch (err) {
          setToast({ message: err.message || 'Falha ao enviar áudio.', tone: 'red' });
        } finally {
          setSending(false);
        }
      }
    };
    recorder.start();
    setRecording(true);
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setRecording(false);
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
    <div className="grid gap-4">
      <PageHeader
        title="Comunicação"
        description="Conversas operacionais, grupos, arquivos, áudio e rastreabilidade interna do SIGEBAP."
        leading={<span className="grid size-12 place-items-center rounded-2xl bg-navy-950/60 text-cyan-100"><Radio size={24} /></span>}
      />

      <section className="grid gap-3 rounded-3xl border border-cyan-300/15 bg-navy-950/45 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
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

      <section className="grid min-h-[680px] gap-4 xl:grid-cols-[390px_minmax(0,1fr)]">
        <aside className="grid min-h-[680px] min-w-0 grid-rows-[auto_auto_minmax(0,1fr)_auto] gap-3 overflow-hidden rounded-3xl border border-cyan-300/15 bg-navy-950/55 p-4">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button key={tab.key} type="button" className={activeTab === tab.key ? 'primary-button min-h-10 px-3' : 'secondary-button min-h-10 px-3'} onClick={() => setActiveTab(tab.key)}>
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
                  filteredConversas.map((conversa) => (
                    <button
                      key={conversa.id}
                      type="button"
                      className={selected?.id === conversa.id ? 'overflow-hidden rounded-2xl border border-cyan-300/35 bg-cyan-400/10 p-3 text-left' : 'overflow-hidden rounded-2xl border border-cyan-300/10 bg-navy-900/60 p-3 text-left hover:border-cyan-300/25'}
                      onClick={() => {
                        setSelectedId(conversa.id);
                        setActiveTab('conversas');
                      }}
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <strong className="block truncate text-white">{conversa.nome}</strong>
                          <span className="mt-1 block truncate text-xs font-bold text-slate-400">{conversa.descricao || 'Grupo operacional'}</span>
                        </div>
                        <span className="shrink-0 rounded-full bg-navy-950/70 px-2 py-1 text-[10px] font-black uppercase text-cyan-100">{conversa.tipo === 'grupo' ? 'Grupo' : 'Direta'}</span>
                      </div>
                    </button>
                  ))
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

          <div className="rounded-2xl border border-cyan-300/10 bg-navy-900/55 p-3">
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

        <main className="grid min-h-[680px] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-3xl border border-cyan-300/15 bg-navy-950/55">
          {selected ? (
            <>
              <header className="flex flex-col gap-3 border-b border-cyan-300/10 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-black text-white">{selected.nome}</h2>
                  <p className="text-sm font-bold text-slate-300">{selected.descricao || 'Conversa operacional'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {GRUPOS_OPERACIONAIS.includes(selected.nome) && <span className="status-chip">Grupo operacional</span>}
                  <span className="status-chip">{mensagens.length} mensagem(ns)</span>
                </div>
              </header>

              <section className="space-y-3 overflow-auto p-4">
                {mensagens.map((mensagem) => (
                  <MensagemItem key={mensagem.id} mensagem={mensagem} mine={mensagem.autor_id === user?.id} signedUrls={signedUrls} />
                ))}
                {typing?.digitando && <div className="text-sm font-bold text-cyan-100">{typing.nome} está digitando...</div>}
                <div ref={messagesEndRef} />
              </section>

              <form className="border-t border-cyan-300/10 p-4" onSubmit={handleSend}>
                {audioUrl && <audio className="mb-3 w-full" src={audioUrl} controls />}
                <div className="grid gap-2 md:grid-cols-[auto_minmax(0,1fr)_auto_auto]">
                  <label className="secondary-button min-h-12 cursor-pointer justify-center">
                    <Paperclip size={18} />
                    <input className="hidden" type="file" accept="image/*,video/*,audio/*,.pdf,.xls,.xlsx,.csv,.doc,.docx,.txt" onChange={handleFile} disabled={sending} />
                  </label>
                  <input
                    className="form-control min-w-0"
                    value={message}
                    onChange={(event) => handleTyping(event.target.value)}
                    placeholder="Digite uma mensagem operacional..."
                    disabled={sending}
                  />
                  <button className={recording ? 'danger-button min-h-12 justify-center' : 'secondary-button min-h-12 justify-center'} type="button" onClick={recording ? stopRecording : startRecording} disabled={sending}>
                    {recording ? <Square size={18} /> : <Mic size={18} />}
                    {recording ? 'Parar' : 'Áudio'}
                  </button>
                  <button className="primary-button min-h-12 justify-center" type="submit" disabled={sending || !message.trim()}>
                    <Send size={18} />
                    Enviar
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
    </div>
  );
}

function Avatar({ user, fotoUrl }) {
  return (
    <span className="grid size-14 shrink-0 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-lg font-black text-cyan-50">
      {fotoUrl || user?.foto_url ? <img className="size-full rounded-2xl object-cover" src={fotoUrl || user.foto_url} alt={user.nome || 'Perfil'} /> : initials(user?.nome || user?.usuario)}
    </span>
  );
}

function MensagemItem({ mensagem, mine, signedUrls }) {
  const leituraCount = mensagem.leituras?.length || 0;
  return (
    <article className={mine ? 'ml-auto max-w-[82%] rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-3' : 'mr-auto max-w-[82%] rounded-2xl border border-cyan-300/15 bg-navy-900/80 p-3'}>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <strong className="text-sm text-white">{mensagem.autor?.nome || mensagem.autor?.usuario || 'Sistema'}</strong>
        <span className="text-xs font-bold text-slate-400">{formatTime(mensagem.created_at)}</span>
      </div>
      {mensagem.corpo && <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-100">{mensagem.corpo}</p>}
      {!!mensagem.anexos?.length && (
        <div className="mt-3 grid gap-2">
          {mensagem.anexos.map((anexo) => {
            const Icon = fileIcon(anexo.tipo);
            const url = signedUrls[anexo.id];
            return (
              <a key={anexo.id} className="flex items-center gap-3 rounded-xl border border-cyan-300/10 bg-navy-950/55 p-2 text-sm font-bold text-cyan-50" href={url || '#'} target="_blank" rel="noreferrer">
                <Icon size={18} />
                <span className="min-w-0 flex-1 truncate">{anexo.nome_original || 'Arquivo'}</span>
                {anexo.tipo === 'audio' ? <Play size={16} /> : <Download size={16} />}
              </a>
            );
          })}
        </div>
      )}
      {mine && <small className="mt-2 block text-right text-[11px] font-black uppercase tracking-wide text-emerald-100">Lido por {leituraCount}</small>}
    </article>
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
