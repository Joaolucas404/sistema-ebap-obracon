import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import { buscarUsuarioPublico } from '../../services/authService.js';

export default function ProtectedRoute({ permission }) {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const setSession = useAuthStore((state) => state.setSession);
  const logout = useAuthStore((state) => state.logout);
  const [checkingSession, setCheckingSession] = useState(false);

  useEffect(() => {
    let active = true;

    async function validateStoredSession() {
      if (!isAuthenticated || !user?.id) return;
      setCheckingSession(true);
      try {
        const freshUser = await buscarUsuarioPublico(user.id);
        if (!active) return;
        if (!freshUser?.ativo) {
          logout();
          return;
        }
        setSession(freshUser);
      } catch {
        if (active) logout();
      } finally {
        if (active) setCheckingSession(false);
      }
    }

    validateStoredSession();
    return () => {
      active = false;
    };
  }, [isAuthenticated, user?.id, setSession, logout]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (checkingSession) {
    return <div className="glass-card rounded-3xl p-8 text-center text-slate-300">Validando sessão...</div>;
  }

  if (permission && !hasPermission(permission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
