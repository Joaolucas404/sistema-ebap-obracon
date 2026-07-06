import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Camera, CheckCircle2, Clock, Plus, RefreshCcw, Search, TriangleAlert } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import KpiCard from '../components/ui/KpiCard.jsx';
import Modal from '../components/ui/Modal.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import Toast from '../components/ui/Toast.jsx';
import OSCard from '../components/os/OSCard.jsx';
import OSFilters from '../components/os/OSFilters.jsx';
import { useAuthStore } from '../store/authStore.js';
import {
  criarOS,
  excluirOS,
  listarEbaps,
  listarOS,
  listarEquipesTecnicas,
  listarResponsaveis,
  obterDashboardOS,
  OS_AREAS,
  OS_PRIORIDADES,
  podeCriarOS,
  podeExcluirOS,
  sugerirEquipePorArea,
  uploadAnexoOS
} from '../services/osService.js';
import { ativoStatusLabel, listarAtivosPorEbap } from '../services/ativosService.js';

const emptyForm = {
  ebap_id: '',
  ativo_id: '',
  equipamento_falha: '',
  equipamento_tipo: '',
  tipo_manutencao: 'corretiva',
  titulo: '',
  descricao: '',
  prioridade: 'media',
  area: '',
  equipe_responsavel: '',
  data_programada: '',
  hora_programada: '',
  turno: ''
};

