import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, CircleStop, Cog, Construction, DoorClosed, History, Layers, List, Pencil, Plus, Power, Search, Wrench, Zap } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import KpiCard from '../components/ui/KpiCard.jsx';
import Modal from '../components/ui/Modal.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import Toast from '../components/ui/Toast.jsx';
import { areaLabel, listarEbaps } from '../services/osService.js';
import {
  alterarStatusAtivo,
  ativoStatusLabel,
  ativoStatusTone,
  ATIVO_STATUS,
  ATIVO_TIPOS,
  atualizarAtivo,
  criarAtivo,
  listarHistoricoAtivo,
  normalizeAtivoStatus,
  podeGerenciarAtivo
} from '../services/ativosService.js';
import { useAtivosStore } from '../store/ativosStore.js';
import { useAuthStore } from '../store/authStore.js';

const EBAP_NAME_ALIASES = {
  'EBAP Canal do Costa': 'EBAP Canal da Costa',
  'Canal do Costa': 'Canal da Costa',
  'EBAP Foz do Costa': 'EBAP Foz da Costa',
  'Foz do Costa': 'Foz da Costa',
  'EBAP Garanhuns': 'EBAP Guaranhuns',
  Garanhuns: 'Guaranhuns',
  'EBAP Laranjas': 'EBAP Laranja',
  Laranjas: 'Laranja',
  'EBAP Marilandia': 'EBAP Marilândia',
  Marilandia: 'Marilândia',
  'EBAP Sitio Batalha': 'EBAP Sítio Batalha',
  'Sitio Batalha': 'Sítio Batalha',
  'EBAP Cobilandia': 'EBAP Cobilândia',
  Cobilandia: 'Cobilândia',
  'EBAP Comportas': 'Estação de Comportas',
  Comportas: 'Estação de Comportas'
};

const ATIVOS_AREAS = [
  { value: 'mecanica', label: 'Mecânica' },
  { value: 'eletrica', label: 'Elétrica' },
  { value: 'automacao', label: 'Automação' }
];

const TIPO_VISUAL = {
  Bomba: {
    Icon: Wrench,
    label: 'Bomba',
    plural: 'Bombas',
    className: 'border-sky-300/20 bg-sky-400/10 text-sky-200'
  },
  CCM: {
    Icon: Zap,
    label: 'CCM',
    plural: 'CCMs',
    className: 'border-amber-300/20 bg-amber-400/10 text-amber-200'
  },
  Gerador: {
    Icon: Power,
    label: 'Gerador',
    plural: 'Geradores',
    className: 'border-orange-300/20 bg-orange-400/10 text-orange-200'
  },
  Comporta: {
    Icon: DoorClosed,
    label: 'Comporta',
    plural: 'Comportas',
    className: 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200'
  },
  Rastelo: {
    Icon: Construction,
    label: 'Rastelo',
    plural: 'Rastelos',
    className: 'border-violet-300/20 bg-violet-400/10 text-violet-200'
  },
  'Comporta de Rastelo': {
    Icon: DoorClosed,
    label: 'Comporta de Rastelo',
    plural: 'Comportas de Rastelo',
    className: 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200'
  },
  'Painel Elétrico': {
    Icon: Zap,
    label: 'Painel Elétrico',
    plural: 'Painéis Elétricos',
    className: 'border-amber-300/20 bg-amber-400/10 text-amber-200'
  },
  Outros: {
    Icon: Cog,
    label: 'Outros',
    plural: 'Outros',
    className: 'border-slate-300/20 bg-slate-400/10 text-slate-200'
  }
};

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

function ebapDisplayName(ebap) {
  const value = typeof ebap === 'string' ? ebap : ebap?.nome || ebap?.nome_curto || '';
  return EBAP_NAME_ALIASES[value] || value || '-';
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('pt-BR');
}

function formatDateOnly(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('pt-BR');
}

