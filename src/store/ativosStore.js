import { create } from 'zustand';
import { listarAtivos, obterDashboardAtivos } from '../services/ativosService.js';

export const useAtivosStore = create((set, get) => ({
  ativos: [],
  dashboard: null,
  count: 0,
  page: 1,
  pageSize: 30,
  loading: false,
  error: '',
  filters: {
    search: '',
    status: '',
    tipo: '',
    area: '',
    ebapId: '',
    page: 1,
    pageSize: 30
  },
  setFilters: (patch) => set((state) => ({ filters: { ...state.filters, ...patch } })),
  load: async () => {
    set({ loading: true, error: '' });
    try {
      const filters = get().filters;
      const [ativosResult, dashboard] = await Promise.all([listarAtivos(filters), obterDashboardAtivos()]);
      set({
        ativos: ativosResult.data,
        count: ativosResult.count,
        page: ativosResult.page,
        pageSize: ativosResult.pageSize,
        dashboard,
        loading: false
      });
    } catch (error) {
      set({ error: error.message || 'Falha ao carregar ativos.', loading: false });
    }
  }
}));
