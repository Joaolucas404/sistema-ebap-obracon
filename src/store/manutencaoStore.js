import { create } from 'zustand';
import {
  gerarOsManutencaoVencidas,
  listarEbapsManutencao,
  listarEquipamentosManutencao,
  listarExecucoesManutencao,
  listarOsManutencao,
  listarPlanosManutencao,
  listarResponsaveisManutencao,
  obterDashboardManutencao,
  registrarExecucaoManutencao,
  salvarPlanoManutencao
} from '../services/manutencaoService.js';

export const useManutencaoStore = create((set, get) => ({
  dashboard: null,
  planos: [],
  execucoes: [],
  osManutencao: [],
  ebaps: [],
  equipamentos: [],
  responsaveis: [],
  loading: false,
  saving: false,
  error: '',

  carregarTudo: async (user = null) => {
    set({ loading: true, error: '' });
    try {
      const [dashboard, planos, execucoes, osManutencao, ebaps, equipamentos, responsaveis] = await Promise.all([
        obterDashboardManutencao(),
        listarPlanosManutencao({ ativo: true }),
        listarExecucoesManutencao(),
        listarOsManutencao(500, user),
        listarEbapsManutencao(),
        listarEquipamentosManutencao(),
        listarResponsaveisManutencao()
      ]);

      set({ dashboard, planos, execucoes, osManutencao, ebaps, equipamentos, responsaveis, loading: false });
    } catch (err) {
      set({ error: err.message || 'Falha ao carregar manutencao.', loading: false });
    }
  },

  salvarPlano: async (payload, user) => {
    set({ saving: true, error: '' });
    try {
      await salvarPlanoManutencao(payload, user);
      await get().carregarTudo();
      set({ saving: false });
    } catch (err) {
      set({ error: err.message || 'Falha ao salvar plano.', saving: false });
      throw err;
    }
  },

  registrarExecucao: async (payload, user) => {
    set({ saving: true, error: '' });
    try {
      await registrarExecucaoManutencao(payload, user);
      await get().carregarTudo();
      set({ saving: false });
    } catch (err) {
      set({ error: err.message || 'Falha ao registrar execucao.', saving: false });
      throw err;
    }
  },

  gerarOsVencidas: async (user) => {
    set({ saving: true, error: '' });
    try {
      const count = await gerarOsManutencaoVencidas(user);
      await get().carregarTudo();
      set({ saving: false });
      return count;
    } catch (err) {
      set({ error: err.message || 'Falha ao gerar OS de manutencao.', saving: false });
      throw err;
    }
  }
}));
