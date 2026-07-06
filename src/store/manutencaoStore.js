import { create } from 'zustand';
import {
  cancelarEventoCronograma,
  duplicarEventoCronograma,
  excluirEventoCronograma,
  gerarOsDoEventoCronograma,
  listarAssociacoesAtividades,
  listarCronogramaManutencao,
  listarEbapsManutencao,
  listarImportacoesCronograma,
  resumoCronograma,
  salvarEventoCronograma,
  salvarImportacaoCronograma
} from '../services/manutencaoService.js';

export const useManutencaoStore = create((set, get) => ({
  dashboard: null,
  eventos: [],
  importacoes: [],
  associacoes: {},
  ebaps: [],
  loading: false,
  saving: false,
  error: '',

  carregarTudo: async (user = null, filters = {}) => {
    set({ loading: true, error: '' });
    try {
      const [eventos, importacoes, associacoes, ebaps] = await Promise.all([
        listarCronogramaManutencao(user, filters),
        listarImportacoesCronograma(user),
        listarAssociacoesAtividades(),
        listarEbapsManutencao()
      ]);
      set({ eventos, importacoes, associacoes, ebaps, dashboard: resumoCronograma(eventos), loading: false });
    } catch (err) {
      set({ error: err.message || 'Falha ao carregar planejamento de manutenção.', loading: false });
    }
  },

  salvarEvento: async (payload, user) => {
    set({ saving: true, error: '' });
    try {
      const evento = await salvarEventoCronograma(payload, user);
      await get().carregarTudo(user);
      set({ saving: false });
      return evento;
    } catch (err) {
      set({ error: err.message || 'Falha ao salvar evento.', saving: false });
      throw err;
    }
  },

  importarEventos: async (payload, user) => {
    set({ saving: true, error: '' });
    try {
      await salvarImportacaoCronograma(payload, user);
      await get().carregarTudo(user);
      set({ saving: false });
    } catch (err) {
      set({ error: err.message || 'Falha ao importar cronograma.', saving: false });
      throw err;
    }
  },

  cancelarEvento: async (evento, user) => {
    set({ saving: true, error: '' });
    try {
      await cancelarEventoCronograma(evento, user);
      await get().carregarTudo(user);
      set({ saving: false });
    } catch (err) {
      set({ error: err.message || 'Falha ao cancelar evento.', saving: false });
      throw err;
    }
  },

  excluirEvento: async (evento, user) => {
    set({ saving: true, error: '' });
    try {
      await excluirEventoCronograma(evento, user);
      await get().carregarTudo(user);
      set({ saving: false });
    } catch (err) {
      set({ error: err.message || 'Falha ao excluir evento.', saving: false });
      throw err;
    }
  },

  duplicarEvento: async (evento, user) => {
    set({ saving: true, error: '' });
    try {
      await duplicarEventoCronograma(evento, user);
      await get().carregarTudo(user);
      set({ saving: false });
    } catch (err) {
      set({ error: err.message || 'Falha ao duplicar evento.', saving: false });
      throw err;
    }
  },

  gerarOsEvento: async (evento, user) => {
    set({ saving: true, error: '' });
    try {
      const updated = await gerarOsDoEventoCronograma(evento, user);
      await get().carregarTudo(user);
      set({ saving: false });
      return updated;
    } catch (err) {
      set({ error: err.message || 'Falha ao gerar OS do evento.', saving: false });
      throw err;
    }
  }
}));
