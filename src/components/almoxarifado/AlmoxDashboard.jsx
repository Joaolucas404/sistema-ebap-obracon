import { Boxes, CircleDollarSign, Layers3, PackageCheck, TriangleAlert, Warehouse } from 'lucide-react';
import KpiCard from '../ui/KpiCard.jsx';

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));
}

export default function AlmoxDashboard({ dashboard }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <KpiCard icon={Boxes} label="Itens cadastrados" value={dashboard?.totalItens ?? 0} helper="Itens ativos e inativos" />
      <KpiCard icon={PackageCheck} label="Itens ativos" value={dashboard?.ativos ?? 0} helper="Disponíveis para movimentação" tone="green" />
      <KpiCard icon={TriangleAlert} label="Estoque mínimo" value={dashboard?.estoqueBaixo ?? 0} helper="Itens abaixo ou no mínimo" tone="orange" />
      <KpiCard icon={Warehouse} label="Zerados" value={dashboard?.zerados ?? 0} helper="Sem saldo disponível" tone="red" />
      <KpiCard icon={Layers3} label="Categorias" value={dashboard?.categorias ?? 0} helper="Agrupamentos ativos" />
      <KpiCard icon={PackageCheck} label="Movimentos hoje" value={dashboard?.movimentosHoje ?? 0} helper="Entradas, saídas e ajustes" tone="cyan" />
      <div className="glass-card rounded-2xl p-4 md:col-span-2">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-navy-950/60 text-cyan-100">
            <CircleDollarSign size={24} />
          </span>
          <div>
            <small className="font-black uppercase tracking-wide text-slate-400">Valor estimado em estoque</small>
            <strong className="mt-1 block text-2xl font-black text-white">{formatCurrency(dashboard?.valorEstimado)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
