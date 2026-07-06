import { AlertTriangle, CheckCircle2, ClipboardList, FileText, MapPinned } from 'lucide-react';
import KpiCard from '../ui/KpiCard.jsx';

export default function LocalizacaoDashboard({ dashboard }) {
  const data = dashboard || {};

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
      <KpiCard icon={MapPinned} label="EBAPs" value={data.total || 0} helper="Unidades cadastradas" tone="cyan" />
      <KpiCard icon={CheckCircle2} label="Operando" value={data.operando || 0} helper="Status normal" tone="green" />
      <KpiCard icon={AlertTriangle} label="Atenção" value={data.atencao || 0} helper="Monitorar" tone="orange" />
      <KpiCard icon={AlertTriangle} label="Crítica" value={data.critica || 0} helper="Prioridade operacional" tone="red" />
      <KpiCard icon={ClipboardList} label="OS abertas" value={data.osAbertas || 0} helper="Todas as EBAPs" tone="blue" />
      <KpiCard icon={FileText} label="RDO pendentes" value={data.roPendentes || 0} helper="Validação ou rascunho" tone="cyan" />
    </section>
  );
}
