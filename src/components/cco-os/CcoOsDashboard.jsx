import { AlertTriangle, CheckCircle2, Clock, RotateCcw, XCircle } from 'lucide-react';
import KpiCard from '../ui/KpiCard.jsx';

export default function CcoOsDashboard({ dashboard }) {
  const data = dashboard || {};

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <KpiCard icon={Clock} label="Aguardando analise" value={data.aguardandoAnalise || 0} helper="Fila pendente CCO" tone="orange" />
      <KpiCard icon={CheckCircle2} label="Aprovadas hoje" value={data.aprovadasHoje || 0} helper="Encaminhadas ao Supervisor" tone="green" />
      <KpiCard icon={XCircle} label="Rejeitadas hoje" value={data.rejeitadasHoje || 0} helper="Com motivo registrado" tone="red" />
      <KpiCard icon={RotateCcw} label="Correcoes" value={data.devolvidasCorrecao || 0} helper="Devolvidas ao solicitante" tone="cyan" />
      <KpiCard icon={AlertTriangle} label="Criticas pendentes" value={data.criticasPendentes || 0} helper="Prioridade critica" tone="red" />
    </section>
  );
}
