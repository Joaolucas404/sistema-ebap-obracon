import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ClipboardCheck, FileText, MapPin, PackageX, RefreshCcw, ShieldAlert, ShoppingCart, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EbapsMap from '../components/localizacao/EbapsMap.jsx';
import KpiCard from '../components/ui/KpiCard.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import { obterSalaSituacaoOperacional } from '../services/salaSituacaoService.js';

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('pt-BR');
}

function statusTone(status) {
  if (['CRITICA', 'critica', 'critico', 'atrasada'].includes(status)) return 'red';
  if (['ATENCAO', 'aguardando_supervisor', 'pendente_validacao_cco', 'aguardando_aprovacao', 'em_analise'].includes(status)) return 'orange';
  if (['OPERANDO', 'concluida', 'aprovada'].includes(status)) return 'green';
  return 'cyan';
}

export default function SalaSituacao() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [selectedEbap, setSelectedEbap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);

  async function load() {
    setError('');
    try {
      const result = await obterSalaSituacaoOperacional();
      setData(result);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.message || 'Nao foi possivel carregar a Sala de Situacao.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 60000);
    return () => window.clearInterval(timer);
  }, []);

  const criticidade = useMemo(() => {
    const ebaps = data?.mapa?.ebaps || [];
    return {
      operando: ebaps.filter((ebap) => ebap.status_operacional === 'OPERANDO').length,
      atencao: ebaps.filter((ebap) => ebap.status_operacional === 'ATENCAO').length,
      critica: ebaps.filter((ebap) => ebap.status_operacional === 'CRITICA').length
    };
  }, [data]);

  const filas = data?.filas || {};
  const kpis = data?.kpis || {};

  return (
    <div className="grid gap-4">
      <PageHeader
        title="Sala de Situacao Operacional"
        description="Centro operacional em tempo real integrado a OS, RDO, CCO, SST, Almoxarifado, Compras e EBAPs."
        leading={<span className="grid size-12 place-items-center rounded-2xl bg-navy-950/60 text-cyan-100"><ShieldAlert size={24} /></span>}
        actions={
          <>
            <span className="status-chip">
              Atualizado: {lastUpdate ? lastUpdate.toLocaleTimeString('pt-BR') : '-'}
            </span>
            <button className="secondary-button" type="button" onClick={load} disabled={loading}>
              <RefreshCcw size={17} className={loading ? 'animate-spin' : ''} />
              Atualizar
            </button>
            <button className="primary-button" type="button" onClick={() => navigate('/sala-situacao-tv')}>
              Modo TV
            </button>
          </>
        }
      />

      {error && <div className="rounded-2xl border border-red-300/30 bg-red-500/15 p-4 text-sm font-bold text-red-100">{error}</div>}

      <section className="grid gap-4 md:grid-cols-3">
        <CritCard tone="green" label="Operando" value={criticidade.operando} />
        <CritCard tone="orange" label="Atencao" value={criticidade.atencao} />
        <CritCard tone="red" label="Critica" value={criticidade.critica} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={ShieldAlert} label="OS críticas" value={loading ? '...' : kpis.osCriticas || 0} helper="Prioridade crítica aberta" tone="red" />
        <KpiCard icon={Wrench} label="Aguard. supervisor" value={loading ? '...' : kpis.osAguardandoSupervisor || 0} helper="Fila de decisao" tone="orange" />
        <KpiCard icon={FileText} label="RDO pendentes" value={loading ? '...' : kpis.roPendentes || 0} helper="Validacao CCO" tone="cyan" />
        <KpiCard icon={AlertTriangle} label="Alertas SST" value={loading ? '...' : kpis.alertasSst || 0} helper="APR/APT em atencao" tone="orange" />
        <KpiCard icon={PackageX} label="Estoque crítico" value={loading ? '...' : kpis.estoqueCritico || 0} helper="Abaixo do mínimo" tone="red" />
        <KpiCard icon={ShoppingCart} label="Compras aprovacao" value={loading ? '...' : kpis.comprasAprovacao || 0} helper="Aguardando decisao" tone="orange" />
        <KpiCard icon={MapPin} label="EBAPs críticas" value={loading ? '...' : kpis.ebapsCriticas || 0} helper="Status operacional crítico" tone="red" />
        <KpiCard icon={ClipboardCheck} label="Movimentacoes" value={loading ? '...' : filas.últimasMovimentacoes?.length || 0} helper="Eventos recentes" tone="green" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-4">
          <QueuePanel title="OS críticas" items={filas.osCriticas} empty="Nenhuma OS crítica aberta." path={(item) => `/os/${item.id}`} />
          <QueuePanel title="OS aguardando Supervisor" items={filas.osAguardandoSupervisor} empty="Nenhuma OS aguardando supervisor." path={(item) => `/os/${item.id}`} />
          <QueuePanel title="RDO pendentes de validacao" items={filas.roPendentes} empty="Nenhum RDO pendente." path={() => '/cco-relatorios-diarios'} />
        </div>

        <div className="grid gap-4">
          <section className="premium-card p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-white">Mapa resumido das EBAPs</h3>
                <p className="text-sm text-slate-300">Marcadores por status operacional.</p>
              </div>
              {selectedEbap && <StatusBadge tone={statusTone(selectedEbap.status_operacional)}>{selectedEbap.nome_curto || selectedEbap.nome}</StatusBadge>}
            </div>
            <div className="overflow-hidden rounded-2xl">
              <EbapsMap ebaps={data?.mapa?.ebaps || []} onSelect={setSelectedEbap} />
            </div>
          </section>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <SimplePanel title="Alertas SST" items={filas.alertasSst} empty="Nenhum alerta SST." path={() => '/sst'} />
        <SimplePanel title="Estoque crítico" items={filas.estoqueCritico} empty="Nenhum item crítico." path={() => '/almoxarifado'} render={(item) => `${item.nome} - ${item.estoque_atual || 0}/${item.estoque_minimo || 0} ${item.unidade || ''}`} />
        <SimplePanel title="Compras aguardando aprovacao" items={filas.comprasAprovacao} empty="Nenhuma compra aguardando aprovacao." path={() => '/compras'} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <SimplePanel title="EBAPs críticas" items={filas.ebapsCriticas} empty="Nenhuma EBAP crítica." path={() => '/localizacao-ebaps'} render={(item) => `${item.nome} - ${item.os_abertas || 0} OS abertas`} />
        <section className="premium-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardCheck className="text-cyan-100" size={20} />
            <h3 className="text-lg font-black text-white">Ultimas movimentacoes</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {(filas.últimasMovimentacoes || []).length ? filas.últimasMovimentacoes.map((item, index) => (
              <button key={`${item.tipo}-${item.titulo}-${index}`} type="button" className="rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-4 text-left shadow-inner transition hover:-translate-y-0.5 hover:border-cyan-200/60" onClick={() => navigate(item.path)}>
                <span className="text-xs font-black uppercase text-cyan-100">{item.tipo}</span>
                <strong className="mt-1 block text-white">{item.titulo}</strong>
                <p className="truncate text-sm text-slate-300">{item.descricao || '-'}</p>
                <small className="text-slate-500">{formatDate(item.data)}</small>
              </button>
            )) : <Empty text="Nenhuma movimentacao recente." />}
          </div>
        </section>
      </section>
    </div>
  );
}

