import { CheckCircle2, CircleDollarSign, Clock, PackageCheck, ShoppingCart, XCircle } from 'lucide-react';
import KpiCard from '../ui/KpiCard.jsx';

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function ComprasDashboard({ dashboard }) {
  const data = dashboard || {};

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <KpiCard icon={Clock} label="Solicitações pendentes" value={data.pendentes || 0} helper="Solicitada ou aguardando aprovação" tone="orange" />
      <KpiCard icon={CheckCircle2} label="Aprovadas" value={data.aprovadas || 0} helper="Liberadas pela gestao" tone="green" />
      <KpiCard icon={XCircle} label="Reprovadas" value={data.reprovadas || 0} helper="Com motivo registrado" tone="red" />
      <KpiCard icon={ShoppingCart} label="Em cotacao" value={data.emCotacao || 0} helper="Pesquisa de fornecedores" tone="cyan" />
      <KpiCard icon={PackageCheck} label="Recebidas" value={data.recebidas || 0} helper="Integradas ao almoxarifado" tone="blue" />
      <KpiCard icon={CircleDollarSign} label="Valor total solicitado" value={formatCurrency(data.valorTotalSolicitado)} helper={`${data.total || 0} solicitacao(oes)`} tone="cyan" />
    </section>
  );
}
