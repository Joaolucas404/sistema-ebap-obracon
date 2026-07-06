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
  { key: 'tecnico-nova-os', label: 'Nova OS', path: '/os?nova=1', icon: Plus },
  { key: 'tecnico-minhas-os', label: 'Minhas OS', path: '/os?visão=minhas', icon: ClipboardList },
  { key: 'tecnico-equipe', label: 'OS da Equipe', path: '/os?visão=equipe', icon: UsersRound },
  { key: 'tecnico-historico', label: 'Histórico', path: '/os?visão=historico', icon: History },
  { key: 'tecnico-relatorios', label: 'Relatórios', path: '/relatorio', icon: FileText },
  { key: 'tecnico-perfil', label: 'Meu Perfil', path: '/perfil', icon: UserRound }
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
    if (perfil === 'tecnico') {
      return [{ group: 'TÉCNICO', items: TECH_ITEMS }];
    }

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

  return (
    <aside className="nav-shell">
      <div className="sidebar-brand">
        <span className="sidebar-brand-logo">
          <img src={BRAND.loginLogo} alt={BRAND.consortiumName} />
        </span>
        <span className="sidebar-brand-text">
          <strong>SIGEBAP</strong>
          <small>{BRAND.systemName}</small>
        </span>
      </div>

      <nav className="sidebar-nav" aria-label="Navegação principal">
        {groups.map(({ group, items }) => (
          <section key={group} className="nav-group">
            <div className="nav-group-title">{group}</div>
            <div className="nav-group-items">
              {items.map((item) => {
                const Icon = item.icon;
                const badge = item.key === 'notificacoes' ? unreadCount : 0;
                return (
                  <NavLink
                    key={item.key}
                    to={item.path}
                    onClick={onNavigate}
                    className={({ isActive }) => ['nav-item', isActive ? 'nav-item-active' : 'nav-item-inactive'].join(' ')}
                    title={item.label}
                  >
                    <span className="nav-icon">
                      <Icon size={18} />
                    </span>
                    <span className="nav-label">{item.label}</span>
                    {badge > 0 && (
                      <span className="nav-badge">
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
        <span className="sidebar-profile-avatar">
          {photoUrl ? <img className="h-full w-full object-cover" src={photoUrl} alt={user?.nome || 'Usuário'} /> : initials(user?.nome || user?.usuario)}
        </span>
        <span className="sidebar-profile-text">
          <strong>{user?.nome || user?.usuario || 'Usuário'}</strong>
          <small>{user?.cargo || prettyRole(user?.perfil)}</small>
        </span>
      </NavLink>
      <div className="sidebar-profile-actions">
        <NavLink to="/config" className="sidebar-profile-action" title="Configurações">
          <Settings size={16} />
          <span>Configurações</span>
        </NavLink>
        <button className="sidebar-profile-action" type="button" onClick={onLogout}>
          <LogOut size={16} />
          <span>Sair</span>
        </button>
      </div>
    </footer>
  );
}
