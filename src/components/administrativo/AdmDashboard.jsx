import { AlertTriangle, CalendarDays, Car, FileWarning, Stethoscope, UserCheck } from 'lucide-react';
import KpiCard from '../ui/KpiCard.jsx';

export default function AdmDashboard({ dashboard }) {
  const data = dashboard || {};
  return (
    <div className="grid gap-4">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={UserCheck} label="Colaboradores ativos" value={data.colaboradoresAtivos || 0} helper={`${data.colaboradoresFerias || 0} em férias`} tone="cyan" />
        <KpiCard icon={Stethoscope} label="Atestados no mês" value={data.atestadosMes || 0} helper="Registros de DP/RH" tone="orange" />
        <KpiCard icon={FileWarning} label="Docs vencendo" value={data.documentosVencendo || 0} helper="Próximos 30 dias" tone="red" />
        <KpiCard icon={Car} label="Frota operacional" value={data.veiculosOperacionais || 0} helper={`${data.frotaManutencao || 0} em manutenção`} tone="green" />
      </section>
      <section className="glass-card rounded-3xl p-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-navy-950/60 text-amber-100"><AlertTriangle size={22} /></span>
          <div>
            <h3 className="text-xl font-black text-white">Alertas de vencimento</h3>
            <p className="text-sm text-slate-300">Documentos, seguros e licenciamento nos próximos 30 dias.</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(data.alertas || []).length ? data.alertas.map((alerta, index) => (
            <div key={`${alerta.tipo}-${alerta.titulo}-${index}`} className="rounded-2xl border border-cyan-300/15 bg-navy-950/45 p-4">
              <div className="flex items-center gap-2 text-sm font-black uppercase text-cyan-100"><CalendarDays size={16} />{alerta.tipo}</div>
              <strong className="mt-2 block text-white">{alerta.titulo}</strong>
              <p className={alerta.status === 'vencido' ? 'text-sm font-bold text-red-100' : 'text-sm font-bold text-amber-100'}>{alerta.status} em {formatDate(alerta.data)}</p>
            </div>
          )) : <p className="text-sm font-bold text-slate-300">Nenhum alerta administrativo no período.</p>}
        </div>
      </section>
    </div>
  );
}

function formatDate(value) {
  return value ? new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR') : '-';
}
