import { AlertTriangle, ClipboardCheck, GraduationCap, HardHat, ListChecks, PackageCheck, ShieldAlert, Siren } from 'lucide-react';
import KpiCard from '../ui/KpiCard.jsx';

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('pt-BR');
}

export default function SstDashboard({ dashboard }) {
  const alertas = dashboard?.alertasLista || [];

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={HardHat} label="EPIs ativos" value={dashboard?.totalEpis ?? 0} helper="Itens cadastrados em SST" />
        <KpiCard icon={PackageCheck} label="Entregas hoje" value={dashboard?.entregasHoje ?? 0} helper="EPIs entregues no dia" tone="green" />
        <KpiCard icon={GraduationCap} label="Treinamentos" value={dashboard?.treinamentos ?? 0} helper="Cadastros ativos" />
        <KpiCard icon={ClipboardCheck} label="APR abertas" value={dashboard?.aprAbertas ?? 0} helper="Rascunho, analise ou liberada" tone="orange" />
        <KpiCard icon={AlertTriangle} label="Trein. vencidos" value={dashboard?.treinamentosVencidos ?? 0} helper="Regularizacao necessaria" tone="red" />
        <KpiCard icon={AlertTriangle} label="Trein. vencendo" value={dashboard?.treinamentosVencendo ?? 0} helper="Proximos 30 dias" tone="orange" />
        <KpiCard icon={ShieldAlert} label="CA vencidos" value={dashboard?.caVencidos ?? 0} helper="Certificado de aprovacao" tone="red" />
        <KpiCard icon={ShieldAlert} label="CA vencendo" value={dashboard?.caVencendo ?? 0} helper="Proximos 30 dias" tone="orange" />
        <KpiCard icon={ClipboardCheck} label="APT abertas" value={dashboard?.aptAbertas ?? 0} helper="Permissoes de trabalho" tone="orange" />
        <KpiCard icon={ListChecks} label="Inspecoes abertas" value={dashboard?.inspecoesAbertas ?? 0} helper="Campo e conformidade" />
        <KpiCard icon={Siren} label="Ocorrencias abertas" value={dashboard?.ocorrenciasAbertas ?? 0} helper="Eventos em tratamento" tone="orange" />
        <KpiCard icon={Siren} label="Criticas" value={dashboard?.ocorrenciasCriticas ?? 0} helper="Ocorrencias criticas abertas" tone="red" />
        <KpiCard icon={ListChecks} label="Planos abertos" value={dashboard?.planosAbertos ?? 0} helper="Acoes pendentes" />
        <KpiCard icon={AlertTriangle} label="Planos atrasados" value={dashboard?.planosAtrasados ?? 0} helper="Prazo vencido" tone="red" />
      </div>

      <section className="glass-card rounded-3xl p-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-navy-950/60 text-orange-100">
            <AlertTriangle size={22} />
          </span>
          <div>
            <h3 className="text-xl font-black text-white">Alertas de vencimento</h3>
            <p className="text-sm text-slate-300">Treinamentos e CAs vencidos ou vencendo nos proximos 30 dias.</p>
          </div>
        </div>

        {alertas.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {alertas.map((alerta, index) => (
              <article key={`${alerta.tipo}-${alerta.titulo}-${index}`} className="rounded-2xl border border-cyan-300/15 bg-navy-950/35 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-black ${alerta.severidade === 'red' ? 'border-red-300/40 bg-red-500/20 text-red-100' : 'border-orange-300/40 bg-orange-500/20 text-orange-100'}`}>
                      {alerta.tipo}
                    </span>
                    <strong className="mt-3 block text-white">{alerta.titulo || '-'}</strong>
                    <p className="text-sm text-slate-300">{alerta.pessoa || '-'}</p>
                  </div>
                  <time className="text-sm font-bold text-slate-200">{formatDate(alerta.data)}</time>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-green-300/20 bg-green-500/10 p-5 text-sm font-bold text-green-100">
            Nenhum vencimento critico encontrado.
          </div>
        )}
      </section>
    </div>
  );
}
