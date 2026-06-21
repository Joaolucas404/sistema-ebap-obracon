import { useEffect, useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { MENU_GROUPS, MENU_ITEMS } from '../../config/menu.js';
import { canAccess } from '../../config/permissions.js';
import { BRAND } from '../../config/brand.js';
import { useAuthStore } from '../../store/authStore.js';
import { useNotificacoesStore } from '../../store/notificacoesStore.js';

const STORAGE_KEY = 'sigebap.sidebar.groups';

export default function Sidebar({ onNavigate }) {
  const user = useAuthStore((state) => state.user);
  const perfil = user?.perfil;
  const unreadCount = useNotificacoesStore((state) => state.unreadCount);
  const [openGroups, setOpenGroups] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null') || Object.fromEntries(MENU_GROUPS.map((group) => [group, true]));
    } catch {
      return Object.fromEntries(MENU_GROUPS.map((group) => [group, true]));
    }
  });

  const groups = useMemo(() => {
    const items = MENU_ITEMS.filter((item) => canAccess(perfil, item.key));
    return MENU_GROUPS.map((group) => ({
      group,
      items: items.filter((item) => item.group === group)
    })).filter((entry) => entry.items.length);
  }, [perfil]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(openGroups));
  }, [openGroups]);

  function toggleGroup(group) {
    setOpenGroups((current) => ({ ...current, [group]: !current[group] }));
  }

  return (
    <aside className="nav-shell lg:sticky lg:top-3 lg:h-[calc(100vh-86px)] lg:overflow-auto">
      <div className="grid justify-items-center gap-1.5 px-2 pb-3 pt-1 text-center">
        <div className="login-logo-frame w-20 max-w-full transition duration-300 hover:scale-[1.02] 2xl:w-24">
          <img className="h-auto w-full" src={BRAND.loginLogo} alt={BRAND.consortiumName} />
        </div>
        <div>
          <strong className="block text-xs font-black leading-tight text-white drop-shadow">{BRAND.systemName}</strong>
          <span className="block text-[11px] font-extrabold text-[#17B33A]">{BRAND.consortiumName}</span>
        </div>
      </div>

      <nav className="grid gap-2">
        {groups.map(({ group, items }) => (
          <section key={group} className="nav-group">
            <button
              type="button"
              className="nav-group-title"
              onClick={() => toggleGroup(group)}
            >
              <span>{group}</span>
              <span className="inline-flex items-center gap-2">
                <span className="rounded-full border border-cyan-200/20 bg-white/10 px-2 py-0.5 text-[10px] text-cyan-50">{items.length}</span>
                <ChevronDown size={16} className={`transition-transform ${openGroups[group] ? 'rotate-0' : '-rotate-90'}`} />
              </span>
            </button>
            {openGroups[group] && (
              <div className="grid gap-1 pt-1 animate-softIn">
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
                        <small className="block truncate text-[11px] text-slate-300/80">{item.description}</small>
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
            )}
          </section>
        ))}
      </nav>
    </aside>
  );
}
