import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Clock3, Image, LogOut, UserRound } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MENU_ITEMS } from '../../config/menu.js';
import NotificationBadgeButton from '../notificacoes/NotificationBadgeButton.jsx';
import NotificationsPanel from '../notificacoes/NotificationsPanel.jsx';
import GlobalSearch from './GlobalSearch.jsx';
import { useAuthStore } from '../../store/authStore.js';
import { useNotificacoesStore } from '../../store/notificacoesStore.js';
import { enviarFotoPerfilComunicacao, resolverUrlFotoPerfil } from '../../services/comunicacaoService.js';
import ProfilePhotoCropModal from '../perfil/ProfilePhotoCropModal.jsx';

function prettyRole(role) {
  const labels = {
    operador: 'Operador',
    tecnico: 'Técnico',
    cco: 'CCO',
    supervisor: 'Supervisor',
    gerencia: 'Gerência',
    diretoria: 'Diretoria',
    prefeitura: 'Prefeitura',
    fiscal_operacional: 'Fiscal Operacional',
    sst: 'SST',
    administrativo: 'Administrativo',
    almoxarifado: 'Almoxarifado',
    financeiro: 'Financeiro'
  };

  return labels[role] || role || 'Perfil';
}

function initials(name = '') {
  return String(name || 'U')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export default function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const updateUser = useAuthStore((state) => state.updateUser);
  const {
    ultimas,
    unreadCount,
    saving,
    carregarResumo,
    marcarLida,
    marcarTodasLidas,
    iniciarRealtime,
    pararRealtime
  } = useNotificacoesStore();
  const current = MENU_ITEMS.find((item) => item.path === location.pathname);
  const [now, setNow] = useState(() => new Date());
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [photoCropFile, setPhotoCropFile] = useState(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const profilePhotoInputRef = useRef(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    carregarResumo(user);
    iniciarRealtime(user);
    return () => pararRealtime();
  }, [user, carregarResumo, iniciarRealtime, pararRealtime]);

  useEffect(() => {
    let alive = true;
    async function resolvePhotoUrl() {
      const source = user?.foto_url || '';
      if (!source) {
        setPhotoUrl('');
        return;
      }

      try {
        const resolved = await resolverUrlFotoPerfil(source);
        if (!alive) return;
        setPhotoUrl(resolved);
      } catch {
        if (alive) setPhotoUrl('');
      }
    }

    resolvePhotoUrl();
    return () => {
      alive = false;
    };
  }, [user?.foto_url]);

  const clock = useMemo(() => {
    const date = new Intl.DateTimeFormat('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(now);
    const time = new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(now);

    return { date, time };
  }, [now]);

  function handleLogout() {
    pararRealtime();
    logout();
    navigate('/login', { replace: true });
  }

  function handleProfilePhoto(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setPhotoCropFile(file);
    setProfileMenuOpen(false);
  }

  async function saveCroppedProfilePhoto(file) {
    setSavingPhoto(true);
    try {
      const row = await enviarFotoPerfilComunicacao(file, user);
      updateUser({ foto_url: row?.foto_url || '', cargo: row?.cargo || user?.cargo });
      setPhotoUrl(row?.foto_url ? await resolverUrlFotoPerfil(row.foto_url) : '');
      setPhotoCropFile(null);
      setProfileMenuOpen(false);
    } catch (err) {
      window.alert(err.message || 'Não foi possível atualizar a foto.');
    } finally {
      setSavingPhoto(false);
    }
  }

  async function handleRead(id) {
    await marcarLida(id, user);
  }

  async function handleReadAll() {
    await marcarTodasLidas(user);
  }

  return (
    <header className="topbar-shell">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-blue-300/25 bg-blue-500/15 text-xs font-black text-blue-100 shadow-lg shadow-black/20 ring-1 ring-white/10">
          EB
        </div>
        <div className="min-w-0">
          <strong className="block truncate text-xs font-black uppercase tracking-[0.08em] 2xl:text-sm">Sistema Operacional EBAPs</strong>
          <span className="mt-0.5 block truncate text-xs font-semibold text-[#D6E4FF]/80">Consórcio União Obracon</span>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-[auto_minmax(240px,1fr)] md:items-center">
        <div className="min-w-0 md:text-center">
        <h1 className="text-lg font-black tracking-wide text-white md:text-xl">{current?.label || 'EBAPS'}</h1>
        <p className="hidden text-xs font-medium text-slate-300 2xl:block">{current?.description || 'Controle operacional integrado'}</p>
        </div>
        <GlobalSearch />
      </div>

      <div className="flex flex-wrap items-center gap-2 md:justify-end">
        <span className="status-chip">
          <Clock3 size={15} />
          <span className="hidden sm:inline">{clock.date}</span>
          {clock.time}
        </span>
        <div className="relative">
          <button
            type="button"
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-blue-200/25 bg-white/10 px-2.5 py-1 text-left text-xs font-black text-[#D6E4FF] transition hover:border-blue-200/45 hover:bg-white/15"
            onClick={() => setProfileMenuOpen((open) => !open)}
            title="Opções do perfil"
          >
            <span className="grid h-7 w-7 place-items-center overflow-hidden rounded-full bg-blue-500/20 text-[10px] text-white ring-1 ring-blue-200/20">
              {photoUrl ? <img className="h-full w-full object-cover" src={photoUrl} alt={user.nome || 'Usuário'} onError={() => setPhotoUrl('')} /> : initials(user?.nome || user?.usuario)}
            </span>
            <span className="grid min-w-0 leading-tight">
              <strong className="max-w-[140px] truncate text-white">{user?.nome || user?.usuario || 'Usuário'}</strong>
              <small className="truncate text-[10px] font-extrabold uppercase tracking-wide text-slate-400">{prettyRole(user?.perfil)}</small>
            </span>
          </button>

          <input ref={profilePhotoInputRef} className="hidden" type="file" accept="image/*" onChange={handleProfilePhoto} />

          {profileMenuOpen && (
            <div className="absolute right-0 top-[calc(100%+10px)] z-[999] w-72 overflow-hidden rounded-3xl border border-blue-200/20 bg-[#10224D] p-2 shadow-2xl shadow-black/35">
              <div className="flex items-center gap-3 border-b border-blue-200/10 p-3">
                <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl bg-blue-500/20 text-sm font-black text-white ring-1 ring-blue-200/20">
                  {photoUrl ? <img className="h-full w-full object-cover" src={photoUrl} alt={user.nome || 'Perfil'} /> : initials(user?.nome || user?.usuario)}
                </span>
                <span className="min-w-0">
                  <strong className="block truncate text-sm font-black text-white">{user?.nome || user?.usuario || 'Usuário'}</strong>
                  <small className="block truncate text-xs font-bold uppercase tracking-wide text-slate-400">{prettyRole(user?.perfil)}</small>
                </span>
              </div>
              <div className="grid gap-1 p-1">
                <button className="flex min-h-11 items-center gap-3 rounded-2xl px-3 text-left text-sm font-black text-slate-100 hover:bg-white/10" type="button" onClick={() => { setProfileMenuOpen(false); navigate('/perfil'); }}>
                  <UserRound size={18} className="text-blue-100" />
                  Meu perfil
                </button>
                <button className="flex min-h-11 items-center gap-3 rounded-2xl px-3 text-left text-sm font-black text-slate-100 hover:bg-white/10" type="button" onClick={() => profilePhotoInputRef.current?.click()} disabled={savingPhoto}>
                  {photoUrl ? <Image size={18} className="text-blue-100" /> : <Camera size={18} className="text-blue-100" />}
                  {savingPhoto ? 'Enviando foto...' : photoUrl ? 'Alterar foto' : 'Adicionar foto'}
                </button>
                <button className="flex min-h-11 items-center gap-3 rounded-2xl px-3 text-left text-sm font-black text-red-100 hover:bg-red-500/10" type="button" onClick={handleLogout}>
                  <LogOut size={18} />
                  Sair
                </button>
              </div>
            </div>
          )}
        </div>
        <NotificationBadgeButton count={unreadCount} onClick={() => setNotificationsOpen(true)} />
        <button type="button" className="secondary-button min-h-10 px-3" onClick={handleLogout}>
          <LogOut size={17} />
          Sair
        </button>
      </div>

      <NotificationsPanel
        open={notificationsOpen}
        notifications={ultimas}
        unreadCount={unreadCount}
        saving={saving}
        onClose={() => setNotificationsOpen(false)}
        onRead={handleRead}
        onReadAll={handleReadAll}
      />
      <ProfilePhotoCropModal
        open={Boolean(photoCropFile)}
        file={photoCropFile}
        saving={savingPhoto}
        onCancel={() => setPhotoCropFile(null)}
        onConfirm={saveCroppedProfilePhoto}
      />
    </header>
  );
}
