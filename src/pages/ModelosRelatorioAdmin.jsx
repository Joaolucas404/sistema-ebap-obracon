import { useEffect, useMemo, useState } from 'react';
import { Copy, FileCog, ListChecks, Plus, RefreshCcw, Search, Trash2 } from 'lucide-react';
import Modal from '../components/ui/Modal.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Toast from '../components/ui/Toast.jsx';
import { useAuthStore } from '../store/authStore.js';
import {
  duplicarModeloAdmin,
  excluirModeloAdmin,
  listarModelosAdmin,
  MODELO_AREAS,
  MODELO_PAGE_SIZE,
  MODELO_TIPOS_EQUIPAMENTO,
  MODELO_TIPOS_MANUTENCAO,
  obterContadoresModelos,
  podeAdministrarModelo,
  salvarModeloAdmin
} from '../services/modelosRelatorioAdminService.js';

const blank = {
  id: null,
  codigo: '',
  titulo: '',
  area: 'mecanica',
  tipo_manutencao: 'preventiva',
  equipamento_tipo: 'Bomba',
  resumo: '',
  checklist: '',
  ativo: true
};

function label(list, value) {
  return list.find((item) => item.value === value)?.label || value || '-';
}

function titleCase(value) {
  return String(value || '-').replaceAll('_', ' ').replace(/^./, (char) => char.toUpperCase());
}

function mapModelo(modelo) {
  return {
    id: modelo.id,
    codigo: modelo.codigo || '',
    titulo: modelo.titulo || '',
    area: modelo.area || 'mecanica',
    tipo_manutencao: modelo.tipo_manutencao || 'preventiva',
    equipamento_tipo: modelo.equipamento_tipo || 'Bomba',
    resumo: modelo.resumo || '',
    checklist: (modelo.campos || []).filter((campo) => campo.grupo === 'checklist').map((campo) => campo.label).join('\n'),
    ativo: modelo.ativo !== false
  };
}

