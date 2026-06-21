import { useEffect, useMemo, useState } from 'react';
import { Clock3, LogOut, Shield } from 'lucide-react';
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
    tecnico: 'Tecnico',
    cco: 'CCO',
    supervisor: 'Supervisor',
    gerencia: 'Gerencia',
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
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-green-300/30 bg-[#17B33A]/15 text-xs font-black text-green-100 shadow-lg shadow-black/20 ring-1 ring-white/10">
          EB
        </div>
        <div className="min-w-0">
          <strong className="block truncate text-xs font-black uppercase tracking-[0.08em] 2xl:text-sm">Sistema Operacional EBAPs</strong>
          <span className="mt-0.5 block truncate text-xs font-semibold text-green-100/80">Consorcio Uniao Obracon</span>
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
        <span className="status-chip bg-cyan-400/10">
          <span className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_12px_rgba(74,222,128,.75)]" />
          <Shield size={15} />
          {user?.nome} - {prettyRole(user?.perfil)}
        </span>
        <NotificationBadgeButton count={unreadCount} onClick={() => setNotificationsOpen(true)} />
        <button type="button" className="secondary-button" onClick={handleLogout}>
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
