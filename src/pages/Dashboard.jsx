import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, ClipboardList, Clock3, DollarSign, Factory, FileText, HardHat, PackageX, RefreshCcw, ShieldAlert, WalletCards, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import KpiCard from '../components/ui/KpiCard.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import { AREA_LABELS, obterDashboardExecutivo, STATUS_LABELS } from '../services/dashboardService.js';
import { useAuthStore } from '../store/authStore.js';

const STATUS_COLORS = {
  solicitada_prefeitura: '#38bdf8',
  aguardando_supervisor: '#f59e0b',
  analise_supervisor: '#facc15',
  programada: '#22c55e',
  encaminhada_tecnicos: '#06b6d4',
  em_execucao: '#3b82f6',
  concluida_tecnicos: '#14b8a6',
  validacao_supervisor: '#a78bfa',
  enviada_prefeitura: '#60a5fa',
  aguardando_validacao_prefeitura: '#f97316',
  nao_conforme: '#ef4444',
  concluida_arquivada: '#22c55e',
  concluida: '#22c55e',
  finalizada: '#22c55e',
  cancelada: '#94a3b8',
  rejeitada: '#ef4444',
  aberta: '#38bdf8',
  em_analise: '#facc15',
  aguardando_material: '#fb923c'
};

const AREA_COLORS = ['#38bdf8', '#22c55e', '#f59e0b', '#ef4444', '#a78bfa', '#14b8a6', '#f97316', '#60a5fa'];

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('pt-BR');
}

function timeAgo(value) {
  if (!value) return 'Sem data';
  const diff = Date.now() - new Date(value).getTime();
  if (Number.isNaN(diff)) return formatDate(value);
  const minutes = Math.max(0, Math.round(diff / 60000));
  if (minutes < 1) return 'Atualizado agora';
  if (minutes < 60) return `Atualizado ha ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Atualizado ha ${hours} h`;
  return formatDate(value);
}

