import { useEffect, useState } from 'react';
import { CalendarDays, ClipboardCheck, Plus, RefreshCcw, Settings2, Wand2 } from 'lucide-react';
import ManutencaoCalendario from '../components/manutencao/ManutencaoCalendario.jsx';
import ManutencaoDashboard from '../components/manutencao/ManutencaoDashboard.jsx';
import ManutencaoHistorico from '../components/manutencao/ManutencaoHistorico.jsx';
import PlanoManutencaoForm, { blankPlanoManutencao, mapPlanoToForm } from '../components/manutencao/PlanoManutencaoForm.jsx';
import PlanosManutencaoTable from '../components/manutencao/PlanosManutencaoTable.jsx';
import Modal from '../components/ui/Modal.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Toast from '../components/ui/Toast.jsx';
import { podeGerenciarManutencao } from '../services/manutencaoService.js';
import { useAuthStore } from '../store/authStore.js';
import { useManutencaoStore } from '../store/manutencaoStore.js';

const tabs = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'planos', label: 'Planos' },
  { key: 'calendario', label: 'Calendario' },
  { key: 'historico', label: 'Historico' },
  { key: 'integracoes', label: 'Integracoes' }
];

export default function Manutencao() {
  const user = useAuthStore((state) => state.user);
  const {
    dashboard,
    planos,
    execucoes,
    osManutencao,
    ebaps,
    equipamentos,
    responsaveis,
    loading,
    saving,
    error,
    carregarTudo,
    salvarPlano,
    registrarExecucao,
    gerarOsVencidas
  } = useManutencaoStore();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(blankPlanoManutencao);
  const [execForm, setExecForm] = useState({});
  const [localError, setLocalError] = useState('');
  const [toast, setToast] = useState({ message: '', tone: 'cyan' });

  const canManage = podeGerenciarManutencao(user?.perfil);

  useEffect(() => {
    carregarTudo(user);
  }, [carregarTudo, user]);

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateExec(field, value) {
    setExecForm((current) => ({ ...current, [field]: value }));
  }

  function openCreate() {
    setForm(blankPlanoManutencao);
    setLocalError('');
    setModal('plano');
  }

  function openEdit(plano) {
    setForm(mapPlanoToForm(plano));
    setLocalError('');
    setModal('plano');
  }

  function openExec(plano) {
    setExecForm({
      plano_id: plano.id,
      os_id: '',
      status: 'pendente',
      data_programada: plano.proxima_execucao,
      data_execucao: '',
      checklist: Array.isArray(plano.checklist) ? plano.checklist.join('\n') : '',
      observacoes: ''
    });
    setLocalError('');
    setModal('execucao');
  }

  function closeModal() {
    setModal(null);
    setLocalError('');
  }

  async function handleSavePlano(event) {
    event.preventDefault();
    try {
      await salvarPlano(form, user);
      setToast({ message: 'Plano de manutencao salvo.', tone: 'green' });
      closeModal();
    } catch (err) {
      setLocalError(err.message || 'Nao foi possivel salvar o plano.');
    }
  }

  async function handleExec(event) {
    event.preventDefault();
    try {
      await registrarExecucao(execForm, user);
      setToast({ message: 'Execucao registrada.', tone: 'green' });
      closeModal();
    } catch (err) {
      setLocalError(err.message || 'Nao foi possivel registrar a execucao.');
    }
  }

  async function handleGerarOS() {
    try {
      const count = await gerarOsVencidas(user);
      setToast({ message: `${count} OS de manutencao gerada(s).`, tone: count ? 'green' : 'cyan' });
    } catch (err) {
      setLocalError(err.message || 'Nao foi possivel gerar OS.');
    }
  }

  return (
    <div className="grid gap-4">
      <PageHeader
        title="Manutencao"
        description="Planos preventivos, preditivos e corretivos, calendario, checklists e geracao automatica de OS."
        leading={<span className="grid size-12 place-items-center rounded-2xl bg-navy-950/60 text-cyan-100"><Settings2 size={24} /></span>}
        actions={
          <>
            <button className="secondary-button" type="button" onClick={() => carregarTudo(user)} disabled={loading}>
              <RefreshCcw size={17} />
              Atualizar
            </button>
            {canManage && (
              <>
                <button className="secondary-button" type="button" onClick={handleGerarOS} disabled={saving}>
                  <Wand2 size={18} />
                  Gerar OS vencidas
                </button>
                <button className="primary-button" type="button" onClick={openCreate}>
                  <Plus size={18} />
                  Novo plano
                </button>
              </>
            )}
          </>
        }
      />

      {(error || localError) && <div className="rounded-2xl border border-red-300/30 bg-red-500/15 p-4 text-sm font-bold text-red-100">{localError || error}</div>}

      <section className="glass-card rounded-3xl p-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button key={tab.key} className={activeTab === tab.key ? 'primary-button min-h-10' : 'secondary-button min-h-10'} type="button" onClick={() => setActiveTab(tab.key)}>
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="glass-card rounded-3xl p-8 text-center text-slate-300">Carregando manutencao...</div>
      ) : (
        <>
          {activeTab === 'dashboard' && <ManutencaoDashboard dashboard={dashboard} />}
          {activeTab === 'planos' && <PlanosManutencaoTable planos={planos} canManage={canManage} onEdit={openEdit} onExecute={openExec} />}
          {activeTab === 'calendario' && <ManutencaoCalendario osItems={osManutencao} ebaps={ebaps} user={user} />}
          {activeTab === 'historico' && <ManutencaoHistorico execucoes={execucoes} />}
          {activeTab === 'integracoes' && <Integracoes osManutencao={osManutencao} execucoes={execucoes} />}
        </>
      )}

      <Modal open={modal === 'plano'} title={form.id ? 'Editar plano de manutencao' : 'Novo plano de manutencao'} onClose={closeModal}>
        {localError && <ErrorBox message={localError} />}
        <PlanoManutencaoForm form={form} ebaps={ebaps} equipamentos={equipamentos} saving={saving} onChange={updateForm} onSubmit={handleSavePlano} onCancel={closeModal} />
      </Modal>

      <Modal open={modal === 'execucao'} title="Registrar execucao de manutencao" onClose={closeModal}>
        {localError && <ErrorBox message={localError} />}
        <form className="grid gap-4" onSubmit={handleExec}>
          <label className="field-label">
            Status
            <select className="form-control" value={execForm.status || 'pendente'} onChange={(event) => updateExec('status', event.target.value)}>
              {['pendente', 'programada', 'em_execucao', 'concluida', 'atrasada', 'cancelada'].map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}
            </select>
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="field-label">Data programada<input className="form-control" type="date" value={execForm.data_programada || ''} onChange={(event) => updateExec('data_programada', event.target.value)} /></label>
            <label className="field-label">Data executada<input className="form-control" type="date" value={execForm.data_execucao || ''} onChange={(event) => updateExec('data_execucao', event.target.value)} /></label>
          </div>
          <label className="field-label">Checklist executado<textarea className="form-control min-h-28 py-3" value={execForm.checklist || ''} onChange={(event) => updateExec('checklist', event.target.value)} /></label>
          <label className="field-label">Observacoes<textarea className="form-control min-h-24 py-3" value={execForm.observacoes || ''} onChange={(event) => updateExec('observacoes', event.target.value)} /></label>
          <div className="flex justify-end gap-2">
            <button className="secondary-button" type="button" onClick={closeModal}>Cancelar</button>
            <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Registrar'}</button>
          </div>
        </form>
      </Modal>

      <Toast message={toast.message} tone={toast.tone} onClose={() => setToast({ message: '', tone: 'cyan' })} />
    </div>
  );
}

