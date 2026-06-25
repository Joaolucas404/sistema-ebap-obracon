import { useEffect, useMemo, useState } from 'react';
import { BarChart3, CheckCircle2, Clock, Plus, RefreshCcw, Search, TriangleAlert } from 'lucide-react';
import KpiCard from '../components/ui/KpiCard.jsx';
import Modal from '../components/ui/Modal.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Toast from '../components/ui/Toast.jsx';
import OSCard from '../components/os/OSCard.jsx';
import OSFilters from '../components/os/OSFilters.jsx';
import { useAuthStore } from '../store/authStore.js';
import {
  criarOS,
  excluirOS,
  listarEbaps,
  listarOS,
  listarResponsaveis,
  obterDashboardOS,
  OS_AREAS,
  OS_PRIORIDADES,
  podeCriarOS,
  podeExcluirOS
} from '../services/osService.js';
import { ativoStatusLabel, listarAtivosPorEbap } from '../services/ativosService.js';

const emptyForm = {
  ebap_id: '',
  ativo_id: '',
  equipamento_falha: '',
  tipo_manutencao: 'corretiva',
  titulo: '',
  descricao: '',
  prioridade: 'media',
  area: '',
  responsavel_id: '',
  data_programada: '',
  hora_programada: '',
  turno: ''
};

export default function OrdensServico() {
  const user = useAuthStore((state) => state.user);
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [dashboard, setDashboard] = useState(null);
  const [ebaps, setEbaps] = useState([]);
  const [ativosEbap, setAtivosEbap] = useState([]);
  const [responsaveis, setResponsaveis] = useState([]);
  const [filters, setFilters] = useState({ search: '', status: '', prioridade: '', ebapId: '', responsavelId: '', page: 1, pageSize: 8 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ message: '', tone: 'cyan' });

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / filters.pageSize)), [count, filters.pageSize]);
  const canCreate = podeCriarOS(user?.perfil);
  const canDelete = podeExcluirOS(user?.perfil);
  const userAreaOperacional = user?.area_operacional || user?.area_supervisao || '';

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
        listarOS({ ...filters, perfil: user?.perfil, userId: user?.id, areaSupervisao: userAreaOperacional }),
        obterDashboardOS({ perfil: user?.perfil, userId: user?.id, areaSupervisao: userAreaOperacional })
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
  }, [filters, user?.id, user?.perfil, userAreaOperacional]);

  useEffect(() => {
    if (!modalOpen || !form.ebap_id) {
      setAtivosEbap([]);
      return;
    }
    listarAtivosPorEbap(form.ebap_id)
      .then(setAtivosEbap)
      .catch((err) => setError(err.message || 'Falha ao carregar ativos da EBAP.'));
  }, [modalOpen, form.ebap_id]);

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function openCreate() {
    setForm(emptyForm);
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
      area: ativo?.area_responsavel || current.area
    }));
  }

  async function handleCreate(event) {
    event.preventDefault();
    const equipamentoFalha = form.equipamento_falha.trim();
    if (equipamentoFalha.length < 3 || equipamentoFalha.length > 150) {
      setError('Informe o equipamento com falha com 3 a 150 caracteres.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await criarOS({ ...form, equipamento_falha: equipamentoFalha }, user);
      setToast({ message: 'OS criada com sucesso.', tone: 'green' });
      setModalOpen(false);
      setForm(emptyForm);
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
        title="Ordens de Serviço"
        description="Cadastro, acompanhamento, filtros, dashboard e rastreabilidade de OS conectados ao Supabase."
        actions={
          <>
            <button className="secondary-button" type="button" onClick={loadOS} disabled={loading}>
              <RefreshCcw size={17} />
              Atualizar
            </button>
            {canCreate && (
              <button className="primary-button" type="button" onClick={openCreate}>
                <Plus size={18} />
                Nova OS
              </button>
            )}
          </>
        }
      />

      {error && <div className="rounded-2xl border border-red-300/30 bg-red-500/15 p-4 text-sm font-bold text-red-100">{error}</div>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={BarChart3} label="Total" value={dashboard?.total ?? 0} helper="OS no escopo do perfil" />
        <KpiCard icon={Clock} label="Abertas" value={dashboard?.abertas ?? 0} helper="Pendentes ou em execução" tone="orange" />
        <KpiCard icon={CheckCircle2} label="Concluídas" value={dashboard?.concluidas ?? 0} helper="Encerradas no fluxo" tone="green" />
        <KpiCard icon={TriangleAlert} label="Atrasadas" value={dashboard?.atrasadas ?? 0} helper="Data programada vencida" tone="red" />
      </div>

      <OSFilters filters={filters} onChange={setFilters} ebaps={ebaps} responsaveis={responsaveis} showResponsavel={user?.perfil !== 'tecnico'} />

      <section className="grid gap-3">
        {loading ? (
          <div className="glass-card rounded-3xl p-8 text-center text-slate-300">Carregando ordens de serviço...</div>
        ) : items.length ? (
          items.map((os) => <OSCard key={os.id} os={os} canDelete={canDelete} onDelete={handleDeleteOS} />)
        ) : (
          <div className="glass-card rounded-3xl p-8 text-center">
            <Search className="mx-auto text-cyan-200" size={34} />
            <h3 className="mt-3 text-lg font-black text-white">Nenhuma OS encontrada</h3>
            <p className="mt-1 text-sm text-slate-300">Ajuste os filtros ou crie uma nova ordem de serviço.</p>
          </div>
        )}
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
      </div>

      <Modal open={modalOpen} title="Nova Ordem de Serviço" onClose={() => setModalOpen(false)}>
        <form className="grid gap-4" onSubmit={handleCreate}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="field-label">
              EBAP
              <select
                className="form-control"
                value={form.ebap_id}
                onChange={(event) => setForm((current) => ({ ...current, ebap_id: event.target.value, ativo_id: '', equipamento_falha: '' }))}
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
              Equipamento com falha
              <select className="form-control mb-2" value={form.ativo_id} onChange={(event) => handleAtivoChange(event.target.value)}>
                <option value="">Selecionar ativo cadastrado...</option>
                {ativosEbap.map((ativo) => (
                  <option key={ativo.id} value={ativo.id}>
                    {ativo.nome_operacional} - {ativoStatusLabel(ativo.status_operacional)}
                  </option>
                ))}
              </select>
              <input
                className="form-control"
                value={form.equipamento_falha}
                onChange={(event) => updateForm('equipamento_falha', event.target.value)}
                minLength={3}
                maxLength={150}
                placeholder="Ex.: Bomba 02, painel elétrico, comporta norte..."
                required
              />
            </label>
            <label className="field-label">
              Tipo de manutenÃ§Ã£o
              <select className="form-control" value={form.tipo_manutencao} onChange={(event) => updateForm('tipo_manutencao', event.target.value)}>
                <option value="corretiva">Corretiva</option>
                <option value="preventiva">Preventiva</option>
                <option value="preditiva">Preditiva</option>
              </select>
            </label>
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
            <label className="field-label">
              Área de atuação
              <select className="form-control" value={form.area} onChange={(event) => updateForm('area', event.target.value)} required>
                <option value="">Selecione...</option>
                {OS_AREAS.map((area) => (
                  <option key={area.value} value={area.value}>
                    {area.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label md:col-span-2">
              Título
              <input className="form-control" value={form.titulo} onChange={(event) => updateForm('titulo', event.target.value)} required />
            </label>
            <label className="field-label md:col-span-2">
              Descrição
              <textarea className="form-control min-h-28 py-3" value={form.descricao} onChange={(event) => updateForm('descricao', event.target.value)} required />
            </label>
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
