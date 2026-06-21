import { useEffect, useMemo, useState } from 'react';
import { Clock3, LogOut, Shield } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MENU_ITEMS } from '../../config/menu.js';
import NotificationBadgeButton from '../notificacoes/NotificationBadgeButton.jsx';
import NotificationsPanel from '../notificacoes/NotificationsPanel.jsx';
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
    <header className="glass-card mx-auto mb-4 grid max-w-[1400px] gap-3 rounded-3xl px-4 py-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-green-300/30 bg-[#17B33A]/15 text-sm font-black text-green-100 shadow-lg shadow-black/20">
          EB
        </div>
        <div className="min-w-0">
          <strong className="block truncate text-sm font-black uppercase tracking-wide">Sistema Operacional EBAPs</strong>
          <span className="block truncate text-xs text-green-100/80">Consorcio Uniao Obracon</span>
        </div>
      </div>

      <div className="md:text-center">
        <h1 className="text-xl font-black tracking-wide text-white md:text-2xl">{current?.label || 'EBAPS'}</h1>
        <p className="text-sm text-slate-300">{current?.description || 'Controle operacional integrado'}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 md:justify-end">
        <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-navy-950/35 px-3 py-2 text-xs font-black text-cyan-100">
          <Clock3 size={15} />
          <span className="hidden sm:inline">{clock.date}</span>
          {clock.time}
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3 py-2 text-xs font-black text-cyan-100">
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