function formatTimeOnly(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function getTipoVisual(tipo) {
  return TIPO_VISUAL[tipo] || {
    Icon: Cog,
    label: tipo || 'Outros',
    plural: tipo || 'Outros',
    className: 'border-slate-300/20 bg-slate-400/10 text-slate-200'
  };
}


function createStatusCounts() {
  return Object.fromEntries(ATIVO_STATUS.map((status) => [status.value, 0]));
}

function groupAtivosByEbap(rows) {
  const groups = new Map();

  rows.forEach((ativo) => {
    const key = ativo.ebap_id || 'sem-ebap';
    if (!groups.has(key)) {
      groups.set(key, {
        id: key,
        nome: ebapDisplayName(ativo.ebap) || 'Sem EBAP',
        total: 0,
        counts: createStatusCounts(),
        ativos: []
      });
    }

    const group = groups.get(key);
    const status = normalizeAtivoStatus(ativo.status_operacional);
    group.total += 1;
    group.counts[status] = (group.counts[status] || 0) + 1;
    group.ativos.push(ativo);
  });

  return Array.from(groups.values()).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

function groupAtivosByTipo(rows) {
  const groups = new Map();

  rows.forEach((ativo) => {
    const visual = getTipoVisual(ativo.tipo);
    const key = visual.label;
    if (!groups.has(key)) {
      groups.set(key, {
        id: key,
        tipo: visual.label,
        plural: visual.plural,
        visual,
        ativos: []
      });
    }

    groups.get(key).ativos.push(ativo);
  });

  return Array.from(groups.values()).sort((a, b) => a.plural.localeCompare(b.plural, 'pt-BR'));
}

function getEbapHealth(group) {
  if (!group.total) return 0;
  return Math.round(((group.counts.operando || 0) / group.total) * 100);
}

function getEbapCardClass(group) {
  if ((group.counts.parado || 0) > 0) return 'border-red-300/35 bg-red-500/10 shadow-red-950/20';
  if ((group.counts.atencao || 0) > 0) return 'border-amber-300/30 bg-amber-400/10 shadow-amber-950/20';
  if ((group.counts.em_manutencao || 0) > 0) return 'border-sky-300/30 bg-sky-400/10 shadow-sky-950/20';
  return 'border-emerald-300/20 bg-emerald-400/5 shadow-navy-950/20';
}

function getHealthTone(health) {
  if (health >= 90) return 'bg-emerald-300';
  if (health >= 70) return 'bg-amber-300';
  return 'bg-red-300';
}

function AssetTypeIcon({ tipo, size = 18 }) {
  const visual = getTipoVisual(tipo);
  const Icon = visual.Icon;

  return (
    <span className={['inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border', visual.className].join(' ')} aria-hidden="true">
      <Icon size={size} strokeWidth={2} />
    </span>
  );
}

function AssetIdentity({ ativo }) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <AssetTypeIcon tipo={ativo.tipo} />
      <span className="min-w-0">
        <strong className="block truncate text-white">{ativo.nome_operacional}</strong>
        <span className="block truncate text-xs font-semibold text-slate-400">{getTipoVisual(ativo.tipo).label}</span>
      </span>
    </span>
  );
}

