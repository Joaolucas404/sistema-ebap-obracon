import { create } from 'zustand';
import {
  desativarItemAlmoxarifado,
  listarCategoriasAlmoxarifado,
  listarItensAlmoxarifado,
  listarLocaisAlmoxarifado,
  listarMovimentacoesAlmoxarifado,
  obterDashboardAlmoxarifado,
  registrarMovimentacaoAlmoxarifado,
  salvarItemAlmoxarifado
} from '../services/almoxarifadoService.js';

const defaultFilters = {
  search: '',
  categoria: '',
  localId: '',
  status: 'ativo',
  estoque: '',
  page: 1,
  pageSize: 10
};

export const useAlmoxarifadoStore = create((set, get) => ({
  itens: [],
  itensMovimentacao: [],
  locais: [],
  categorias: [],
  movimentacoes: [],
  dashboard: null,
  count: 0,
  filters: defaultFilters,
  loading: false,
  saving: false,
  error: '',

  setFilters: (patch) => {
    set((state) => ({
      filters: {
        ...state.filters,
        ...patch,
        page: patch.page || 1
      }
    }));
  },

  resetFilters: () => set({ filters: defaultFilters }),

  carregarBase: async () => {
    const [locais, categorias] = await Promise.all([listarLocaisAlmoxarifado(), listarCategoriasAlmoxarifado()]);
    set({ locais, categorias });
  },

  carregarTudo: async () => {
    set({ loading: true, error: '' });
    try {
      const filters = get().filters;
      const [lista, itensMovimentacao, dashboard, movimentacoes, locais, categorias] = await Promise.all([
        listarItensAlmoxarifado(filters),
        listarItensAlmoxarifado({ status: 'ativo', page: 1, pageSize: 1000 }),
        obterDashboardAlmoxarifado(),
        listarMovimentacoesAlmoxarifado({ limit: 20 }),
        listarLocaisAlmoxarifado(),
        listarCategoriasAlmoxarifado()
      ]);

      set({
        itens: lista.data,
        itensMovimentacao: itensMovimentacao.data,
        count: lista.count,
        dashboard,
        movimentacoes,
        locais,
        categorias,
        loading: false
      });
    } catch (err) {
      set({ error: err.message || 'Falha ao carregar almoxarifado.', loading: false });
    }
  },

  salvarItem: async (payload, user) => {
    set({ saving: true, error: '' });
    try {
      await salvarItemAlmoxarifado(payload, user);
      await get().carregarTudo();
      set({ saving: false });
    } catch (err) {
      set({ error: err.message || 'Falha ao salvar item.', saving: false });
      throw err;
    }
  },

  desativarItem: async (id, user) => {
    set({ saving: true, error: '' });
    try {
      await desativarItemAlmoxarifado(id, user);
      await get().carregarTudo();
      set({ saving: false });
    } catch (err) {
      set({ error: err.message || 'Falha ao desativar item.', saving: false });
      throw err;
    }
  },

  registrarMovimentacao: async (payload, user) => {
    set({ saving: true, error: '' });
    try {
      await registrarMovimentacaoAlmoxarifado(payload, user);
      await get().carregarTudo();
      set({ saving: false });
    } catch (err) {
      set({ error: err.message || 'Falha ao registrar movimentacao.', saving: false });
      throw err;
    }
  }
}));
