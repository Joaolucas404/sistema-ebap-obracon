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

function compraOtimista(saved, payload, user) {
  const itens = (payload.itens || []).map((item, index) => ({
    id: `${saved?.id || 'nova'}-item-${index}`,
    compra_id: saved?.id || payload.id || null,
    ...item
  }));

  return {
    ...payload,
    ...saved,
    id: saved?.id || payload.id,
    numero: saved?.numero || payload.numero || 'Nova solicitação',
    status: saved?.status || payload.status || 'solicitada',
    area: saved?.area || payload.area,
    ebap_id: saved?.ebap_id || payload.ebap_id || null,
    solicitante_id: saved?.solicitante_id || user?.id || null,
    created_at: saved?.created_at || new Date().toISOString(),
    deleted_at: null,
    itens,
    aprovacoes: [],
    historico: [],
    solicitante: {
      id: user?.id,
      nome: user?.nome,
      usuario: user?.usuario,
      perfil: user?.perfil
    },
    ebap: null,
    fornecedor: null
  };
}

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

  carregarTudo: async (overrideFilters = null) => {
    const filters = overrideFilters || get().filters;
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
        ...(overrideFilters ? { filters: overrideFilters } : {}),
        loading: false
      });
    } catch (err) {
      set({ error: err.message || 'Falha ao carregar compras.', loading: false });
    }
  },

  salvarSolicitacao: async (payload, user) => {
    set({ saving: true, error: '' });
    try {
      const saved = await salvarSolicitacaoCompra(payload, user);
      const filters = { ...defaultFilters };
      await get().carregarTudo(filters);
      if (saved?.id) {
        const current = get().compras;
        const exists = current.some((compra) => compra.id === saved.id);
        if (!exists) {
          set({
            compras: [compraOtimista(saved, payload, user), ...current],
            count: Math.max(get().count + 1, current.length + 1),
            filters
          });
        }
      }
      set({ saving: false });
      return saved;
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