function Integracoes({ osManutencao, execucoes }) {
  const comOs = execucoes.filter((item) => item.os_id).length;
  return (
    <section className="grid gap-4 md:grid-cols-3">
      <InfoCard icon={ClipboardCheck} title="OS" value={osManutencao.length} helper={`${comOs} execucao(oes) vinculada(s)`} />
      <InfoCard icon={CalendarDays} title="SST" value="Preparado" helper="APR/APT podem ser vinculadas pela OS" />
      <InfoCard icon={Settings2} title="Almoxarifado" value="Preparado" helper="Materiais podem ser baixados na OS" />
    </section>
  );
}

function InfoCard({ icon: Icon, title, value, helper }) {
  return (
    <div className="glass-card rounded-3xl p-5">
      <div className="flex items-center gap-3">
        <span className="grid size-12 place-items-center rounded-2xl bg-navy-950/60 text-cyan-100"><Icon size={22} /></span>
        <div>
          <small className="font-black uppercase tracking-wide text-slate-400">{title}</small>
          <strong className="block text-2xl font-black text-white">{value}</strong>
          <p className="text-sm text-slate-300">{helper}</p>
        </div>
      </div>
    </div>
  );
}

function ErrorBox({ message }) {
  return <div className="mb-4 rounded-2xl border border-red-300/30 bg-red-500/15 p-3 text-sm font-bold text-red-100">{message}</div>;
}
