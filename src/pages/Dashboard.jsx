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
  programada: '#3B82F6',
  encaminhada_tecnicos: '#06b6d4',
  em_execucao: '#3b82f6',
  concluida_tecnicos: '#6366F1',
  validacao_supervisor: '#a78bfa',
  enviada_prefeitura: '#60a5fa',
  aguardando_validacao_prefeitura: '#f97316',
  nao_conforme: '#ef4444',
  concluida_arquivada: '#3B82F6',
  concluida: '#3B82F6',
  finalizada: '#3B82F6',
  cancelada: '#94a3b8',
  rejeitada: '#ef4444',
  aberta: '#38bdf8',
  em_analise: '#facc15',
  aguardando_material: '#fb923c'
};

const AREA_COLORS = ['#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#6366f1', '#818cf8', '#bfdbfe'];
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
  if (['normal', 'concluida_arquivada', 'concluida', 'finalizada', 'validado_cco'].includes(status)) return 'blue';
  if (['critico', 'critica', 'nao_conforme', 'rejeitada', 'cancelada', 'rejeitado_cco'].includes(status)) return 'red';
  if (['atencao', 'aguardando_supervisor', 'analise_supervisor', 'aguardando_validacao_prefeitura', 'correcao_solicitada'].includes(status)) return 'orange';
  return 'cyan';
}

function ebapTone(status) {
  if (status === 'critico') return 'red';
  if (status === 'atencao') return 'orange';
  return 'blue';
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
  return <div className="grid min-h-36 place-items-center rounded-xl bg-[#0A1633]/45 px-4 text-center text-sm font-bold text-slate-300">{text}</div>;
}

function ChartCard({ title, children }) {
  return (
    <section className="rounded-2xl border border-blue-200/10 bg-[#10224D]/72 p-5 shadow-xl shadow-black/15">
      <h3 className="mb-3 text-base font-black text-white">{title}</h3>
      <div className="h-56">{children}</div>
    </section>
  );
}

