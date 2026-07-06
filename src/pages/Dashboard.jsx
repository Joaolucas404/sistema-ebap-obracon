import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  MapPinned,
  MessageCircle,
  RefreshCcw,
  ShieldAlert,
  UserCog,
  WalletCards,
  Wrench
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import Card, { CardHeader } from '../components/ui/Card.jsx';
import DonutChart from '../components/ui/DonutChart.jsx';
import HorizontalBarChart, { getChartToneColor } from '../components/ui/HorizontalBarChart.jsx';
import KpiCard from '../components/ui/KpiCard.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import { normalizePerfil } from '../config/permissions.js';
import { AREA_LABELS, obterDashboardExecutivo, STATUS_LABELS } from '../services/dashboardService.js';
import { useAuthStore } from '../store/authStore.js';

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
  if (minutes < 1) return 'Agora';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h`;
  return formatDate(value);
}

function money(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function prettyStatus(status) {
  return STATUS_LABELS[status] || String(status || '-').replaceAll('_', ' ');
}

function prettyArea(area) {
  return AREA_LABELS[area] || String(area || 'Não informado').replaceAll('_', ' ');
}

function statusTone(status) {
  if (['critico', 'critica', 'nao_conforme', 'rejeitada', 'cancelada'].includes(status)) return 'red';
  if (['atencao', 'aguardando_supervisor', 'analise_supervisor', 'aguardando_validacao_prefeitura'].includes(status)) return 'orange';
  if (['concluida_arquivada', 'concluida', 'finalizada', 'validado_cco', 'normal'].includes(status)) return 'blue';
  return 'cyan';
}

function getDashboardRole(perfil) {
  const role = normalizePerfil(perfil);
  if (['diretoria', 'gerencia'].includes(role)) return 'diretoria';
  if (['prefeitura', 'fiscal_operacional'].includes(role)) return 'prefeitura';
  if (role === 'supervisor') return 'supervisor';
  return 'operador';
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function profileCopy(role, userName) {
  const name = userName || 'usuario';
  const config = {
    operador: {
      eyebrow: 'Painel do Operador',
      title: `${getGreeting()}, ${name}`,
      description: 'Resumo rápido do turno, RDOs, OS e pontos que precisam de acao em campo.'
    },
    supervisor: {
      eyebrow: 'Painel da Supervisao',
      title: `${getGreeting()}, ${name}`,
      description: 'Fila de validação, prioridades técnicas e situação operacional das EBAPs.'
    },
    diretoria: {
      eyebrow: 'Dashboard Executivo',
      title: 'Situação geral da operação',
      description: 'KPIs, riscos, prioridades e movimentações recentes para decisão rápida.'
    },
    prefeitura: {
      eyebrow: 'Acompanhamento Operacional',
      title: `${getGreeting()}, ${name}`,
      description: 'Solicitacoes, status de atendimento e últimas atualizacoes liberadas para acompanhamento.'
    }
  };

  return config[role] || config.operador;
}

function buildKpis(role, data, summary) {
  const kpis = data?.kpis || {};
  const common = {
    osAbertas: { icon: ClipboardList, label: 'OS abertas', value: kpis.osAbertas || 0, helper: 'em atendimento', tone: 'blue' },
    osCriticas: { icon: ShieldAlert, label: 'OS críticas', value: kpis.osCriticas || 0, helper: 'prioridade alta', tone: 'red' },
    rdoPendentes: { icon: FileText, label: 'RDO pendentes', value: kpis.roPendentes || 0, helper: 'validacao CCO', tone: 'orange' },
    ebapsCriticas: { icon: AlertTriangle, label: 'EBAPs críticas', value: summary.criticas, helper: `${summary.atencao} em atenção`, tone: 'red' },
    concluidasHoje: { icon: CheckCircle2, label: 'Concluídas hoje', value: kpis.osConcluidasHoje || 0, helper: 'OS finalizadas', tone: 'blue' }
  };

  if (role === 'operador') {
    return [
      common.rdoPendentes,
      common.osAbertas,
      { icon: Building2, label: 'EBAPs operando', value: summary.operando, helper: 'situacao normal', tone: 'blue' },
      common.ebapsCriticas
    ];
  }

  if (role === 'supervisor') {
    return [
      { icon: UserCog, label: 'Aguardando supervisor', value: kpis.osAguardandoSupervisor || 0, helper: 'para analise', tone: 'orange' },
      common.osCriticas,
      common.osAbertas,
      common.rdoPendentes,
      common.concluidasHoje
    ];
  }

  if (role === 'prefeitura') {
    return [
      common.osAbertas,
      common.concluidasHoje,
      { icon: Clock3, label: 'Em acompanhamento', value: kpis.osAguardandoSupervisor || 0, helper: 'em fluxo interno', tone: 'orange' },
      common.ebapsCriticas
    ];
  }

  return [
    common.osAbertas,
    common.osCriticas,
    { icon: UserCog, label: 'Supervisor', value: kpis.osAguardandoSupervisor || 0, helper: 'em analise', tone: 'orange' },
    common.rdoPendentes,
    common.ebapsCriticas,
    common.concluidasHoje
  ];
}

function buildActions(role) {
  const actions = {
    operador: [
      { label: 'Abrir RDO', path: '/relatorio', icon: FileText, description: 'Registrar turno e fotos.' },
      { label: 'Abrir OS', path: '/os', icon: Wrench, description: 'Solicitar atendimento.' },
      { label: 'Comunicar CCO', path: '/comunicacao', icon: MessageCircle, description: 'Chat operacional.' },
      { label: 'Mapa Operacional', path: '/localizacao-ebaps', icon: MapPinned, description: 'Ver EBAPs no mapa.' }
    ],
    supervisor: [
      { label: 'Fila de supervisão', path: '/supervisao', icon: UserCog, description: 'Analisar OS pendentes.' },
      { label: 'Ordens de Serviço', path: '/os', icon: Wrench, description: 'Acompanhar execução.' },
      { label: 'Validar RDO', path: '/cco-relatorios-diarios', icon: FileText, description: 'Revisar diarios.' },
      { label: 'Mapa Operacional', path: '/localizacao-ebaps', icon: MapPinned, description: 'Ver unidades.' }
    ],
    diretoria: [
      { label: 'Ordens de Serviço', path: '/os', icon: Wrench, description: 'Ver carteira operacional.' },
      { label: 'Administrativo', path: '/administrativo', icon: Building2, description: 'RH, DP e frota.' },
      { label: 'Financeiro', path: '/financeiro-contrato', icon: WalletCards, description: 'Medições e custos.' },
      { label: 'Mapa Operacional', path: '/localizacao-ebaps', icon: MapPinned, description: 'Visão geografica.' }
    ],
    prefeitura: [
      { label: 'Abrir solicitacao', path: '/os', icon: Wrench, description: 'Registrar demanda.' },
      { label: 'Minhas solicitacoes', path: '/os', icon: ClipboardList, description: 'Acompanhar status.' },
      { label: 'Comunicar equipe', path: '/comunicacao', icon: MessageCircle, description: 'Mensagens.' }
    ]
  };

  return actions[role] || actions.operador;
}

function EmptyPanel({ text = 'Nenhum dado disponível no momento.' }) {
  return <div className="grid min-h-32 place-items-center rounded-xl bg-white/[0.04] px-4 text-center text-sm font-bold text-slate-300">{text}</div>;
}

function DashboardHeader({ copy, loading, onRefresh }) {
  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <span className="text-xs font-black uppercase tracking-[0.22em] text-blue-200">{copy.eyebrow}</span>
        <h1 className="page-title mt-2 text-3xl leading-tight text-white md:text-4xl">{copy.title}</h1>
        <p className="mt-2 max-w-4xl text-sm font-normal leading-6 text-slate-300 md:text-base">{copy.description}</p>
      </div>
      <Button icon={RefreshCcw} loading={loading} onClick={onRefresh} size="lg" variant="primary">
        Atualizar
      </Button>
    </div>
  );
}

function ChartCard({ title, description, children }) {
  return (
    <Card className="min-h-[340px]" padding="lg">
      <CardHeader title={title} description={description} />
      <div className="mt-5 min-w-0">{children}</div>
    </Card>
  );
}

function PriorityList({ ebaps, navigate }) {
  return (
    <Card className="min-h-[420px]" padding="lg">
      <CardHeader
        title="Prioridades operacionais"
        description="Unidades que exigem atenção primeiro."
        action={<Button icon={MapPinned} onClick={() => navigate('/localizacao-ebaps')} variant="outline">Abrir mapa</Button>}
      />
      <div className="mt-5 grid gap-3">
        {ebaps.length ? ebaps.slice(0, 6).map((ebap, index) => (
          <button
            key={ebap.id || ebap.nome || index}
            type="button"
            className="rounded-2xl border border-blue-200/10 bg-white/[0.04] p-4 text-left transition hover:border-blue-300/30 hover:bg-blue-500/10"
            onClick={() => navigate('/localizacao-ebaps')}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">#{index + 1}</span>
                <h3 className="mt-1 text-lg font-black leading-tight text-white">{ebap.nome_curto || ebap.nome}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-300">
                  OS: {ebap.ordensAbertas || 0} | RDO: {ebap.roPendentes || 0} | Atualizado {timeAgo(ebap.updatedAt)}
                </p>
              </div>
              <StatusBadge tone={statusTone(ebap.criticidade?.nivel)} size="md">{ebap.criticidade?.label || 'Normal'}</StatusBadge>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#0A1633]">
                <div className="h-full rounded-full bg-blue-400" style={{ width: `${Math.min(100, ebap.criticidade?.score || 0)}%` }} />
              </div>
              <strong className="text-sm text-white">{ebap.criticidade?.score || 0}%</strong>
            </div>
          </button>
        )) : <EmptyPanel text="Nenhuma EBAP prioritaria no momento." />}
      </div>
    </Card>
  );
}

function RecentActivity({ items, navigate }) {
  return (
    <Card className="min-h-[420px]" padding="lg">
      <CardHeader title="Atividades recentes" description="Últimas movimentações relevantes do SIGEBAP." />
      <div className="mt-5 grid gap-3">
        {items?.length ? items.slice(0, 7).map((item, index) => (
          <button
            key={`${item.tipo}-${item.titulo}-${index}`}
            type="button"
            className="rounded-2xl border border-blue-200/10 bg-white/[0.04] p-4 text-left transition hover:border-blue-300/30 hover:bg-blue-500/10"
            onClick={() => item.path && navigate(item.path)}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <StatusBadge tone={item.tipo === 'OS' ? 'red' : item.tipo === 'RDO' ? 'orange' : 'blue'}>{item.tipo}</StatusBadge>
                <h3 className="mt-3 text-base font-black leading-tight text-white">{item.titulo || 'Movimentacao'}</h3>
                <p className="mt-1 text-sm font-semibold leading-5 text-slate-300">{item.descricao || '-'}</p>
              </div>
              <span className="text-sm font-bold text-slate-400">{timeAgo(item.data)}</span>
            </div>
          </button>
        )) : <EmptyPanel text="Nenhuma atividade recente encontrada." />}
      </div>
    </Card>
  );
}

function QuickActions({ role, navigate }) {
  const actions = buildActions(role);
  return (
    <Card padding="lg">
      <CardHeader title="Acoes rapidas" description="Atalhos principais para este perfil." />
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            className="flex min-h-28 items-start gap-4 rounded-2xl border border-blue-200/10 bg-white/[0.04] p-4 text-left transition hover:border-blue-300/30 hover:bg-blue-500/10"
            onClick={() => navigate(action.path)}
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-blue-200/15 bg-blue-500/15 text-blue-100">
              <action.icon size={22} />
            </span>
            <span>
              <strong className="block text-base font-black leading-tight text-white">{action.label}</strong>
              <small className="mt-2 block text-sm font-semibold leading-5 text-slate-300">{action.description}</small>
            </span>
          </button>
        ))}
      </div>
    </Card>
  );
}

function OperationalSummary({ data, summary }) {
  const cards = [
    { label: 'EBAPs operando', value: summary.operando, tone: 'blue' },
    { label: 'EBAPs em atenção', value: summary.atencao, tone: 'orange' },
    { label: 'EBAPs críticas', value: summary.criticas, tone: 'red' },
    { label: 'Contratos ativos', value: data?.kpis?.contratosAtivos || 0, tone: 'blue' },
    { label: 'Compras pendentes', value: data?.kpis?.comprasPendentes || 0, tone: 'orange' },
    { label: 'Medido no mês', value: money(data?.kpis?.valorMedidoMes), tone: 'blue' }
  ];

  return (
    <Card padding="lg">
      <CardHeader title="Leitura executiva" description="Resumo consolidado para entender a operacao rapidamente." />
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((item) => (
          <div key={item.label} className="rounded-2xl border border-blue-200/10 bg-white/[0.04] p-4">
            <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">{item.label}</span>
            <strong className="mt-2 block text-2xl font-black leading-tight text-white">{item.value}</strong>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#0A1633]">
              <div className={`h-full rounded-full ${item.tone === 'red' ? 'bg-red-400' : item.tone === 'orange' ? 'bg-amber-400' : 'bg-blue-400'}`} style={{ width: '68%' }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const dashboardRole = useMemo(() => getDashboardRole(user?.perfil), [user?.perfil]);

  async function load() {
    try {
      setLoading(true);
      setError('');
      const result = await obterDashboardExecutivo();
      setData(result);
    } catch (err) {
      setError(err.message || 'Não foi possível carregar o dashboard.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const ebaps = data?.ebaps || [];
  const summary = useMemo(() => ({
    operando: ebaps.filter((ebap) => ebap.criticidade?.nivel === 'normal').length,
    atencao: ebaps.filter((ebap) => ebap.criticidade?.nivel === 'atencao').length,
    criticas: ebaps.filter((ebap) => ebap.criticidade?.nivel === 'critico').length
  }), [ebaps]);

  const rankedEbaps = useMemo(() => [...ebaps].sort((a, b) => (b.criticidade?.score || 0) - (a.criticidade?.score || 0)), [ebaps]);
  const kpis = useMemo(() => buildKpis(dashboardRole, data, summary), [dashboardRole, data, summary]);
  const copy = useMemo(() => profileCopy(dashboardRole, user?.nome || user?.name), [dashboardRole, user?.nome, user?.name]);
  const osPorArea = useMemo(() => (data?.osPorArea || []).map((item) => ({ ...item, name: prettyArea(item.value) })), [data]);
  const osPorStatus = useMemo(() => (data?.osPorStatus || []).map((item) => ({ ...item, name: prettyStatus(item.value) })), [data]);

  return (
    <div className="grid w-full max-w-none gap-6">
      <DashboardHeader copy={copy} loading={loading} onRefresh={load} />

      {error && (
        <Card className="border-red-300/30 bg-red-500/15 text-red-100" padding="md">
          <strong>{error}</strong>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {kpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}
      </div>

      <QuickActions role={dashboardRole} navigate={navigate} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <PriorityList ebaps={rankedEbaps} navigate={navigate} />
        <RecentActivity items={data?.últimasMovimentacoes || []} navigate={navigate} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <ChartCard title="Distribuição das Ordens de Serviço" description="Status principais com valores visíveis, sem depender do tooltip.">
          <HorizontalBarChart data={osPorStatus} getColor={(row) => getChartToneColor(row, 'status')} />
        </ChartCard>
        <ChartCard title="Demandas por Area Tecnica" description="Concentracao de ordens por especialidade operacional.">
          <HorizontalBarChart data={osPorArea} getColor={(row) => getChartToneColor(row, 'area')} />
        </ChartCard>
        <ChartCard title="Proporção das Compras" description="Distribuição do fluxo de compras por status.">
          <DonutChart data={data?.comprasPorStatus || []} />
        </ChartCard>
      </div>

      {dashboardRole === 'diretoria' && <OperationalSummary data={data} summary={summary} />}
    </div>
  );
}
