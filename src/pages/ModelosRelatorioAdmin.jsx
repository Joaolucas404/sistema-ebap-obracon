import { useEffect, useMemo, useState } from 'react';
import { FileCog, Plus, RefreshCcw, Search, Trash2 } from 'lucide-react';
import Modal from '../components/ui/Modal.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Toast from '../components/ui/Toast.jsx';
import { useAuthStore } from '../store/authStore.js';
import {
  excluirModeloAdmin,
  listarModelosAdmin,
  MODELO_AREAS,
  MODELO_TIPOS_EQUIPAMENTO,
  MODELO_TIPOS_MANUTENCAO,
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

export default function ModelosRelatorioAdmin() {
  const user = useAuthStore((state) => state.user);
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({ search: '', area: '', tipoManutencao: '', equipamentoTipo: '' });
  const [form, setForm] = useState(blank);
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ message: '', tone: 'cyan' });
  const canManage = podeAdministrarModelo(user);
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
      setItems(await listarModelosAdmin(user, filters));
    } catch (err) {
      setError(err.message || 'Falha ao carregar modelos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [filters.area, filters.tipoManutencao, filters.equipamentoTipo]);

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

  async function handleDelete(modelo) {
    if (!window.confirm('Excluir o modelo ' + modelo.titulo + '?')) return;
    setSaving(true);
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

  function setFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }));
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
        <div className="grid gap-3 md:grid-cols-4">
          <label className="field-label">Pesquisa
            <span className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cyan-200" size={17} /><input className="form-control pl-10" value={filters.search} onChange={(event) => setFilter('search', event.target.value)} onBlur={load} placeholder="Nome ou equipamento" /></span>
          </label>
          <Select label="Área" value={filters.area} onChange={(value) => setFilter('area', value)}><option value="">Todas</option>{filteredAreas.map((area) => <option key={area.value} value={area.value}>{area.label}</option>)}</Select>
          <Select label="Tipo de manutenção" value={filters.tipoManutencao} onChange={(value) => setFilter('tipoManutencao', value)}><option value="">Todos</option>{MODELO_TIPOS_MANUTENCAO.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}</Select>
          <Select label="Tipo de equipamento" value={filters.equipamentoTipo} onChange={(value) => setFilter('equipamentoTipo', value)}><option value="">Todos</option>{MODELO_TIPOS_EQUIPAMENTO.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}</Select>
        </div>
      </section>

      <section className="grid gap-3">
        {loading ? <div className="glass-card rounded-3xl p-8 text-center text-slate-300">Carregando modelos...</div> : items.length ? items.map((modelo) => (
          <article key={modelo.id} className="glass-card rounded-3xl p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <strong className="text-lg font-black text-white">{modelo.titulo}</strong>
                <p className="mt-1 text-sm text-slate-300">{label(MODELO_AREAS, modelo.area)} • {modelo.tipo_manutencao} • {modelo.equipamento_tipo}</p>
                <p className="mt-2 text-sm text-slate-400">{modelo.resumo || 'Sem resumo.'}</p>
              </div>
              <div className="flex gap-2"><button className="secondary-button" type="button" onClick={() => openEdit(modelo)}>Editar</button><button className="danger-button" type="button" onClick={() => handleDelete(modelo)} disabled={saving}><Trash2 size={17} />Excluir</button></div>
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {(modelo.campos || []).filter((campo) => campo.grupo === 'checklist').slice(0, 6).map((campo) => <span key={campo.id} className="rounded-xl border border-cyan-300/15 bg-navy-950/45 px-3 py-2 text-sm text-slate-200">{campo.label}</span>)}
            </div>
          </article>
        )) : <div className="glass-card rounded-3xl p-8 text-center text-slate-300">Nenhum modelo encontrado.</div>}
      </section>

      <Modal open={modal} title={form.id ? 'Editar modelo' : 'Novo modelo'} onClose={() => setModal(false)}>
        <form className="grid gap-4" onSubmit={handleSave}>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Nome" value={form.titulo} onChange={(value) => setField('titulo', value)} required minLength={3} />
            <Select label="Área" value={form.area} onChange={(value) => setField('area', value)} required>{filteredAreas.map((area) => <option key={area.value} value={area.value}>{area.label}</option>)}</Select>
            <Select label="Tipo de manutenção" value={form.tipo_manutencao} onChange={(value) => setField('tipo_manutencao', value)} required>{MODELO_TIPOS_MANUTENCAO.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}</Select>
            <Select label="Tipo de equipamento" value={form.equipamento_tipo} onChange={(value) => setField('equipamento_tipo', value)} required>{MODELO_TIPOS_EQUIPAMENTO.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}</Select>
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

function Input({ label, value, onChange, ...props }) {
  return <label className="field-label">{label}<input className="form-control" value={value ?? ''} onChange={(event) => onChange(event.target.value)} {...props} /></label>;
}
function Select({ label, value, onChange, children, ...props }) {
  return <label className="field-label">{label}<select className="form-control" value={value ?? ''} onChange={(event) => onChange(event.target.value)} {...props}>{children}</select></label>;
}
function Textarea({ label, value, onChange, ...props }) {
  return <label className="field-label">{label}<textarea className="form-control min-h-28 resize-y py-3" value={value ?? ''} onChange={(event) => onChange(event.target.value)} {...props} /></label>;
}
