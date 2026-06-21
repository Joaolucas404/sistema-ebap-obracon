import { useEffect, useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { MENU_GROUPS, MENU_ITEMS } from '../../config/menu.js';
import { canAccess } from '../../config/permissions.js';
import { BRAND } from '../../config/brand.js';
import { useAuthStore } from '../../store/authStore.js';

const STORAGE_KEY = 'sigebap.sidebar.groups';

export default function Sidebar({ onNavigate }) {
  const user = useAuthStore((state) => state.user);
  const perfil = user?.perfil;
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
    <aside className="glass-card rounded-3xl p-3 lg:sticky lg:top-5 lg:h-[calc(100vh-112px)] lg:overflow-auto">
      <div className="grid justify-items-center gap-2 px-2 pb-4 pt-2 text-center">
        <div className="login-logo-frame w-32 max-w-full">
          <img className="h-auto w-full" src={BRAND.loginLogo} alt={BRAND.consortiumName} />
        </div>
        <div>
          <strong className="block text-sm font-black leading-tight text-white">{BRAND.systemName}</strong>
          <span className="block text-xs font-extrabold text-[#17B33A]">{BRAND.consortiumName}</span>
        </div>
      </div>

      <nav className="grid gap-3">
        {groups.map(({ group, items }) => (
          <section key={group} className="rounded-2xl border border-cyan-300/10 bg-navy-950/20 p-1">
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wide text-cyan-100 transition hover:bg-white/10"
              onClick={() => toggleGroup(group)}
            >
              {group}
              <ChevronDown size={16} className={`transition-transform ${openGroups[group] ? 'rotate-0' : '-rotate-90'}`} />
            </button>
            {openGroups[group] && (
              <div className="grid gap-1 pt-1">
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.key}
                      to={item.path}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        [
                          'grid min-h-14 grid-cols-[38px_minmax(0,1fr)] items-center gap-3 rounded-2xl border px-3 py-2 transition duration-200',
                          isActive
                            ? 'border-cyan-300/60 bg-cyan-400/15 text-white shadow-lg shadow-cyan-950/20'
                            : 'border-transparent text-slate-100 hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-white/10'
                        ].join(' ')
                      }
                    >
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-navy-950/80 text-cyan-200">
                        <Icon size={20} />
                      </span>
                      <span className="min-w-0">
                        <strong className="block truncate text-sm font-black">{item.label}</strong>
                        <small className="block truncate text-xs text-slate-300/80">{item.description}</small>
                      </span>
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
