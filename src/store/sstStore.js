import { create } from 'zustand';
import {
  listarAprs,
  listarApts,
  listarEbapsSst,
  listarEntregasEpi,
  listarEpis,
  listarFuncionariosSst,
  listarFuncionarioTreinamentos,
  listarInspecoes,
  listarOcorrencias,
  listarOrdensServicoSst,
  listarPlanosAcao,
  listarTreinamentos,
  obterDashboardSst,
  registrarEntregaEpi,
  registrarFuncionarioTreinamento,
  salvarApr,
  salvarApt,
  salvarEpi,
  salvarInspecao,
  salvarOcorrencia,
  salvarPlanoAcao,
  salvarTreinamento
} from '../services/sstService.js';

export const useSstStore = create((set, get) => ({
  dashboard: null,
  epis: [],
  entregas: [],
  treinamentos: [],
  funcionarioTreinamentos: [],
  aprs: [],
  apts: [],
  inspecoes: [],
  ocorrencias: [],
  planosAcao: [],
  funcionarios: [],
  ebaps: [],
  ordensServico: [],
  loading: false,
  saving: false,
  error: '',

  carregarTudo: async () => {
    set({ loading: true, error: '' });
    try {
      const [dashboard, epis, entregas, treinamentos, funcionarioTreinamentos, aprs, apts, inspecoes, ocorrencias, planosAcao, funcionarios, ebaps, ordensServico] = await Promise.all([
        obterDashboardSst(),
        listarEpis(),
        listarEntregasEpi(),
        listarTreinamentos(),
        listarFuncionarioTreinamentos(),
        listarAprs(),
        listarApts(),
        listarInspecoes(),
        listarOcorrencias(),
        listarPlanosAcao(),
        listarFuncionariosSst(),
        listarEbapsSst(),
        listarOrdensServicoSst()
      ]);

      set({
        dashboard,
        epis,
        entregas,
        treinamentos,
        funcionarioTreinamentos,
        aprs,
        apts,
        inspecoes,
        ocorrencias,
        planosAcao,
        funcionarios,
        ebaps,
        ordensServico,
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
  ,

  salvarApt: async (payload, user) => {
    set({ saving: true, error: '' });
    try {
      await salvarApt(payload, user);
      await get().carregarTudo();
      set({ saving: false });
    } catch (err) {
      set({ error: err.message || 'Falha ao salvar APT.', saving: false });
      throw err;
    }
  },

  salvarInspecao: async (payload, user) => {
    set({ saving: true, error: '' });
    try {
      await salvarInspecao(payload, user);
      await get().carregarTudo();
      set({ saving: false });
    } catch (err) {
      set({ error: err.message || 'Falha ao salvar inspecao.', saving: false });
      throw err;
    }
  },

  salvarOcorrencia: async (payload, user) => {
    set({ saving: true, error: '' });
    try {
      await salvarOcorrencia(payload, user);
      await get().carregarTudo();
      set({ saving: false });
    } catch (err) {
      set({ error: err.message || 'Falha ao salvar ocorrencia.', saving: false });
      throw err;
    }
  },

  salvarPlanoAcao: async (payload, user) => {
    set({ saving: true, error: '' });
    try {
      await salvarPlanoAcao(payload, user);
      await get().carregarTudo();
      set({ saving: false });
    } catch (err) {
      set({ error: err.message || 'Falha ao salvar plano de acao.', saving: false });
      throw err;
    }
  }
}));