export default function OrdensServico() {
  const user = useAuthStore((state) => state.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [dashboard, setDashboard] = useState(null);
  const [ebaps, setEbaps] = useState([]);
  const [ativosEbap, setAtivosEbap] = useState([]);
  const [responsaveis, setResponsaveis] = useState([]);
  const equipesTecnicas = listarEquipesTecnicas();
  const [filters, setFilters] = useState({ search: '', status: '', prioridade: '', ebapId: '', responsavelId: '', page: 1, pageSize: 8 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [fotoFiles, setFotoFiles] = useState([]);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ message: '', tone: 'cyan' });

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / filters.pageSize)), [count, filters.pageSize]);
  const ativoSelecionado = useMemo(() => ativosEbap.find((item) => item.id === form.ativo_id) || null, [ativosEbap, form.ativo_id]);
  const canCreate = podeCriarOS(user?.perfil);
  const canDelete = podeExcluirOS(user?.perfil);
  const userAreaOperacional = user?.area_operacional || user?.area_supervisao || '';
  const tecnicoScope = user?.perfil === 'tecnico' ? searchParams.get('visão') || '' : '';
  const isTecnico = user?.perfil === 'tecnico';
  const isFiscalOperacional = user?.perfil === 'fiscal_operacional';
  const pageTitle = isTecnico
    ? tecnicoScope === 'equipe'
      ? 'OS da Equipe'
      : tecnicoScope === 'historico'
        ? 'Histórico'
        : 'Minhas OS'
    : isFiscalOperacional
      ? 'Minhas Solicitações'
      : 'Ordens de Serviço';
  const pageDescription = isTecnico
    ? `Equipe ${user?.equipe || '-'} • visualização restrita ao técnico e à própria equipe.`
    : isFiscalOperacional
      ? 'Acompanhe somente as OS abertas por você.'
      : 'Cadastro, acompanhamento, filtros, dashboard e rastreabilidade de OS conectados ao Supabase.';

  async function loadBase() {
    const [ebapRows, responsavelRows] = await Promise.all([listarEbaps(), listarResponsaveis()]);
    setEbaps(ebapRows);
    setResponsaveis(responsavelRows);
  }

  async function loadOS() {
    setLoading(true);
    setError('');
    try {
      const [lista, dash] = await Promise.all([
        listarOS({ ...filters, perfil: user?.perfil, userId: user?.id, areaSupervisão: userAreaOperacional, equipe: user?.equipe, scope: tecnicoScope }),
        obterDashboardOS({ perfil: user?.perfil, userId: user?.id, areaSupervisão: userAreaOperacional, equipe: user?.equipe, scope: tecnicoScope })
      ]);
      setItems(lista.data);
      setCount(lista.count);
      setDashboard(dash);
    } catch (err) {
      setError(err.message || 'Falha ao carregar ordens de serviço.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBase().catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    loadOS();
  }, [filters, user?.id, user?.perfil, userAreaOperacional, user?.equipe, tecnicoScope]);

  useEffect(() => {
    if (!modalOpen || !form.ebap_id) {
      setAtivosEbap([]);
      return;
    }
    listarAtivosPorEbap(form.ebap_id)
      .then(setAtivosEbap)
      .catch((err) => setError(err.message || 'Falha ao carregar ativos da EBAP.'));
  }, [modalOpen, form.ebap_id]);

  useEffect(() => {
    if (searchParams.get('nova') === '1' && canCreate) {
      openCreate();
      setSearchParams(tecnicoScope ? { visão: tecnicoScope } : {});
    }
  }, [searchParams, canCreate]);

  function updateForm(field, value) {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === 'area' && value && !current.equipe_responsavel) {
        next.equipe_responsavel = sugerirEquipePorArea(value);
      }
      return next;
    });
  }

  function openCreate() {
    setForm(emptyForm);
    setFotoFiles([]);
    setAtivosEbap([]);
    setError('');
    setModalOpen(true);
  }

  function handleAtivoChange(ativoId) {
    const ativo = ativosEbap.find((item) => item.id === ativoId);
    setForm((current) => ({
      ...current,
      ativo_id: ativoId,
      equipamento_falha: ativo ? ativo.nome_operacional : current.equipamento_falha,
      equipamento_tipo: ativo?.tipo || '',
      area: ativo?.area_responsavel || current.area,
      equipe_responsavel: ativo?.area_responsavel ? sugerirEquipePorArea(ativo.area_responsavel) || current.equipe_responsavel : current.equipe_responsavel
    }));
  }

  async function handleCreate(event) {
    event.preventDefault();
    if (!form.ativo_id) {
      setError('Selecione um ativo cadastrado como equipamento com falha.');
      return;
    }
    const equipamentoFalha = form.equipamento_falha.trim();
    if (equipamentoFalha.length < 3 || equipamentoFalha.length > 150) {
      setError('Informe o equipamento com falha com 3 a 150 caracteres.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const created = await criarOS({ ...form, equipamento_falha: equipamentoFalha }, user);
      if (isFiscalOperacional && fotoFiles.length) {
        await Promise.all(fotoFiles.map((file) => uploadAnexoOS(created.id, file, user, 'Foto enviada pelo Fiscal Operacional.', 'foto_solicitacao')));
      }
      setToast({ message: 'OS criada com sucesso.', tone: 'green' });
      setModalOpen(false);
      setForm(emptyForm);
      setFotoFiles([]);
      await loadOS();
    } catch (err) {
      setError(err.message || 'Não foi possível criar a OS.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteOS(os) {
    const confirmed = window.confirm(`Excluir a OS ${os.numero}? Ela sairá da lista, mas o histórico será mantido.`);
    if (!confirmed) return;

    setSaving(true);
    setError('');
    try {
      await excluirOS(os.id, user);
      setToast({ message: 'OS excluída.', tone: 'orange' });
      await loadOS();
    } catch (err) {
      setError(err.message || 'Não foi possível excluir a OS.');
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
        title={pageTitle}
        description={pageDescription}
        actions={
          <>
            {!isFiscalOperacional && <button className="secondary-button" type="button" onClick={loadOS} disabled={loading}>
              <RefreshCcw size={17} />
              Atualizar
            </button>}
            {canCreate && (
              <button className="primary-button" type="button" onClick={openCreate}>
                <Plus size={18} />
                {isFiscalOperacional ? 'Abrir OS' : 'Nova OS'}
              </button>
            )}
          </>
        }
      />

      {isTecnico && (
        <section className="glass-card rounded-3xl p-3">
          <div className="grid gap-2 sm:grid-cols-3">
            <button className={tecnicoScope === 'minhas' || !tecnicoScope ? 'primary-button' : 'secondary-button'} type="button" onClick={() => setSearchParams({ visão: 'minhas' })}>
              Minhas OS
            </button>
            <button className={tecnicoScope === 'equipe' ? 'primary-button' : 'secondary-button'} type="button" onClick={() => setSearchParams({ visão: 'equipe' })}>
              OS da Equipe
            </button>
            <button className={tecnicoScope === 'historico' ? 'primary-button' : 'secondary-button'} type="button" onClick={() => setSearchParams({ visão: 'historico' })}>
              Histórico
            </button>
          </div>
        </section>
      )}

      {error && <div className="rounded-2xl border border-red-300/30 bg-red-500/15 p-4 text-sm font-bold text-red-100">{error}</div>}

      {!isFiscalOperacional && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={BarChart3} label="Total" value={dashboard?.total ?? 0} helper="OS no escopo do perfil" />
        <KpiCard icon={Clock} label="Abertas" value={dashboard?.abertas ?? 0} helper="Pendentes ou em execução" tone="orange" />
        <KpiCard icon={CheckCircle2} label="Concluídas" value={dashboard?.concluidas ?? 0} helper="Encerradas no fluxo" tone="green" />
        <KpiCard icon={TriangleAlert} label="Atrasadas" value={dashboard?.atrasadas ?? 0} helper="Data programada vencida" tone="red" />
      </div>}

      {!isFiscalOperacional && <OSFilters filters={filters} onChange={setFilters} ebaps={ebaps} responsaveis={responsaveis} showResponsavel={user?.perfil !== 'tecnico'} />}

      <section className="grid gap-3">
        {loading ? (
          <div className="glass-card rounded-3xl p-8 text-center text-slate-300">Carregando ordens de serviço...</div>
        ) : items.length ? (
          items.map((os) => isFiscalOperacional ? <FiscalSolicitacaoCard key={os.id} os={os} /> : <OSCard key={os.id} os={os} canDelete={canDelete} onDelete={handleDeleteOS} />)
        ) : (
          <div className="glass-card rounded-3xl p-8 text-center">
            <Search className="mx-auto text-cyan-200" size={34} />
            <h3 className="mt-3 text-lg font-black text-white">Nenhuma OS encontrada</h3>
            <p className="mt-1 text-sm text-slate-300">Ajuste os filtros ou crie uma nova ordem de serviço.</p>
          </div>
        )}
      </section>

      {!isFiscalOperacional && <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm font-bold text-slate-300">
          Página {filters.page} de {totalPages} • {count} registro(s)
        </span>
        <div className="flex gap-2">
          <button className="secondary-button" type="button" disabled={filters.page <= 1} onClick={() => setPage(filters.page - 1)}>
            Anterior
          </button>
          <button className="secondary-button" type="button" disabled={filters.page >= totalPages} onClick={() => setPage(filters.page + 1)}>
            Próxima
          </button>
        </div>
      </div>}

      <Modal open={modalOpen} title="Nova Ordem de Serviço" onClose={() => setModalOpen(false)}>
        <form className="grid gap-4" onSubmit={handleCreate}>
          {isTecnico && (
            <div className="grid gap-3 rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-4 md:grid-cols-2">
              <div>
                <small className="block text-xs font-black uppercase tracking-wide text-slate-400">Técnico</small>
                <strong className="mt-1 block text-white">{user?.nome || user?.usuario}</strong>
              </div>
              <div>
                <small className="block text-xs font-black uppercase tracking-wide text-slate-400">Equipe</small>
                <strong className="mt-1 block text-white">{user?.equipe || '-'}</strong>
              </div>
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <label className="field-label">
              EBAP
              <select
                className="form-control"
                value={form.ebap_id}
                onChange={(event) => setForm((current) => ({ ...current, ebap_id: event.target.value, ativo_id: '', equipamento_falha: '', equipamento_tipo: '', area: '', equipe_responsavel: '' }))}
                required
              >
                <option value="">Selecione...</option>
                {ebaps.map((ebap) => (
                  <option key={ebap.id} value={ebap.id}>
                    {ebap.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label">
              Equipamento
              <select className="form-control mb-2" value={form.ativo_id} onChange={(event) => handleAtivoChange(event.target.value)} disabled={!form.ebap_id} required>
                <option value="">Selecionar ativo cadastrado...</option>
                {ativosEbap.map((ativo) => (
                  <option key={ativo.id} value={ativo.id}>
                    {ativo.nome_operacional} - {ativoStatusLabel(ativo.status_operacional)}
                  </option>
                ))}
              </select>
              {!isFiscalOperacional && (
              <input
                className="form-control"
                value={form.equipamento_falha}
                onChange={(event) => updateForm('equipamento_falha', event.target.value)}
                minLength={3}
                maxLength={150}
                placeholder="Ex.: Bomba 02, painel elétrico, comporta norte..."
                required
                readOnly={Boolean(ativoSelecionado)}
              />
              )}
            </label>
            {!isFiscalOperacional && <label className="field-label">
              Tipo de equipamento
              <input className="form-control" value={form.equipamento_tipo || ativoSelecionado?.tipo || ''} readOnly placeholder="Preenchido pelo ativo selecionado" />
            </label>}
            {!isFiscalOperacional && <label className="field-label">
              Tipo de manutenção
              <select className="form-control" value={form.tipo_manutencao} onChange={(event) => updateForm('tipo_manutencao', event.target.value)}>
                <option value="corretiva">Corretiva</option>
                <option value="preventiva">Preventiva</option>
                <option value="preditiva">Preditiva</option>
              </select>
            </label>}
            <label className="field-label">
              Prioridade
              <select className="form-control" value={form.prioridade} onChange={(event) => updateForm('prioridade', event.target.value)}>
                {OS_PRIORIDADES.map((prioridade) => (
                  <option key={prioridade.value} value={prioridade.value}>
                    {prioridade.label}
                  </option>
                ))}
              </select>
            </label>
            {!isFiscalOperacional && <label className="field-label">
              Área de atuação
              <select className="form-control" value={form.area} onChange={(event) => updateForm('area', event.target.value)} required disabled={Boolean(ativoSelecionado)}>
                <option value="">Selecione...</option>
                {OS_AREAS.map((area) => (
                  <option key={area.value} value={area.value}>
                    {area.label}
                  </option>
                ))}
              </select>
            </label>}
            {!isFiscalOperacional && <label className="field-label">
              Equipe responsável
              <select className="form-control" value={form.equipe_responsavel} onChange={(event) => updateForm('equipe_responsavel', event.target.value)} required>
                <option value="">Selecione...</option>
                {equipesTecnicas.map((equipe) => (
                  <option key={equipe.value} value={equipe.value}>{equipe.label}</option>
                ))}
              </select>
            </label>}
            <label className="field-label md:col-span-2">
              Título
              <input className="form-control" value={form.titulo} onChange={(event) => updateForm('titulo', event.target.value)} required />
            </label>
            <label className="field-label md:col-span-2">
              Descrição
              <textarea className="form-control min-h-28 py-3" value={form.descricao} onChange={(event) => updateForm('descricao', event.target.value)} required />
            </label>
            {isFiscalOperacional && (
              <label className="field-label md:col-span-2">
                Fotos
                <div className="rounded-2xl border border-blue-200/15 bg-navy-950/55 p-4">
                  <input
                    className="form-control"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    onChange={(event) => setFotoFiles(Array.from(event.target.files || []))}
                  />
                  <div className="mt-3 flex items-center gap-2 text-sm font-bold text-slate-300">
                    <Camera size={17} className="text-blue-200" />
                    {fotoFiles.length ? `${fotoFiles.length} foto(s) selecionada(s)` : 'Nenhuma foto selecionada'}
                  </div>
                </div>
              </label>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button className="secondary-button" type="button" onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button className="primary-button" type="submit" disabled={saving}>
              Criar OS
            </button>
          </div>
        </form>
      </Modal>

      <Toast message={toast.message} tone={toast.tone} onClose={() => setToast({ message: '', tone: 'cyan' })} />
    </div>
  );
}

function FiscalSolicitacaoCard({ os }) {
  const date = os.created_at ? new Date(os.created_at) : null;
  const formattedDate = date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString('pt-BR') : '-';

  return (
    <article className="rounded-[26px] border border-blue-200/15 bg-[#10224D]/80 p-4 shadow-lg shadow-black/20">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <strong className="block text-lg font-black text-white">{os.numero}</strong>
          <h3 className="mt-1 line-clamp-2 text-xl font-black text-white">{os.titulo}</h3>
        </div>
        <StatusBadge tone={statusTone(os.status)}>{statusLabel(os.status)}</StatusBadge>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 text-sm font-bold text-slate-300">
        <span>{formattedDate}</span>
        <a className="primary-button min-h-10 px-4" href={`/os/${os.id}`}>
          Detalhes
        </a>
      </div>
    </article>
  );
}
