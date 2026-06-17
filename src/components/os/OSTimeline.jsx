import { CheckCircle2, Circle, Clock3 } from 'lucide-react';
import { statusLabel } from '../../services/osService.js';

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('pt-BR');
}

export default function OSTimeline({ historico = [] }) {
  if (!historico.length) {
    return (
      <div className="rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-4 text-sm text-slate-300">
        Nenhum histórico registrado ainda.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {historico.map((item, index) => {
        const Icon = index === historico.length - 1 ? CheckCircle2 : item.status_novo ? Clock3 : Circle;
        return (
          <div key={item.id} className="grid grid-cols-[34px_minmax(0,1fr)] gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full border border-cyan-300/25 bg-cyan-400/10 text-cyan-100">
              <Icon size={18} />
            </span>
            <div className="rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong className="font-black text-white">{item.acao}</strong>
                <small className="text-slate-400">{formatDate(item.created_at)}</small>
              </div>
              {item.descricao && <p className="mt-1 text-sm text-slate-300">{item.descricao}</p>}
              {(item.status_anterior || item.status_novo) && (
                <p className="mt-2 text-xs font-bold text-cyan-100">
                  {statusLabel(item.status_anterior)} → {statusLabel(item.status_novo)}
                </p>
              )}
              <small className="mt-2 block text-slate-400">Usuário: {item.usuario?.nome || 'Sistema'}</small>
            </div>
          </div>
        );
      })}
    </div>
  );
}
