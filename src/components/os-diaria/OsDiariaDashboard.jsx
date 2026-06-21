import { AlertTriangle, CheckCircle2, Clock, PlayCircle } from 'lucide-react';
import KpiCard from '../ui/KpiCard.jsx';

export default function OsDiariaDashboard({ dashboard }) {
  const data = dashboard || {};

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard icon={Clock} label="Programadas hoje" value={data.programadasHoje || 0} helper="Aguardando inicio" tone="cyan" />
      <KpiCard icon={CheckCircle2} label="Concluidas hoje" value={data.concluidasHoje || 0} helper="Finalizadas pelo tecnico" tone="green" />
      <KpiCard icon={PlayCircle} label="Em execucao" value={data.emExecucao || 0} helper="Atendimento aberto" tone="orange" />
      <KpiCard icon={AlertTriangle} label="Atrasadas" value={data.atrasadas || 0} helper="Programacao vencida" tone="red" />
    </section>
  );
}
