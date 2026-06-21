import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';

const icons = {
  info: Info,
  sucesso: CheckCircle2,
  alerta: AlertTriangle,
  erro: XCircle
};

const tones = {
  baixa: 'border-slate-300/20 bg-slate-400/10 text-slate-100',
  normal: 'border-cyan-300/25 bg-cyan-400/10 text-cyan-100',
  alta: 'border-orange-300/35 bg-orange-400/15 text-orange-100',
  critica: 'border-red-300/35 bg-red-500/15 text-red-100'
};

function formatDate(value) {
  return value ? new Date(value).toLocaleString('pt-BR') : '-';
}

export default function NotificationItem({ notificacao, compact = false, onRead, onOpen }) {
  const Icon = icons[notificacao.tipo] || Info;
  const isUnread = !notificacao.lida_em;

  return (
    <article className={`rounded-2xl border p-4 ${isUnread ? 'border-cyan-300/35 bg-cyan-300/10' : 'border-cyan-300/10 bg-navy-950/35'}`}>
      <div className="flex gap-3">
        <span className={`grid size-10 shrink-0 place-items-center rounded-2xl ${tones[notificacao.prioridade] || tones.normal}`}>
          <Icon size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <button className="text-left font-black text-white hover:text-cyan-100" type="button" onClick={() => onOpen?.(notificacao)}>
              {notificacao.titulo}
            </button>
            {isUnread && <span className="rounded-full bg-green-500/20 px-2 py-1 text-[10px] font-black uppercase text-green-100">Nova</span>}
          </div>
          <p className={`${compact ? 'line-clamp-2' : ''} mt-1 text-sm text-slate-300`}>{notificacao.mensagem}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-400">
            <span>{formatDate(notificacao.created_at)}</span>
            <span className="rounded-full border border-cyan-300/15 px-2 py-1 uppercase">{notificacao.modulo || 'geral'}</span>
            <span className="rounded-full border border-cyan-300/15 px-2 py-1 uppercase">{notificacao.prioridade || 'normal'}</span>
          </div>
          {isUnread && (
            <button className="mt-3 text-xs font-black text-cyan-100 hover:text-white" type="button" onClick={() => onRead(notificacao.id)}>
              Marcar como lida
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
