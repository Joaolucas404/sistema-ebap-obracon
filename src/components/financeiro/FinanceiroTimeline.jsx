import { Clock3 } from 'lucide-react';
import FinanceiroStatusBadge from './FinanceiroStatusBadge.jsx';

function dateTime(value) {
  return value ? new Date(value).toLocaleString('pt-BR') : '-';
}

export default function FinanceiroTimeline({ historico, entidadeTipo, entidadeId }) {
  const rows = entidadeTipo && entidadeId
    ? historico.filter((item) => item.entidade_tipo === entidadeTipo && item.entidade_id === entidadeId)
    : historico;

  if (!rows.length) {
    return <div className="rounded-2xl border border-cyan-300/15 bg-navy-950/35 p-5 text-sm font-bold text-slate-300">Sem histórico registrado.</div>;
  }

  return (
    <section className="grid gap-3">
      {rows.map((item) => (
        <article key={item.id} className="rounded-2xl border border-cyan-300/15 bg-navy-950/40 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="flex gap-3">
              <span className="mt-1 grid size-9 shrink-0 place-items-center rounded-xl bg-cyan-400/15 text-cyan-100">
                <Clock3 size={17} />
              </span>
              <div>
                <strong className="block text-sm font-black uppercase text-white">{item.acao}</strong>
                <p className="text-sm text-slate-300">{item.descricao || '-'}</p>
                <small className="text-slate-500">{item.usuario?.nome || 'Sistema'} · {dateTime(item.created_at)}</small>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {item.status_anterior && <FinanceiroStatusBadge status={item.status_anterior} />}
              {item.status_novo && <FinanceiroStatusBadge status={item.status_novo} />}
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
