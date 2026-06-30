import { useEffect, useMemo, useState } from 'react';
import { ClipboardList, FileText, History, LogOut, Plus, Settings, UserRound, UsersRound } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { MENU_GROUPS, MENU_ITEMS } from '../../config/menu.js';
import { canAccess } from '../../config/permissions.js';
import { BRAND } from '../../config/brand.js';
import { useAuthStore } from '../../store/authStore.js';
import { useNotificacoesStore } from '../../store/notificacoesStore.js';
import { resolverUrlFotoPerfil } from '../../services/comunicacaoService.js';

const TECH_ITEMS = [
  { key: 'tecnico-nova-os', label: 'Nova OS', path: '/os?nova=1', icon: Plus, description: 'Abrir nova ordem' },
  { key: 'tecnico-minhas-os', label: 'Minhas OS', path: '/os?visao=minhas', icon: ClipboardList, description: 'Criadas ou atribuídas' },
  { key: 'tecnico-equipe', label: 'OS da Equipe', path: '/os?visao=equipe', icon: UsersRound, description: 'Somente minha equipe' },
  { key: 'tecnico-historico', label: 'Histórico', path: '/os?visao=historico', icon: History, description: 'Meu histórico e equipe' },
  { key: 'tecnico-relatorios', label: 'Relatórios', path: '/relatorio', icon: FileText, description: 'RDO e relatórios' },
  { key: 'tecnico-perfil', label: 'Meu Perfil', path: '/perfil', icon: UserRound, description: 'Dados de acesso' }
];

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

export default function Sidebar({ onNavigate }) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const perfil = user?.perfil;
  const unreadCount = useNotificacoesStore((state) => state.unreadCount);
  const pararRealtime = useNotificacoesStore((state) => state.pararRealtime);
  const [photoUrl, setPhotoUrl] = useState('');

  const groups = useMemo(() => {
    const items = MENU_ITEMS.filter((item) => canAccess(perfil, item.key));
    return MENU_GROUPS.map((group) => ({
      group,
      items: items.filter((item) => item.group === group)
    })).filter((entry) => entry.items.length);
  }, [perfil]);

  useEffect(() => {
    let alive = true;
    async function resolvePhoto() {
      if (!user?.foto_url) {
        setPhotoUrl('');
        return;
      }
      try {
        const resolved = await resolverUrlFotoPerfil(user.foto_url);
        if (alive) setPhotoUrl(resolved);
      } catch {
        if (alive) setPhotoUrl('');
      }
    }
    resolvePhoto();
    return () => {
      alive = false;
    };
  }, [user?.foto_url]);

  function handleLogout() {
    pararRealtime();
    logout();
    navigate('/login', { replace: true });
  }

  if (perfil === 'tecnico') {
    return (
      <aside className="nav-shell lg:sticky lg:top-0 lg:h-screen lg:overflow-hidden">
        <div className="grid justify-items-center gap-1.5 px-2 pb-4 pt-1 text-center">
          <div className="login-logo-frame w-16 max-w-full transition duration-300 hover:scale-[1.02] 2xl:w-20">
            <img className="h-auto w-full" src={BRAND.loginLogo} alt={BRAND.consortiumName} />
          </div>
          <div>
            <strong className="block text-xs font-black leading-tight text-white drop-shadow">Área Técnica</strong>
            <span className="block text-[11px] font-extrabold text-[#D6E4FF]">{user?.equipe || user?.area_operacional || 'Equipe'}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {TECH_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.key}
                to={item.path}
                onClick={onNavigate}
                className={({ isActive }) => ['nav-item', isActive ? 'nav-item-active' : 'nav-item-inactive'].join(' ')}
              >
                <span className="nav-icon">
                  <Icon size={19} />
                </span>
                <span className="min-w-0">
                  <strong className="block truncate text-sm font-black leading-tight">{item.label}</strong>
                </span>
              </NavLink>
            );
          })}
        </nav>
        <SidebarProfile user={user} photoUrl={photoUrl} onLogout={handleLogout} />
      </aside>
    );
  }

  return (
    <aside className="nav-shell lg:sticky lg:top-0 lg:h-screen lg:overflow-hidden">
      <div className="grid justify-items-center gap-1.5 px-2 pb-4 pt-1 text-center">
        <div className="login-logo-frame w-16 max-w-full transition duration-300 hover:scale-[1.02] 2xl:w-20">
          <img className="h-auto w-full" src={BRAND.loginLogo} alt={BRAND.consortiumName} />
        </div>
        <div>
          <strong className="block text-xs font-black leading-tight text-white drop-shadow">{BRAND.systemName}</strong>
          <span className="block text-[11px] font-extrabold text-[#D6E4FF]">{BRAND.consortiumName}</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {groups.map(({ group, items }) => (
          <section key={group} className="nav-group">
            <div className="nav-group-title">{group}</div>
            <div className="grid gap-0.5 pt-1">
                {items.map((item) => {
                  const Icon = item.icon;
                  const badge = item.key === 'notificacoes' ? unreadCount : 0;
                  return (
                    <NavLink
                      key={item.key}
                      to={item.path}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        [
                          'nav-item',
                          isActive ? 'nav-item-active' : 'nav-item-inactive'
                        ].join(' ')
                      }
                    >
                      <span className="nav-icon">
                        <Icon size={19} />
                      </span>
                      <span className="min-w-0">
                        <strong className="block truncate text-sm font-black leading-tight">{item.label}</strong>
                      </span>
                      {badge > 0 && (
                        <span className="grid min-h-6 min-w-6 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white ring-2 ring-navy-900">
                          {badge > 99 ? '99+' : badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
          </section>
        ))}
      </nav>
      <SidebarProfile user={user} photoUrl={photoUrl} onLogout={handleLogout} />
    </aside>
  );
}

function SidebarProfile({ user, photoUrl, onLogout }) {
  return (
    <footer className="sidebar-profile">
      <NavLink to="/perfil" className="sidebar-profile-main">
        <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-blue-500/20 text-xs font-black text-white ring-1 ring-blue-200/20">
          {photoUrl ? <img className="h-full w-full object-cover" src={photoUrl} alt={user?.nome || 'Usuário'} /> : initials(user?.nome || user?.usuario)}
        </span>
        <span className="min-w-0">
          <strong className="block truncate text-sm font-black text-white">{user?.nome || user?.usuario || 'Usuário'}</strong>
          <small className="block truncate text-[10px] font-bold uppercase tracking-wide text-slate-400">{user?.cargo || prettyRole(user?.perfil)}</small>
        </span>
      </NavLink>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <NavLink to="/config" className="sidebar-profile-action" title="Configurações">
          <Settings size={16} />
          <span>Config.</span>
        </NavLink>
        <button className="sidebar-profile-action" type="button" onClick={onLogout}>
          <LogOut size={16} />
          <span>Sair</span>
        </button>
      </div>
    </footer>
  );
}
