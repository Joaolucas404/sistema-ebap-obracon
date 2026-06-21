import { Check, ClipboardList, Edit3, PackageCheck, Send, ShoppingCart, X } from 'lucide-react';
import CompraStatusBadge from './CompraStatusBadge.jsx';

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString('pt-BR') : '-';
}

export default function ComprasTable({ compras, loading, canManage, canApprove, onEdit, onStatus, onApprove, onReceive, onView }) {
  if (loading) {
    return <div className="glass-card rounded-3xl p-8 text-center text-slate-300">Carregando compras...</div>;
  }

  if (!compras.length) {
    return (
      <div className="glass-card rounded-3xl p-8 text-center">
        <ShoppingCart className="mx-auto text-cyan-200" size={36} />
        <h3 className="mt-3 text-xl font-black text-white">Nenhuma solicitacao encontrada</h3>
        <p className="text-sm text-slate-300">Crie uma solicitacao ou ajuste os filtros.</p>
      </div>
    );
  }

  return (
    <section className="glass-card overflow-hidden rounded-3xl">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left">
          <thead className="bg-navy-950/45 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Numero</th>
              <th className="px-4 py-3">Area / EBAP</th>
              <th className="px-4 py-3">Solicitante</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Criada em</th>
              <th className="px-4 py-3 text-right">Acoes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cyan-300/10">
            {compras.map((compra) => (
              <tr key={compra.id} className="hover:bg-cyan-300/5">
                <td className="px-4 py-4">
                  <button className="font-black text-white hover:text-cyan-100" type="button" onClick={() => onView(compra)}>
                    {compra.numero}
                  </button>
                  <div className="text-xs text-slate-400">{compra.itens?.length || 0} material(is)</div>
                </td>
                <td className="px-4 py-4">
                  <div className="font-bold text-white">{compra.area || '-'}</div>
                  <div className="text-sm text-slate-300">{compra.ebap?.nome || 'Sem EBAP'}</div>
                </td>
                <td className="px-4 py-4 text-sm text-slate-200">{compra.solicitante?.nome || compra.solicitante?.usuario || '-'}</td>
                <td className="px-4 py-4"><CompraStatusBadge status={compra.status} /></td>
                <td className="px-4 py-4 font-black text-white">{formatCurrency(compra.valor_total)}</td>
                <td className="px-4 py-4 text-sm text-slate-300">{formatDate(compra.created_at)}</td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap justify-end gap-2">
                    <button className="secondary-button min-h-10 px-3" type="button" onClick={() => onView(compra)} title="Detalhes">
                      <ClipboardList size={16} />
                    </button>
                    {canManage && compra.status !== 'recebida' && (
                      <button className="secondary-button min-h-10 px-3" type="button" onClick={() => onEdit(compra)} title="Editar">
                        <Edit3 size={16} />
                      </button>
                    )}
                    {canManage && compra.status === 'solicitada' && (
                      <button className="secondary-button min-h-10 px-3" type="button" onClick={() => onStatus(compra, 'em_cotacao')} title="Enviar para cotacao">
                        <Send size={16} />
                      </button>
                    )}
                    {canManage && compra.status === 'em_cotacao' && (
                      <button className="secondary-button min-h-10 px-3" type="button" onClick={() => onStatus(compra, 'aguardando_aprovacao')} title="Enviar para aprovacao">
                        <Check size={16} />
                      </button>
                    )}
                    {canApprove && compra.status === 'aguardando_aprovacao' && (
                      <>
                        <button className="primary-button min-h-10 px-3" type="button" onClick={() => onApprove(compra, true)} title="Aprovar">
                          <Check size={16} />
                        </button>
                        <button className="secondary-button min-h-10 px-3 border-red-300/35 bg-red-500/15 text-red-100" type="button" onClick={() => onApprove(compra, false)} title="Reprovar">
                          <X size={16} />
                        </button>
                      </>
                    )}
                    {canManage && compra.status === 'aprovada' && (
                      <button className="secondary-button min-h-10 px-3" type="button" onClick={() => onStatus(compra, 'comprada')} title="Marcar comprada">
                        <ShoppingCart size={16} />
                      </button>
                    )}
                    {canManage && compra.status === 'comprada' && (
                      <button className="primary-button min-h-10 px-3" type="button" onClick={() => onReceive(compra)} title="Receber e atualizar estoque">
                        <PackageCheck size={16} />
                      </button>
                    )}
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
