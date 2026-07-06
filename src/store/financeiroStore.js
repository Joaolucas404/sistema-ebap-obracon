import { create } from 'zustand';
import {
  aprovarFinanceiro,
  excluirFinanceiro,
  gerarUrlDocumentoFinanceiro,
  listarApoioFinanceiro,
  listarContratos,
  listarDocumentosFinanceiros,
  listarHistoricoFinanceiro,
  listarLancamentos,
  listarMedições,
  obterDashboardFinanceiro,
  salvarContrato,
  salvarLancamento,
  salvarMedicao,
  uploadDocumentoFinanceiro
} from '../services/financeiroService.js';

const defaultFilters = {
  search: '',
  status: '',
  tipo: '',
  fornecedorId: '',
  contratoId: '',
  ebapId: '',
  prefeituraStatus: ''
};

export const useFinanceiroStore = create((set, get) => ({
  dashboard: null,
  contratos: [],
  medições: [],
  lancamentos: [],
  documentos: [],
  historico: [],
  fornecedores: [],
  ebaps: [],
  usuarios: [],
  filters: defaultFilters,
  loading: false,
  saving: false,
  error: '',

  setFilters: (patch) => set((state) => ({ filters: { ...state.filters, ...patch } })),
  resetFilters: () => set({ filters: defaultFilters }),

  carregarTudo: async () => {
    const { filters } = get();
    set({ loading: true, error: '' });
    try {
      const [dashboard, contratos, medições, lancamentos, documentos, historico, apoio] = await Promise.all([
        obterDashboardFinanceiro(),
        listarContratos(filters),
        listarMedições(filters),
        listarLancamentos(filters),
        listarDocumentosFinanceiros(),
        listarHistoricoFinanceiro(),
        listarApoioFinanceiro()
      ]);

      set({
        dashboard,
        contratos,
        medições,
        lancamentos,
        documentos,
        historico,
        fornecedores: apoio.fornecedores,
        ebaps: apoio.ebaps,
        usuarios: apoio.usuarios,
        loading: false
      });
    } catch (err) {
      set({ error: err.message || 'Falha ao carregar Financeiro/Contratos.', loading: false });
    }
  },

  salvarContrato: async (payload, user) => {
    set({ saving: true, error: '' });
    try {
      await salvarContrato(payload, user);
      await get().carregarTudo();
      set({ saving: false });
    } catch (err) {
      set({ error: err.message || 'Falha ao salvar contrato.', saving: false });
      throw err;
    }
  },

  salvarMedicao: async (payload, user) => {
    set({ saving: true, error: '' });
    try {
      await salvarMedicao(payload, user);
      await get().carregarTudo();
      set({ saving: false });
    } catch (err) {
      set({ error: err.message || 'Falha ao salvar medicao.', saving: false });
      throw err;
    }
  },

  salvarLancamento: async (payload, user) => {
    set({ saving: true, error: '' });
    try {
      await salvarLancamento(payload, user);
      await get().carregarTudo();
      set({ saving: false });
    } catch (err) {
      set({ error: err.message || 'Falha ao salvar lancamento.', saving: false });
      throw err;
    }
  },

  aprovar: async (payload, user) => {
    set({ saving: true, error: '' });
    try {
      await aprovarFinanceiro(payload, user);
      await get().carregarTudo();
      set({ saving: false });
    } catch (err) {
      set({ error: err.message || 'Falha ao registrar aprovacao.', saving: false });
      throw err;
    }
  },

  excluir: async (payload, user) => {
    set({ saving: true, error: '' });
    try {
      await excluirFinanceiro(payload, user);
      await get().carregarTudo();
      set({ saving: false });
    } catch (err) {
      set({ error: err.message || 'Falha ao remover registro.', saving: false });
      throw err;
    }
  },

  uploadDocumento: async (payload, user) => {
    set({ saving: true, error: '' });
    try {
      await uploadDocumentoFinanceiro(payload, user);
      await get().carregarTudo();
      set({ saving: false });
    } catch (err) {
      set({ error: err.message || 'Falha ao enviar documento.', saving: false });
      throw err;
    }
  },

  abrirDocumento: async (documento) => gerarUrlDocumentoFinanceiro(documento)
}));