export default function Ativos() {
  const user = useAuthStore((state) => state.user);
  const { ativos, dashboard, count, filters, page, pageSize, loading, error, setFilters, load, subscribeRealtime } = useAtivosStore();
  const [ebaps, setEbaps] = useState([]);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [statusForm, setStatusForm] = useState({ status_operacional: 'operando', motivo: '' });
  const [historico, setHistorico] = useState({ status: [], os: [], relatorios: [] });
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState('');
  const [toast, setToast] = useState({ message: '', tone: 'cyan' });
  const [viewMode, setViewMode] = useState('lista');
  const [expandedEbaps, setExpandedEbaps] = useState({});

  const canManage = podeGerenciarAtivo(user?.perfil);
  const supervisorArea = user?.perfil === 'supervisor' ? user.area_supervisao || user.area_operacional || '' : '';
  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / pageSize)), [count, pageSize]);
  const groupedAtivos = useMemo(() => groupAtivosByEbap(ativos), [ativos]);
  const ativosByTipo = useMemo(() => groupAtivosByTipo(ativos), [ativos]);

  useEffect(() => {
    listarEbaps().then(setEbaps).catch((err) => setToast({ message: err.message || 'Falha ao carregar EBAPs.', tone: 'red' }));
  }, []);

  useEffect(() => subscribeRealtime(), [subscribeRealtime]);

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

  function setOperationalView(mode) {
    setViewMode(mode);
    setFilters({ page: 1, pageSize: mode === 'cards' ? 1000 : 30 });
  }

  function toggleEbapGroup(groupId) {
    setExpandedEbaps((current) => ({ ...current, [groupId]: !current[groupId] }));
  }

  function renderActions(ativo) {
    return (
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
    );
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
      status_operacional: normalizeAtivoStatus(ativo.status_operacional),
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
    setStatusForm({ status_operacional: normalizeAtivoStatus(ativo.status_operacional), motivo: '' });
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
        <KpiCard icon={Layers} label="Total de Ativos" value={loading ? '...' : dashboard?.total || count || 0} helper="Equipamentos cadastrados" tone="cyan" />
        <KpiCard icon={CheckCircle2} label="Operando" value={loading ? '...' : dashboard?.operando || 0} helper="Equipamentos disponíveis" tone="green" />
        <KpiCard icon={AlertTriangle} label="Atenção" value={loading ? '...' : dashboard?.atencao || 0} helper="Operação com alerta" tone="yellow" />
        <KpiCard icon={CircleStop} label="Parado" value={loading ? '...' : dashboard?.parado || 0} helper="Fora de operação" tone="red" />
        <KpiCard icon={Wrench} label="Em Manutenção" value={loading ? '...' : dashboard?.manutencao || 0} helper="Intervenção ativa" tone="blue" />
      </section>

      <section className="glass-card rounded-3xl p-4">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_0.8fr]">
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
          <FilterSelect label="Área" value={filters.area} onChange={(value) => setFilters({ area: supervisorArea || value, page: 1 })} disabled={Boolean(supervisorArea)}>
            {ATIVOS_AREAS.map((area) => <option key={area.value} value={area.value}>{area.label}</option>)}
          </FilterSelect>
          <FilterSelect label="Tipo" value={filters.tipo} onChange={(value) => setFilters({ tipo: value, page: 1 })}>
            {ATIVO_TIPOS.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
          </FilterSelect>

          <FilterSelect label="EBAP" value={filters.ebapId} onChange={(value) => setFilters({ ebapId: value, page: 1 })}>
            {ebaps.map((ebap) => <option key={ebap.id} value={ebap.id}>{ebapDisplayName(ebap)}</option>)}
          </FilterSelect>
        </div>
      </section>

      <section className="glass-card rounded-3xl p-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <button className={viewMode === 'lista' ? 'primary-button' : 'secondary-button'} type="button" onClick={() => setOperationalView('lista')}>
            <List size={17} />
            Lista
          </button>
          <button className={viewMode === 'cards' ? 'primary-button' : 'secondary-button'} type="button" onClick={() => setOperationalView('cards')}>
            <Layers size={17} />
            Cards
          </button>
        </div>
      </section>

      {viewMode === 'lista' ? (
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
                {ativosByTipo.map((tipoGroup) => (
                  <AssetTypeTableGroup key={tipoGroup.id} group={tipoGroup} colSpan={6}>
                    {tipoGroup.ativos.map((ativo) => (
                      <tr key={ativo.id} className="hover:bg-cyan-300/5">
                        <td className="px-4 py-3">
                          <AssetIdentity ativo={ativo} />
                        </td>
                        <td className="px-4 py-3 text-slate-200">{ebapDisplayName(ativo.ebap)}</td>
                        <td className="px-4 py-3 text-slate-200">{areaLabel(ativo.area_responsavel)}</td>
                        <td className="px-4 py-3">
                          <StatusBadge tone={ativoStatusTone(ativo.status_operacional)} size="lg">{ativoStatusLabel(ativo.status_operacional)}</StatusBadge>
                        </td>
                        <td className="px-4 py-3 text-slate-300">{[ativo.fabricante, ativo.modelo].filter(Boolean).join(' / ') || '-'}</td>
                        <td className="px-4 py-3">{renderActions(ativo)}</td>
                      </tr>
                    ))}
                  </AssetTypeTableGroup>
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
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {groupedAtivos.map((group) => {
            const expanded = Boolean(expandedEbaps[group.id]);
            const health = getEbapHealth(group);
            const hasAlert = (group.counts.atencao || 0) > 0 || (group.counts.parado || 0) > 0 || (group.counts.em_manutencao || 0) > 0;

            return (
              <article key={group.id} className={['overflow-hidden rounded-3xl border p-4 shadow-xl transition duration-300 hover:-translate-y-0.5', getEbapCardClass(group)].join(' ')}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="block text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">EBAP</span>
                    <h3 className="mt-1 truncate text-lg font-black text-white">{group.nome}</h3>
                  </div>
                  <StatusBadge tone={hasAlert ? ((group.counts.parado || 0) > 0 ? 'red' : 'yellow') : 'green'} size="md">
                    {hasAlert ? 'Atenção' : 'Normal'}
                  </StatusBadge>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <OperationalMetric label="Total" value={group.total} className="border-cyan-300/15 bg-white/5 text-cyan-100" />
                  <OperationalMetric label="Operando" value={group.counts.operando || 0} className="border-emerald-300/20 bg-emerald-400/10 text-emerald-100" />
                  <OperationalMetric label="Atenção" value={group.counts.atencao || 0} className={(group.counts.atencao || 0) > 0 ? 'border-amber-300/35 bg-amber-400/15 text-amber-100' : 'border-slate-300/10 bg-white/5 text-slate-300'} />
                  <OperationalMetric label="Parado" value={group.counts.parado || 0} className={(group.counts.parado || 0) > 0 ? 'border-red-300/35 bg-red-400/15 text-red-100' : 'border-slate-300/10 bg-white/5 text-slate-300'} />
                  <OperationalMetric label="Manutenção" value={group.counts.em_manutencao || 0} className={(group.counts.em_manutencao || 0) > 0 ? 'border-sky-300/35 bg-sky-400/15 text-sky-100' : 'border-slate-300/10 bg-white/5 text-slate-300'} />
                  <OperationalMetric label="Saúde" value={String(health) + '%'} className="border-cyan-300/15 bg-navy-950/45 text-white" />
                </div>

                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-[11px] font-black uppercase tracking-wide text-slate-400">
                    <span>Saúde operacional</span>
                    <span>{health}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-navy-950/70 ring-1 ring-white/10">
                    <div className={['h-full rounded-full transition-all duration-500', getHealthTone(health)].join(' ')} style={{ width: String(health) + '%' }} />
                  </div>
                </div>

                <button className="mt-4 flex w-full items-center justify-between rounded-2xl border border-cyan-300/15 bg-navy-950/45 px-4 py-3 text-left text-sm font-black text-cyan-50 transition hover:bg-cyan-300/10" type="button" onClick={() => toggleEbapGroup(group.id)}>
                  <span>Equipamentos</span>
                  {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>

                <div className={['grid transition-[grid-template-rows,opacity] duration-300 ease-out', expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'].join(' ')}>
                  <div className="overflow-hidden">
                    <div className="mt-3 grid gap-3 border-t border-cyan-300/10 pt-3">
                      {groupAtivosByTipo(group.ativos).map((tipoGroup) => (
                        <div key={tipoGroup.id} className="rounded-2xl border border-cyan-300/10 bg-navy-950/40 p-3">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <span className="flex items-center gap-2">
                              <AssetTypeIcon tipo={tipoGroup.tipo} size={16} />
                              <strong className="text-xs font-black uppercase tracking-wide text-cyan-50">{tipoGroup.plural}</strong>
                            </span>
                            <span className="text-xs font-black text-slate-400">{tipoGroup.ativos.length}</span>
                          </div>
                          <div className="grid gap-2">
                            {tipoGroup.ativos.map((ativo) => (
                              <div key={ativo.id} className="grid gap-2 rounded-xl bg-navy-900/55 p-3 text-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                                <AssetIdentity ativo={ativo} />
                                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                                  <StatusBadge tone={ativoStatusTone(ativo.status_operacional)} size="md">{ativoStatusLabel(ativo.status_operacional)}</StatusBadge>
                                  {renderActions(ativo)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}

          {!groupedAtivos.length && (
            <div className="rounded-3xl border border-cyan-300/15 bg-navy-950/45 px-4 py-10 text-center text-sm font-bold text-slate-300 md:col-span-2 xl:col-span-3">
              Nenhum ativo encontrado.
            </div>
          )}
        </section>
      )}

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
                {ATIVOS_AREAS.map((area) => <option key={area.value} value={area.value}>{area.label}</option>)}
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
              <div className="grid gap-3 rounded-xl border border-cyan-300/10 bg-navy-950/55 p-3 md:grid-cols-2">
                <HistoryInfo label="Data" value={formatDateOnly(item.created_at)} />
                <HistoryInfo label="Hora" value={formatTimeOnly(item.created_at)} />
                <HistoryInfo label="Status anterior" value={ativoStatusLabel(item.status_anterior)} />
                <HistoryInfo label="Novo status" value={ativoStatusLabel(item.status_novo)} />
                <HistoryInfo label="Usuário responsável" value={item.usuario?.nome || 'Sistema'} />
                <HistoryInfo label="OS vinculada" value={item.os?.numero ? `${item.os.numero} - ${item.os.titulo || ''}` : '-'} />
              </div>
              <span className="font-semibold text-slate-200">{item.motivo || item.metadata?.observacao || '-'}</span>
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

function OperationalMetric({ label, value, className }) {
  return (
    <div className={['rounded-2xl border px-3 py-2', className].join(' ')}>
      <span className="block text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</span>
      <strong className="mt-1 block text-xl font-black leading-none">{value}</strong>
    </div>
  );
}

function AssetTypeTableGroup({ group, colSpan, children }) {
  return (
    <>
      <tr className="border-y border-cyan-300/10 bg-navy-950/70">
        <td className="px-4 py-3" colSpan={colSpan}>
          <span className="flex items-center gap-3">
            <AssetTypeIcon tipo={group.tipo} size={17} />
            <span className="min-w-0">
              <strong className="block text-xs font-black uppercase tracking-wide text-cyan-50">{group.plural}</strong>
              <small className="block text-[11px] font-bold text-slate-400">{group.ativos.length} ativo(s)</small>
            </span>
          </span>
        </td>
      </tr>
      {children}
    </>
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

function HistoryInfo({ label, value }) {
  return (
    <span className="min-w-0">
      <small className="block text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</small>
      <strong className="block truncate text-sm text-white">{value}</strong>
    </span>
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
