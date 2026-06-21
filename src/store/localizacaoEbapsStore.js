import { create } from 'zustand';
import { obterIndicadoresEbaps } from '../services/localizacaoEbapsService.js';

export const useLocalizacaoEbapsStore = create((set, get) => ({
  ebaps: [],
  dashboard: null,
  filters: {
    search: '',
    status: ''
  },
  loading: false,
  error: '',

  setFilters: (patch) => set((state) => ({ filters: { ...state.filters, ...patch } })),
  resetFilters: () => set({ filters: { search: '', status: '' } }),

  carregar: async () => {
    set({ loading: true, error: '' });
    try {
      const { ebaps, dashboard } = await obterIndicadoresEbaps();
      set({ ebaps, dashboard, loading: false });
    } catch (err) {
      set({ error: err.message || 'Falha ao carregar localizacao das EBAPs.', loading: false });
    }
  },

  getFilteredEbaps: () => {
    const { ebaps, filters } = get();
    return ebaps.filter((ebap) => {
      const matchesSearch = !filters.search?.trim() || ebap.nome.toLowerCase().includes(filters.search.trim().toLowerCase());
      const matchesStatus = !filters.status || ebap.status_operacional === filters.status;
      return matchesSearch && matchesStatus;
    });
  }
}));
