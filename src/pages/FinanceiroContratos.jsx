import { useEffect, useMemo, useState } from 'react';
import { FileSpreadsheet, Landmark, Plus, RefreshCcw, WalletCards } from 'lucide-react';
import FinanceiroApprovalModal from '../components/financeiro/FinanceiroApprovalModal.jsx';
import FinanceiroDashboard from '../components/financeiro/FinanceiroDashboard.jsx';
import FinanceiroDocuments from '../components/financeiro/FinanceiroDocuments.jsx';
import FinanceiroFilters from '../components/financeiro/FinanceiroFilters.jsx';
import {
  blankContrato,
  blankLancamento,
  blankMedicao,
  ContratoForm,
  LancamentoForm,
  mapContratoToForm,
  mapLancamentoToForm,
  mapMedicaoToForm,
  MedicaoForm
} from '../components/financeiro/FinanceiroForms.jsx';
import { ContratosTable, LancamentosTable, MediçõesTable } from '../components/financeiro/FinanceiroTables.jsx';
import FinanceiroTimeline from '../components/financeiro/FinanceiroTimeline.jsx';
import FinanceiroUploadModal from '../components/financeiro/FinanceiroUploadModal.jsx';
import Modal from '../components/ui/Modal.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Toast from '../components/ui/Toast.jsx';
import { podeAprovarFinanceiro, podeGerenciarFinanceiro } from '../services/financeiroService.js';
import { useAuthStore } from '../store/authStore.js';
import { useFinanceiroStore } from '../store/financeiroStore.js';

const tabs = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'contratos', label: 'Contratos' },
  { key: 'medições', label: 'Medições' },
  { key: 'lancamentos', label: 'Lançamentos' },
  { key: 'documentos', label: 'Documentos' },
  { key: 'historico', label: 'Histórico' }
];

