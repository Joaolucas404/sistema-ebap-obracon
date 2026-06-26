import { create } from 'zustand';
import { supabase } from '../lib/supabase.js';
import { listarAtivos, obterDashboardAtivos } from '../services/ativosService.js';

export const useAtivosStore = create((set, get) => ({
  ativos: [],
  dashboard: null,
  count: 0,
  page: 1,
  pageSize: 30,
  loading: false,
  error: '',
  realtimeChannel: null,
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
  },
  subscribeRealtime: () => {
    if (get().realtimeChannel) return () => {};

    const channel = supabase
      .channel('ativos-operacionais')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ativos' }, () => {
        get().load();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ativo_status_historico' }, () => {
        get().load();
      })
      .subscribe();

    set({ realtimeChannel: channel });

    return () => {
      supabase.removeChannel(channel);
      if (get().realtimeChannel === channel) set({ realtimeChannel: null });
    };
  }
}));
