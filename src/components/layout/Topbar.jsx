import { LogOut, Shield } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MENU_ITEMS } from '../../config/menu.js';
import { useAuthStore } from '../../store/authStore.js';

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
  const current = MENU_ITEMS.find((item) => item.path === location.pathname);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <header className="glass-card mx-auto mb-4 grid max-w-[1400px] gap-3 rounded-3xl px-4 py-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative h-9 w-12 shrink-0">
          <span className="absolute left-0 top-2 h-5 w-8 rotate-45 rounded-full border-[6px] border-cyan-300" />
          <span className="absolute right-0 top-2 h-5 w-8 -rotate-45 rounded-full border-[6px] border-blue-500" />
        </div>
        <div className="min-w-0">
          <strong className="block truncate text-sm font-black uppercase tracking-wide">EBAPS Vila Velha</strong>
          <span className="block truncate text-xs text-cyan-100/70">Sistema operacional integrado</span>
        </div>
      </div>

      <div className="md:text-center">
        <h1 className="text-xl font-black tracking-wide text-white md:text-2xl">{current?.label || 'EBAPS'}</h1>
        <p className="text-sm text-slate-300">{current?.description || 'Controle operacional integrado'}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 md:justify-end">
        <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3 py-2 text-xs font-black text-cyan-100">
          <Shield size={15} />
          {user?.nome} • {prettyRole(user?.perfil)}
        </span>
        <button type="button" className="secondary-button" onClick={handleLogout}>
          <LogOut size={17} />
          Sair
        </button>
      </div>
    </header>
  );
}