function money(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function statusTone(status) {
  if (['normal', 'concluida_arquivada', 'concluida', 'finalizada', 'validado_cco'].includes(status)) return 'green';
  if (['critico', 'critica', 'nao_conforme', 'rejeitada', 'cancelada', 'rejeitado_cco'].includes(status)) return 'red';
  if (['atencao', 'aguardando_supervisor', 'analise_supervisor', 'aguardando_validacao_prefeitura', 'correcao_solicitada'].includes(status)) return 'orange';
  return 'cyan';
}

function ebapTone(status) {
  if (status === 'critico') return 'red';
  if (status === 'atencao') return 'orange';
  return 'green';
}

function ebapColor(status) {
  if (status === 'critico') return 'from-red-500/25 to-red-500/5 border-red-300/35';
  if (status === 'atencao') return 'from-yellow-500/25 to-yellow-500/5 border-yellow-300/35';
  return 'from-green-500/25 to-green-500/5 border-green-300/35';
}

function prettyStatus(status) {
  return STATUS_LABELS[status] || status?.replaceAll('_', ' ') || '-';
}

function prettyArea(area) {
  return AREA_LABELS[area] || area?.replaceAll('_', ' ') || 'Nao informado';
}

function ChartCard({ title, subtitle, children }) {
  return (
    <section className="glass-card rounded-3xl p-5">
      <div className="mb-4">
        <h3 className="text-lg font-black text-white">{title}</h3>
        {subtitle && <p className="text-sm text-slate-300">{subtitle}</p>}
      </div>
      <div className="h-72">{children}</div>
    </section>
  );
}

function EmptyPanel({ text = 'Sem dados para exibir.' }) {
  return <div className="grid h-full place-items-center rounded-2xl border border-cyan-300/15 bg-navy-950/45 text-sm font-bold text-slate-300">{text}</div>;
}

function EquipmentRatio({ label, value }) {
  const [available, total] = String(value || '-').split('/');
  const percentage = value && value !== '-' && total ? Math.round((Number(available) / Number(total)) * 100) : null;

  return (
    <div className="rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-4">
      <span className="text-xs font-black uppercase text-slate-400">{label}</span>
      <strong className="mt-1 block text-2xl text-white">{value || '-'}</strong>
      {percentage !== null && (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-navy-950">
          <div className="h-full rounded-full bg-cyan-300" style={{ width: `${percentage}%` }} />
        </div>
      )}
    </div>
  );
}

function calcularDisponibilidadeGerencial(gerencial) {
  const ratios = Object.values(gerencial?.grupos || {});
  return ratios.reduce(
    (acc, value) => {
      if (!value || value === '-') return acc;
      const [available, total] = String(value).split('/').map(Number);
      if (!Number.isFinite(available) || !Number.isFinite(total)) return acc;
      return {
        disponiveis: acc.disponiveis + available,
        existentes: acc.existentes + total
      };
    },
    { disponiveis: 0, existentes: 0 }
  );
}

function EbapDetailPanel({ ebap, onClose }) {
  if (!ebap) return null;
  const gerencial = ebap.gerencial;
  const calculo = calcularDisponibilidadeGerencial(gerencial);
  const disponibilidadeCalculada = calculo.existentes ? ((calculo.disponiveis / calculo.existentes) * 100).toFixed(1) : '-';

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-3 backdrop-blur-sm" onClick={onClose}>
      <section className="max-h-[88vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-cyan-300/25 bg-[#08245a] p-5 shadow-2xl shadow-black/40" onClick={(event) => event.stopPropagation()}>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cyan-400/10 text-cyan-100">
            <FileText size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white">{ebap.nome_curto || ebap.nome}</h3>
            <p className="text-sm text-slate-300">Disponibilidade calculada e classificacao operacional do Relatorio Gerencial de 08/05/2026.</p>
          </div>
        </div>
        <button type="button" className="secondary-button" onClick={onClose}>
          <X size={17} />
          Fechar
        </button>
      </div>

      {gerencial ? (
        <>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-4">
              <span className="text-xs font-black uppercase text-slate-400">Disponibilidade calculada</span>
              <strong className="mt-1 block text-3xl text-white">{gerencial.disponibilidade.toFixed(1)}%</strong>
              <small className="text-slate-300">
                {calculo.disponiveis}/{calculo.existentes} equipamentos = {disponibilidadeCalculada}%
              </small>
            </div>
            <div className="rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-4">
              <span className="text-xs font-black uppercase text-slate-400">Classificacao operacional</span>
              <strong className="mt-1 block text-3xl text-white">{gerencial.statusRelatorio}</strong>
              <small className="text-slate-300">Pode ser critica mesmo com percentual alto</small>
            </div>
            <div className="rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-4">
              <span className="text-xs font-black uppercase text-slate-400">Alerta visual no dashboard</span>
              <strong className="mt-1 block text-3xl text-white">{ebap.criticidade?.score || 0}%</strong>
              <small className="text-slate-300">Escala visual: vermelho, amarelo ou verde</small>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <EquipmentRatio label="Bombas" value={gerencial.grupos.bombas} />
            <EquipmentRatio label="Comportas" value={gerencial.grupos.comportas} />
            <EquipmentRatio label="Rastelos" value={gerencial.grupos.rastelos} />
            <EquipmentRatio label="Comp. Rastelo" value={gerencial.grupos.comportaRastelo} />
          </div>

          <div className="mt-4 rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-4">
            <span className="text-xs font-black uppercase text-slate-400">Por que essa classificacao?</span>
            <p className="mt-2 text-sm leading-6 text-slate-200">{gerencial.motivo}</p>
          </div>

          <div className="mt-4 rounded-2xl border border-cyan-300/15 bg-cyan-400/10 p-4">
            <span className="text-xs font-black uppercase text-cyan-100">Como ler esses numeros</span>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              A disponibilidade e a conta matematica do relatorio: equipamentos disponiveis divididos por equipamentos existentes.
              O alerta visual nao e essa disponibilidade; ele traduz a classificacao operacional do relatorio: Critica = 95%, Atencao = 62% e Adequada = 18%.
            </p>
          </div>
        </>
      ) : (
        <div className="mt-5 rounded-2xl border border-orange-300/25 bg-orange-400/10 p-4 text-sm font-bold text-orange-100">
          Esta EBAP ainda nao possui correspondencia no Relatorio_Gerencial.docx.
        </div>
      )}
      </section>
    </div>
  );
}

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEbap, setSelectedEbap] = useState(null);

  async function loadDashboard() {
    setLoading(true);
    setError('');
    try {
      const result = await obterDashboardExecutivo();
      setData(result);
    } catch (err) {
      setError(err.message || 'Nao foi possivel carregar o dashboard.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const criticidade = useMemo(() => {
    const ebaps = data?.ebaps || [];
    return {
      criticas: ebaps.filter((ebap) => ebap.criticidade?.nivel === 'critico').length,
      atencao: ebaps.filter((ebap) => ebap.criticidade?.nivel === 'atencao').length,
      normais: ebaps.filter((ebap) => ebap.criticidade?.nivel === 'normal').length
    };
  }, [data?.ebaps]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);

  return (
    <div className="grid gap-4">
      <PageHeader
        title={`${greeting}, ${user?.nome || 'Operacao'}`}
        description={`Portal Executivo EBAPs - ${new Date().toLocaleString('pt-BR')}`}
        actions={
          <button type="button" className="secondary-button" onClick={loadDashboard} disabled={loading}>
            <RefreshCcw size={17} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>
        }
      />

      {error && <div className="rounded-2xl border border-red-300/30 bg-red-500/15 p-4 text-sm font-bold text-red-100">{error}</div>}

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-green-300/25 bg-green-400/10 p-5 transition hover:-translate-y-0.5">
          <span className="text-xs font-black uppercase text-green-100">Operando</span>
          <strong className="mt-1 block text-4xl text-white">{criticidade.normais}</strong>
        </div>
        <div className="rounded-3xl border border-yellow-300/25 bg-yellow-400/10 p-5 transition hover:-translate-y-0.5">
          <span className="text-xs font-black uppercase text-yellow-100">Atencao</span>
          <strong className="mt-1 block text-4xl text-white">{criticidade.atencao}</strong>
        </div>
        <div className="rounded-3xl border border-red-300/25 bg-red-400/10 p-5 transition hover:-translate-y-0.5">
          <span className="text-xs font-black uppercase text-red-100">Critica</span>
          <strong className="mt-1 block text-4xl text-white">{criticidade.criticas}</strong>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <KpiCard icon={ClipboardList} label="OS abertas" value={loading ? '...' : data?.kpis.osAbertas ?? 0} helper="Fluxos nao encerrados" tone="cyan" />
        <KpiCard icon={CheckCircle2} label="Concluidas hoje" value={loading ? '...' : data?.kpis.osConcluidasHoje ?? 0} helper="Encerradas no dia" tone="green" />
        <KpiCard icon={Clock3} label="Aguard. supervisor" value={loading ? '...' : data?.kpis.osAguardandoSupervisor ?? 0} helper="Na fila de analise" tone="orange" />
        <KpiCard icon={ShieldAlert} label="OS criticas" value={loading ? '...' : data?.kpis.osCriticas ?? 0} helper="Prioridade critica" tone="red" />
        <KpiCard icon={Factory} label="EBAPs operando" value={loading ? '...' : data?.kpis.ebapsOperando ?? 0} helper="Status normal" tone="green" />
        <KpiCard icon={FileText} label="RO pendentes" value={loading ? '...' : data?.kpis.roPendentes ?? 0} helper="Validacao ou correcao" tone="orange" />
        <KpiCard icon={HardHat} label="APR pendentes" value={loading ? '...' : data?.kpis.aprPendentes ?? 0} helper="SST aguardando acao" tone="cyan" />
        <KpiCard icon={PackageX} label="Estoque critico" value={loading ? '...' : data?.kpis.estoqueCritico ?? 0} helper="Itens zerados" tone="red" />
        <KpiCard icon={WalletCards} label="Compras pendentes" value={loading ? '...' : data?.kpis.comprasPendentes ?? 0} helper="Cotacao ou aprovacao" tone="orange" />
        <KpiCard icon={DollarSign} label="Medicoes pendentes" value={loading ? '...' : data?.kpis.medicoesPendentes ?? 0} helper={`${data?.kpis.contratosAtivos || 0} contratos ativos`} tone="green" />
      </div>

      <section className="glass-card rounded-3xl p-5">
        <div className="mb-4">
          <h3 className="text-lg font-black text-white">Indicadores financeiros</h3>
          <p className="text-sm text-slate-300">Contratos, medicoes e valores consolidados do modulo financeiro.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <FinanceMetric label="Valor medido no mes" value={money(data?.kpis.valorMedidoMes)} />
          <FinanceMetric label="Valor aprovado" value={money(data?.kpis.valorAprovado)} />
          <FinanceMetric label="Valor glosado" value={money(data?.kpis.valorGlosado)} />
          <FinanceMetric label="Compras pendentes" value={data?.kpis.comprasPendentes || 0} />
        </div>
      </section>

      <section className="glass-card rounded-3xl p-5">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-xl font-black text-white">Situacao das EBAPs</h3>
            <p className="text-sm text-slate-300">Clique em uma unidade para ver disponibilidade calculada, classificacao operacional e justificativa do relatorio.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone="green">{criticidade.normais} normais</StatusBadge>
            <StatusBadge tone="orange">{criticidade.atencao} atencao</StatusBadge>
            <StatusBadge tone="red">{criticidade.criticas} criticas</StatusBadge>
          </div>
        </div>

        {loading ? (
          <EmptyPanel text="Carregando EBAPs..." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {(data?.ebaps || []).map((ebap) => (
              <button
                key={ebap.id}
                type="button"
                className={`rounded-2xl border bg-gradient-to-br p-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-200/70 focus:outline-none focus:ring-2 focus:ring-cyan-300 ${ebapColor(ebap.gerencial?.statusDashboard || ebap.status)}`}
                onClick={() => setSelectedEbap(ebap)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <strong className="block text-lg text-white">{ebap.nome_curto || ebap.nome}</strong>
                    <span className="text-xs font-bold uppercase text-slate-300">{ebap.bairro || ebap.codigo || 'EBAP'}</span>
                  </div>
                  <StatusBadge tone={ebapTone(ebap.gerencial?.statusDashboard || ebap.status)}>
                    {(ebap.gerencial?.statusDashboard || ebap.status) === 'atencao' ? 'Amarelo' : (ebap.gerencial?.statusDashboard || ebap.status) === 'critico' ? 'Vermelho' : 'Verde'}
                  </StatusBadge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-navy-950/55 p-3">
                    <span className="text-xs font-black uppercase text-slate-400">OS abertas</span>
                    <strong className="mt-1 block text-2xl text-white">{ebap.ordensAbertas}</strong>
                  </div>
                  <div className="rounded-2xl bg-navy-950/55 p-3">
                    <span className="text-xs font-black uppercase text-slate-400">Alerta operacional</span>
                    <strong className="mt-1 block text-2xl text-white">{ebap.criticidade?.score || 0}%</strong>
                  </div>
                  <div className="rounded-2xl bg-navy-950/55 p-3">
                    <span className="text-xs font-black uppercase text-slate-400">RO pendentes</span>
                    <strong className="mt-1 block text-2xl text-white">{ebap.roPendentes || 0}</strong>
                  </div>
                  <div className="rounded-2xl bg-navy-950/55 p-3">
                    <span className="text-xs font-black uppercase text-slate-400">Preventivas</span>
                    <strong className="mt-1 block text-2xl text-white">{ebap.preventivasPendentes || 0}</strong>
                  </div>
                </div>
                {ebap.gerencial && (
                  <div className="mt-3 rounded-2xl bg-navy-950/35 px-3 py-2 text-xs font-bold text-slate-200">
                    Disponibilidade calculada: {ebap.gerencial.disponibilidade.toFixed(1)}%
                  </div>
                )}
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-navy-950/80">
                  <div
                    className={`h-full rounded-full ${ebap.criticidade?.nivel === 'critico' ? 'bg-red-400' : ebap.criticidade?.nivel === 'atencao' ? 'bg-yellow-300' : 'bg-green-400'}`}
                    style={{ width: `${ebap.criticidade?.score || 0}%` }}
                  />
                </div>
                <p className="mt-3 text-xs font-bold text-slate-300">{timeAgo(ebap.updatedAt)}</p>
              </button>
            ))}
          </div>
        )}
      </section>

      <EbapDetailPanel ebap={selectedEbap} onClose={() => setSelectedEbap(null)} />

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="OS por Status" subtitle="Distribuicao das ordens por etapa do fluxo.">
          {loading ? (
            <EmptyPanel text="Carregando grafico..." />
          ) : data?.osPorStatus?.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.osPorStatus} margin={{ top: 8, right: 8, left: -18, bottom: 48 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                <XAxis dataKey="name" stroke="#cbd5e1" tick={{ fontSize: 10 }} angle={-28} textAnchor="end" interval={0} height={70} />
                <YAxis allowDecimals={false} stroke="#cbd5e1" tick={{ fontSize: 11 }} />
                <Tooltip cursor={{ fill: 'rgba(56,189,248,0.08)' }} contentStyle={{ background: '#08214f', border: '1px solid rgba(125,211,252,.35)', color: '#fff' }} />
                <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                  {data.osPorStatus.map((entry) => (
                    <Cell key={entry.value} fill={STATUS_COLORS[entry.value] || '#38bdf8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyPanel />
          )}
        </ChartCard>

        <ChartCard title="OS por Area" subtitle="Volume por area de atuacao.">
          {loading ? (
            <EmptyPanel text="Carregando grafico..." />
          ) : data?.osPorArea?.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.osPorArea} dataKey="total" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={3}>
                  {data.osPorArea.map((entry, index) => (
                    <Cell key={entry.value} fill={AREA_COLORS[index % AREA_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#08214f', border: '1px solid rgba(125,211,252,.35)', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyPanel />
          )}
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard title="RO por EBAP" subtitle="Relatorios diarios agrupados por unidade.">
          {loading ? <EmptyPanel text="Carregando grafico..." /> : data?.roPorEbap?.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.roPorEbap} margin={{ top: 8, right: 8, left: -18, bottom: 48 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                <XAxis dataKey="name" stroke="#cbd5e1" tick={{ fontSize: 10 }} angle={-28} textAnchor="end" interval={0} height={70} />
                <YAxis allowDecimals={false} stroke="#cbd5e1" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#08214f', border: '1px solid rgba(125,211,252,.35)', color: '#fff' }} />
                <Bar dataKey="total" fill="#38bdf8" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyPanel text="Nenhum dado disponivel ainda." />}
        </ChartCard>
        <ChartCard title="Compras por Status" subtitle="Fluxo de compras e aprovacao.">
          {loading ? <EmptyPanel text="Carregando grafico..." /> : data?.comprasPorStatus?.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={data.comprasPorStatus} dataKey="total" nameKey="name" innerRadius={55} outerRadius={90}>{data.comprasPorStatus.map((entry, index) => <Cell key={entry.value} fill={AREA_COLORS[index % AREA_COLORS.length]} />)}</Pie><Tooltip contentStyle={{ background: '#08214f', border: '1px solid rgba(125,211,252,.35)', color: '#fff' }} /></PieChart>
            </ResponsiveContainer>
          ) : <EmptyPanel text="Nenhum dado disponivel ainda." />}
        </ChartCard>
        <ChartCard title="Preventivas por Situacao" subtitle="Execucoes de manutencao.">
          {loading ? <EmptyPanel text="Carregando grafico..." /> : data?.preventivasPorSituacao?.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.preventivasPorSituacao} margin={{ top: 8, right: 8, left: -18, bottom: 48 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                <XAxis dataKey="name" stroke="#cbd5e1" tick={{ fontSize: 10 }} angle={-28} textAnchor="end" interval={0} height={70} />
                <YAxis allowDecimals={false} stroke="#cbd5e1" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#08214f', border: '1px solid rgba(125,211,252,.35)', color: '#fff' }} />
                <Bar dataKey="total" fill="#22c55e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyPanel text="Nenhum dado disponivel ainda." />}
        </ChartCard>
      </div>

      <section className="glass-card rounded-3xl p-5">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="text-cyan-100" size={20} />
          <h3 className="text-lg font-black text-white">Ultimas movimentacoes</h3>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(data?.ultimasMovimentacoes || []).length ? data.ultimasMovimentacoes.map((item, index) => (
            <button key={`${item.tipo}-${item.titulo}-${index}`} type="button" className="rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-200/60" onClick={() => navigate(item.path)}>
              <span className="text-xs font-black uppercase text-cyan-100">{item.tipo}</span>
              <strong className="mt-1 block text-white">{item.titulo}</strong>
              <p className="truncate text-sm text-slate-300">{item.descricao || '-'}</p>
              <small className="text-slate-500">{formatDate(item.data)}</small>
            </button>
          )) : <EmptyPanel text="Nenhum dado disponivel ainda." />}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="glass-card rounded-3xl p-5">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="text-cyan-100" size={20} />
            <h3 className="text-lg font-black text-white">Ultimas 10 Ordens de Servico</h3>
          </div>
          <div className="grid gap-3">
            {loading ? (
              <EmptyPanel text="Carregando ordens..." />
            ) : data?.ultimasOs?.length ? (
              data.ultimasOs.map((os) => (
                <div key={os.id} className="rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <strong className="text-white">{os.numero}</strong>
                      <p className="text-sm text-slate-300">{os.titulo}</p>
                      <small className="text-slate-400">{os.ebap?.nome_curto || os.ebap?.nome || '-'} - {prettyArea(os.area)}</small>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge tone={statusTone(os.status)}>{prettyStatus(os.status)}</StatusBadge>
                      <StatusBadge tone={statusTone(os.prioridade)}>{os.prioridade || '-'}</StatusBadge>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyPanel text="Nenhuma OS encontrada." />
            )}
          </div>
        </section>

        <section className="glass-card rounded-3xl p-5">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardList className="text-cyan-100" size={20} />
            <h3 className="text-lg font-black text-white">Ultimos 10 Relatorios Diarios</h3>
          </div>
          <div className="grid gap-3">
            {loading ? (
              <EmptyPanel text="Carregando relatorios..." />
            ) : data?.ultimosRelatorios?.length ? (
              data.ultimosRelatorios.map((relatorio) => (
                <div key={relatorio.id} className="rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <strong className="text-white">{relatorio.codigo}</strong>
                      <p className="text-sm text-slate-300">{relatorio.ebap?.nome_curto || relatorio.ebap?.nome || '-'} - {relatorio.operador?.nome || 'Operador nao informado'}</p>
                      <small className="text-slate-400">{formatDate(relatorio.created_at)}</small>
                    </div>
                    <StatusBadge tone={statusTone(relatorio.status)}>{prettyStatus(relatorio.status)}</StatusBadge>
                  </div>
                </div>
              ))
            ) : (
              <EmptyPanel text="Nenhum relatorio encontrado." />
            )}
          </div>
        </section>
      </div>

      <section className="glass-card rounded-3xl p-5">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle className="text-orange-100" size={20} />
          <h3 className="text-lg font-black text-white">Indicador de criticidade das EBAPs</h3>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-green-300/25 bg-green-400/10 p-4">
            <span className="text-xs font-black uppercase text-green-100">Normal</span>
            <strong className="mt-1 block text-3xl text-white">{criticidade.normais}</strong>
          </div>
          <div className="rounded-2xl border border-yellow-300/25 bg-yellow-400/10 p-4">
            <span className="text-xs font-black uppercase text-yellow-100">Atencao</span>
            <strong className="mt-1 block text-3xl text-white">{criticidade.atencao}</strong>
          </div>
          <div className="rounded-2xl border border-red-300/25 bg-red-400/10 p-4">
            <span className="text-xs font-black uppercase text-red-100">Critica</span>
            <strong className="mt-1 block text-3xl text-white">{criticidade.criticas}</strong>
          </div>
        </div>
      </section>
    </div>
  );
}

function FinanceMetric({ label, value }) {
  return (
    <div className="rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-4 transition hover:-translate-y-0.5">
      <span className="text-xs font-black uppercase text-slate-400">{label}</span>
      <strong className="mt-2 block text-xl text-white">{value}</strong>
    </div>
  );
}
