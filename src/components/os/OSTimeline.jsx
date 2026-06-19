import { CheckCircle2, Circle, Clock3, RotateCcw } from 'lucide-react';
import { OS_WORKFLOW, statusLabel } from '../../services/osService.js';

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('pt-BR');
}

export default function OSTimeline({ historico = [], statusAtual = '' }) {
  const currentIndex = Math.max(
    OS_WORKFLOW.findIndex((step) => step.value === statusAtual),
    historico.reduce((index, item) => {
      const stepIndex = OS_WORKFLOW.findIndex((step) => step.value === item.status_novo);
      return stepIndex > index ? stepIndex : index;
    }, -1)
  );

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {OS_WORKFLOW.map((step, index) => {
          const stepEvents = historico.filter((item) => item.status_novo === step.value || item.metadata?.etapa === step.value);
          const isDone = currentIndex > index;
          const isCurrent = currentIndex === index;
          const Icon = isDone ? CheckCircle2 : isCurrent ? Clock3 : Circle;

          return (
            <article
              key={step.value}
              className={`rounded-2xl border p-4 ${
                isCurrent
                  ? 'border-cyan-300/50 bg-cyan-400/10'
                  : isDone
                    ? 'border-green-300/30 bg-green-400/10'
                    : 'border-cyan-300/15 bg-navy-950/55'
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border text-sm font-black ${
                    isCurrent
                      ? 'border-cyan-200 bg-cyan-300/20 text-cyan-50'
                      : isDone
                        ? 'border-green-200 bg-green-300/20 text-green-50'
                        : 'border-slate-500/40 bg-slate-700/20 text-slate-300'
                  }`}
                >
                  {step.ordem}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon size={17} className={isDone ? 'text-green-200' : isCurrent ? 'text-cyan-100' : 'text-slate-400'} />
                    <strong className="text-sm font-black text-white">{step.label}</strong>
                  </div>
                  <small className="mt-1 block text-xs font-bold uppercase tracking-wide text-slate-400">{step.perfil}</small>
                </div>
              </div>

              <div className="mt-3 grid gap-2">
                {stepEvents.length ? (
                  stepEvents.map((event) => <HistoryEvent key={event.id} item={event} />)
                ) : (
                  <p className="rounded-xl border border-cyan-300/10 bg-navy-950/35 p-3 text-xs text-slate-400">Sem movimentação registrada nesta etapa.</p>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {historico.length ? (
        <div className="rounded-2xl border border-cyan-300/15 bg-navy-950/45 p-4">
          <h4 className="mb-3 text-sm font-black uppercase tracking-wide text-cyan-100">Histórico completo de movimentações</h4>
          <div className="grid gap-3">
            {historico.map((item) => (
              <HistoryEvent key={item.id} item={item} expanded />
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-4 text-sm text-slate-300">Nenhum histórico registrado ainda.</div>
      )}
    </div>
  );
}

function HistoryEvent({ item, expanded = false }) {
  const motivo = item.metadata?.motivo;
  return (
    <div className={`rounded-xl border border-cyan-300/10 bg-navy-950/55 p-3 ${expanded ? 'grid gap-1' : ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <strong className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-white">
          {item.acao === 'return' || item.acao === 'reject' ? <RotateCcw size={14} className="text-red-200" /> : null}
          {item.acao}
        </strong>
        <small className="text-xs text-slate-400">{formatDate(item.created_at)}</small>
      </div>
      {item.descricao && <p className="mt-1 text-sm text-slate-300">{item.descricao}</p>}
      {(item.status_anterior || item.status_novo) && (
        <p className="mt-1 text-xs font-bold text-cyan-100">
          {statusLabel(item.status_anterior)} para {statusLabel(item.status_novo)}
        </p>
      )}
      {motivo && <p className="mt-1 rounded-lg border border-red-300/20 bg-red-500/10 p-2 text-xs font-bold text-red-100">Motivo: {motivo}</p>}
      <small className="mt-1 block text-xs text-slate-400">Usuário responsável: {item.usuario?.nome || 'Sistema'}</small>
    </div>
  );
}