export default function FinanceiroContratos() {
  const user = useAuthStore((state) => state.user);
  const {
    dashboard,
    contratos,
    medições,
    lancamentos,
    documentos,
    historico,
    fornecedores,
    ebaps,
    usuarios,
    filters,
    loading,
    saving,
    error,
    setFilters,
    resetFilters,
    carregarTudo,
    salvarContrato,
    salvarMedicao,
    salvarLancamento,
    aprovar,
    excluir,
    uploadDocumento,
    abrirDocumento
  } = useFinanceiroStore();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [modal, setModal] = useState({ type: null, entidadeTipo: null, row: null });
  const [contratoForm, setContratoForm] = useState(blankContrato);
  const [medicaoForm, setMedicaoForm] = useState(blankMedicao);
  const [lancamentoForm, setLancamentoForm] = useState(blankLancamento);
  const [approvalForm, setApprovalForm] = useState({ status_novo: '', prefeitura_status: '', motivo: '' });
  const [uploadFile, setUploadFile] = useState(null);
  const [localError, setLocalError] = useState('');
  const [toast, setToast] = useState({ message: '', tone: 'cyan' });

  const canManage = podeGerenciarFinanceiro(user?.perfil);
  const canApprove = podeAprovarFinanceiro(user?.perfil);
  const modalTitle = useMemo(() => {
    if (modal.type === 'contrato') return contratoForm.id ? 'Editar contrato' : 'Novo contrato';
    if (modal.type === 'medicao') return medicaoForm.id ? 'Editar medição' : 'Nova medição';
    if (modal.type === 'lancamento') return lancamentoForm.id ? 'Editar lançamento' : 'Novo lançamento';
    if (modal.type === 'aprovacao') return 'Fluxo de aprovação';
    if (modal.type === 'upload') return 'Upload de documento';
    if (modal.type === 'detalhe') return 'Rastreabilidade financeira';
    if (modal.type === 'delete') return 'Excluir registro';
    return '';
  }, [modal.type, contratoForm.id, medicaoForm.id, lancamentoForm.id]);

  useEffect(() => {
    carregarTudo();
  }, [filters, carregarTudo]);

  function closeModal() {
    setModal({ type: null, entidadeTipo: null, row: null });
    setLocalError('');
    setUploadFile(null);
    setApprovalForm({ status_novo: '', prefeitura_status: '', motivo: '' });
  }

  function openCreate(type) {
    setLocalError('');
    if (type === 'contrato') setContratoForm(blankContrato);
    if (type === 'medicao') setMedicaoForm(blankMedicao);
    if (type === 'lancamento') setLancamentoForm(blankLancamento);
    setModal({ type, entidadeTipo: type, row: null });
  }

  function openEdit(type, row) {
    setLocalError('');
    if (type === 'contrato') setContratoForm(mapContratoToForm(row));
    if (type === 'medicao') setMedicaoForm(mapMedicaoToForm(row));
    if (type === 'lancamento') setLancamentoForm(mapLancamentoToForm(row));
    setModal({ type, entidadeTipo: type, row });
  }

  function openApproval(type, row) {
    setLocalError('');
    setApprovalForm({ status_novo: '', prefeitura_status: '', motivo: '' });
    setModal({ type: 'aprovacao', entidadeTipo: type, row });
  }

  function openUpload(type, row) {
    setLocalError('');
    setUploadFile(null);
    setModal({ type: 'upload', entidadeTipo: type, row });
  }

  function openView(type, row) {
    setModal({ type: 'detalhe', entidadeTipo: type, row });
  }

  function openDelete(type, row) {
    setApprovalForm({ motivo: '' });
    setModal({ type: 'delete', entidadeTipo: type, row });
  }

  async function handleContrato(event) {
    event.preventDefault();
    try {
      await salvarContrato(contratoForm, user);
      setToast({ message: 'Contrato salvo.', tone: 'green' });
      closeModal();
      setActiveTab('contratos');
    } catch (err) {
      setLocalError(err.message || 'Não foi possível salvar o contrato.');
    }
  }

  async function handleMedicao(event) {
    event.preventDefault();
    try {
      await salvarMedicao(medicaoForm, user);
      setToast({ message: 'Medição salva.', tone: 'green' });
      closeModal();
      setActiveTab('medições');
    } catch (err) {
      setLocalError(err.message || 'Não foi possível salvar a medição.');
    }
  }

  async function handleLancamento(event) {
    event.preventDefault();
    try {
      await salvarLancamento(lancamentoForm, user);
      setToast({ message: 'Lançamento salvo.', tone: 'green' });
      closeModal();
      setActiveTab('lancamentos');
    } catch (err) {
      setLocalError(err.message || 'Não foi possível salvar o lançamento.');
    }
  }

  async function handleApproval(event) {
    event.preventDefault();
    try {
      await aprovar({
        id: modal.row.id,
        entidade_tipo: modal.entidadeTipo,
        status_novo: approvalForm.status_novo,
        prefeitura_status: approvalForm.prefeitura_status,
        motivo: approvalForm.motivo
      }, user);
      setToast({ message: 'Aprovação registrada.', tone: 'green' });
      closeModal();
    } catch (err) {
      setLocalError(err.message || 'Não foi possível registrar aprovação.');
    }
  }

  async function handleUpload(event) {
    event.preventDefault();
    try {
      await uploadDocumento({
        entidade_tipo: modal.entidadeTipo,
        entidade_id: modal.row.id,
        file: uploadFile
      }, user);
      setToast({ message: 'Documento enviado.', tone: 'green' });
      closeModal();
      setActiveTab('documentos');
    } catch (err) {
      setLocalError(err.message || 'Não foi possível enviar o documento.');
    }
  }

  async function handleDelete(event) {
    event.preventDefault();
    try {
      await excluir({
        entidade_tipo: modal.entidadeTipo,
        id: modal.row.id,
        motivo: approvalForm.motivo
      }, user);
      setToast({ message: 'Registro removido.', tone: 'orange' });
      closeModal();
    } catch (err) {
      setLocalError(err.message || 'Não foi possível excluir.');
    }
  }

  async function handleOpenDocument(documento) {
    try {
      const url = await abrirDocumento(documento);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setLocalError(err.message || 'Não foi possível abrir o documento.');
    }
  }

  return (
    <div className="grid gap-4">
      <PageHeader
        title="Financeiro, Contratos e Medições"
        description="Gestão contratual, medições, fiscalização da Prefeitura, lançamentos, documentos e aprovações."
        leading={<span className="grid size-12 place-items-center rounded-2xl bg-navy-950/60 text-cyan-100"><WalletCards size={24} /></span>}
        actions={
          <>
            <button className="secondary-button" type="button" onClick={carregarTudo} disabled={loading}>
              <RefreshCcw size={17} />
              Atualizar
            </button>
            {canManage && (
              <>
                <button className="secondary-button" type="button" onClick={() => openCreate('medicao')}>
                  <FileSpreadsheet size={18} />
                  Nova medição
                </button>
                <button className="secondary-button" type="button" onClick={() => openCreate('lancamento')}>
                  <Plus size={18} />
                  Lançamento
                </button>
                <button className="primary-button" type="button" onClick={() => openCreate('contrato')}>
                  <Landmark size={18} />
                  Novo contrato
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

      {activeTab === 'dashboard' && <FinanceiroDashboard dashboard={dashboard} />}

      {['contratos', 'medições', 'lancamentos'].includes(activeTab) && (
        <FinanceiroFilters
          activeTab={activeTab}
          filters={filters}
          fornecedores={fornecedores}
          ebaps={ebaps}
          contratos={contratos}
          onChange={setFilters}
          onReset={resetFilters}
        />
      )}

      {activeTab === 'contratos' && (
        <ContratosTable
          contratos={contratos}
          loading={loading}
          canManage={canManage}
          canApprove={canApprove}
          onEdit={(row) => openEdit('contrato', row)}
          onApprove={openApproval}
          onDelete={openDelete}
          onUpload={openUpload}
          onView={openView}
        />
      )}

      {activeTab === 'medições' && (
        <MediçõesTable
          medições={medições}
          loading={loading}
          canManage={canManage}
          canApprove={canApprove}
          onEdit={(row) => openEdit('medicao', row)}
          onApprove={openApproval}
          onDelete={openDelete}
          onUpload={openUpload}
          onView={openView}
        />
      )}

      {activeTab === 'lancamentos' && (
        <LancamentosTable
          lancamentos={lancamentos}
          loading={loading}
          canManage={canManage}
          canApprove={canApprove}
          onEdit={(row) => openEdit('lancamento', row)}
          onApprove={openApproval}
          onDelete={openDelete}
          onUpload={openUpload}
          onView={openView}
        />
      )}

      {activeTab === 'documentos' && <FinanceiroDocuments documentos={documentos} onOpen={handleOpenDocument} />}
      {activeTab === 'historico' && <FinanceiroTimeline historico={historico} />}

      <Modal open={modal.type === 'contrato'} title={modalTitle} onClose={closeModal}>
        {localError && <ErrorBox message={localError} />}
        <ContratoForm
          form={contratoForm}
          fornecedores={fornecedores}
          ebaps={ebaps}
          usuarios={usuarios}
          saving={saving}
          onChange={(field, value) => setContratoForm((current) => ({ ...current, [field]: value }))}
          onSubmit={handleContrato}
          onCancel={closeModal}
        />
      </Modal>

      <Modal open={modal.type === 'medicao'} title={modalTitle} onClose={closeModal}>
        {localError && <ErrorBox message={localError} />}
        <MedicaoForm
          form={medicaoForm}
          contratos={contratos}
          ebaps={ebaps}
          usuarios={usuarios}
          saving={saving}
          onChange={(field, value) => setMedicaoForm((current) => ({ ...current, [field]: value }))}
          onSubmit={handleMedicao}
          onCancel={closeModal}
        />
      </Modal>

      <Modal open={modal.type === 'lancamento'} title={modalTitle} onClose={closeModal}>
        {localError && <ErrorBox message={localError} />}
        <LancamentoForm
          form={lancamentoForm}
          contratos={contratos}
          medições={medições}
          fornecedores={fornecedores}
          ebaps={ebaps}
          saving={saving}
          onChange={(field, value) => setLancamentoForm((current) => ({ ...current, [field]: value }))}
          onSubmit={handleLancamento}
          onCancel={closeModal}
        />
      </Modal>

      <Modal open={modal.type === 'aprovacao'} title={modalTitle} onClose={closeModal}>
        {localError && <ErrorBox message={localError} />}
        <FinanceiroApprovalModal
          form={approvalForm}
          entidadeTipo={modal.entidadeTipo}
          saving={saving}
          onChange={(field, value) => setApprovalForm((current) => ({ ...current, [field]: value }))}
          onSubmit={handleApproval}
          onCancel={closeModal}
        />
      </Modal>

      <Modal open={modal.type === 'upload'} title={modalTitle} onClose={closeModal}>
        {localError && <ErrorBox message={localError} />}
        <FinanceiroUploadModal file={uploadFile} saving={saving} onFile={setUploadFile} onSubmit={handleUpload} onCancel={closeModal} />
      </Modal>

      <Modal open={modal.type === 'detalhe'} title={modalTitle} onClose={closeModal}>
        <FinanceiroTimeline historico={historico} entidadeTipo={modal.entidadeTipo} entidadeId={modal.row?.id} />
      </Modal>

      <Modal open={modal.type === 'delete'} title={modalTitle} onClose={closeModal}>
        {localError && <ErrorBox message={localError} />}
        <form className="grid gap-4" onSubmit={handleDelete}>
          <div className="rounded-2xl border border-red-300/25 bg-red-500/10 p-4 text-sm text-red-100">
            Esta ação remove o registro da operação por soft delete, mantendo rastreabilidade e auditoria.
          </div>
          <label className="field-label">
            Motivo
            <textarea className="form-control min-h-24 py-3" value={approvalForm.motivo || ''} onChange={(event) => setApprovalForm((current) => ({ ...current, motivo: event.target.value }))} />
          </label>
          <div className="flex justify-end gap-2">
            <button className="secondary-button" type="button" onClick={closeModal}>Cancelar</button>
            <button className="primary-button bg-red-600 hover:bg-red-500" type="submit" disabled={saving}>{saving ? 'Excluindo...' : 'Excluir'}</button>
          </div>
        </form>
      </Modal>

      <Toast message={toast.message} tone={toast.tone} onClose={() => setToast({ message: '', tone: 'cyan' })} />
    </div>
  );
}

function ErrorBox({ message }) {
  return <div className="mb-4 rounded-2xl border border-red-300/30 bg-red-500/15 p-3 text-sm font-bold text-red-100">{message}</div>;
}
