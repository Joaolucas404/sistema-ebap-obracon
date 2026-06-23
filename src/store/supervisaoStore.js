import { create } from 'zustand';
import {
  confirmarAreaOS,
  encaminharTecnicosOS,
  listarFilaSupervisao,
  programarExecucaoOS,
  reencaminharOS,
  solicitarCorrecaoOS,
  validarExecucaoOS
} from '../services/supervisaoService.js';

const defaultFilters = {
  page: 1,
  pageSize: 20,
  area: '',
  ebapId: '',
  statusSupervisor: '',
  status: '',
  prioridade: '',
  equipe: '',
  tecnicoId: '',
  data: '',
  search: ''
};

export const useSupervisaoStore = create((set, get) => ({
  items: [],
  count: 0,
  kpis: null,
  contexto: null,
  filters: defaultFilters,
  loading: false,
  saving: false,
  error: '',

  setFilters: (patch) => set((state) => ({ filters: { ...state.filters, ...patch, page: patch.page || 1 } })),
  resetFilters: () => set({ filters: defaultFilters }),

  carregar: async (user) => {
    if (!user?.id) return;
    const { filters } = get();
    set({ loading: true, error: '' });
    try {
      const result = await listarFilaSupervisao(filters, user);
      set({ items: result.data, count: result.count, kpis: result.kpis, contexto: result.contexto, loading: false });
    } catch (err) {
      set({ error: err.message || 'Falha ao carregar supervisão.', loading: false });
    }
  },

  executar: async (action, osId, payload, user) => {
    set({ saving: true, error: '' });
    try {
      const actions = {
        confirmar: () => confirmarAreaOS(osId, user),
        programar: () => programarExecucaoOS(osId, payload, user),
        encaminhar: () => encaminharTecnicosOS(osId, user),
        corrigir: () => solicitarCorrecaoOS(osId, payload?.motivo, user),
        validar: () => validarExecucaoOS(osId, user),
        reencaminhar: () => reencaminharOS(osId, payload, user)
      };
      if (!actions[action]) throw new Error('Ação inválida.');
      const data = await actions[action]();
      await get().carregar(user);
      set({ saving: false });
      return data;
    } catch (err) {
      set({ error: err.message || 'Falha ao executar ação.', saving: false });
      throw err;
    }
  }
}));
