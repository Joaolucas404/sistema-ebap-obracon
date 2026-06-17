import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';

export default function AppLayout() {
  return (
    <div className="app-bg">
      <div className="content-layer">
        <Topbar />
        <div className="mx-auto grid max-w-[1400px] gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <Sidebar />
          <main className="min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