function ExecutiveKpi({ icon: Icon, label, value, helper, tone = 'blue' }) {
  const toneClass = {
    blue: 'bg-blue-500/20 text-blue-100 ring-blue-300/25',
    cyan: 'bg-sky-500/18 text-sky-100 ring-sky-300/25',
    orange: 'bg-amber-500/16 text-amber-100 ring-amber-300/25',
    red: 'bg-red-500/16 text-red-100 ring-red-300/25',
    indigo: 'bg-indigo-500/18 text-indigo-100 ring-indigo-300/25'
  };

  return (
    <article className="rounded-2xl border border-blue-200/12 bg-[#10224D]/76 p-4 shadow-xl shadow-black/14">
      <div className="flex items-start gap-3">
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ring-1 ${toneClass[tone] || toneClass.blue}`}>
          {Icon && <Icon size={22} />}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[11px] font-black uppercase tracking-[0.12em] text-slate-300">{label}</span>
          <strong className="mt-1 block text-3xl font-black leading-none text-white">{value}</strong>
          {helper && <small className="mt-2 block truncate text-xs font-bold text-slate-400">{helper}</small>}
        </span>
      </div>
    </article>
  );
}

function MiniMetric({ icon: Icon, label, value, tone = 'cyan' }) {
  const toneClass = {
    cyan: 'text-blue-100',
    green: 'text-blue-100',
    orange: 'text-blue-100',
    red: 'text-blue-100',
    blue: 'text-blue-100'
  };

  return (
    <div className={`rounded-2xl bg-[#10224D]/55 p-3 shadow-inner shadow-blue-950/20 ${toneClass[tone] || toneClass.cyan}`}>
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
    <div className="rounded-2xl bg-[#0A1633]/45 p-4">
      <span className="text-xs font-black uppercase text-slate-400">{label}</span>
      <strong className="mt-1 block text-2xl text-white">{value || '-'}</strong>
      {percentage !== null && (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-navy-950">
          <div className="h-full rounded-full bg-blue-400" style={{ width: `${percentage}%` }} />
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
    return 'blue';
  }

  function barClass(ebap) {
    if (ebap.criticidade?.nivel === 'critico') return 'h-full bg-red-400';
    if (ebap.criticidade?.nivel === 'atencao') return 'h-full bg-yellow-300';
    return 'h-full bg-blue-400';
  }

  return (
    <section className="rounded-2xl border border-blue-200/10 bg-[#10224D]/72 p-5 shadow-xl shadow-black/15">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-blue-200/10 pb-4">
        <div>
          <h3 className="text-base font-black text-white">{title}</h3>
          <p className="text-xs font-semibold text-slate-400">Ordenadas por criticidade</p>
        </div>
        <StatusBadge tone="blue">{ebaps.length}</StatusBadge>
      </div>
      <div className="grid max-h-[70vh] gap-2 overflow-auto pr-1">
        {ebaps.length ? ebaps.map((ebap) => (
          <button
            key={ebap.id}
            type="button"
            className="rounded-xl border border-transparent bg-transparent p-3 text-left transition hover:bg-blue-500/10"
            onClick={() => onSelect(ebap)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <strong className="block truncate text-sm font-black text-white">{ebap.nome_curto || ebap.nome}</strong>
                <small className="block truncate text-xs font-semibold text-slate-400">{ebap.codigo || ebap.bairro || 'EBAP'} - {timeAgo(ebap.updatedAt)}</small>
              </div>
              <StatusBadge tone={rowTone(ebap)}>{ebap.criticidade?.label || 'Normal'}</StatusBadge>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#061431]">
                <div className={barClass(ebap)} style={{ width: `${ebap.criticidade?.score || 0}%` }} />
              </div>
              <strong className="text-xs font-black text-white">{ebap.criticidade?.score || 0}%</strong>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-black text-slate-200">
              <span className="rounded-lg bg-blue-950/45 px-2 py-1.5">OS: {ebap.ordensAbertas || 0}</span>
              <span className="rounded-lg bg-blue-950/45 px-2 py-1.5">RDO: {ebap.roPendentes || 0}</span>
            </div>
          </button>
        )) : (
          <EmptyPanel text="Nenhuma EBAP cadastrada." />
        )}
      </div>
    </section>
  );
}

function MovimentoList({ items = [], navigate }) {
  return (
    <div className="grid gap-2">
      {items.length ? items.slice(0, 8).map((item, index) => (
        <button key={`${item.tipo}-${item.titulo}-${index}`} type="button" className="rounded-xl border border-transparent bg-[#0A1633]/30 px-3 py-2 text-left transition hover:bg-blue-500/10" onClick={() => navigate(item.path)}>
          <span className="text-[11px] font-black uppercase text-blue-100">{item.tipo}</span>
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
    <section className="grid gap-4">
      <div className="flex flex-wrap gap-2">
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
          <section className="rounded-2xl border border-blue-200/10 bg-[#10224D]/72 p-5 shadow-xl shadow-black/15">
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
                  <Bar dataKey="total" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyPanel />}
          </ChartCard>
          <section className="rounded-2xl border border-blue-200/10 bg-[#10224D]/72 p-5 shadow-xl shadow-black/15">
            <h3 className="mb-3 text-base font-black text-white">Movimentacoes SST</h3>
            <MovimentoList items={(data?.ultimasMovimentacoes || []).filter((item) => ['APR', 'SST'].includes(item.tipo))} navigate={navigate} />
          </section>
        </div>
      )}

      {activeTab === 'Almoxarifado' && (
        <div className="grid gap-4 md:grid-cols-2">
          <KpiCard icon={PackageX} label="Estoque critico" value={loading ? '...' : data?.kpis.estoqueCritico ?? 0} helper="Itens zerados ou abaixo do minimo" tone="red" />
          <section className="rounded-2xl border border-blue-200/10 bg-[#10224D]/72 p-5 shadow-xl shadow-black/15">
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
          <section className="rounded-2xl border border-blue-200/10 bg-[#10224D]/72 p-5 shadow-xl shadow-black/15">
            <h3 className="mb-3 text-base font-black text-white">Ultimas compras</h3>
            <MovimentoList items={(data?.ultimasMovimentacoes || []).filter((item) => item.tipo === 'Compra')} navigate={navigate} />
          </section>
        </div>
      )}

      {activeTab === 'Financeiro' && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MiniMetric icon={DollarSign} label="Valor medido no mes" value={money(data?.kpis.valorMedidoMes)} tone="cyan" />
          <MiniMetric icon={CheckCircle2} label="Valor aprovado" value={money(data?.kpis.valorAprovado)} tone="blue" />
          <MiniMetric icon={AlertTriangle} label="Valor glosado" value={money(data?.kpis.valorGlosado)} tone="red" />
          <MiniMetric icon={WalletCards} label="Medicoes pendentes" value={data?.kpis.medicoesPendentes || 0} tone="orange" />
        </div>
      )}
    </section>
  );
}

function MobileDashboard({ user, data, loading, error, criticidade, rankedEbaps, greeting, onRefresh, onSelectEbap, navigate }) {
  const topEbaps = rankedEbaps.slice(0, 6);

  return (
    <div className="grid gap-4 md:hidden">
      <section className="rounded-[28px] border border-blue-200/15 bg-[#10224D]/85 p-5 shadow-xl shadow-black/20">
        <span className="text-xs font-black uppercase tracking-[0.18em] text-blue-200/70">Dashboard mobile</span>
        <h1 className="mt-2 text-2xl font-black text-white">{greeting}, {user?.nome || 'Operação'}</h1>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-300">
          Resumo rápido para acompanhamento em celular e tablet.
        </p>
        <button type="button" className="secondary-button mt-4 w-full" onClick={onRefresh} disabled={loading}>
          <RefreshCcw size={17} className={loading ? 'animate-spin' : ''} />
          Atualizar indicadores
        </button>
      </section>

      {error && <div className="rounded-2xl border border-red-300/30 bg-red-500/15 p-4 text-sm font-bold text-red-100">{error}</div>}

      <section className="grid grid-cols-2 gap-3">
        <MiniMetric icon={ClipboardList} label="OS abertas" value={loading ? '...' : data?.kpis.osAbertas ?? 0} tone="cyan" />
        <MiniMetric icon={ShieldAlert} label="OS críticas" value={loading ? '...' : data?.kpis.osCriticas ?? 0} tone="red" />
        <MiniMetric icon={FileText} label="RDO pendentes" value={loading ? '...' : data?.kpis.roPendentes ?? 0} tone="orange" />
        <MiniMetric icon={Factory} label="EBAPs críticas" value={loading ? '...' : criticidade.criticas} tone="red" />
      </section>

      <section className="grid gap-3">
        <button type="button" className="primary-button min-h-14 justify-between px-5" onClick={() => navigate('/os?nova=1')}>
          Abrir OS
          <ClipboardList size={20} />
        </button>
        <button type="button" className="secondary-button min-h-14 justify-between px-5" onClick={() => navigate('/relatorio')}>
          Abrir RDO
          <FileText size={20} />
        </button>
      </section>

      <section className="rounded-[28px] border border-blue-200/15 bg-[#10224D]/80 p-4 shadow-xl shadow-black/20">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-black text-white">EBAPs em atenção</h2>
            <p className="text-xs font-semibold text-slate-300">Ordenadas por criticidade operacional.</p>
          </div>
          <StatusBadge tone="red">{criticidade.criticas}</StatusBadge>
        </div>

        <div className="grid gap-3">
          {topEbaps.length ? topEbaps.map((ebap) => (
            <button
              key={ebap.id}
              type="button"
              className="rounded-2xl border border-blue-200/12 bg-[#0A1633]/65 p-4 text-left shadow-inner shadow-white/5"
              onClick={() => onSelectEbap(ebap)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <strong className="block truncate text-base font-black text-white">{ebap.nome_curto || ebap.nome}</strong>
                  <span className="mt-1 block text-xs font-bold text-slate-400">{ebap.codigo || ebap.bairro || 'EBAP'}</span>
                </div>
                <StatusBadge tone={ebap.criticidade?.nivel === 'critico' ? 'red' : ebap.criticidade?.nivel === 'atencao' ? 'orange' : 'cyan'}>
                  {ebap.criticidade?.label || 'Normal'}
                </StatusBadge>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <MiniMetric label="Crit." value={`${ebap.criticidade?.score || 0}%`} tone={ebap.criticidade?.nivel === 'critico' ? 'red' : 'orange'} />
                <MiniMetric label="OS" value={ebap.ordensAbertas || 0} tone="cyan" />
                <MiniMetric label="RDO" value={ebap.roPendentes || 0} tone="orange" />
              </div>
            </button>
          )) : (
            <EmptyPanel text="Nenhuma EBAP encontrada." />
          )}
        </div>
      </section>

      <section className="rounded-[28px] border border-blue-200/15 bg-[#10224D]/80 p-4 shadow-xl shadow-black/20">
        <h2 className="text-lg font-black text-white">Últimas movimentações</h2>
        <div className="mt-3">
          <MovimentoList items={data?.ultimasMovimentacoes || []} navigate={navigate} />
        </div>
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
    <>
      <MobileDashboard
        user={user}
        data={data}
        loading={loading}
        error={error}
        criticidade={criticidade}
        rankedEbaps={rankedEbaps}
        greeting={greeting}
        onRefresh={loadDashboard}
        onSelectEbap={setSelectedEbap}
        navigate={navigate}
      />
      <div className="hidden gap-7 md:grid">
      <section className="px-1 pt-2">
        <div className="grid gap-5 xl:grid-cols-[minmax(280px,0.75fr)_minmax(0,1.9fr)_auto] xl:items-end">
          <div className="min-w-0">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-blue-200/70">Dashboard operacional</span>
            <h2 className="mt-1 truncate text-2xl font-black leading-tight text-white">{greeting}, {user?.nome || 'Operacao'}</h2>
            <p className="mt-1 text-sm font-semibold text-slate-300">{new Date().toLocaleString('pt-BR')}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-6">
            <ExecutiveKpi icon={ClipboardList} label="OS abertas" value={loading ? '...' : data?.kpis.osAbertas ?? 0} helper="hoje" tone="blue" />
            <ExecutiveKpi icon={ShieldAlert} label="OS criticas" value={loading ? '...' : data?.kpis.osCriticas ?? 0} helper="prioridade alta" tone="red" />
            <ExecutiveKpi icon={Clock3} label="Supervisor" value={loading ? '...' : data?.kpis.osAguardandoSupervisor ?? 0} helper="em análise" tone="orange" />
            <ExecutiveKpi icon={FileText} label="RDO pend." value={loading ? '...' : data?.kpis.roPendentes ?? 0} helper="validação" tone="indigo" />
            <ExecutiveKpi icon={Factory} label="EBAPs crit." value={loading ? '...' : criticidade.criticas} helper="atenção" tone="red" />
            <ExecutiveKpi icon={CheckCircle2} label="Concl. hoje" value={loading ? '...' : data?.kpis.osConcluidasHoje ?? 0} helper="execução" tone="cyan" />
          </div>
          <button type="button" className="primary-button min-h-12 justify-center px-5" onClick={loadDashboard} disabled={loading}>
            <RefreshCcw size={17} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>
        </div>
      </section>

      {error && <div className="rounded-2xl border border-red-300/30 bg-red-500/15 p-4 text-sm font-bold text-red-100">{error}</div>}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,3.15fr)_minmax(320px,1fr)]">
        <section className="rounded-2xl border border-blue-200/10 bg-[#10224D]/72 p-5 shadow-xl shadow-black/15">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-black text-white">Mapa operacional</h3>
              <p className="text-sm font-semibold text-slate-300">Visao georreferenciada das EBAPs cadastradas.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge tone="blue">{criticidade.normais} operando</StatusBadge>
              <StatusBadge tone="orange">{criticidade.atencao} atencao</StatusBadge>
              <StatusBadge tone="red">{criticidade.criticas} critica</StatusBadge>
            </div>
          </div>
          <EbapsMap ebaps={mapEbaps} onSelect={setSelectedEbap} surface={false} />
        </section>

        <EbapsCompactTable title="Todas as EBAPs" ebaps={rankedEbaps} onSelect={setSelectedEbap} />
      </section>

      <DashboardTabs activeTab={activeTab} setActiveTab={setActiveTab} data={data} loading={loading} navigate={navigate} />

    </div>
    <EbapDetailPanel ebap={selectedEbap} onClose={() => setSelectedEbap(null)} />
    </>
  );
}
