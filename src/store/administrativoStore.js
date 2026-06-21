import { create } from 'zustand';
import {
  abrirDocumentoAdministrativo,
  carregarApoioAdministrativo,
  listarAdministrativo,
  obterDashboardAdministrativo,
  removerAdministrativo,
  salvarAtestado,
  salvarColaborador,
  salvarFerias,
  salvarManutencaoFrota,
  salvarVeiculo,
  uploadDocumentoAdministrativo
} from '../services/administrativoService.js';

export const useAdministrativoStore = create((set, get) => ({
  dashboard: null,
  colaboradores: [],
  ferias: [],
  atestados: [],
  documentos: [],
  veiculos: [],
  frotaManutencoes: [],
  historico: [],
  usuarios: [],
  sstColaboradores: [],
  fornecedores: [],
  manutencoes: [],
  loading: false,
  saving: false,
  error: '',

  carregarTudo: async () => {
    set({ loading: true, error: '' });
    try {
      const [dashboard, dados, apoio] = await Promise.all([
        obterDashboardAdministrativo(),
        listarAdministrativo(),
        carregarApoioAdministrativo()
      ]);
      set({ dashboard, ...dados, ...apoio, loading: false });
    } catch (err) {
      set({ error: err.message || 'Falha ao carregar Administrativo.', loading: false });
    }
  },

  salvarColaborador: async (payload, user) => saveAndReload(set, get, () => salvarColaborador(payload, user), 'Falha ao salvar colaborador.'),
  salvarFerias: async (payload, user) => saveAndReload(set, get, () => salvarFerias(payload, user), 'Falha ao salvar férias.'),
  salvarAtestado: async (payload, user) => saveAndReload(set, get, () => salvarAtestado(payload, user), 'Falha ao salvar atestado.'),
  salvarVeiculo: async (payload, user) => saveAndReload(set, get, () => salvarVeiculo(payload, user), 'Falha ao salvar veículo.'),
  salvarManutencaoFrota: async (payload, user) => saveAndReload(set, get, () => salvarManutencaoFrota(payload, user), 'Falha ao salvar manutenção da frota.'),
  uploadDocumento: async (payload, user) => saveAndReload(set, get, () => uploadDocumentoAdministrativo(payload, user), 'Falha ao enviar documento.'),
  remover: async (payload, user) => saveAndReload(set, get, () => removerAdministrativo(payload, user), 'Falha ao remover registro.'),
  abrirDocumento: async (documento) => abrirDocumentoAdministrativo(documento)
}));

async function saveAndReload(set, get, fn, errorMessage) {
  set({ saving: true, error: '' });
  try {
    await fn();
    await get().carregarTudo();
    set({ saving: false });
  } catch (err) {
    set({ error: err.message || errorMessage, saving: false });
    throw err;
  }
}
