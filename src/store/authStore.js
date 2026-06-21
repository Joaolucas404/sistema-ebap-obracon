import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { canAccess, normalizePerfil } from '../config/permissions.js';

const AUTH_STORAGE_KEY = 'ebaps-auth-session';

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
      logout: () => {
        window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
        set({ user: null, isAuthenticated: false });
      },
      hasPermission: (permissionKey) => {
        const user = get().user;
        return Boolean(user && canAccess(user.perfil, permissionKey));
      }
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => window.sessionStorage),
      onRehydrateStorage: () => () => {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
      },
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
