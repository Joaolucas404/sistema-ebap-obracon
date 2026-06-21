import { Activity, CalendarCheck, CheckCircle2, Gauge, ListTodo, TriangleAlert } from 'lucide-react';
import KpiCard from '../ui/KpiCard.jsx';

export default function ManutencaoDashboard({ dashboard }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <KpiCard icon={CalendarCheck} label="Preventivas programadas" value={dashboard?.preventivasProgramadas ?? 0} helper="Pendentes ou em execucao" />
      <KpiCard icon={CheckCircle2} label="Preventivas concluidas" value={dashboard?.preventivasConcluidas ?? 0} helper="Concluidas no mes" tone="green" />
      <KpiCard icon={Activity} label="Corretivas abertas" value={dashboard?.corretivasAbertas ?? 0} helper="OS de manutencao abertas" tone="orange" />
      <KpiCard icon={TriangleAlert} label="Corretivas criticas" value={dashboard?.corretivasCriticas ?? 0} helper="Prioridade critica" tone="red" />
      <KpiCard icon={ListTodo} label="Backlog" value={dashboard?.backlog ?? 0} helper="Execucoes e OS pendentes" tone="orange" />
      <KpiCard icon={Gauge} label="Cumprimento do plano" value={`${dashboard?.cumprimentoPlano ?? 0}%`} helper="Execucoes concluidas no mes" tone="green" />
    </div>
  );
}
