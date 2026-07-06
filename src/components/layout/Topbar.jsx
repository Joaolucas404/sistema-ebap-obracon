import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Clock3, Image, LogOut, Settings, UserRound } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MENU_ITEMS } from '../../config/menu.js';
import NotificationBadgeButton from '../notificacoes/NotificationBadgeButton.jsx';
import NotificationsPanel from '../notificacoes/NotificationsPanel.jsx';
import GlobalSearch from './GlobalSearch.jsx';
import { useAuthStore } from '../../store/authStore.js';
import { useNotificacoesStore } from '../../store/notificacoesStore.js';
import { enviarFotoPerfilComunicacao, obterPerfilComunicacao, resolverUrlFotoPerfil } from '../../services/comunicacaoService.js';
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
    últimas,
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
      let source = user?.foto_url || '';
      if (!source && user?.id) {
        const perfil = await obterPerfilComunicacao(user.id);
        source = perfil?.foto_url || '';
        if (source) updateUser({ foto_url: source, cargo: perfil?.cargo || user?.cargo });
      }
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
  }, [user?.id, user?.foto_url]);

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
      <div className="topbar-title">
        <h1>{current?.label || 'EBAPS'}</h1>
        <p>{current?.description || 'Controle operacional integrado'}</p>
      </div>

      <div className="topbar-search">
        <GlobalSearch />
      </div>

      <div className="topbar-actions">
        <span className="status-chip">
          <Clock3 size={15} />
          <span className="hidden sm:inline">{clock.date}</span>
          {clock.time}
        </span>

        <NotificationBadgeButton count={unreadCount} onClick={() => setNotificationsOpen(true)} />

        <button type="button" className="topbar-icon-button" onClick={() => navigate('/config')} title="Configurações">
          <Settings size={18} />
        </button>

        <div className="relative">
          <button type="button" className="topbar-user-button" onClick={() => setProfileMenuOpen((open) => !open)} title="Opções do perfil">
            <span className="topbar-user-avatar">
              {photoUrl ? <img className="h-full w-full object-cover" src={photoUrl} alt={user.nome || 'Usuário'} onError={() => setPhotoUrl('')} /> : initials(user?.nome || user?.usuario)}
            </span>
            <span className="topbar-user-text">
              <strong>{user?.nome || user?.usuario || 'Usuário'}</strong>
              <small>{prettyRole(user?.perfil)}</small>
            </span>
          </button>

          <input ref={profilePhotoInputRef} className="hidden" type="file" accept="image/*" onChange={handleProfilePhoto} />

          {profileMenuOpen && (
            <div className="absolute right-0 top-[calc(100%+10px)] z-[999] w-72 overflow-hidden rounded-2xl border border-blue-200/20 bg-[#10224D] p-2 shadow-2xl shadow-black/35">
              <div className="flex items-center gap-3 border-b border-blue-200/10 p-3">
                <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl bg-blue-500/20 text-sm font-black text-white ring-1 ring-blue-200/20">
                  {photoUrl ? <img className="h-full w-full object-cover" src={photoUrl} alt={user.nome || 'Perfil'} /> : initials(user?.nome || user?.usuario)}
                </span>
                <span className="min-w-0">
                  <strong className="block text-sm font-black text-white">{user?.nome || user?.usuario || 'Usuário'}</strong>
                  <small className="block text-xs font-bold uppercase tracking-wide text-slate-400">{prettyRole(user?.perfil)}</small>
                </span>
              </div>
              <div className="grid gap-1 p-1">
                <button className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-left text-sm font-black text-slate-100 hover:bg-white/10" type="button" onClick={() => { setProfileMenuOpen(false); navigate('/perfil'); }}>
                  <UserRound size={18} className="text-blue-100" />
                  Meu perfil
                </button>
                <button className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-left text-sm font-black text-slate-100 hover:bg-white/10" type="button" onClick={() => profilePhotoInputRef.current?.click()} disabled={savingPhoto}>
                  {photoUrl ? <Image size={18} className="text-blue-100" /> : <Camera size={18} className="text-blue-100" />}
                  {savingPhoto ? 'Enviando foto...' : photoUrl ? 'Alterar foto' : 'Adicionar foto'}
                </button>
                <button className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-left text-sm font-black text-red-100 hover:bg-red-500/10" type="button" onClick={handleLogout}>
                  <LogOut size={18} />
                  Sair
                </button>
              </div>
            </div>
          )}
        </div>

        <button type="button" className="topbar-logout-button" onClick={handleLogout}>
          <LogOut size={17} />
          Sair
        </button>
      </div>

      <NotificationsPanel
        open={notificationsOpen}
        notifications={últimas}
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
