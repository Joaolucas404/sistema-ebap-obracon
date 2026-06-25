import { useEffect, useMemo, useState } from 'react';
import { Activity, Boxes, CheckCircle2, Cpu, History, Pencil, Plus, Search, Wrench, XCircle } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import KpiCard from '../components/ui/KpiCard.jsx';
import Modal from '../components/ui/Modal.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import Toast from '../components/ui/Toast.jsx';
import { OS_AREAS, areaLabel, listarEbaps } from '../services/osService.js';
import {
  alterarStatusAtivo,
  ativoStatusLabel,
  ativoStatusTone,
  ATIVO_STATUS,
  ATIVO_TIPOS,
  atualizarAtivo,
  criarAtivo,
  listarHistoricoAtivo,
  podeGerenciarAtivo
} from '../services/ativosService.js';
import { useAtivosStore } from '../store/ativosStore.js';
import { useAuthStore } from '../store/authStore.js';

const emptyForm = {
  nome_operacional: '',
  tipo: 'Bomba',
  ebap_id: '',
  area_responsavel: '',
  status_operacional: 'operando',
  fabricante: '',
  modelo: '',
  numero_serie: '',
  instalado_em: '',
  observacoes: ''
};

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('pt-BR');
}

export default function Ativos() {
  const user = useAuthStore((state) => state.user);
  const { ativos, dashboard, count, filters, page, pageSize, loading, error, setFilters, load } = useAtivosStore();
  const [ebaps, setEbaps] = useState([]);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [statusForm, setStatusForm] = useState({ status_operacional: 'operando', motivo: '' });
  const [historico, setHistorico] = useState({ status: [], os: [], relatorios: [] });
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState('');
  const [toast, setToast] = useState({ message: '', tone: 'cyan' });

  const canManage = podeGerenciarAtivo(user?.perfil);
  const supervisorArea = user?.perfil === 'supervisor' ? user.area_supervisao || user.area_operacional || '' : '';
  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / pageSize)), [count, pageSize]);

  useEffect(() => {
    listarEbaps().then(setEbaps).catch((err) => setToast({ message: err.message || 'Falha ao carregar EBAPs.', tone: 'red' }));
  }, []);

  useEffect(() => {
    if (supervisorArea && filters.area !== supervisorArea) {
      setFilters({ area: supervisorArea, page: 1 });
    }
  }, [supervisorArea, filters.area]);

  useEffect(() => {
    load();
  }, [filters]);

  async function refresh() {
    await load();
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function openCreate() {
    setSelected(null);
    setForm(emptyForm);
    setLocalError('');
    setModal('form');
  }

  function openEdit(ativo) {
    setSelected(ativo);
    setForm({
      nome_operacional: ativo.nome_operacional || '',
      tipo: ativo.tipo || 'Bomba',
      ebap_id: ativo.ebap_id || '',
      area_responsavel: ativo.area_responsavel || '',
      status_operacional: ativo.status_operacional || 'operando',
      fabricante: ativo.fabricante || '',
      modelo: ativo.modelo || '',
      numero_serie: ativo.numero_serie || '',
      instalado_em: ativo.instalado_em || '',
      observacoes: ativo.observacoes || ''
    });
    setLocalError('');
    setModal('form');
  }

  async function openHistory(ativo) {
    setSelected(ativo);
    setModal('history');
    setLocalError('');
    try {
      setHistorico(await listarHistoricoAtivo(ativo.id));
    } catch (err) {
      setLocalError(err.message || 'Falha ao carregar histórico.');
    }
  }

  function openStatus(ativo) {
    setSelected(ativo);
    setStatusForm({ status_operacional: ativo.status_operacional || 'operando', motivo: '' });
    setLocalError('');
    setModal('status');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setLocalError('');
    try {
      if (selected) {
        await atualizarAtivo(selected.id, form, user);
        setToast({ message: 'Ativo atualizado.', tone: 'green' });
      } else {
        await criarAtivo(form, user);
        setToast({ message: 'Ativo cadastrado.', tone: 'green' });
      }
      setModal(null);
      await refresh();
    } catch (err) {
      setLocalError(err.message || 'Falha ao salvar ativo.');
    } finally {
      setSaving(false);
    }
  }

  async function handleStatus(event) {
    event.preventDefault();
    setSaving(true);
    setLocalError('');
    try {
      await alterarStatusAtivo(selected.id, statusForm, user);
      setToast({ message: 'Status operacional atualizado.', tone: 'green' });
      setModal(null);
      await refresh();
    } catch (err) {
      setLocalError(err.message || 'Falha ao alterar status.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-4">
      <PageHeader
        title="Ativos Operacionais"
        description="Cadastro, status e histórico dos equipamentos vinculados a EBAPs, OS, RDO e relatórios técnicos."
        actions={
          <>
            <button className="secondary-button" type="button" onClick={refresh}>
              <Activity size={17} />
              Atualizar
            </button>
            {canManage && (
              <button className="primary-button" type="button" onClick={openCreate}>
                <Plus size={17} />
                Novo ativo
              </button>
            )}
          </>
        }
      />

      {(error || localError) && <div className="rounded-2xl border border-red-300/30 bg-red-500/15 p-4 text-sm font-bold text-red-100">{error || localError}</div>}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <KpiCard icon={Boxes} label="Total" value={loading ? '...' : dashboard?.total || 0} helper="Ativos cadastrados" />
        <KpiCard icon={CheckCircle2} label="Operando" value={loading ? '...' : dashboard?.operando || 0} helper="Sem restrição" tone="green" />
        <KpiCard icon={Activity} label="Restrição" value={loading ? '...' : dashboard?.restricao || 0} helper="Operando com alerta" tone="orange" />
        <KpiCard icon={Wrench} label="Manutenção" value={loading ? '...' : dashboard?.manutencao || 0} helper="Intervenção ativa" tone="blue" />
        <KpiCard icon={XCircle} label="Fora" value={loading ? '...' : dashboard?.foraOperacao || 0} helper="Fora de operação" tone="red" />
      </section>

      <section className="glass-card rounded-3xl p-4">
        <div className="grid gap-3 lg:grid-cols-[1.3fr_0.8fr_0.8fr_0.8fr_0.8fr]">
          <label className="field-label">
            Pesquisa
            <span className="form-control flex items-center gap-2">
              <Search size={18} className="text-cyan-100" />
              <input
                className="w-full bg-transparent outline-none"
                value={filters.search}
                onChange={(event) => setFilters({ search: event.target.value, page: 1 })}
                placeholder="Nome, código, fabricante, série..."
              />
            </span>
          </label>
          <FilterSelect label="Status" value={filters.status} onChange={(value) => setFilters({ status: value, page: 1 })}>
            {ATIVO_STATUS.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
          </FilterSelect>
          <FilterSelect label="Tipo" value={filters.tipo} onChange={(value) => setFilters({ tipo: value, page: 1 })}>
            {ATIVO_TIPOS.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
          </FilterSelect>
          <FilterSelect label="Área" value={filters.area} onChange={(value) => setFilters({ area: supervisorArea || value, page: 1 })} disabled={Boolean(supervisorArea)}>
            {OS_AREAS.map((area) => <option key={area.value} value={area.value}>{area.label}</option>)}
          </FilterSelect>
          <FilterSelect label="EBAP" value={filters.ebapId} onChange={(value) => setFilters({ ebapId: value, page: 1 })}>
            {ebaps.map((ebap) => <option key={ebap.id} value={ebap.id}>{ebap.nome}</option>)}
          </FilterSelect>
        </div>
      </section>

      <section className="glass-card overflow-hidden rounded-3xl">
        <div className="overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-cyan-300/15 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Ativo</th>
                <th className="px-4 py-3">EBAP</th>
                <th className="px-4 py-3">Área</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Fabricante/Modelo</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-300/10">
              {ativos.map((ativo) => (
                <tr key={ativo.id} className="hover:bg-cyan-300/5">
                  <td className="px-4 py-3">
                    <strong className="block text-white">{ativo.nome_operacional}</strong>
                    <span className="text-xs font-semibold text-slate-400">{ativo.tipo} {ativo.numero_serie ? `• Série ${ativo.numero_serie}` : ''}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-200">{ativo.ebap?.nome || '-'}</td>
                  <td className="px-4 py-3 text-slate-200">{areaLabel(ativo.area_responsavel)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={ativoStatusTone(ativo.status_operacional)}>{ativoStatusLabel(ativo.status_operacional)}</StatusBadge>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{[ativo.fabricante, ativo.modelo].filter(Boolean).join(' / ') || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button className="secondary-button min-h-10 px-3" type="button" onClick={() => openHistory(ativo)} title="Histórico">
                        <History size={17} />
                      </button>
                      {canManage && (
                        <>
                          <button className="secondary-button min-h-10 px-3" type="button" onClick={() => openStatus(ativo)} title="Alterar status">
                            <Activity size={17} />
                          </button>
                          <button className="secondary-button min-h-10 px-3" type="button" onClick={() => openEdit(ativo)} title="Editar">
                            <Pencil size={17} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!ativos.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm font-bold text-slate-300">
                    Nenhum ativo encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-cyan-300/10 px-4 py-3 text-sm font-bold text-slate-300">
          <span>Página {page} de {totalPages} • {count} ativo(s)</span>
          <div className="flex gap-2">
            <button className="secondary-button" type="button" disabled={page <= 1} onClick={() => setFilters({ page: page - 1 })}>Anterior</button>
            <button className="secondary-button" type="button" disabled={page >= totalPages} onClick={() => setFilters({ page: page + 1 })}>Próxima</button>
          </div>
        </div>
      </section>

      <Modal open={modal === 'form'} title={selected ? 'Editar ativo' : 'Novo ativo'} onClose={() => setModal(null)}>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nome Operacional" value={form.nome_operacional} onChange={(value) => updateForm('nome_operacional', value)} required />
            <label className="field-label">
              Tipo
              <select className="form-control" value={form.tipo} onChange={(event) => updateForm('tipo', event.target.value)} required>
                {ATIVO_TIPOS.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
              </select>
            </label>
            <label className="field-label">
              EBAP
              <select className="form-control" value={form.ebap_id} onChange={(event) => updateForm('ebap_id', event.target.value)} required>
                <option value="">Selecione...</option>
                {ebaps.map((ebap) => <option key={ebap.id} value={ebap.id}>{ebap.nome}</option>)}
              </select>
            </label>
            <label className="field-label">
              Área Responsável
              <select className="form-control" value={form.area_responsavel} onChange={(event) => updateForm('area_responsavel', event.target.value)} required>
                <option value="">Selecione...</option>
                {OS_AREAS.map((area) => <option key={area.value} value={area.value}>{area.label}</option>)}
              </select>
            </label>
            {!selected && (
              <label className="field-label">
                Status Operacional
                <select className="form-control" value={form.status_operacional} onChange={(event) => updateForm('status_operacional', event.target.value)} required>
                  {ATIVO_STATUS.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                </select>
              </label>
            )}
            <Field label="Fabricante" value={form.fabricante} onChange={(value) => updateForm('fabricante', value)} />
            <Field label="Modelo" value={form.modelo} onChange={(value) => updateForm('modelo', value)} />
            <Field label="Número de Série" value={form.numero_serie} onChange={(value) => updateForm('numero_serie', value)} />
            <Field label="Data de Instalação" type="date" value={form.instalado_em} onChange={(value) => updateForm('instalado_em', value)} />
            <label className="field-label md:col-span-2">
              Observações
              <textarea className="form-control min-h-24 py-3" value={form.observacoes} onChange={(event) => updateForm('observacoes', event.target.value)} />
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button className="secondary-button" type="button" onClick={() => setModal(null)}>Cancelar</button>
            <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar ativo'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={modal === 'status'} title="Alterar status operacional" onClose={() => setModal(null)}>
        <form className="grid gap-4" onSubmit={handleStatus}>
          <div className="rounded-2xl border border-cyan-300/15 bg-navy-950/60 p-4">
            <small className="text-xs font-black uppercase tracking-wide text-slate-400">Ativo</small>
            <strong className="mt-1 block text-white">{selected?.nome_operacional}</strong>
          </div>
          <label className="field-label">
            Novo status
            <select className="form-control" value={statusForm.status_operacional} onChange={(event) => setStatusForm((current) => ({ ...current, status_operacional: event.target.value }))}>
              {ATIVO_STATUS.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
            </select>
          </label>
          <label className="field-label">
            Motivo obrigatório
            <textarea className="form-control min-h-24 py-3" value={statusForm.motivo} onChange={(event) => setStatusForm((current) => ({ ...current, motivo: event.target.value }))} required />
          </label>
          <div className="flex justify-end gap-2">
            <button className="secondary-button" type="button" onClick={() => setModal(null)}>Cancelar</button>
            <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Registrando...' : 'Registrar status'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={modal === 'history'} title={`Histórico - ${selected?.nome_operacional || ''}`} onClose={() => setModal(null)}>
        <div className="grid gap-4">
          <HistoryBlock title="Mudanças de status" items={historico.status} render={(item) => (
            <>
              <strong className="text-white">{ativoStatusLabel(item.status_anterior)} → {ativoStatusLabel(item.status_novo)}</strong>
              <span>{item.motivo}</span>
              <small>{formatDate(item.created_at)} • {item.usuario?.nome || 'Sistema'} {item.os?.numero ? `• ${item.os.numero}` : ''}</small>
            </>
          )} />
          <HistoryBlock title="Ordens de Serviço" items={historico.os} render={(item) => (
            <>
              <strong className="text-white">{item.numero} - {item.titulo}</strong>
              <span>{item.tipo_manutencao || 'manutenção'} • {item.status}</span>
              <small>{formatDate(item.created_at)}</small>
            </>
          )} />
          <HistoryBlock title="Relatórios técnicos/RDO" items={historico.relatorios} render={(item) => (
            <>
              <strong className="text-white">{item.modelo?.titulo || item.ativo_nome || 'Relatório técnico'}</strong>
              <span>{item.tipo_manutencao || '-'} • {item.status}</span>
              <small>{formatDate(item.updated_at || item.created_at)}</small>
            </>
          )} />
        </div>
      </Modal>

      <Toast message={toast.message} tone={toast.tone} onClose={() => setToast({ message: '', tone: 'cyan' })} />
    </div>
  );
}

function FilterSelect({ label, value, onChange, children, disabled = false }) {
  return (
    <label className="field-label">
      {label}
      <select className="form-control" value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
        <option value="">Todos</option>
        {children}
      </select>
    </label>
  );
}

function Field({ label, value, onChange, type = 'text', required = false }) {
  return (
    <label className="field-label">
      {label}
      <input className="form-control" type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} />
    </label>
  );
}

function HistoryBlock({ title, items, render }) {
  return (
    <section className="rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-4">
      <h4 className="mb-3 text-sm font-black uppercase tracking-wide text-cyan-100">{title}</h4>
      <div className="grid gap-2">
        {items.map((item) => (
          <div key={item.id} className="grid gap-1 rounded-2xl bg-navy-900/70 p-3 text-sm text-slate-300">
            {render(item)}
          </div>
        ))}
        {!items.length && <span className="text-sm font-semibold text-slate-400">Nenhum registro encontrado.</span>}
      </div>
    </section>
  );
}
