import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  CheckSquare,
  ChevronRight,
  FileText,
  Home,
  MessageCircle,
  Mic,
  PackageCheck,
  Plus,
  UserRound,
  Wrench
} from 'lucide-react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { canAccess, normalizePerfil } from '../../config/permissions.js';
import { useAuthStore } from '../../store/authStore.js';
import { obterPerfilComunicacao, resolverUrlFotoPerfil } from '../../services/comunicacaoService.js';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';

const MOBILE_NAV_ITEMS = [
  { key: 'dashboard', label: 'Início', path: '/dashboard', icon: Home },
  { key: 'os', label: 'OS', path: '/os', icon: Wrench },
  { key: 'relatorio', label: 'RDO', path: '/relatorio', icon: FileText },
  { key: 'comunicacao', label: 'Chat', path: '/comunicacao', icon: MessageCircle },
  { key: 'perfil', label: 'Perfil', path: '/perfil', icon: UserRound }
];

const MOBILE_HOME_ACTIONS = [
  {
    key: 'relatorio',
    title: 'Abrir RDO',
    description: 'Registrar turno, fotos e status rápidos.',
    path: '/relatorio',
    icon: FileText,
    tone: 'from-blue-500/25 to-blue-500/5'
  },
  {
    key: 'os',
    title: 'Minhas OS',
    description: 'Executar checklist, evidências e conclusão.',
    path: '/os?visão=minhas',
    icon: Wrench,
    tone: 'from-indigo-500/25 to-blue-500/5'
  },
  {
    key: 'comunicacao',
    title: 'Comunicação',
    description: 'Chat operacional, áudio e arquivos.',
    path: '/comunicacao',
    icon: MessageCircle,
    tone: 'from-sky-500/25 to-blue-500/5'
  },
  {
    key: 'os',
    title: 'Abrir OS',
    description: 'Criar nova ordem de serviço em campo.',
    path: '/os?nova=1',
    icon: Plus,
    tone: 'from-blue-400/25 to-indigo-500/5'
  },
  {
    key: 'ativos',
    title: 'Ativos da EBAP',
    description: 'Consultar equipamentos e situação atual.',
    path: '/ativos',
    icon: PackageCheck,
    tone: 'from-slate-300/15 to-blue-500/5'
  }
];

const FIELD_PRIORITIES = [
  { label: 'Fotos', icon: Camera },
  { label: 'Áudio', icon: Mic },
  { label: 'Checklist', icon: CheckSquare },
  { label: 'Status rápidos', icon: AlertTriangle }
];

function useIsMobileLayout() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 1023px)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const media = window.matchMedia('(max-width: 1023px)');
    const handleChange = () => setIsMobile(media.matches);
    handleChange();
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  return isMobile;
}

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

function isFiscalOperacional(user) {
  return normalizePerfil(user?.perfil) === 'fiscal_operacional';
}

function MobileHeader({ user }) {
  const initials = (user?.nome || user?.usuario || 'U').slice(0, 2).toUpperCase();
  const updateUser = useAuthStore((state) => state.updateUser);
  const [photoUrl, setPhotoUrl] = useState('');

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
        if (alive) setPhotoUrl(resolved);
      } catch {
        if (alive) setPhotoUrl('');
      }
    }

    resolvePhotoUrl();
    return () => {
      alive = false;
    };
  }, [user?.id, user?.foto_url]);

  return (
    <header className="sticky top-0 z-40 border-b border-blue-200/10 bg-[#0A1633]/95 px-4 py-3 shadow-lg shadow-black/20 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-200/70">SIGEBAP Mobile</span>
          <strong className="block truncate text-lg font-black text-white">Operação em campo</strong>
        </div>
        <Link
          to="/perfil"
          className="flex max-w-[190px] items-center gap-2 rounded-2xl border border-blue-200/15 bg-white/10 p-1.5 pr-3 text-left shadow-inner shadow-white/5"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-blue-500/20 text-xs font-black text-white ring-1 ring-blue-200/20">
            {photoUrl ? <img className="h-full w-full object-cover" src={photoUrl} alt={user.nome || 'Usuário'} onError={() => setPhotoUrl('')} /> : initials}
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-black text-white">{user?.nome || user?.usuario || 'Usuário'}</span>
            <span className="block truncate text-[10px] font-bold uppercase tracking-wide text-slate-300">{user?.cargo || prettyRole(user?.perfil)}</span>
            <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide text-blue-100">
              <span className="size-1.5 rounded-full bg-blue-400" />
              Online
            </span>
          </span>
        </Link>
      </div>
    </header>
  );
}

