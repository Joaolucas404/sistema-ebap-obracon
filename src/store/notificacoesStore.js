import { create } from 'zustand';
import {
  contarNotificacoesNaoLidas,
  listarNotificacoes,
  listarUltimasNotificacoes,
  marcarNotificacaoLida,
  marcarTodasNotificacoesLidas,
  subscribeNotificacoes
} from '../services/notificacoesService.js';

const defaultFilters = {
  page: 1,
  pageSize: 20,
  modulo: '',
  prioridade: '',
  tipo: '',
  status: '',
  dataInicio: '',
  dataFim: ''
};

export const useNotificacoesStore = create((set, get) => ({
  notificacoes: [],
  últimas: [],
  count: 0,
  unreadCount: 0,
  filters: defaultFilters,
  loading: false,
  saving: false,
  error: '',
  unsubscribeRealtime: null,

  setFilters: (patch) => set((state) => ({ filters: { ...state.filters, ...patch, page: patch.page || 1 } })),
  resetFilters: () => set({ filters: defaultFilters }),

  carregar: async (user) => {
    if (!user?.id) return;
    const { filters } = get();
    set({ loading: true, error: '' });
    try {
      const [lista, últimas, unreadCount] = await Promise.all([
        listarNotificacoes(filters, user),
        listarUltimasNotificacoes(user),
        contarNotificacoesNaoLidas(user)
      ]);
      set({
        notificacoes: lista.data,
        count: lista.count,
        últimas,
        unreadCount,
        loading: false
      });
    } catch (err) {
      set({ error: err.message || 'Falha ao carregar notificacoes.', loading: false });
    }
  },

  carregarResumo: async (user) => {
    if (!user?.id) return;
    try {
      const [últimas, unreadCount] = await Promise.all([
        listarUltimasNotificacoes(user),
        contarNotificacoesNaoLidas(user)
      ]);
      set({ últimas, unreadCount });
    } catch (err) {
      set({ error: err.message || 'Falha ao carregar resumo de notificacoes.' });
    }
  },

  marcarLida: async (id, user) => {
    set({ saving: true, error: '' });
    try {
      await marcarNotificacaoLida(id, user);
      await get().carregar(user);
      set({ saving: false });
    } catch (err) {
      set({ error: err.message || 'Falha ao marcar notificacao como lida.', saving: false });
      throw err;
    }
  },

  marcarTodasLidas: async (user) => {
    set({ saving: true, error: '' });
    try {
      const count = await marcarTodasNotificacoesLidas(user);
      await get().carregar(user);
      set({ saving: false });
      return count;
    } catch (err) {
      set({ error: err.message || 'Falha ao marcar notificacoes como lidas.', saving: false });
      throw err;
    }
  },

  iniciarRealtime: (user) => {
    const current = get().unsubscribeRealtime;
    if (current) current();
    if (!user?.id) return;

    const unsubscribe = subscribeNotificacoes(user, () => {
      get().carregarResumo(user);
      get().carregar(user);
    });

    set({ unsubscribeRealtime: unsubscribe });
  },

  pararRealtime: () => {
    const current = get().unsubscribeRealtime;
    if (current) current();
    set({ unsubscribeRealtime: null });
  }
}));
