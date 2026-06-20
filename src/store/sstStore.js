import { create } from 'zustand';
import {
  listarAprs,
  listarEbapsSst,
  listarEntregasEpi,
  listarEpis,
  listarFuncionariosSst,
  listarFuncionarioTreinamentos,
  listarTreinamentos,
  obterDashboardSst,
  registrarEntregaEpi,
  registrarFuncionarioTreinamento,
  salvarApr,
  salvarEpi,
  salvarTreinamento
} from '../services/sstService.js';

export const useSstStore = create((set, get) => ({
  dashboard: null,
  epis: [],
  entregas: [],
  treinamentos: [],
  funcionarioTreinamentos: [],
  aprs: [],
  funcionarios: [],
  ebaps: [],
  loading: false,
  saving: false,
  error: '',

  carregarTudo: async () => {
    set({ loading: true, error: '' });
    try {
      const [dashboard, epis, entregas, treinamentos, funcionarioTreinamentos, aprs, funcionarios, ebaps] = await Promise.all([
        obterDashboardSst(),
        listarEpis(),
        listarEntregasEpi(),
        listarTreinamentos(),
        listarFuncionarioTreinamentos(),
        listarAprs(),
        listarFuncionariosSst(),
        listarEbapsSst()
      ]);

      set({
        dashboard,
        epis,
        entregas,
        treinamentos,
        funcionarioTreinamentos,
        aprs,
        funcionarios,
        ebaps,
        loading: false
      });
    } catch (err) {
      set({ error: err.message || 'Falha ao carregar SST.', loading: false });
    }
  },

  salvarEpi: async (payload, user) => {
    set({ saving: true, error: '' });
    try {
      await salvarEpi(payload, user);
      await get().carregarTudo();
      set({ saving: false });
    } catch (err) {
      set({ error: err.message || 'Falha ao salvar EPI.', saving: false });
      throw err;
    }
  },

  registrarEntregaEpi: async (payload, user) => {
    set({ saving: true, error: '' });
    try {
      await registrarEntregaEpi(payload, user);
      await get().carregarTudo();
      set({ saving: false });
    } catch (err) {
      set({ error: err.message || 'Falha ao registrar entrega de EPI.', saving: false });
      throw err;
    }
  },

  salvarTreinamento: async (payload, user) => {
    set({ saving: true, error: '' });
    try {
      await salvarTreinamento(payload, user);
      await get().carregarTudo();
      set({ saving: false });
    } catch (err) {
      set({ error: err.message || 'Falha ao salvar treinamento.', saving: false });
      throw err;
    }
  },

  registrarFuncionarioTreinamento: async (payload, user) => {
    set({ saving: true, error: '' });
    try {
      await registrarFuncionarioTreinamento(payload, user);
      await get().carregarTudo();
      set({ saving: false });
    } catch (err) {
      set({ error: err.message || 'Falha ao registrar treinamento do funcionario.', saving: false });
      throw err;
    }
  },

  salvarApr: async (payload, user) => {
    set({ saving: true, error: '' });
    try {
      await salvarApr(payload, user);
      await get().carregarTudo();
      set({ saving: false });
    } catch (err) {
      set({ error: err.message || 'Falha ao salvar APR.', saving: false });
      throw err;
    }
  }
}));
