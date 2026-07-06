import { useEffect, useMemo, useState } from 'react';
import { PackageCheck, Plus, RefreshCcw, ShoppingCart, Truck } from 'lucide-react';
import CompraForm, { blankCompra, blankCompraItem, mapCompraToForm } from '../components/compras/CompraForm.jsx';
import CompraTimeline from '../components/compras/CompraTimeline.jsx';
import ComprasDashboard from '../components/compras/ComprasDashboard.jsx';
import ComprasFilters from '../components/compras/ComprasFilters.jsx';
import ComprasTable from '../components/compras/ComprasTable.jsx';
import FornecedorForm, { blankFornecedor, mapFornecedorToForm } from '../components/compras/FornecedorForm.jsx';
import FornecedoresTable from '../components/compras/FornecedoresTable.jsx';
import Modal from '../components/ui/Modal.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Toast from '../components/ui/Toast.jsx';
import { podeAprovarCompras, podeGerenciarCompras } from '../services/comprasService.js';
import { useAuthStore } from '../store/authStore.js';
import { useComprasStore } from '../store/comprasStore.js';

const tabs = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'solicitacoes', label: 'Solicitacoes' },
  { key: 'fornecedores', label: 'Fornecedores' },
  { key: 'historico', label: 'Historico' }
];

