import { useEffect, useMemo, useState } from 'react';
import { Clock3, LogOut } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MENU_ITEMS } from '../../config/menu.js';
import NotificationBadgeButton from '../notificacoes/NotificationBadgeButton.jsx';
import NotificationsPanel from '../notificacoes/NotificationsPanel.jsx';
import GlobalSearch from './GlobalSearch.jsx';
import { useAuthStore } from '../../store/authStore.js';
import { useNotificacoesStore } from '../../store/notificacoesStore.js';

function prettyRole(role) {
  const labels = {
    operador: 'Operador',
    tecnico: 'Técnico',
    cco: 'CCO',
    supervisor: 'Supervisor',
    gerencia: 'Gerência',
    diretoria: 'Diretoria',
    prefeitura: 'Prefeitura',
    sst: 'SST',
    administrativo: 'Administrativo',
    almoxarifado: 'Almoxarifado',
    financeiro: 'Financeiro'
  };

  return labels[role] || role || 'Perfil';
}

export default function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
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

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    carregarResumo(user);
    iniciarRealtime(user);
    return () => pararRealtime();
  }, [user, carregarResumo, iniciarRealtime, pararRealtime]);

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
        <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-blue-200/25 bg-white/10 px-2.5 py-1 text-xs font-black text-[#D6E4FF]">
          <span className="grid h-7 w-7 place-items-center overflow-hidden rounded-full bg-blue-500/20 text-[10px] text-white ring-1 ring-blue-200/20">
            {user?.foto_url ? <img className="h-full w-full object-cover" src={user.foto_url} alt={user.nome || 'Usuário'} /> : (user?.nome || user?.usuario || 'U').slice(0, 2).toUpperCase()}
          </span>
          <span className="grid min-w-0 leading-tight">
            <strong className="max-w-[140px] truncate text-white">{user?.nome || user?.usuario || 'Usuário'}</strong>
            <small className="truncate text-[10px] font-extrabold uppercase tracking-wide text-slate-400">{prettyRole(user?.perfil)}</small>
          </span>
        </span>
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
    </header>
  );
}