function CritCard({ label, value, tone }) {
  const classes = {
    green: 'border-green-300/25 bg-green-500/10 text-green-100',
    orange: 'border-yellow-300/25 bg-yellow-500/10 text-yellow-100',
    red: 'border-red-300/25 bg-red-500/10 text-red-100'
  };
  return (
    <div className={`metric-card ${classes[tone]}`}>
      <span className="text-xs font-black uppercase">{label}</span>
      <strong className="mt-1 block text-4xl text-white">{value}</strong>
    </div>
  );
}

function QueuePanel({ title, items = [], empty, path }) {
  const navigate = useNavigate();
  return (
    <section className="premium-card p-5">
      <h3 className="mb-4 text-lg font-black text-white">{title}</h3>
      <div className="grid gap-3">
        {items.length ? items.map((item) => (
          <button key={item.id} type="button" className="rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-4 text-left shadow-inner transition hover:-translate-y-0.5 hover:border-cyan-200/60" onClick={() => navigate(path(item))}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <strong className="text-white">{item.numero || item.codigo || item.titulo}</strong>
                <p className="text-sm text-slate-300">{item.titulo || item.status || item.atividade}</p>
                <small className="text-slate-400">{item.ebap?.nome_curto || item.ebap?.nome || '-'} - {formatDate(item.created_at)}</small>
              </div>
              <StatusBadge tone={statusTone(item.prioridade || item.status)}>{item.prioridade || item.status || '-'}</StatusBadge>
            </div>
          </button>
        )) : <Empty text={empty} />}
      </div>
    </section>
  );
}

function SimplePanel({ title, items = [], empty, path, render }) {
  const navigate = useNavigate();
  return (
    <section className="premium-card p-5">
      <h3 className="mb-4 text-lg font-black text-white">{title}</h3>
      <div className="grid gap-3">
        {items.length ? items.slice(0, 8).map((item) => (
          <button key={item.id} type="button" className="rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-4 text-left shadow-inner transition hover:-translate-y-0.5 hover:border-cyan-200/60" onClick={() => navigate(path(item))}>
            <strong className="text-white">{item.numero || item.codigo || item.nome || item.atividade || item.titulo}</strong>
            <p className="text-sm text-slate-300">{render ? render(item) : item.status || item.area || item.descricao || '-'}</p>
            <small className="text-slate-500">{formatDate(item.created_at || item.updated_at)}</small>
          </button>
        )) : <Empty text={empty} />}
      </div>
    </section>
  );
}

function Empty({ text }) {
  return <div className="rounded-2xl border border-cyan-300/15 bg-navy-950/35 p-5 text-center text-sm font-bold text-slate-300">{text}</div>;
}
