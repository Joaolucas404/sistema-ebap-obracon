import { Activity, CalendarCheck, CheckCircle2, Gauge, ListTodo, TriangleAlert } from 'lucide-react';
import KpiCard from '../ui/KpiCard.jsx';

export default function ManutencaoDashboard({ dashboard }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <KpiCard icon={CalendarCheck} label="Preventivas programadas" value={dashboard?.preventivasProgramadas ?? 0} helper="Pendentes ou em execução" />
      <KpiCard icon={CheckCircle2} label="Preventivas concluídas" value={dashboard?.preventivasConcluidas ?? 0} helper="Concluídas no mês" tone="green" />
      <KpiCard icon={Activity} label="Corretivas abertas" value={dashboard?.corretivasAbertas ?? 0} helper="OS de manutenção abertas" tone="orange" />
      <KpiCard icon={TriangleAlert} label="Corretivas críticas" value={dashboard?.corretivasCriticas ?? 0} helper="Prioridade crítica" tone="red" />
      <KpiCard icon={ListTodo} label="Backlog" value={dashboard?.backlog ?? 0} helper="Execuções e OS pendentes" tone="orange" />
      <KpiCard icon={Gauge} label="Cumprimento do plano" value={`${dashboard?.cumprimentoPlano ?? 0}%`} helper="Execuções concluídas no mês" tone="green" />
    </div>
  );
}
