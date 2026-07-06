import { useEffect, useMemo, useState } from 'react';
import { PackagePlus, RefreshCcw, Repeat, Warehouse } from 'lucide-react';
import AlmoxDashboard from '../components/almoxarifado/AlmoxDashboard.jsx';
import AlmoxFilters from '../components/almoxarifado/AlmoxFilters.jsx';
import AlmoxItemForm, { blankAlmoxItem } from '../components/almoxarifado/AlmoxItemForm.jsx';
import AlmoxItemsTable from '../components/almoxarifado/AlmoxItemsTable.jsx';
import AlmoxMovementForm, { blankAlmoxMovement } from '../components/almoxarifado/AlmoxMovementForm.jsx';
import AlmoxMovementHistory from '../components/almoxarifado/AlmoxMovementHistory.jsx';
import Modal from '../components/ui/Modal.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Toast from '../components/ui/Toast.jsx';
import { podeGerenciarAlmoxarifado } from '../services/almoxarifadoService.js';
import { useAlmoxarifadoStore } from '../store/almoxarifadoStore.js';
import { useAuthStore } from '../store/authStore.js';

function mapItemToForm(item) {
  return {
    id: item.id,
    codigo: item.codigo || '',
    nome: item.nome || '',
    categoria: item.categoria || '',
    unidade: item.unidade || 'un',
    local_id: item.local_id || '',
    estoque_minimo: item.estoque_minimo ?? 0,
    custo_medio: item.custo_medio ?? '',
    controlado: Boolean(item.controlado),
    ativo: item.ativo !== false
  };
}

export default function Almoxarifado() {
  const user = useAuthStore((state) => state.user);
  const {
    itens,
    itensMovimentacao,
    locais,
    categorias,
    movimentacoes,
    dashboard,
    count,
    filters,
    loading,
    saving,
    error,
    setFilters,
    resetFilters,
    carregarTudo,
    salvarItem,
    desativarItem,
    registrarMovimentacao
  } = useAlmoxarifadoStore();

  const [modal, setModal] = useState({ type: null, item: null });
  const [itemForm, setItemForm] = useState(blankAlmoxItem);
  const [movementForm, setMovementForm] = useState(blankAlmoxMovement);
  const [localError, setLocalError] = useState('');
  const [toast, setToast] = useState({ message: '', tone: 'cyan' });

  const canManage = podeGerenciarAlmoxarifado(user?.perfil);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / filters.pageSize)), [count, filters.pageSize]);

  useEffect(() => {
    carregarTudo();
  }, [filters, carregarTudo]);

  function openCreateItem() {
    setItemForm(blankAlmoxItem);
    setLocalError('');
    setModal({ type: 'item', item: null });
  }

  function openEditItem(item) {
    setItemForm(mapItemToForm(item));
    setLocalError('');
    setModal({ type: 'item', item });
  }

  function openMovement(item = null, tipo = 'entrada') {
    setMovementForm({
      ...blankAlmoxMovement,
      item_id: item?.id || '',
      tipo
    });
    setLocalError('');
    setModal({ type: 'movement', item });
  }

  function closeModal() {
    setModal({ type: null, item: null });
    setLocalError('');
  }

  function updateItemForm(field, value) {
    setItemForm((current) => ({ ...current, [field]: value }));
  }

  function updateMovementForm(field, value) {
    setMovementForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSaveItem(event) {
    event.preventDefault();
    setLocalError('');

    try {
      await salvarItem(itemForm, user);
      setToast({ message: itemForm.id ? 'Item atualizado com sucesso.' : 'Item cadastrado com sucesso.', tone: 'green' });
      closeModal();
    } catch (err) {
      setLocalError(err.message || 'Não foi possível salvar o item.');
    }
  }

  async function handleMovement(event) {
    event.preventDefault();
    setLocalError('');

    try {
      await registrarMovimentacao(movementForm, user);
      setToast({ message: 'Movimentacao registrada com sucesso.', tone: 'green' });
      closeModal();
    } catch (err) {
      setLocalError(err.message || 'Não foi possível registrar a movimentação.');
    }
  }

  async function handleDelete(item) {
    const confirmed = window.confirm(`Desativar o item ${item.codigo} - ${item.nome}?`);
    if (!confirmed) return;

    try {
      await desativarItem(item.id, user);
      setToast({ message: 'Item desativado.', tone: 'orange' });
    } catch (err) {
      setLocalError(err.message || 'Não foi possível desativar o item.');
    }
  }

  function changePage(page) {
    setFilters({ page });
  }

  return (
    <div className="grid gap-4">
      <PageHeader
        title="Almoxarifado"
        description="Controle de materiais, estoque mínimo, entradas, saídas e histórico de movimentações conectado ao Supabase."
        leading={
          <span className="grid size-12 place-items-center rounded-2xl bg-navy-950/60 text-cyan-100">
            <Warehouse size={24} />
          </span>
        }
        actions={
          <>
            <button className="secondary-button" type="button" onClick={carregarTudo} disabled={loading}>
              <RefreshCcw size={17} />
              Atualizar
            </button>
            {canManage && (
              <>
                <button className="secondary-button" type="button" onClick={() => openMovement()}>
                  <Repeat size={18} />
                  Movimentar
                </button>
                <button className="primary-button" type="button" onClick={openCreateItem}>
                  <PackagePlus size={18} />
                  Novo item
                </button>
              </>
            )}
          </>
        }
      />

      {(error || localError) && (
        <div className="rounded-2xl border border-red-300/30 bg-red-500/15 p-4 text-sm font-bold text-red-100">
          {localError || error}
        </div>
      )}

      <AlmoxDashboard dashboard={dashboard} />

      <AlmoxFilters filters={filters} categorias={categorias} locais={locais} onChange={setFilters} onReset={resetFilters} />

      <AlmoxItemsTable itens={itens} loading={loading} canManage={canManage} onEdit={openEditItem} onMove={openMovement} onDelete={handleDelete} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm font-bold text-slate-300">
          Pagina {filters.page} de {totalPages} - {count} item(ns)
        </span>
        <div className="flex gap-2">
          <button className="secondary-button" type="button" disabled={filters.page <= 1} onClick={() => changePage(filters.page - 1)}>
            Anterior
          </button>
          <button className="secondary-button" type="button" disabled={filters.page >= totalPages} onClick={() => changePage(filters.page + 1)}>
            Proxima
          </button>
        </div>
      </div>

      <AlmoxMovementHistory movimentacoes={movimentacoes} />

      <Modal open={modal.type === 'item'} title={itemForm.id ? 'Editar item' : 'Novo item'} onClose={closeModal}>
        {localError && <div className="mb-4 rounded-2xl border border-red-300/30 bg-red-500/15 p-3 text-sm font-bold text-red-100">{localError}</div>}
        <AlmoxItemForm form={itemForm} locais={locais} saving={saving} onChange={updateItemForm} onSubmit={handleSaveItem} onCancel={closeModal} />
      </Modal>

      <Modal open={modal.type === 'movement'} title="Movimentar estoque" onClose={closeModal}>
        {localError && <div className="mb-4 rounded-2xl border border-red-300/30 bg-red-500/15 p-3 text-sm font-bold text-red-100">{localError}</div>}
        <AlmoxMovementForm
          form={movementForm}
          itens={itensMovimentacao}
          saving={saving}
          onChange={updateMovementForm}
          onSubmit={handleMovement}
          onCancel={closeModal}
        />
      </Modal>

      <Toast message={toast.message} tone={toast.tone} onClose={() => setToast({ message: '', tone: 'cyan' })} />
    </div>
  );
}
