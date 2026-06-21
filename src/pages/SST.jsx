import { useEffect, useState } from 'react';
import { ClipboardPlus, GraduationCap, HardHat, ListChecks, Plus, RefreshCcw, ShieldCheck, Siren } from 'lucide-react';
import Modal from '../components/ui/Modal.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Toast from '../components/ui/Toast.jsx';
import SstDashboard from '../components/sst/SstDashboard.jsx';
import {
  AprForm,
  blankApr,
  blankApt,
  blankEntrega,
  blankEpi,
  blankFuncionarioTreinamento,
  blankInspecao,
  blankOcorrencia,
  blankPlanoAcao,
  blankTreinamento,
  EntregaEpiForm,
  EpiForm,
  FuncionarioTreinamentoForm,
  AptForm,
  InspecaoForm,
  OcorrenciaForm,
  PlanoAcaoForm,
  TreinamentoForm
} from '../components/sst/SstForms.jsx';
import { AprTable, AptTable, EntregasTable, EpiTable, FuncionarioTreinamentosTable, InspecoesTable, OcorrenciasTable, PlanosAcaoTable, TreinamentosTable } from '../components/sst/SstTables.jsx';
import { podeCadastrarBaseSst, podeGerenciarSst } from '../services/sstService.js';
import { useAuthStore } from '../store/authStore.js';
import { useSstStore } from '../store/sstStore.js';

const tabs = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'epis', label: 'EPIs' },
  { key: 'entregas', label: 'Entregas' },
  { key: 'treinamentos', label: 'Treinamentos' },
  { key: 'vencimentos', label: 'Vencimentos' },
  { key: 'apr', label: 'APR' },
  { key: 'apt', label: 'APT' },
  { key: 'inspecoes', label: 'Inspecoes' },
  { key: 'ocorrencias', label: 'Ocorrencias' },
  { key: 'planos', label: 'Planos' }
];

function mapEpi(epi) {
  return {
    id: epi.id,
    codigo: epi.codigo || '',
    nome: epi.nome || '',
    ca: epi.ca || '',
    validade_ca: epi.validade_ca || '',
    categoria: epi.categoria || '',
    fabricante: epi.fabricante || '',
    estoque_minimo: epi.estoque_minimo ?? 0,
    ativo: epi.ativo !== false
  };
}

function mapTreinamento(treinamento) {
  return {
    id: treinamento.id,
    codigo: treinamento.codigo || '',
    nome: treinamento.nome || '',
    norma: treinamento.norma || '',
    categoria: treinamento.categoria || '',
    carga_horaria: treinamento.carga_horaria || '',
    validade_meses: treinamento.validade_meses || '',
    obrigatorio: treinamento.obrigatorio !== false,
    ativo: treinamento.ativo !== false
  };
}

function toDatetimeLocal(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 16);
}

function mapApr(apr) {
  return {
    id: apr.id,
    codigo: apr.codigo || '',
    os_id: apr.os_id || '',
    ebap_id: apr.ebap_id || '',
    atividade: apr.atividade || '',
    local_atividade: apr.local_atividade || '',
    riscos: apr.riscos || '',
    medidas_controle: apr.medidas_controle || '',
    epis_obrigatorios: apr.epis_obrigatorios || '',
    responsavel_id: apr.responsavel_id || '',
    status: apr.status || 'rascunho',
    inicio_previsto: toDatetimeLocal(apr.inicio_previsto),
    fim_previsto: toDatetimeLocal(apr.fim_previsto),
    observacoes: apr.observacoes || ''
  };
}

function mapApt(apt) {
  return {
    id: apt.id,
    codigo: apt.codigo || '',
    apr_id: apt.apr_id || '',
    os_id: apt.os_id || '',
    ebap_id: apt.ebap_id || '',
    atividade: apt.atividade || '',
    local_atividade: apt.local_atividade || '',
    equipe: apt.equipe || '',
    riscos: apt.riscos || '',
    medidas_controle: apt.medidas_controle || '',
    epis_obrigatorios: apt.epis_obrigatorios || '',
    responsavel_id: apt.responsavel_id || '',
    autorizador_id: apt.autorizador_id || '',
    status: apt.status || 'rascunho',
    inicio_previsto: toDatetimeLocal(apt.inicio_previsto),
    fim_previsto: toDatetimeLocal(apt.fim_previsto),
    observacoes: apt.observacoes || ''
  };
}

