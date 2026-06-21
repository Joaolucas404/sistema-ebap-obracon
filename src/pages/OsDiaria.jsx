import { useEffect, useState } from 'react';
import { ClipboardList, RefreshCcw } from 'lucide-react';
import OsDiariaCard from '../components/os-diaria/OsDiariaCard.jsx';
import OsDiariaDashboard from '../components/os-diaria/OsDiariaDashboard.jsx';
import OsDiariaDetail from '../components/os-diaria/OsDiariaDetail.jsx';
import OsDiariaExecucaoModal from '../components/os-diaria/OsDiariaExecucaoModal.jsx';
import OsDiariaFilters from '../components/os-diaria/OsDiariaFilters.jsx';
import Modal from '../components/ui/Modal.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Toast from '../components/ui/Toast.jsx';
import {
  buscarDetalheOsDiaria,
  CHECKLIST_OS_DIARIA,
  listarItensAlmoxOsDiaria,
  listarOsDiarias,
  movimentarOsDiaria,
  obterDashboardOsDiarias,
  uploadFotoOsDiaria
} from '../services/osDiariaService.js';
import { useAuthStore } from '../store/authStore.js';

const defaultFilters = { periodo: 'hoje', turno: '', area: '' };
const blankExec = { checklist: [], materiais: [], observacao: '', fotos: { antes: null, durante: null, depois: null } };

export default function OsDiaria() {
  const user = useAuthStore((state) => state.user);
  const [dashboard, setDashboard] = useState(null);
  const [rows, setRows] = useState([]);
  const [itens, setItens] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [detail, setDetail] = useState(null);
  const [modal, setModal] = useState({ type: null, os: null, action: null });
  const [execForm, setExecForm] = useState(blankExec);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ message: '', tone: 'cyan' });

  async function loadAll() {
    setLoading(true);
    setError('');
    try {
      const [dash, osRows, almoxRows] = await Promise.all([
        obterDashboardOsDiarias(user),
        listarOsDiarias(filters, user),
        listarItensAlmoxOsDiaria()
      ]);
      setDashboard(dash);
      setRows(osRows);
      setItens(almoxRows);
    } catch (err) {
      setError(err.message || 'Falha ao carregar OS diarias.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, [filters, user]);

  function updateFilters(patch) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  async function openDetail(os) {
    setModal({ type: 'detail', os, action: null });
    setDetail(null);
    try {
      setDetail(await buscarDetalheOsDiaria(os.id));
    } catch (err) {
      setError(err.message || 'Falha ao carregar detalhe da OS.');
    }
  }

  async function openAction(os, action) {
    const detailRows = await buscarDetalheOsDiaria(os.id);
    const checklist = CHECKLIST_OS_DIARIA[os.area] || CHECKLIST_OS_DIARIA.outros;
    setDetail(detailRows);
    setExecForm({
      ...blankExec,
      checklist: action === 'iniciar' ? checklist : (os.payload?.execucao_diaria?.checklist || [])
    });
    setModal({ type: 'execucao', os, action });
  }

  function updateExec(field, value) {
    setExecForm((current) => ({ ...current, [field]: value }));
  }

  function toggleChecklist(item, checked) {
    setExecForm((current) => ({
      ...current,
      checklist: checked ? [...new Set([...(current.checklist || []), item])] : (current.checklist || []).filter((row) => row !== item)
    }));
  }

  function addMaterial() {
    setExecForm((current) => ({ ...current, materiais: [...(current.materiais || []), { item_id: '', quantidade: 1 }] }));
  }

  function updateMaterial(index, field, value) {
    setExecForm((current) => ({
      ...current,
      materiais: current.materiais.map((material, itemIndex) => (itemIndex === index ? { ...material, [field]: value } : material))
    }));
  }

  function removeMaterial(index) {
    setExecForm((current) => ({ ...current, materiais: current.materiais.filter((_, itemIndex) => itemIndex !== index) }));
  }

  function updatePhoto(tipo, file) {
    setExecForm((current) => ({ ...current, fotos: { ...current.fotos, [tipo]: file } }));
  }

  async function handleExec(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const osId = modal.os.id;
      if (modal.action === 'concluir') {
        const fotos = Object.entries(execForm.fotos || {}).filter(([, file]) => Boolean(file));
        for (const [tipo, file] of fotos) {
          await uploadFotoOsDiaria(osId, file, tipo, user);
        }
      }

      await movimentarOsDiaria({
        osId,
        acao: modal.action,
        checklist: execForm.checklist,
        materiais: execForm.materiais.filter((item) => item.item_id && Number(item.quantidade) > 0),
        observacao: execForm.observacao
      }, user);

      setToast({ message: 'Acao registrada na OS diaria.', tone: 'green' });
      setModal({ type: null, os: null, action: null });
      setExecForm(blankExec);
      await loadAll();
    } catch (err) {
      setError(err.message || 'Falha ao registrar execucao.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-4">
      <PageHeader
        title="OS Diarias"
        description="Painel operacional diario para execucao tecnica, checklist, materiais, SST, fotos e rastreabilidade."
        leading={<span className="grid size-12 place-items-center rounded-2xl bg-navy-950/60 text-cyan-100"><ClipboardList size={24} /></span>}
        actions={
          <button className="secondary-button" type="button" onClick={loadAll} disabled={loading}>
            <RefreshCcw size={17} />
            Atualizar
          </button>
        }
      />

      {error && <div className="rounded-2xl border border-red-300/30 bg-red-500/15 p-4 text-sm font-bold text-red-100">{error}</div>}

      <OsDiariaDashboard dashboard={dashboard} />
      <OsDiariaFilters filters={filters} onChange={updateFilters} />

      {loading ? (
        <div className="glass-card rounded-3xl p-8 text-center text-slate-300">Carregando OS diarias...</div>
      ) : rows.length ? (
        <section className="grid gap-3">
          {rows.map((os) => (
            <OsDiariaCard key={os.id} os={os} onDetail={openDetail} onAction={openAction} />
          ))}
        </section>
      ) : (
        <div className="glass-card rounded-3xl p-8 text-center text-slate-300">Nenhuma OS diaria encontrada para os filtros selecionados.</div>
      )}

      <Modal open={modal.type === 'detail'} title="Detalhe da OS diaria" onClose={() => setModal({ type: null, os: null, action: null })}>
        <OsDiariaDetail detail={detail} />
      </Modal>

      <Modal open={modal.type === 'execucao'} title="Execucao da OS diaria" onClose={() => setModal({ type: null, os: null, action: null })}>
        <OsDiariaExecucaoModal
          os={modal.os}
          action={modal.action}
          form={execForm}
          itens={itens}
          sst={detail?.sst}
          saving={saving}
          onChange={updateExec}
          onChecklistChange={toggleChecklist}
          onMaterialChange={updateMaterial}
          onAddMaterial={addMaterial}
          onRemoveMaterial={removeMaterial}
          onPhotoChange={updatePhoto}
          onSubmit={handleExec}
          onCancel={() => setModal({ type: null, os: null, action: null })}
        />
      </Modal>

      <Toast message={toast.message} tone={toast.tone} onClose={() => setToast({ message: '', tone: 'cyan' })} />
    </div>
  );
}