export default function Compras() {
  const user = useAuthStore((state) => state.user);
  const {
    compras,
    fornecedores,
    ebaps,
    itensAlmox,
    historico,
    dashboard,
    count,
    filters,
    loading,
    saving,
    error,
    setFilters,
    resetFilters,
    carregarTudo,
    salvarSolicitacao,
    salvarFornecedor,
    mudarStatus,
    aprovar,
    receber
  } = useComprasStore();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [modal, setModal] = useState({ type: null, compra: null });
  const [compraForm, setCompraForm] = useState(blankCompra);
  const [fornecedorForm, setFornecedorForm] = useState(blankFornecedor);
  const [actionForm, setActionForm] = useState({ parecer: '', observacao: '', fornecedor_id: '' });
  const [localError, setLocalError] = useState('');
  const [toast, setToast] = useState({ message: '', tone: 'cyan' });

  const canManage = podeGerenciarCompras(user?.perfil);
  const canApprove = podeAprovarCompras(user?.perfil);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / filters.pageSize)), [count, filters.pageSize]);

  useEffect(() => {
    carregarTudo();
  }, [filters, carregarTudo]);

  function closeModal() {
    setModal({ type: null, compra: null });
    setLocalError('');
  }

  function openCompra(compra = null) {
    setCompraForm(compra ? mapCompraToForm(compra) : blankCompra);
    setLocalError('');
    setModal({ type: 'compra', compra });
  }

  function openFornecedor(fornecedor = null) {
    setFornecedorForm(fornecedor ? mapFornecedorToForm(fornecedor) : blankFornecedor);
    setLocalError('');
    setModal({ type: 'fornecedor', compra: null });
  }

  function openApproval(compra, aprovado) {
    setActionForm({ parecer: '', observacao: '', fornecedor_id: compra.fornecedor_id || '', aprovado });
    setLocalError('');
    setModal({ type: 'aprovacao', compra });
  }

  function openStatus(compra, status) {
    setActionForm({ parecer: '', observacao: '', fornecedor_id: compra.fornecedor_id || '', status });
    setLocalError('');
    setModal({ type: 'status', compra });
  }

  function openReceive(compra) {
    setActionForm({ parecer: '', observacao: '', fornecedor_id: compra.fornecedor_id || '' });
    setLocalError('');
    setModal({ type: 'recebimento', compra });
  }

  function openDetails(compra) {
    setLocalError('');
    setModal({ type: 'detalhe', compra });
  }

  function updateCompra(field, value) {
    setCompraForm((current) => ({ ...current, [field]: value }));
  }

  function updateCompraItem(index, field, value) {
    setCompraForm((current) => ({
      ...current,
      itens: current.itens.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item))
    }));
  }

  function addCompraItem() {
    setCompraForm((current) => ({ ...current, itens: [...current.itens, { ...blankCompraItem }] }));
  }

  function removeCompraItem(index) {
    setCompraForm((current) => ({ ...current, itens: current.itens.filter((_, itemIndex) => itemIndex !== index) }));
  }

  function updateFornecedor(field, value) {
    setFornecedorForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSaveCompra(event) {
    event.preventDefault();
    try {
      const saved = await salvarSolicitacao(compraForm, user);
      console.log('[Compras] solicitação salva e listagem recarregada', {
        tabela: 'compras',
        compra: saved
      });
      setToast({ message: saved?.numero ? `Solicitação de compra ${saved.numero} salva.` : 'Solicitação de compra salva.', tone: 'green' });
      closeModal();
      setActiveTab('solicitacoes');
    } catch (err) {
      setLocalError(err.message || 'Não foi possível salvar a solicitação.');
    }
  }

  async function handleSaveFornecedor(event) {
    event.preventDefault();
    try {
      await salvarFornecedor(fornecedorForm, user);
      setToast({ message: 'Fornecedor salvo.', tone: 'green' });
      closeModal();
      setActiveTab('fornecedores');
    } catch (err) {
      setLocalError(err.message || 'Não foi possível salvar o fornecedor.');
    }
  }

  async function handleStatus(event) {
    event.preventDefault();
    try {
      await mudarStatus({
        id: modal.compra.id,
        status: actionForm.status,
        descricao: actionForm.observacao,
        fornecedor_id: actionForm.fornecedor_id
      }, user);
      setToast({ message: 'Compra movimentada.', tone: 'green' });
      closeModal();
    } catch (err) {
      setLocalError(err.message || 'Não foi possível movimentar a compra.');
    }
  }

  async function handleApproval(event) {
    event.preventDefault();
    try {
      await aprovar({
        id: modal.compra.id,
        aprovado: actionForm.aprovado,
        parecer: actionForm.parecer
      }, user);
      setToast({ message: actionForm.aprovado ? 'Compra aprovada.' : 'Compra reprovada.', tone: actionForm.aprovado ? 'green' : 'orange' });
      closeModal();
    } catch (err) {
      setLocalError(err.message || 'Não foi possível registrar aprovação.');
    }
  }

  async function handleReceive(event) {
    event.preventDefault();
    try {
      await receber({ id: modal.compra.id, observacao: actionForm.observacao }, user);
      setToast({ message: 'Compra recebida e estoque atualizado.', tone: 'green' });
      closeModal();
    } catch (err) {
      setLocalError(err.message || 'Não foi possível receber a compra.');
    }
  }

  function changePage(page) {
    setFilters({ page });
  }

  return (
    <div className="grid gap-4">
      <PageHeader
        title="Compras"
        description="Solicitações, cotações, aprovação gerencial, recebimento e integração com almoxarifado."
        leading={<span className="grid size-12 place-items-center rounded-2xl bg-navy-950/60 text-cyan-100"><ShoppingCart size={24} /></span>}
        actions={
          <>
            <button className="secondary-button" type="button" onClick={carregarTudo} disabled={loading}>
              <RefreshCcw size={17} />
              Atualizar
            </button>
            {canManage && (
              <>
                <button className="secondary-button" type="button" onClick={() => openFornecedor()}>
                  <Truck size={18} />
                  Fornecedor
                </button>
                <button className="primary-button" type="button" onClick={() => openCompra()}>
                  <Plus size={18} />
                  Nova solicitacao
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

      {activeTab === 'dashboard' && <ComprasDashboard dashboard={dashboard} />}

      {activeTab === 'solicitacoes' && (
        <>
          <ComprasFilters filters={filters} ebaps={ebaps} onChange={setFilters} onReset={resetFilters} />
          <ComprasTable
            compras={compras}
            loading={loading}
            canManage={canManage}
            canApprove={canApprove}
            onEdit={openCompra}
            onStatus={openStatus}
            onApprove={openApproval}
            onReceive={openReceive}
            onView={openDetails}
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm font-bold text-slate-300">Pagina {filters.page} de {totalPages} - {count} solicitacao(oes)</span>
            <div className="flex gap-2">
              <button className="secondary-button" type="button" disabled={filters.page <= 1} onClick={() => changePage(filters.page - 1)}>Anterior</button>
              <button className="secondary-button" type="button" disabled={filters.page >= totalPages} onClick={() => changePage(filters.page + 1)}>Proxima</button>
            </div>
          </div>
        </>
      )}

      {activeTab === 'fornecedores' && <FornecedoresTable fornecedores={fornecedores} canManage={canManage} onEdit={openFornecedor} />}

      {activeTab === 'historico' && <CompraTimeline historico={historico} />}

      <Modal open={modal.type === 'compra'} title={compraForm.id ? 'Editar solicitacao' : 'Nova solicitacao de compra'} onClose={closeModal}>
        {localError && <ErrorBox message={localError} />}
        <CompraForm
          form={compraForm}
          ebaps={ebaps}
          itensAlmox={itensAlmox}
          saving={saving}
          onChange={updateCompra}
          onItemChange={updateCompraItem}
          onAddItem={addCompraItem}
          onRemoveItem={removeCompraItem}
          onSubmit={handleSaveCompra}
          onCancel={closeModal}
        />
      </Modal>

      <Modal open={modal.type === 'fornecedor'} title={fornecedorForm.id ? 'Editar fornecedor' : 'Novo fornecedor'} onClose={closeModal}>
        {localError && <ErrorBox message={localError} />}
        <FornecedorForm form={fornecedorForm} saving={saving} onChange={updateFornecedor} onSubmit={handleSaveFornecedor} onCancel={closeModal} />
      </Modal>

      <Modal open={modal.type === 'status'} title="Movimentar compra" onClose={closeModal}>
        {localError && <ErrorBox message={localError} />}
        <form className="grid gap-4" onSubmit={handleStatus}>
          {actionForm.status === 'comprada' && (
            <label className="field-label">
              Fornecedor
              <select className="form-control" value={actionForm.fornecedor_id} onChange={(event) => setActionForm((current) => ({ ...current, fornecedor_id: event.target.value }))}>
                <option value="">Não informado</option>
                {fornecedores.map((fornecedor) => <option key={fornecedor.id} value={fornecedor.id}>{fornecedor.nome}</option>)}
              </select>
            </label>
          )}
          <label className="field-label">
            Observacao
            <textarea className="form-control min-h-24 py-3" value={actionForm.observacao} onChange={(event) => setActionForm((current) => ({ ...current, observacao: event.target.value }))} />
          </label>
          <ModalActions saving={saving} onCancel={closeModal} label="Confirmar" />
        </form>
      </Modal>

      <Modal open={modal.type === 'aprovacao'} title={actionForm.aprovado ? 'Aprovar compra' : 'Reprovar compra'} onClose={closeModal}>
        {localError && <ErrorBox message={localError} />}
        <form className="grid gap-4" onSubmit={handleApproval}>
          <label className="field-label">
            Parecer {actionForm.aprovado ? '' : '(obrigatorio)'}
            <textarea className="form-control min-h-28 py-3" required={!actionForm.aprovado} value={actionForm.parecer} onChange={(event) => setActionForm((current) => ({ ...current, parecer: event.target.value }))} />
          </label>
          <ModalActions saving={saving} onCancel={closeModal} label={actionForm.aprovado ? 'Aprovar' : 'Reprovar'} />
        </form>
      </Modal>

      <Modal open={modal.type === 'recebimento'} title="Receber compra" onClose={closeModal}>
        {localError && <ErrorBox message={localError} />}
        <form className="grid gap-4" onSubmit={handleReceive}>
          <div className="rounded-2xl border border-cyan-300/15 bg-navy-950/35 p-4 text-sm text-slate-300">
            Ao confirmar, os materiais vinculados a itens do almoxarifado serao lancados como entrada de estoque.
          </div>
          <label className="field-label">
            Observacao
            <textarea className="form-control min-h-24 py-3" value={actionForm.observacao} onChange={(event) => setActionForm((current) => ({ ...current, observacao: event.target.value }))} />
          </label>
          <ModalActions saving={saving} onCancel={closeModal} label="Receber" />
        </form>
      </Modal>

      <Modal open={modal.type === 'detalhe'} title="Detalhes da compra" onClose={closeModal}>
        <CompraTimeline compra={modal.compra} />
      </Modal>

      <Toast message={toast.message} tone={toast.tone} onClose={() => setToast({ message: '', tone: 'cyan' })} />
    </div>
  );
}

function ModalActions({ saving, onCancel, label }) {
  return (
    <div className="flex justify-end gap-2">
      <button className="secondary-button" type="button" onClick={onCancel}>Cancelar</button>
      <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Salvando...' : label}</button>
    </div>
  );
}

function ErrorBox({ message }) {
  return <div className="mb-4 rounded-2xl border border-red-300/30 bg-red-500/15 p-3 text-sm font-bold text-red-100">{message}</div>;
}