function mapInspecao(inspecao) {
  return {
    id: inspecao.id,
    codigo: inspecao.codigo || '',
    tipo: inspecao.tipo || '',
    os_id: inspecao.os_id || '',
    ebap_id: inspecao.ebap_id || '',
    apr_id: inspecao.apr_id || '',
    apt_id: inspecao.apt_id || '',
    responsavel_id: inspecao.responsavel_id || '',
    data_inspecao: inspecao.data_inspecao || new Date().toISOString().slice(0, 10),
    status: inspecao.status || 'aberta',
    resultado: inspecao.resultado || '',
    nao_conformidades: inspecao.nao_conformidades || '',
    recomendacoes: inspecao.recomendacoes || '',
    observacoes: inspecao.observacoes || ''
  };
}

function mapOcorrencia(ocorrencia) {
  return {
    id: ocorrencia.id,
    codigo: ocorrencia.codigo || '',
    os_id: ocorrencia.os_id || '',
    ebap_id: ocorrencia.ebap_id || '',
    apr_id: ocorrencia.apr_id || '',
    apt_id: ocorrencia.apt_id || '',
    inspecao_id: ocorrencia.inspecao_id || '',
    tipo: ocorrencia.tipo || 'observacao',
    gravidade: ocorrencia.gravidade || 'baixa',
    descricao: ocorrencia.descricao || '',
    acao_imediata: ocorrencia.acao_imediata || '',
    envolvido_id: ocorrencia.envolvido_id || '',
    ocorrido_em: toDatetimeLocal(ocorrencia.ocorrido_em),
    status: ocorrencia.status || 'aberta'
  };
}

function mapPlano(plano) {
  return {
    id: plano.id,
    codigo: plano.codigo || '',
    origem_tipo: plano.origem_tipo || 'outro',
    origem_id: plano.origem_id || '',
    os_id: plano.os_id || '',
    ebap_id: plano.ebap_id || '',
    descricao: plano.descricao || '',
    responsavel_id: plano.responsavel_id || '',
    prioridade: plano.prioridade || 'media',
    prazo: plano.prazo || '',
    status: plano.status || 'aberto',
    observacoes: plano.observacoes || ''
  };
}

