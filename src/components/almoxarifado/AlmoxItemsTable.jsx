import { Edit3, MinusCircle, PlusCircle, Trash2 } from 'lucide-react';
import StockStatusBadge from './StockStatusBadge.jsx';

function formatNumber(value) {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 }).format(Number(value || 0));
}

function formatCurrency(value) {
  if (value == null || value === '') return '-';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));
}

export default function AlmoxItemsTable({ itens, loading, canManage, onEdit, onMove, onDelete }) {
  if (loading) {
    return <div className="glass-card rounded-3xl p-8 text-center text-slate-300">Carregando itens do almoxarifado...</div>;
  }

  if (!itens.length) {
    return (
      <div className="glass-card rounded-3xl p-8 text-center">
        <PackageIcon />
        <h3 className="mt-3 text-lg font-black text-white">Nenhum item encontrado</h3>
        <p className="mt-1 text-sm text-slate-300">Ajuste os filtros ou cadastre um novo item.</p>
      </div>
    );
  }

  return (
    <section className="glass-card overflow-hidden rounded-3xl">
      <div className="overflow-auto">
        <table className="min-w-[980px] w-full border-collapse">
          <thead className="bg-navy-950/50 text-left text-xs uppercase tracking-wide text-slate-300">
            <tr>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Local</th>
              <th className="px-4 py-3">Estoque</th>
              <th className="px-4 py-3">Minimo</th>
              <th className="px-4 py-3">Custo medio</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Acoes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cyan-300/10">
            {itens.map((item) => (
              <tr key={item.id} className="bg-navy-950/20 transition hover:bg-cyan-300/5">
                <td className="px-4 py-4">
                  <strong className="block text-white">{item.nome}</strong>
                  <span className="text-xs font-bold text-cyan-100">{item.codigo}</span>
                </td>
                <td className="px-4 py-4 text-sm text-slate-200">{item.categoria}</td>
                <td className="px-4 py-4 text-sm text-slate-200">{item.local?.nome || '-'}</td>
                <td className="px-4 py-4 text-sm font-black text-white">
                  {formatNumber(item.estoque_atual)} {item.unidade}
                </td>
                <td className="px-4 py-4 text-sm text-slate-200">
                  {formatNumber(item.estoque_minimo)} {item.unidade}
                </td>
                <td className="px-4 py-4 text-sm text-slate-200">{formatCurrency(item.custo_medio)}</td>
                <td className="px-4 py-4">
                  <StockStatusBadge item={item} />
                </td>
                <td className="px-4 py-4">
                  <div className="flex justify-end gap-2">
                    <button className="secondary-button min-h-10 px-3" type="button" onClick={() => onMove(item, 'entrada')} disabled={!canManage}>
                      <PlusCircle size={16} />
                    </button>
                    <button className="secondary-button min-h-10 px-3" type="button" onClick={() => onMove(item, 'saida')} disabled={!canManage}>
                      <MinusCircle size={16} />
                    </button>
                    <button className="secondary-button min-h-10 px-3" type="button" onClick={() => onEdit(item)} disabled={!canManage}>
                      <Edit3 size={16} />
                    </button>
                    <button className="danger-button min-h-10 px-3" type="button" onClick={() => onDelete(item)} disabled={!canManage || !item.ativo}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PackageIcon() {
  return (
    <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-navy-950/60 text-cyan-100">
      <PlusCircle size={28} />
    </span>
  );
}
