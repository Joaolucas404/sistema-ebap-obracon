import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="app-bg">
      <div className="content-layer">
        <Topbar />
        <div className="mx-auto mb-3 max-w-[1680px] lg:hidden">
          <button className="secondary-button w-full justify-between" type="button" onClick={() => setMobileMenuOpen((open) => !open)}>
            <span className="inline-flex items-center gap-2">
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              Menu operacional
            </span>
            <span className="text-xs font-black uppercase tracking-wide text-blue-100">
              {mobileMenuOpen ? 'Ocultar' : 'Abrir'}
            </span>
          </button>
        </div>
        <div className="mx-auto grid max-w-[1680px] gap-3 lg:grid-cols-[258px_minmax(0,1fr)] 2xl:grid-cols-[270px_minmax(0,1fr)]">
          <div className={`${mobileMenuOpen ? 'block' : 'hidden'} lg:block`}>
            <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
          </div>
          <main className="min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