function pageNumbers(totalPages, currentPage) {
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, start + 4);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export default function ModelosRelatorioAdmin() {
  const user = useAuthStore((state) => state.user);
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [counters, setCounters] = useState({ total: 0, byTipo: {} });
  const [filters, setFilters] = useState({ search: '', area: '', tipoManutencao: '', equipamentoTipo: '', page: 1, pageSize: MODELO_PAGE_SIZE });
  const [form, setForm] = useState(blank);
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ message: '', tone: 'cyan' });
  const canManage = podeAdministrarModelo(user);
  const totalPages = Math.max(1, Math.ceil(count / filters.pageSize));
  const filteredAreas = useMemo(() => {
    if (user?.perfil === 'supervisor') {
      const area = user.area_supervisao || user.area_operacional;
      return MODELO_AREAS.filter((item) => item.value === area);
    }
    return MODELO_AREAS;
  }, [user]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [lista, contadores] = await Promise.all([
        listarModelosAdmin(user, filters),
        obterContadoresModelos(user, filters)
      ]);
      setItems(lista.data);
      setCount(lista.count);
      setCounters(contadores);
    } catch (err) {
      setError(err.message || 'Falha ao carregar modelos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [filters.area, filters.tipoManutencao, filters.equipamentoTipo, filters.page]);

  function openCreate() {
    const area = filteredAreas[0]?.value || 'mecanica';
    setForm({ ...blank, area });
    setModal(true);
  }

  function openEdit(modelo) {
    setForm(mapModelo(modelo));
    setModal(true);
  }

  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function setFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value, page: 1 }));
  }

  async function handleSearch(event) {
    event.preventDefault();
    setFilters((current) => ({ ...current, page: 1 }));
    await load();
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await salvarModeloAdmin(form, user);
      setToast({ message: 'Modelo de relatório salvo.', tone: 'green' });
      setModal(false);
      await load();
    } catch (err) {
      setError(err.message || 'Falha ao salvar modelo.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDuplicate(modelo) {
    setSaving(true);
    setError('');
    try {
      await duplicarModeloAdmin(modelo, user);
      setToast({ message: 'Modelo duplicado.', tone: 'green' });
      await load();
    } catch (err) {
      setError(err.message || 'Falha ao duplicar modelo.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(modelo) {
    if (!window.confirm('Excluir o modelo ' + modelo.titulo + '?')) return;
    setSaving(true);
    setError('');
    try {
      await excluirModeloAdmin(modelo, user);
      setToast({ message: 'Modelo excluído.', tone: 'orange' });
      await load();
    } catch (err) {
      setError(err.message || 'Falha ao excluir modelo.');
    } finally {
      setSaving(false);
    }
  }

  function setPage(page) {
    setFilters((current) => ({ ...current, page }));
  }

  return (
    <div className="grid gap-4">
      <PageHeader
        title="Modelos de Relatório"
        description="Administração dos modelos técnicos utilizados nas Ordens de Serviço."
        leading={<span className="grid size-12 place-items-center rounded-2xl bg-navy-950/60 text-cyan-100"><FileCog size={24} /></span>}
        actions={<><button className="secondary-button" type="button" onClick={load} disabled={loading}><RefreshCcw size={17} />Atualizar</button>{canManage && <button className="primary-button" type="button" onClick={openCreate}><Plus size={18} />Novo modelo</button>}</>}
      />

      {error && <div className="rounded-2xl border border-red-300/30 bg-red-500/15 p-4 text-sm font-bold text-red-100">{error}</div>}

      <section className="glass-card rounded-3xl p-4">
        <form className="grid gap-3 md:grid-cols-4" onSubmit={handleSearch}>
          <label className="field-label">Pesquisa por nome
            <span className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cyan-200" size={17} /><input className="form-control pl-10" value={filters.search} onChange={(event) => setFilter('search', event.target.value)} placeholder="Nome do modelo" /></span>
          </label>
          <Select label="Área" value={filters.area} onChange={(value) => setFilter('area', value)}><option value="">Todas</option>{filteredAreas.map((area) => <option key={area.value} value={area.value}>{area.label}</option>)}</Select>
          <Select label="Tipo" value={filters.tipoManutencao} onChange={(value) => setFilter('tipoManutencao', value)}><option value="">Todos ({counters.total || 0})</option>{MODELO_TIPOS_MANUTENCAO.map((tipo) => <option key={tipo} value={tipo}>{titleCase(tipo)} ({counters.byTipo?.[tipo] || 0})</option>)}</Select>
          <Select label="Equipamento" value={filters.equipamentoTipo} onChange={(value) => setFilter('equipamentoTipo', value)}><option value="">Todos</option>{MODELO_TIPOS_EQUIPAMENTO.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}</Select>
          <button className="secondary-button md:col-span-4 md:justify-self-end" type="submit" disabled={loading}><Search size={17} />Pesquisar</button>
        </form>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {MODELO_TIPOS_MANUTENCAO.map((tipo) => (
          <button key={tipo} type="button" onClick={() => setFilter('tipoManutencao', filters.tipoManutencao === tipo ? '' : tipo)} className={(filters.tipoManutencao === tipo ? 'border-cyan-300/50 bg-cyan-400/15' : 'border-cyan-300/15 bg-navy-950/45') + ' rounded-2xl border p-4 text-left transition hover:border-cyan-300/40'}>
            <small className="font-black uppercase tracking-wide text-slate-400">{titleCase(tipo)}</small>
            <strong className="mt-1 block text-2xl font-black text-white">{counters.byTipo?.[tipo] || 0}</strong>
          </button>
        ))}
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {loading ? <div className="glass-card rounded-3xl p-8 text-center text-slate-300 md:col-span-2 xl:col-span-3">Carregando modelos...</div> : items.length ? items.map((modelo) => {
          const checklistCount = (modelo.campos || []).filter((campo) => campo.grupo === 'checklist').length;
          return (
            <article key={modelo.id} className="glass-card rounded-3xl p-5">
              <div className="flex min-h-full flex-col gap-4">
                <div>
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-cyan-400/10 text-cyan-100"><FileCog size={20} /></span>
                    <span className="rounded-full border border-cyan-300/20 px-3 py-1 text-[11px] font-black uppercase text-cyan-100">{modelo.ativo ? 'Ativo' : 'Inativo'}</span>
                  </div>
                  <h3 className="text-lg font-black text-white">{modelo.titulo}</h3>
                  <p className="mt-2 text-sm text-slate-300">{label(MODELO_AREAS, modelo.area)} • {titleCase(modelo.tipo_manutencao)} • {modelo.equipamento_tipo}</p>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-400">{modelo.resumo || 'Sem resumo.'}</p>
                </div>
                <div className="mt-auto flex items-center gap-2 rounded-2xl border border-cyan-300/15 bg-navy-950/45 p-3 text-sm font-bold text-slate-200"><ListChecks size={17} className="text-cyan-200" />{checklistCount} item(ns) de checklist</div>
                <div className="flex flex-wrap gap-2">
                  <button className="secondary-button min-h-9 px-3 text-xs" type="button" onClick={() => openEdit(modelo)}>Editar</button>
                  <button className="secondary-button min-h-9 px-3 text-xs" type="button" onClick={() => handleDuplicate(modelo)} disabled={saving}><Copy size={15} />Duplicar</button>
                  <button className="danger-button min-h-9 px-3 text-xs" type="button" onClick={() => handleDelete(modelo)} disabled={saving}><Trash2 size={15} />Excluir</button>
                </div>
              </div>
            </article>
          );
        }) : <div className="glass-card rounded-3xl p-8 text-center text-slate-300 md:col-span-2 xl:col-span-3">Nenhum modelo encontrado.</div>}
      </section>

      <Pagination page={filters.page} totalPages={totalPages} onPage={setPage} count={count} />

      <Modal open={modal} title={form.id ? 'Editar modelo' : 'Novo modelo'} onClose={() => setModal(false)}>
        <form className="grid gap-4" onSubmit={handleSave}>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Nome" value={form.titulo} onChange={(value) => setField('titulo', value)} required minLength={3} />
            <Select label="Área" value={form.area} onChange={(value) => setField('area', value)} required>{filteredAreas.map((area) => <option key={area.value} value={area.value}>{area.label}</option>)}</Select>
            <Select label="Tipo" value={form.tipo_manutencao} onChange={(value) => setField('tipo_manutencao', value)} required>{MODELO_TIPOS_MANUTENCAO.map((tipo) => <option key={tipo} value={tipo}>{titleCase(tipo)}</option>)}</Select>
            <Select label="Equipamento" value={form.equipamento_tipo} onChange={(value) => setField('equipamento_tipo', value)} required>{MODELO_TIPOS_EQUIPAMENTO.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}</Select>
          </div>
          <Textarea label="Checklist" value={form.checklist} onChange={(value) => setField('checklist', value)} required placeholder="Um item por linha" />
          <Textarea label="Resumo" value={form.resumo} onChange={(value) => setField('resumo', value)} />
          <label className="flex items-center gap-3 rounded-2xl border border-cyan-300/15 bg-navy-950/35 p-4 text-sm font-black text-slate-100"><input className="size-4 accent-green-500" type="checkbox" checked={form.ativo !== false} onChange={(event) => setField('ativo', event.target.checked)} />Modelo ativo</label>
          <div className="flex justify-end gap-2"><button className="secondary-button" type="button" onClick={() => setModal(false)}>Cancelar</button><button className="primary-button" type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar modelo'}</button></div>
        </form>
      </Modal>
      <Toast message={toast.message} tone={toast.tone} onClose={() => setToast({ message: '', tone: 'cyan' })} />
    </div>
  );
}

function Pagination({ page, totalPages, onPage, count }) {
  if (totalPages <= 1) return <div className="text-sm font-bold text-slate-400">{count} modelo(s) encontrado(s)</div>;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-cyan-300/15 bg-navy-950/35 p-3">
      <span className="text-sm font-bold text-slate-300">{count} modelo(s) • Página {page} de {totalPages}</span>
      <div className="flex flex-wrap gap-2">
        <button className="secondary-button min-h-9 px-3 text-xs" type="button" disabled={page <= 1} onClick={() => onPage(page - 1)}>« Anterior</button>
        {pageNumbers(totalPages, page).map((item) => <button key={item} className={item === page ? 'primary-button min-h-9 px-3 text-xs' : 'secondary-button min-h-9 px-3 text-xs'} type="button" onClick={() => onPage(item)}>{item}</button>)}
        <button className="secondary-button min-h-9 px-3 text-xs" type="button" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Próximo »</button>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, ...props }) {
  return <label className="field-label">{label}<input className="form-control" value={value ?? ''} onChange={(event) => onChange(event.target.value)} {...props} /></label>;
}
function Select({ label, value, onChange, children, ...props }) {
  return <label className="field-label">{label}<select className="form-control" value={value ?? ''} onChange={(event) => onChange(event.target.value)} {...props}>{children}</select></label>;
}
function Textarea({ label, value, onChange, ...props }) {
  return <label className="field-label">{label}<textarea className="form-control min-h-28 resize-y py-3" value={value ?? ''} onChange={(event) => onChange(event.target.value)} {...props} /></label>;
}
