import { Clock3 } from 'lucide-react';
import CompraStatusBadge from './CompraStatusBadge.jsx';

function formatDate(value) {
  return value ? new Date(value).toLocaleString('pt-BR') : '-';
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function CompraTimeline({ compra, historico = [] }) {
  const eventos = compra?.historico?.length ? compra.historico : historico;

  if (!compra && !eventos.length) {
    return <div className="glass-card rounded-3xl p-8 text-center text-slate-300">Sem historico de compras.</div>;
  }

  return (
    <section className="grid gap-4">
      {compra && (
        <div className="rounded-2xl border border-cyan-300/15 bg-navy-950/35 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-black text-white">{compra.numero}</h3>
              <p className="text-sm text-slate-300">{compra.justificativa}</p>
            </div>
            <CompraStatusBadge status={compra.status} />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Info label="Area" value={compra.area || '-'} />
            <Info label="EBAP" value={compra.ebap?.nome || '-'} />
            <Info label="Valor" value={formatCurrency(compra.valor_total)} />
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="text-xs uppercase text-slate-400">
                <tr>
                  <th className="py-2">Material</th>
                  <th className="py-2">Qtde</th>
                  <th className="py-2">Un.</th>
                  <th className="py-2">Valor unit.</th>
                  <th className="py-2">Recebido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-300/10">
                {(compra.itens || []).map((item) => (
                  <tr key={item.id || item.descricao}>
                    <td className="py-2 text-white">{item.descricao}</td>
                    <td className="py-2 text-slate-300">{item.quantidade}</td>
                    <td className="py-2 text-slate-300">{item.unidade}</td>
                    <td className="py-2 text-slate-300">{formatCurrency(item.valor_unitario)}</td>
                    <td className="py-2 text-slate-300">{item.recebido ? 'Sim' : 'Não'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid gap-3">
        {[...eventos].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map((item) => (
          <div key={item.id} className="rounded-2xl border border-cyan-300/15 bg-navy-950/45 p-4">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-cyan-500/15 text-cyan-100">
                <Clock3 size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong className="text-white">{item.acao || 'movimentacao'}</strong>
                  <span className="text-xs font-bold text-slate-400">{formatDate(item.created_at)}</span>
                </div>
                <p className="text-sm text-slate-300">{item.descricao || '-'}</p>
                <small className="text-slate-400">
                  {item.status_anterior || '-'} para {item.status_novo || '-'} {item.usuario?.nome ? `- ${item.usuario.nome}` : ''}
                </small>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl bg-navy-950/45 p-3">
      <small className="font-black uppercase text-slate-400">{label}</small>
      <strong className="block text-white">{value}</strong>
    </div>
  );
}
