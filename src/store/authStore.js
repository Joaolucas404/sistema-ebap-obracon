import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { canAccess, normalizePerfil } from '../config/permissions.js';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      setSession: (user) =>
        set({
          user: user ? { ...user, perfil: normalizePerfil(user.perfil) } : null,
          isAuthenticated: Boolean(user)
        }),
      logout: () => set({ user: null, isAuthenticated: false }),
      hasPermission: (permissionKey) => {
        const user = get().user;
        return Boolean(user && canAccess(user.perfil, permissionKey));
      }
    }),
    {
      name: 'ebaps-auth-session',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
