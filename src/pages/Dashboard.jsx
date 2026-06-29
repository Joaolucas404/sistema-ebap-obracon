import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock3,
  DollarSign,
  Factory,
  FileText,
  HardHat,
  PackageX,
  RefreshCcw,
  ShieldAlert,
  WalletCards,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import EbapsMap from '../components/localizacao/EbapsMap.jsx';
import KpiCard from '../components/ui/KpiCard.jsx';
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
const TABS = ['Operacao', 'SST', 'Almoxarifado', 'Compras', 'Financeiro'];

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

function prettyStatus(status) {
  return STATUS_LABELS[status] || status?.replaceAll('_', ' ') || '-';
}

function prettyArea(area) {
  return AREA_LABELS[area] || area?.replaceAll('_', ' ') || 'Nao informado';
}

function mapStatus(ebap) {
  const status = ebap.gerencial?.statusDashboard || ebap.status || ebap.status_operacional;
  if (status === 'critico' || status === 'CRITICA') return 'CRITICA';
  if (status === 'atencao' || status === 'ATENCAO') return 'ATENCAO';
  return 'OPERANDO';
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

function EmptyPanel({ text = 'Nenhum dado disponivel ainda.' }) {
  return <div className="grid min-h-36 place-items-center rounded-2xl border border-cyan-300/15 bg-navy-950/45 px-4 text-center text-sm font-bold text-slate-300">{text}</div>;
}

function ChartCard({ title, children }) {
  return (
    <section className="premium-card p-4">
      <h3 className="mb-3 text-base font-black text-white">{title}</h3>
      <div className="h-56">{children}</div>
    </section>
  );
}

function MiniMetric({ icon: Icon, label, value, tone = 'cyan' }) {
  const toneClass = {
    cyan: 'border-cyan-300/20 text-cyan-100',
    green: 'border-blue-300/20 text-blue-100',
    orange: 'border-yellow-300/20 text-yellow-100',
    red: 'border-red-300/20 text-red-100'
  };

  return (
    <div className={`rounded-2xl border bg-navy-950/45 p-3 shadow-inner ${toneClass[tone] || toneClass.cyan}`}>
      <div className="flex items-center gap-2">
        {Icon && <Icon size={17} />}
        <span className="truncate text-[11px] font-black uppercase tracking-wide text-slate-300">{label}</span>
      </div>
      <strong className="mt-1 block text-2xl font-black text-white">{value}</strong>
    </div>
  );
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

function EbapDetailPanel({ ebap, onClose }) {
  if (!ebap) return null;
  const gerencial = ebap.gerencial;
  const calculo = calcularDisponibilidadeGerencial(gerencial);
  const disponibilidadeCalculada = calculo.existentes ? ((calculo.disponiveis / calculo.existentes) * 100).toFixed(1) : '-';

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-3 backdrop-blur-sm" onClick={onClose}>
      <section className="premium-card max-h-[88vh] w-full max-w-5xl overflow-y-auto p-5 shadow-2xl shadow-black/40" onClick={(event) => event.stopPropagation()}>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cyan-400/10 text-cyan-100">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white">{ebap.nome_curto || ebap.nome}</h3>
              <p className="text-sm text-slate-300">Disponibilidade calculada e classificacao operacional do Relatorio Gerencial.</p>
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
              <MiniMetric label="Disponibilidade" value={`${gerencial.disponibilidade.toFixed(1)}%`} tone={ebapTone(gerencial.statusDashboard)} />
              <MiniMetric label="Classificacao" value={gerencial.statusRelatorio} tone={ebapTone(gerencial.statusDashboard)} />
              <MiniMetric label="Alerta visual" value={`${ebap.criticidade?.score || 0}%`} tone={ebapTone(gerencial.statusDashboard)} />
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
              <p className="mt-3 text-xs font-bold text-slate-400">
                Conta de disponibilidade: {calculo.disponiveis}/{calculo.existentes} equipamentos = {disponibilidadeCalculada}%.
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

function EbapsCompactTable({ title, ebaps, onSelect }) {
  function rowTone(ebap) {
    if (ebap.criticidade?.nivel === 'critico') return 'red';
    if (ebap.criticidade?.nivel === 'atencao') return 'orange';
    return 'green';
  }

  function barClass(ebap) {
    if (ebap.criticidade?.nivel === 'critico') return 'h-full bg-red-400';
    if (ebap.criticidade?.nivel === 'atencao') return 'h-full bg-yellow-300';
    return 'h-full bg-blue-400';
  }

  return (
    <section className="premium-card overflow-hidden p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-base font-black text-white">{title}</h3>
        <StatusBadge tone="cyan">{ebaps.length} unidades</StatusBadge>
      </div>
      <div className="max-h-[360px] overflow-auto pr-1">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="sticky top-0 z-10 bg-[#0a2a62] text-[11px] uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-3 py-2">EBAP</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Criticidade</th>
              <th className="px-3 py-2">OS</th>
              <th className="px-3 py-2">RDO</th>
              <th className="px-3 py-2">Atualizacao</th>
            </tr>
          </thead>
          <tbody>
            {ebaps.length ? ebaps.map((ebap) => (
              <tr key={ebap.id} className="border-t border-cyan-300/10 transition hover:bg-white/5">
                <td className="px-3 py-2">
                  <button type="button" className="font-black text-white hover:text-cyan-100" onClick={() => onSelect(ebap)}>
                    {ebap.nome_curto || ebap.nome}
                  </button>
                  <small className="block text-slate-400">{ebap.codigo || ebap.bairro || 'EBAP'}</small>
                </td>
                <td className="px-3 py-2">
                  <StatusBadge tone={rowTone(ebap)}>{ebap.criticidade?.label || 'Normal'}</StatusBadge>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-20 overflow-hidden rounded-full bg-navy-950">
                      <div className={barClass(ebap)} style={{ width: `${ebap.criticidade?.score || 0}%` }} />
                    </div>
                    <strong className="text-white">{ebap.criticidade?.score || 0}%</strong>
                  </div>
                </td>
                <td className="px-3 py-2 font-black text-white">{ebap.ordensAbertas || 0}</td>
                <td className="px-3 py-2 font-black text-white">{ebap.roPendentes || 0}</td>
                <td className="px-3 py-2 text-xs font-bold text-slate-300">{timeAgo(ebap.updatedAt)}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" className="px-3 py-8 text-center text-sm font-bold text-slate-300">Nenhuma EBAP cadastrada.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MovimentoList({ items = [], navigate }) {
  return (
    <div className="grid gap-2">
      {items.length ? items.slice(0, 8).map((item, index) => (
        <button key={`${item.tipo}-${item.titulo}-${index}`} type="button" className="rounded-2xl border border-cyan-300/15 bg-navy-950/55 px-3 py-2 text-left transition hover:border-cyan-200/60" onClick={() => navigate(item.path)}>
          <span className="text-[11px] font-black uppercase text-cyan-100">{item.tipo}</span>
          <strong className="block truncate text-sm text-white">{item.titulo}</strong>
          <small className="block truncate text-slate-400">{item.descricao || '-'} - {formatDate(item.data)}</small>
        </button>
      )) : <EmptyPanel />}
    </div>
  );
}

function TabButton({ active, children, onClick }) {
  return (
    <button type="button" className={active ? 'primary-button min-h-10 px-4' : 'secondary-button min-h-10 px-4'} onClick={onClick}>
      {children}
    </button>
  );
}

function DashboardTabs({ activeTab, setActiveTab, data, loading, navigate }) {
  return (
    <section className="premium-card p-4">
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <TabButton key={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)}>
            {tab}
          </TabButton>
        ))}
      </div>

      {activeTab === 'Operacao' && (
        <div className="grid gap-4 xl:grid-cols-[1fr_1fr_0.9fr]">
          <ChartCard title="OS por Status">
            {loading ? <EmptyPanel text="Carregando..." /> : data?.osPorStatus?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.osPorStatus} margin={{ top: 8, right: 8, left: -18, bottom: 42 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                  <XAxis dataKey="name" stroke="#cbd5e1" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" interval={0} height={58} />
                  <YAxis allowDecimals={false} stroke="#cbd5e1" tick={{ fontSize: 11 }} />
                  <Tooltip cursor={{ fill: 'rgba(56,189,248,0.08)' }} contentStyle={{ background: '#08214f', border: '1px solid rgba(125,211,252,.35)', color: '#fff' }} />
                  <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                    {data.osPorStatus.map((entry) => <Cell key={entry.value} fill={STATUS_COLORS[entry.value] || '#38bdf8'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyPanel />}
          </ChartCard>
          <ChartCard title="OS por Area">
            {loading ? <EmptyPanel text="Carregando..." /> : data?.osPorArea?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.osPorArea} dataKey="total" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={3}>
                    {data.osPorArea.map((entry, index) => <Cell key={entry.value} fill={AREA_COLORS[index % AREA_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#08214f', border: '1px solid rgba(125,211,252,.35)', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyPanel />}
          </ChartCard>
          <section className="premium-card p-4">
            <h3 className="mb-3 text-base font-black text-white">Ultimas movimentacoes</h3>
            <MovimentoList items={data?.ultimasMovimentacoes || []} navigate={navigate} />
          </section>
        </div>
      )}

      {activeTab === 'SST' && (
        <div className="grid gap-4 xl:grid-cols-[0.7fr_1fr_1fr]">
          <KpiCard icon={HardHat} label="APR pendentes" value={loading ? '...' : data?.kpis.aprPendentes ?? 0} helper="SST aguardando acao" tone="orange" />
          <ChartCard title="Preventivas por Situacao">
            {loading ? <EmptyPanel text="Carregando..." /> : data?.preventivasPorSituacao?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.preventivasPorSituacao} margin={{ top: 8, right: 8, left: -18, bottom: 42 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                  <XAxis dataKey="name" stroke="#cbd5e1" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" interval={0} height={58} />
                  <YAxis allowDecimals={false} stroke="#cbd5e1" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#08214f', border: '1px solid rgba(125,211,252,.35)', color: '#fff' }} />
                  <Bar dataKey="total" fill="#22c55e" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyPanel />}
          </ChartCard>
          <section className="premium-card p-4">
            <h3 className="mb-3 text-base font-black text-white">Movimentacoes SST</h3>
            <MovimentoList items={(data?.ultimasMovimentacoes || []).filter((item) => ['APR', 'SST'].includes(item.tipo))} navigate={navigate} />
          </section>
        </div>
      )}

      {activeTab === 'Almoxarifado' && (
        <div className="grid gap-4 md:grid-cols-2">
          <KpiCard icon={PackageX} label="Estoque critico" value={loading ? '...' : data?.kpis.estoqueCritico ?? 0} helper="Itens zerados ou abaixo do minimo" tone="red" />
          <section className="premium-card p-4">
            <h3 className="mb-3 text-base font-black text-white">Leitura executiva</h3>
            <p className="text-sm leading-6 text-slate-300">O indicador mostra itens em estoque critico vindos do Supabase. A lista detalhada permanece no modulo Almoxarifado para evitar excesso de informacao na home executiva.</p>
          </section>
        </div>
      )}

      {activeTab === 'Compras' && (
        <div className="grid gap-4 xl:grid-cols-[0.7fr_1fr_1fr]">
          <KpiCard icon={WalletCards} label="Compras pendentes" value={loading ? '...' : data?.kpis.comprasPendentes ?? 0} helper="Cotacao ou aprovacao" tone="orange" />
          <ChartCard title="Compras por Status">
            {loading ? <EmptyPanel text="Carregando..." /> : data?.comprasPorStatus?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.comprasPorStatus} dataKey="total" nameKey="name" innerRadius={52} outerRadius={82}>
                    {data.comprasPorStatus.map((entry, index) => <Cell key={entry.value} fill={AREA_COLORS[index % AREA_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#08214f', border: '1px solid rgba(125,211,252,.35)', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyPanel />}
          </ChartCard>
          <section className="premium-card p-4">
            <h3 className="mb-3 text-base font-black text-white">Ultimas compras</h3>
            <MovimentoList items={(data?.ultimasMovimentacoes || []).filter((item) => item.tipo === 'Compra')} navigate={navigate} />
          </section>
        </div>
      )}

      {activeTab === 'Financeiro' && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MiniMetric icon={DollarSign} label="Valor medido no mes" value={money(data?.kpis.valorMedidoMes)} tone="cyan" />
          <MiniMetric icon={CheckCircle2} label="Valor aprovado" value={money(data?.kpis.valorAprovado)} tone="green" />
          <MiniMetric icon={AlertTriangle} label="Valor glosado" value={money(data?.kpis.valorGlosado)} tone="red" />
          <MiniMetric icon={WalletCards} label="Medicoes pendentes" value={data?.kpis.medicoesPendentes || 0} tone="orange" />
        </div>
      )}
    </section>
  );
}

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEbap, setSelectedEbap] = useState(null);
  const [activeTab, setActiveTab] = useState('Operacao');

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

  const rankedEbaps = useMemo(() => {
    const ebaps = data?.ebaps || [];
    const byScore = (a, b) => (b.criticidade?.score || 0) - (a.criticidade?.score || 0) || (b.ordensAbertas || 0) - (a.ordensAbertas || 0);
    return [...ebaps].sort(byScore);
  }, [data?.ebaps]);

  const mapEbaps = useMemo(() => (
    (data?.ebaps || []).map((ebap) => ({
      ...ebap,
      status_operacional: mapStatus(ebap),
      os_abertas: ebap.ordensAbertas,
      ro_pendentes: ebap.roPendentes
    }))
  ), [data?.ebaps]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);

  return (
    <div className="grid gap-3">
      <section className="page-surface">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-black leading-tight text-white">{greeting}, {user?.nome || 'Operacao'}</h2>
            <p className="text-sm text-slate-300">Portal Executivo EBAPs - {new Date().toLocaleString('pt-BR')}</p>
          </div>
          <button type="button" className="secondary-button" onClick={loadDashboard} disabled={loading}>
            <RefreshCcw size={17} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>
        </div>
      </section>

      {error && <div className="rounded-2xl border border-red-300/30 bg-red-500/15 p-4 text-sm font-bold text-red-100">{error}</div>}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <MiniMetric icon={ClipboardList} label="OS abertas" value={loading ? '...' : data?.kpis.osAbertas ?? 0} tone="cyan" />
        <MiniMetric icon={ShieldAlert} label="OS criticas" value={loading ? '...' : data?.kpis.osCriticas ?? 0} tone="red" />
        <MiniMetric icon={Clock3} label="Aguard. supervisor" value={loading ? '...' : data?.kpis.osAguardandoSupervisor ?? 0} tone="orange" />
        <MiniMetric icon={FileText} label="RDO pendentes" value={loading ? '...' : data?.kpis.roPendentes ?? 0} tone="orange" />
        <MiniMetric icon={Factory} label="EBAPs criticas" value={loading ? '...' : criticidade.criticas} tone="red" />
        <MiniMetric icon={CheckCircle2} label="OS concluidas hoje" value={loading ? '...' : data?.kpis.osConcluidasHoje ?? 0} tone="green" />
      </section>

      <section className="grid gap-3 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="premium-card p-4">
          <div className="mb-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-base font-black text-white">Mapa operacional</h3>
              <p className="text-xs text-slate-300">Resumo georreferenciado das EBAPs cadastradas.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge tone="green">{criticidade.normais} operando</StatusBadge>
              <StatusBadge tone="orange">{criticidade.atencao} atencao</StatusBadge>
              <StatusBadge tone="red">{criticidade.criticas} critica</StatusBadge>
            </div>
          </div>
          <EbapsMap ebaps={mapEbaps} onSelect={setSelectedEbap} compact />
        </section>

        <EbapsCompactTable title="Todas as EBAPs" ebaps={rankedEbaps} onSelect={setSelectedEbap} />
      </section>

      <DashboardTabs activeTab={activeTab} setActiveTab={setActiveTab} data={data} loading={loading} navigate={navigate} />

      <EbapDetailPanel ebap={selectedEbap} onClose={() => setSelectedEbap(null)} />
    </div>
  );
}