function MobileHome({ user }) {
  if (isFiscalOperacional(user)) {
    const actions = [
      {
        title: 'Abrir OS',
        description: 'Registrar uma solicitação com EBAP, equipamento, descrição, prioridade e fotos.',
        path: '/os?nova=1',
        icon: Wrench,
        tone: 'from-blue-500/30 to-blue-500/5'
      },
      {
        title: 'Minhas Solicitações',
        description: 'Acompanhar somente as solicitações abertas por você.',
        path: '/os?visão=minhas',
        icon: FileText,
        tone: 'from-indigo-500/25 to-blue-500/5'
      }
    ];

    return (
      <section className="grid gap-4">
        <div className="rounded-[28px] border border-blue-200/15 bg-[#10224D]/80 p-5 shadow-xl shadow-black/20">
          <span className="text-xs font-black uppercase tracking-[0.18em] text-blue-200/70">Fiscal Operacional</span>
          <h1 className="mt-2 text-2xl font-black leading-tight text-white">Solicitações de campo</h1>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-300">
            Tela simples para abrir e acompanhar suas próprias OS.
          </p>
        </div>

        <div className="grid gap-4">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                to={action.path}
                className={`group flex min-h-[150px] items-center gap-4 rounded-[30px] border border-blue-200/15 bg-gradient-to-br ${action.tone} p-5 shadow-lg shadow-black/20 transition duration-200 active:scale-[0.99]`}
              >
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-blue-200/15 bg-white/10 text-blue-100 shadow-inner shadow-white/5">
                  <Icon size={32} />
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block text-2xl font-black text-white">{action.title}</strong>
                  <span className="mt-2 block text-base font-semibold leading-snug text-slate-300">{action.description}</span>
                </span>
                <ChevronRight className="shrink-0 text-blue-100/70 transition group-active:translate-x-0.5" size={26} />
              </Link>
            );
          })}
        </div>
      </section>
    );
  }

  const availableActions = MOBILE_HOME_ACTIONS.filter((action) => canAccess(user?.perfil, action.key));

  return (
    <section className="grid gap-4">
      <div className="rounded-[28px] border border-blue-200/15 bg-[#10224D]/80 p-5 shadow-xl shadow-black/20">
        <span className="text-xs font-black uppercase tracking-[0.18em] text-blue-200/70">Início</span>
        <h1 className="mt-2 text-2xl font-black leading-tight text-white">O que você precisa fazer agora?</h1>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-300">
          Acesso rápido às ações mais usadas em campo, com botões grandes para celular e tablet.
        </p>
      </div>

      <div className="grid gap-3">
        {availableActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.key}
              to={action.path}
              className={`group flex min-h-[116px] items-center gap-4 rounded-[28px] border border-blue-200/15 bg-gradient-to-br ${action.tone} p-4 shadow-lg shadow-black/20 transition duration-200 active:scale-[0.99]`}
            >
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-blue-200/15 bg-white/10 text-blue-100 shadow-inner shadow-white/5">
                <Icon size={27} />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block text-xl font-black text-white">{action.title}</strong>
                <span className="mt-1 block text-sm font-semibold leading-snug text-slate-300">{action.description}</span>
              </span>
              <ChevronRight className="shrink-0 text-blue-100/70 transition group-active:translate-x-0.5" size={24} />
            </Link>
          );
        })}
      </div>

      <div className="rounded-[28px] border border-blue-200/15 bg-[#10224D]/70 p-4 shadow-lg shadow-black/20">
        <h2 className="text-sm font-black uppercase tracking-[0.14em] text-blue-100">Prioridades do mobile</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {FIELD_PRIORITIES.map((item) => {
            const Icon = item.icon;
            return (
              <span key={item.label} className="flex min-h-12 items-center gap-2 rounded-2xl border border-blue-200/10 bg-[#0A1633]/70 px-3 text-sm font-black text-slate-100">
                <Icon size={18} className="text-blue-200" />
                {item.label}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function MobileBottomNav({ user }) {
  const items = MOBILE_NAV_ITEMS.filter((item) => canAccess(user?.perfil, item.key));

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-blue-200/10 bg-[#0A1633]/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.65rem)] pt-2 shadow-[0_-18px_35px_rgba(0,0,0,0.3)] backdrop-blur-xl">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1 rounded-[28px] border border-blue-200/10 bg-white/5 p-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.key}
              to={item.path}
              className={({ isActive }) =>
                `flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-black transition ${
                  isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/30' : 'text-slate-300 active:bg-white/10'
                }`
              }
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

export default function AppLayout() {
  const isMobile = useIsMobileLayout();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);

  if (isMobile || isFiscalOperacional(user)) {
    const showMobileHome = location.pathname === '/dashboard' || location.pathname === '/';
    const isChatRoute = location.pathname.startsWith('/comunicacao');
    const fiscal = isFiscalOperacional(user);

    return (
      <div className="mobile-native min-h-screen bg-[#0A1633] text-white">
        {!isChatRoute && <MobileHeader user={user} />}
        <main className={isChatRoute ? 'mx-auto min-h-screen max-w-md px-0 pb-0 pt-0' : `mobile-main mx-auto min-h-[calc(100vh-72px)] w-full max-w-3xl px-4 ${fiscal ? 'pb-6' : 'pb-28'} pt-4`}>
          {showMobileHome ? <MobileHome user={user} /> : <Outlet />}
        </main>
        {!isChatRoute && !fiscal && <MobileBottomNav user={user} />}
      </div>
    );
  }

  return (
    <div className="app-bg">
      <div className="desktop-shell grid min-h-screen w-full">
        <Topbar />
        <div className="desktop-body min-h-0">
          <Sidebar />
          <main className="desktop-main min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
