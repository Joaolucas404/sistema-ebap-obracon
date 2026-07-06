import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, FileText, ShieldAlert, Wrench } from 'lucide-react';
import { obterDashboardExecutivo } from '../services/dashboardService.js';

function nowText() {
  return new Date().toLocaleString('pt-BR');
}

export default function SalaSituacaoTV() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(nowText());

  async function load() {
    try {
      const result = await obterDashboardExecutivo();
      setData(result);
    } finally {
      setLoading(false);
      setNow(nowText());
    }
  }

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 60000);
    const clock = window.setInterval(() => setNow(nowText()), 1000);
    return () => {
      window.clearInterval(timer);
      window.clearInterval(clock);
    };
  }, []);

  const criticidade = useMemo(() => {
    const ebaps = data?.ebaps || [];
    return {
      operando: ebaps.filter((ebap) => ebap.criticidade?.nivel === 'normal').length,
      atencao: ebaps.filter((ebap) => ebap.criticidade?.nivel === 'atencao').length,
      critica: ebaps.filter((ebap) => ebap.criticidade?.nivel === 'critico').length
    };
  }, [data]);

  const alertas = [
    ...(data?.ebaps || []).filter((ebap) => ebap.criticidade?.nivel === 'critico').map((ebap) => ({ tipo: 'EBAP critica', texto: ebap.nome_curto || ebap.nome })),
    ...(data?.últimasMovimentacoes || []).filter((item) => ['OS', 'APR', 'Medicao'].includes(item.tipo)).slice(0, 8).map((item) => ({ tipo: item.tipo, texto: `${item.titulo} - ${item.descricao || ''}` }))
  ].slice(0, 12);

  return (
    <div className="min-h-screen bg-[#061a40] p-8 text-white">
      <header className="mb-8 flex items-center justify-between border-b border-cyan-300/20 pb-6">
        <div>
          <h1 className="text-5xl font-black uppercase tracking-wide">Sala de Situação EBAPs</h1>
          <p className="mt-2 text-2xl text-cyan-100">Monitoramento operacional em tempo real</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-white">{now}</p>
          <p className="text-lg text-slate-300">{loading ? 'Atualizando...' : 'Atualização automática a cada 60s'}</p>
        </div>
      </header>

      <main className="grid gap-6">
        <section className="grid gap-6 lg:grid-cols-3">
          <TvCard tone="green" icon={CheckCircle2} label="EBAPs Operando" value={criticidade.operando} />
          <TvCard tone="yellow" icon={AlertTriangle} label="EBAPs Atenção" value={criticidade.atencao} />
          <TvCard tone="red" icon={ShieldAlert} label="EBAPs Críticas" value={criticidade.critica} />
        </section>

        <section className="grid gap-6 lg:grid-cols-4">
          <TvMetric icon={Wrench} label="OS abertas" value={data?.kpis.osAbertas || 0} />
          <TvMetric icon={ShieldAlert} label="OS críticas" value={data?.kpis.osCriticas || 0} />
          <TvMetric icon={FileText} label="RDO pendentes" value={data?.kpis.roPendentes || 0} />
          <TvMetric icon={Clock3} label="Medições pendentes" value={data?.kpis.mediçõesPendentes || 0} />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-[32px] border border-cyan-300/20 bg-white/5 p-6">
            <h2 className="mb-5 text-3xl font-black">EBAPs</h2>
            <div className="grid gap-3">
              {(data?.ebaps || []).map((ebap) => (
                <div key={ebap.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 rounded-2xl bg-navy-950/60 p-4">
                  <strong className="text-2xl">{ebap.nome_curto || ebap.nome}</strong>
                  <span className="text-xl text-slate-300">{ebap.ordensAbertas || 0} OS</span>
                  <span className={badgeClass(ebap.criticidade?.nivel)}>{ebap.criticidade?.label || 'Normal'}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[32px] border border-red-300/20 bg-red-500/10 p-6">
            <h2 className="mb-5 text-3xl font-black">Alertas críticos</h2>
            <div className="grid gap-3">
              {alertas.length ? alertas.map((alerta, index) => (
                <div key={`${alerta.tipo}-${index}`} className="rounded-2xl border border-red-300/20 bg-navy-950/60 p-4">
                  <span className="text-sm font-black uppercase text-red-100">{alerta.tipo}</span>
                  <p className="mt-1 text-xl font-bold text-white">{alerta.texto}</p>
                </div>
              )) : <p className="text-2xl text-slate-300">Nenhum alerta crítico no momento.</p>}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function TvCard({ icon: Icon, label, value, tone }) {
  const styles = {
    green: 'border-green-300/30 bg-green-500/15 text-green-100',
    yellow: 'border-yellow-300/30 bg-yellow-500/15 text-yellow-100',
    red: 'border-red-300/30 bg-red-500/15 text-red-100'
  };
  return (
    <div className={`rounded-[32px] border p-8 ${styles[tone]}`}>
      <Icon size={46} />
      <span className="mt-6 block text-2xl font-black uppercase">{label}</span>
      <strong className="mt-2 block text-7xl font-black text-white">{value}</strong>
    </div>
  );
}

function TvMetric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-[28px] border border-cyan-300/20 bg-white/5 p-6">
      <Icon className="text-cyan-100" size={34} />
      <span className="mt-4 block text-lg font-black uppercase text-slate-300">{label}</span>
      <strong className="text-5xl font-black text-white">{value}</strong>
    </div>
  );
}

function badgeClass(nivel) {
  if (nivel === 'critico') return 'rounded-full bg-red-500/25 px-4 py-2 text-lg font-black text-red-100';
  if (nivel === 'atencao') return 'rounded-full bg-yellow-500/25 px-4 py-2 text-lg font-black text-yellow-100';
  return 'rounded-full bg-green-500/25 px-4 py-2 text-lg font-black text-green-100';
}
