import { useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, RefreshCcw } from 'lucide-react';
import CcoOsCard from '../components/cco-os/CcoOsCard.jsx';
import CcoOsDashboard from '../components/cco-os/CcoOsDashboard.jsx';
import CcoOsDetail from '../components/cco-os/CcoOsDetail.jsx';
import CcoOsFilters from '../components/cco-os/CcoOsFilters.jsx';
import CcoOsValidationModal from '../components/cco-os/CcoOsValidationModal.jsx';
import Modal from '../components/ui/Modal.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Toast from '../components/ui/Toast.jsx';
import { buscarDetalheCcoOS, listarEbapsCcoOS, listarFilaCcoOS, obterDashboardCcoOS, podeValidarCcoOS, validarCcoOS } from '../services/ccoOsService.js';
import { useAuthStore } from '../store/authStore.js';

const defaultFilters = {
  page: 1,
  pageSize: 10,
  ebapId: '',
  area: '',
  prioridade: '',
  origem: '',
  status: '',
  data: ''
};

export default function CcoAnaliseOS() {
  const user = useAuthStore((state) => state.user);
  const [dashboard, setDashboard] = useState(null);
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [ebaps, setEbaps] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState({ type: null, os: null, action: null });
  const [detail, setDetail] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [toast, setToast] = useState({ message: '', tone: 'cyan' });

  const canValidate = podeValidarCcoOS(user?.perfil);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / filters.pageSize)), [count, filters.pageSize]);

  async function loadAll() {
    setLoading(true);
    setError('');
    try {
      const [dash, fila, ebapRows] = await Promise.all([
        obterDashboardCcoOS(),
        listarFilaCcoOS(filters),
        listarEbapsCcoOS()
      ]);
      setDashboard(dash);
      setRows(fila.data);
      setCount(fila.count);
      setEbaps(ebapRows);
    } catch (err) {
      setError(err.message || 'Falha ao carregar CCO de OS.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, [filters]);

  function updateFilters(patch) {
    setFilters((current) => ({ ...current, ...patch, page: patch.page || 1 }));
  }

  function resetFilters() {
    setFilters(defaultFilters);
  }

  async function openDetail(os) {
    setError('');
    setModal({ type: 'detail', os, action: null });
    try {
      setDetail(await buscarDetalheCcoOS(os.id));
    } catch (err) {
      setError(err.message || 'Falha ao carregar detalhe da OS.');
    }
  }

  function openAction(os, action) {
    setMotivo('');
    setModal({ type: 'action', os, action });
  }

  async function handleAction(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await validarCcoOS({ osId: modal.os.id, acao: modal.action, motivo }, user);
      setToast({ message: 'Validação CCO registrada.', tone: modal.action === 'rejeitar' ? 'orange' : 'green' });
      setModal({ type: null, os: null, action: null });
      setMotivo('');
      await loadAll();
    } catch (err) {
      setError(err.message || 'Falha ao validar OS.');
    } finally {
      setSaving(false);
    }
  }

  function changePage(page) {
    updateFilters({ page });
  }

  return (
    <div className="grid gap-4">
      <PageHeader
        title="CCO - OS"
        description="Validação das Ordens de Serviço geradas pela operação antes de seguirem para Supervisor/Manutenção."
        leading={<span className="grid size-12 place-items-center rounded-2xl bg-navy-950/60 text-cyan-100"><ClipboardCheck size={24} /></span>}
        actions={
          <button className="secondary-button" type="button" onClick={loadAll} disabled={loading}>
            <RefreshCcw size={17} />
            Atualizar
          </button>
        }
      />

      {error && <div className="rounded-2xl border border-red-300/30 bg-red-500/15 p-4 text-sm font-bold text-red-100">{error}</div>}

      <CcoOsDashboard dashboard={dashboard} />
      <CcoOsFilters filters={filters} ebaps={ebaps} onChange={updateFilters} onReset={resetFilters} />

      {loading ? (
        <div className="glass-card rounded-3xl p-8 text-center text-slate-300">Carregando fila CCO...</div>
      ) : rows.length ? (
        <section className="grid gap-3">
          {rows.map((os) => (
            <CcoOsCard key={os.id} os={os} canValidate={canValidate} onDetail={openDetail} onAction={openAction} />
          ))}
        </section>
      ) : (
        <div className="glass-card rounded-3xl p-8 text-center text-slate-300">Nenhuma OS encontrada para os filtros selecionados.</div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm font-bold text-slate-300">Pagina {filters.page} de {totalPages} - {count} OS</span>
        <div className="flex gap-2">
          <button className="secondary-button" type="button" disabled={filters.page <= 1} onClick={() => changePage(filters.page - 1)}>Anterior</button>
          <button className="secondary-button" type="button" disabled={filters.page >= totalPages} onClick={() => changePage(filters.page + 1)}>Proxima</button>
        </div>
      </div>

      <Modal open={modal.type === 'detail'} title="Detalhe da OS para CCO" onClose={() => setModal({ type: null, os: null, action: null })}>
        <CcoOsDetail detail={detail} />
      </Modal>

      <Modal open={modal.type === 'action'} title="Validação CCO da OS" onClose={() => setModal({ type: null, os: null, action: null })}>
        <CcoOsValidationModal
          os={modal.os}
          action={modal.action}
          motivo={motivo}
          saving={saving}
          onMotivoChange={setMotivo}
          onConfirm={handleAction}
          onCancel={() => setModal({ type: null, os: null, action: null })}
        />
      </Modal>

      <Toast message={toast.message} tone={toast.tone} onClose={() => setToast({ message: '', tone: 'cyan' })} />
    </div>
  );
}
