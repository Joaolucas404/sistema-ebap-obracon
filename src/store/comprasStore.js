import { create } from 'zustand';
import {
  aprovarCompra,
  listarCompras,
  listarEbapsCompras,
  listarFornecedoresCompras,
  listarHistoricoCompras,
  listarItensAlmoxCompras,
  mudarStatusCompra,
  obterDashboardCompras,
  receberCompra,
  salvarFornecedorCompra,
  salvarSolicitacaoCompra
} from '../services/comprasService.js';

const defaultFilters = {
  page: 1,
  pageSize: 10,
  search: '',
  status: '',
  area: '',
  ebapId: ''
};

export const useComprasStore = create((set, get) => ({
  compras: [],
  fornecedores: [],
  ebaps: [],
  itensAlmox: [],
  historico: [],
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
      const [dashboard, comprasResult, fornecedores, ebaps, itensAlmox, historico] = await Promise.all([
        obterDashboardCompras(),
        listarCompras(filters),
        listarFornecedoresCompras(),
        listarEbapsCompras(),
        listarItensAlmoxCompras(),
        listarHistoricoCompras()
      ]);

      set({
        dashboard,
        compras: comprasResult.data,
        count: comprasResult.count,
        fornecedores,
        ebaps,
        itensAlmox,
        historico,
        loading: false
      });
    } catch (err) {
      set({ error: err.message || 'Falha ao carregar compras.', loading: false });
    }
  },

  salvarSolicitacao: async (payload, user) => {
    set({ saving: true, error: '' });
    try {
      await salvarSolicitacaoCompra(payload, user);
      await get().carregarTudo();
      set({ saving: false });
    } catch (err) {
      set({ error: err.message || 'Falha ao salvar solicitacao.', saving: false });
      throw err;
    }
  },

  salvarFornecedor: async (payload, user) => {
    set({ saving: true, error: '' });
    try {
      await salvarFornecedorCompra(payload, user);
      await get().carregarTudo();
      set({ saving: false });
    } catch (err) {
      set({ error: err.message || 'Falha ao salvar fornecedor.', saving: false });
      throw err;
    }
  },

  mudarStatus: async (payload, user) => {
    set({ saving: true, error: '' });
    try {
      await mudarStatusCompra(payload, user);
      await get().carregarTudo();
      set({ saving: false });
    } catch (err) {
      set({ error: err.message || 'Falha ao movimentar compra.', saving: false });
      throw err;
    }
  },

  aprovar: async (payload, user) => {
    set({ saving: true, error: '' });
    try {
      await aprovarCompra(payload, user);
      await get().carregarTudo();
      set({ saving: false });
    } catch (err) {
      set({ error: err.message || 'Falha ao aprovar compra.', saving: false });
      throw err;
    }
  },

  receber: async (payload, user) => {
    set({ saving: true, error: '' });
    try {
      await receberCompra(payload, user);
      await get().carregarTudo();
      set({ saving: false });
    } catch (err) {
      set({ error: err.message || 'Falha ao receber compra.', saving: false });
      throw err;
    }
  }
}));
