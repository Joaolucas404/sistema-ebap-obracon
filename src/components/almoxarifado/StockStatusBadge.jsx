export default function StockStatusBadge({ item }) {
  const atual = Number(item?.estoque_atual || 0);
  const minimo = Number(item?.estoque_minimo || 0);

  if (!item?.ativo) {
    return <span className="rounded-full border border-slate-300/30 bg-slate-400/15 px-3 py-1 text-xs font-black text-slate-200">Inativo</span>;
  }

  if (atual <= 0) {
    return <span className="rounded-full border border-red-300/40 bg-red-500/20 px-3 py-1 text-xs font-black text-red-100">Zerado</span>;
  }

  if (atual <= minimo) {
    return <span className="rounded-full border border-orange-300/40 bg-orange-500/20 px-3 py-1 text-xs font-black text-orange-100">Estoque mínimo</span>;
  }

  return <span className="rounded-full border border-green-300/40 bg-green-500/20 px-3 py-1 text-xs font-black text-green-100">Normal</span>;
}