export default function SST() {
  const user = useAuthStore((state) => state.user);
  const {
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
    loading,
    saving,
    error,
    carregarTudo,
    salvarEpi,
    registrarEntregaEpi,
    salvarTreinamento,
    registrarFuncionarioTreinamento,
    salvarApr,
    salvarApt,
    salvarInspecao,
    salvarOcorrencia,
    salvarPlanoAcao
  } = useSstStore();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [localError, setLocalError] = useState('');
  const [toast, setToast] = useState({ message: '', tone: 'cyan' });

  const canManage = podeGerenciarSst(user?.perfil);
  const canEditBase = podeCadastrarBaseSst(user?.perfil);

  useEffect(() => {
    carregarTudo();
  }, [carregarTudo]);

  function openModal(type, initialForm) {
    setForm(initialForm);
    setLocalError('');
    setModal(type);
  }

  function closeModal() {
    setModal(null);
    setLocalError('');
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(handler, message) {
    setLocalError('');
    try {
      await handler(form, user);
      setToast({ message, tone: 'green' });
      closeModal();
    } catch (err) {
      setLocalError(err.message || 'Nao foi possivel concluir a operacao.');
    }
  }

  const actions = (
    <>
      <button className="secondary-button" type="button" onClick={carregarTudo} disabled={loading}>
        <RefreshCcw size={17} />
        Atualizar
      </button>
      {canEditBase && (
        <>
          <button className="secondary-button" type="button" onClick={() => openModal('epi', blankEpi)}>
            <HardHat size={18} />
            Novo EPI
          </button>
          <button className="secondary-button" type="button" onClick={() => openModal('treinamento', blankTreinamento)}>
            <GraduationCap size={18} />
            Novo treinamento
          </button>
        </>
      )}
      {canManage && (
        <>
          <button className="secondary-button" type="button" onClick={() => openModal('entrega', blankEntrega)}>
            <Plus size={18} />
            Entregar EPI
          </button>
          <button className="primary-button" type="button" onClick={() => openModal('apr', blankApr)}>
            <ClipboardPlus size={18} />
            Nova APR
          </button>
          <button className="secondary-button" type="button" onClick={() => openModal('apt', blankApt)}>
            <ClipboardPlus size={18} />
            Nova APT
          </button>
          <button className="secondary-button" type="button" onClick={() => openModal('inspecao', blankInspecao)}>
            <ListChecks size={18} />
            Inspecao
          </button>
          <button className="secondary-button" type="button" onClick={() => openModal('ocorrencia', blankOcorrencia)}>
            <Siren size={18} />
            Ocorrencia
          </button>
          <button className="secondary-button" type="button" onClick={() => openModal('plano', blankPlanoAcao)}>
            <ListChecks size={18} />
            Plano
          </button>
        </>
      )}
    </>
  );

  return (
    <div className="grid gap-4">
      <PageHeader
        title="SST"
        description="Seguranca do Trabalho, EPIs, treinamentos, APR e alertas de vencimento conectados ao Supabase."
        leading={
          <span className="grid size-12 place-items-center rounded-2xl bg-navy-950/60 text-cyan-100">
            <ShieldCheck size={24} />
          </span>
        }
        actions={actions}
      />

      {(error || localError) && (
        <div className="rounded-2xl border border-red-300/30 bg-red-500/15 p-4 text-sm font-bold text-red-100">
          {localError || error}
        </div>
      )}

      <section className="glass-card rounded-3xl p-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={activeTab === tab.key ? 'primary-button min-h-10' : 'secondary-button min-h-10'}
              type="button"
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="glass-card rounded-3xl p-8 text-center text-slate-300">Carregando modulo SST...</div>
      ) : (
        <>
          {activeTab === 'dashboard' && <SstDashboard dashboard={dashboard} />}

          {activeTab === 'epis' && (
            <section className="glass-card overflow-hidden rounded-3xl p-4">
              <EpiTable epis={epis} canEdit={canEditBase} onEdit={(epi) => openModal('epi', mapEpi(epi))} />
            </section>
          )}

          {activeTab === 'entregas' && (
            <section className="glass-card rounded-3xl p-5">
              <EntregasTable entregas={entregas} />
            </section>
          )}

          {activeTab === 'treinamentos' && (
            <section className="glass-card rounded-3xl p-5">
              <TreinamentosTable treinamentos={treinamentos} canEdit={canEditBase} onEdit={(treinamento) => openModal('treinamento', mapTreinamento(treinamento))} />
            </section>
          )}

          {activeTab === 'vencimentos' && (
            <section className="glass-card rounded-3xl p-5">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-xl font-black text-white">Controle de vencimentos</h3>
                  <p className="text-sm text-slate-300">Treinamentos por funcionario, com status de validade.</p>
                </div>
                {canManage && (
                  <button className="primary-button" type="button" onClick={() => openModal('funcionarioTreinamento', blankFuncionarioTreinamento)}>
                    <GraduationCap size={18} />
                    Registrar treinamento
                  </button>
                )}
              </div>
              <FuncionarioTreinamentosTable registros={funcionarioTreinamentos} />
            </section>
          )}

          {activeTab === 'apr' && (
            <section className="glass-card rounded-3xl p-5">
              <AprTable aprs={aprs} canEdit={canManage} onEdit={(apr) => openModal('apr', mapApr(apr))} />
            </section>
          )}

          {activeTab === 'apt' && (
            <section className="glass-card rounded-3xl p-5">
              <AptTable apts={apts} canEdit={canManage} onEdit={(apt) => openModal('apt', mapApt(apt))} />
            </section>
          )}

          {activeTab === 'inspecoes' && (
            <section className="glass-card rounded-3xl p-5">
              <InspecoesTable inspecoes={inspecoes} canEdit={canManage} onEdit={(inspecao) => openModal('inspecao', mapInspecao(inspecao))} />
            </section>
          )}

          {activeTab === 'ocorrencias' && (
            <section className="glass-card rounded-3xl p-5">
              <OcorrenciasTable ocorrencias={ocorrencias} canEdit={canManage} onEdit={(ocorrencia) => openModal('ocorrencia', mapOcorrencia(ocorrencia))} />
            </section>
          )}

          {activeTab === 'planos' && (
            <section className="glass-card rounded-3xl p-5">
              <PlanosAcaoTable planos={planosAcao} canEdit={canManage} onEdit={(plano) => openModal('plano', mapPlano(plano))} />
            </section>
          )}
        </>
      )}

      <Modal open={modal === 'epi'} title={form.id ? 'Editar EPI' : 'Novo EPI'} onClose={closeModal}>
        {localError && <ErrorBox message={localError} />}
        <EpiForm form={form} saving={saving} onChange={updateForm} onSubmit={(event) => { event.preventDefault(); submit(salvarEpi, 'EPI salvo com sucesso.'); }} onCancel={closeModal} />
      </Modal>

      <Modal open={modal === 'entrega'} title="Entrega de EPI" onClose={closeModal}>
        {localError && <ErrorBox message={localError} />}
        <EntregaEpiForm form={form} epis={epis} funcionarios={funcionarios} saving={saving} onChange={updateForm} onSubmit={(event) => { event.preventDefault(); submit(registrarEntregaEpi, 'Entrega de EPI registrada.'); }} onCancel={closeModal} />
      </Modal>

      <Modal open={modal === 'treinamento'} title={form.id ? 'Editar treinamento' : 'Novo treinamento'} onClose={closeModal}>
        {localError && <ErrorBox message={localError} />}
        <TreinamentoForm form={form} saving={saving} onChange={updateForm} onSubmit={(event) => { event.preventDefault(); submit(salvarTreinamento, 'Treinamento salvo com sucesso.'); }} onCancel={closeModal} />
      </Modal>

      <Modal open={modal === 'funcionarioTreinamento'} title="Registrar treinamento do funcionario" onClose={closeModal}>
        {localError && <ErrorBox message={localError} />}
        <FuncionarioTreinamentoForm form={form} treinamentos={treinamentos} funcionarios={funcionarios} saving={saving} onChange={updateForm} onSubmit={(event) => { event.preventDefault(); submit(registrarFuncionarioTreinamento, 'Treinamento registrado.'); }} onCancel={closeModal} />
      </Modal>

      <Modal open={modal === 'apr'} title={form.id ? 'Editar APR' : 'Nova APR'} onClose={closeModal}>
        {localError && <ErrorBox message={localError} />}
        <AprForm form={form} funcionarios={funcionarios} ebaps={ebaps} ordensServico={ordensServico} saving={saving} onChange={updateForm} onSubmit={(event) => { event.preventDefault(); submit(salvarApr, 'APR salva com sucesso.'); }} onCancel={closeModal} />
      </Modal>

      <Modal open={modal === 'apt'} title={form.id ? 'Editar APT' : 'Nova APT'} onClose={closeModal}>
        {localError && <ErrorBox message={localError} />}
        <AptForm form={form} funcionarios={funcionarios} ebaps={ebaps} ordensServico={ordensServico} aprs={aprs} saving={saving} onChange={updateForm} onSubmit={(event) => { event.preventDefault(); submit(salvarApt, 'APT salva com sucesso.'); }} onCancel={closeModal} />
      </Modal>

      <Modal open={modal === 'inspecao'} title={form.id ? 'Editar inspecao' : 'Nova inspecao'} onClose={closeModal}>
        {localError && <ErrorBox message={localError} />}
        <InspecaoForm form={form} funcionarios={funcionarios} ebaps={ebaps} ordensServico={ordensServico} aprs={aprs} apts={apts} saving={saving} onChange={updateForm} onSubmit={(event) => { event.preventDefault(); submit(salvarInspecao, 'Inspecao salva com sucesso.'); }} onCancel={closeModal} />
      </Modal>

      <Modal open={modal === 'ocorrencia'} title={form.id ? 'Editar ocorrencia' : 'Nova ocorrencia'} onClose={closeModal}>
        {localError && <ErrorBox message={localError} />}
        <OcorrenciaForm form={form} funcionarios={funcionarios} ebaps={ebaps} ordensServico={ordensServico} aprs={aprs} apts={apts} inspecoes={inspecoes} saving={saving} onChange={updateForm} onSubmit={(event) => { event.preventDefault(); submit(salvarOcorrencia, 'Ocorrencia salva com sucesso.'); }} onCancel={closeModal} />
      </Modal>

      <Modal open={modal === 'plano'} title={form.id ? 'Editar plano de acao' : 'Novo plano de acao'} onClose={closeModal}>
        {localError && <ErrorBox message={localError} />}
        <PlanoAcaoForm form={form} funcionarios={funcionarios} ebaps={ebaps} ordensServico={ordensServico} saving={saving} onChange={updateForm} onSubmit={(event) => { event.preventDefault(); submit(salvarPlanoAcao, 'Plano de acao salvo com sucesso.'); }} onCancel={closeModal} />
      </Modal>

      <Toast message={toast.message} tone={toast.tone} onClose={() => setToast({ message: '', tone: 'cyan' })} />
    </div>
  );
}

function ErrorBox({ message }) {
  return <div className="mb-4 rounded-2xl border border-red-300/30 bg-red-500/15 p-3 text-sm font-bold text-red-100">{message}</div>;
}
