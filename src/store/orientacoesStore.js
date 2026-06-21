import { create } from 'zustand';
import {
  excluirOrientacao,
  listarComunicadosOperacionais,
  listarOrientacoes,
  obterDashboardOrientacoes,
  obterUrlAnexoOrientacao,
  salvarOrientacao,
  uploadAnexoOrientacao
} from '../services/orientacoesService.js';

const defaultFilters = {
  page: 1,
  pageSize: 12,
  search: '',
  categoria: '',
  status: '',
  tipo: ''
};

export const useOrientacoesStore = create((set, get) => ({
  orientacoes: [],
  comunicados: [],
  dashboard: null,
  count: 0,
  filters: defaultFilters,
  loading: false,
  saving: false,
  error: '',

  setFilters: (patch) => set((state) => ({ filters: { ...state.filters, ...patch, page: patch.page || 1 } })),
  resetFilters: () => set({ filters: defaultFilters }),

  carregarTudo: async () => {
    const { filters } = get();
    set({ loading: true, error: '' });

    try {
      const [dashboard, comunicados, orientacoesResult] = await Promise.all([
        obterDashboardOrientacoes(),
        listarComunicadosOperacionais(),
        listarOrientacoes(filters)
      ]);

      set({
        dashboard,
        comunicados,
        orientacoes: orientacoesResult.data,
        count: orientacoesResult.count,
        loading: false
      });
    } catch (err) {
      set({ error: err.message || 'Falha ao carregar orientações.', loading: false });
    }
  },

  salvar: async (payload, user) => {
    set({ saving: true, error: '' });
    try {
      const data = await salvarOrientacao(payload, user);
      await get().carregarTudo();
      set({ saving: false });
      return data;
    } catch (err) {
      set({ error: err.message || 'Falha ao salvar orientação.', saving: false });
      throw err;
    }
  },

  excluir: async (id, user) => {
    set({ saving: true, error: '' });
    try {
      await excluirOrientacao(id, user);
      await get().carregarTudo();
      set({ saving: false });
    } catch (err) {
      set({ error: err.message || 'Falha ao excluir orientação.', saving: false });
      throw err;
    }
  },

  anexar: async (orientacaoId, file, user) => {
    set({ saving: true, error: '' });
    try {
      await uploadAnexoOrientacao(orientacaoId, file, user);
      await get().carregarTudo();
      set({ saving: false });
    } catch (err) {
      set({ error: err.message || 'Falha ao anexar arquivo.', saving: false });
      throw err;
    }
  },

  abrirAnexo: async (anexo) => {
    const url = await obterUrlAnexoOrientacao(anexo);
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}));
